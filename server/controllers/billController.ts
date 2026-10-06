import type { Request, Response } from 'express';
import { billStore, contactStore, appendAuditLog } from '../db/connection.js';
import {
  stkPush,
  stkPushQuery,
  normalizeKenyanPhone,
  isValidKenyanPhone,
  isDarajaConfigured,
  isTokenCacheActive,
} from '../services/mpesa.js';
import {
  sanitizeText,
  computeHmacSignature,
  checkIdempotency,
  saveIdempotency,
  verifyAndRecordCallback,
  recordCallbackVerified,
  getSecurityPosture,
} from '../services/security.js';
import type {
  Bill,
  Participant,
  ParticipantInput,
  PaymentStatus,
  SplitMode,
} from '../../src/types.js';

const generateReceipt = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 7; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SJK${suffix}`;
};

export const listBills = async (_req: Request, res: Response): Promise<void> => {
  try {
    const bills = await billStore.list();
    const auditLogs = billStore.getAuditLogs();
    const contacts = contactStore.listContacts();
    const groups = contactStore.listGroups();
    const security = getSecurityPosture(isTokenCacheActive());
    res.status(200).json({ bills, auditLogs, contacts, groups, security });
  } catch {
    res.status(500).json({
      message: 'We could not load your bills right now. Please refresh and try again.',
    });
  }
};

export const addSavedContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, tag } = req.body as { name?: string; phone?: string; tag?: string };
    const cleanName = sanitizeText(name, 50);
    const rawPhone = String(phone || '').trim();
    const cleanTag = sanitizeText(tag, 30) || 'Friend';

    if (!cleanName) {
      res.status(400).json({ message: 'Please enter a name for this contact.' });
      return;
    }
    if (!isValidKenyanPhone(rawPhone)) {
      res.status(400).json({
        message: 'Please enter a valid Kenyan M-Pesa number (for example, 0712 345 678).',
      });
      return;
    }

    const created = contactStore.addContact({
      id: `CNT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      name: cleanName,
      phone: normalizeKenyanPhone(rawPhone),
      tag: cleanTag,
    });

    res.status(201).json({ contact: created, contacts: contactStore.listContacts() });
  } catch {
    res.status(500).json({
      message: 'We could not save this contact right now. Please try again.',
    });
  }
};

export const removeSavedContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    contactStore.deleteContact(id);
    res.status(200).json({ contacts: contactStore.listContacts() });
  } catch {
    res.status(500).json({
      message: 'We could not remove this contact right now. Please try again.',
    });
  }
};

export const splitBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = req.body as {
      title?: string;
      category?: string;
      total?: number;
      splitMode?: SplitMode;
      phones?: string[];
      participants?: ParticipantInput[];
    };

    const idempotencyKey =
      sanitizeText(req.headers['x-idempotency-key'], 64) ||
      `idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Prevent accidental duplicate charges if the user clicks Send twice
    if (req.headers['x-idempotency-key']) {
      const idemCheck = checkIdempotency(idempotencyKey, rawBody);
      if (idemCheck.hit && idemCheck.conflict) {
        res.status(409).json({
          message:
            'This bill request was already submitted with different details. Please refresh the form and try again.',
        });
        return;
      }
      if (idemCheck.hit && idemCheck.record) {
        res.status(idemCheck.record.status).json({
          ...(idemCheck.record.body as Record<string, unknown>),
          idempotentReplay: true,
        });
        return;
      }
    }

    const numericTotal = Number(rawBody.total);
    if (!Number.isFinite(numericTotal) || numericTotal < 1) {
      res.status(400).json({ message: 'Please enter a total bill amount of at least KES 1.00.' });
      return;
    }
    if (numericTotal > 500_000) {
      res.status(400).json({
        message: 'Total bill amount cannot exceed KES 500,000.00 per split.',
      });
      return;
    }

    let rawParticipants: ParticipantInput[] = [];
    if (Array.isArray(rawBody.participants) && rawBody.participants.length > 0) {
      rawParticipants = rawBody.participants;
    } else if (Array.isArray(rawBody.phones)) {
      rawParticipants = rawBody.phones.map((phone, i) => ({
        name: `Person ${i + 1}`,
        phone: String(phone),
      }));
    }

    if (rawParticipants.length < 2 || rawParticipants.length > 15) {
      res.status(400).json({
        message: 'Please include between 2 and 15 people to split a bill.',
      });
      return;
    }

    const normalizedPhones: string[] = [];
    for (let i = 0; i < rawParticipants.length; i++) {
      const rawPhone = String(rawParticipants[i].phone || '');
      const displayName = sanitizeText(rawParticipants[i].name, 40) || `Person #${i + 1}`;
      if (!isValidKenyanPhone(rawPhone)) {
        res.status(400).json({
          message: `Please enter a valid Kenyan M-Pesa phone number for ${displayName} (e.g., 0712 345 678).`,
        });
        return;
      }
      const norm = normalizeKenyanPhone(rawPhone);
      if (normalizedPhones.includes(norm)) {
        res.status(400).json({
          message: `The phone number +${norm} is listed more than once. Please give each person a unique M-Pesa number.`,
        });
        return;
      }
      normalizedPhones.push(norm);
    }

    const splitMode: SplitMode = rawBody.splitMode === 'custom' ? 'custom' : 'equal';
    const totalCents = Math.round(numericTotal * 100);
    const count = rawParticipants.length;

    const participantAmounts: number[] = [];
    if (splitMode === 'equal') {
      const baseCents = Math.floor(totalCents / count);
      const remainderCents = totalCents - baseCents * count;
      for (let i = 0; i < count; i++) {
        const cents = i < remainderCents ? baseCents + 1 : baseCents;
        participantAmounts.push(Number((cents / 100).toFixed(2)));
      }
    } else {
      let sumCents = 0;
      for (let i = 0; i < count; i++) {
        const amt = Number(rawParticipants[i].amount);
        const displayName = sanitizeText(rawParticipants[i].name, 40) || `Person #${i + 1}`;
        if (!Number.isFinite(amt) || amt < 1) {
          res.status(400).json({
            message: `Please enter an amount of at least KES 1.00 for ${displayName}.`,
          });
          return;
        }
        if (amt > 250_000) {
          res.status(400).json({
            message: `${displayName}'s share exceeds the M-Pesa limit of KES 250,000.00 per payment.`,
          });
          return;
        }
        const cents = Math.round(amt * 100);
        sumCents += cents;
        participantAmounts.push(Number((cents / 100).toFixed(2)));
      }
      if (Math.abs(sumCents - totalCents) > 1) {
        const diffKes = ((totalCents - sumCents) / 100).toFixed(2);
        res.status(400).json({
          message: `The individual shares do not add up to the total bill (difference of KES ${diffKes}).`,
        });
        return;
      }
    }

    const billId = `SP${Math.floor(1000 + Math.random() * 9000)}`;
    const billTitle = sanitizeText(rawBody.title, 70) || `Shared Bill #${billId}`;
    const billCategory = sanitizeText(rawBody.category, 40) || 'General Expense';
    const nowIso = new Date().toISOString();

    const stkResults = await Promise.all(
      normalizedPhones.map((phone, idx) =>
        stkPush(phone, participantAmounts[idx], billId, billTitle)
      )
    );

    const participants: Participant[] = normalizedPhones.map((phone, idx) => ({
      id: `P-${billId}-${idx + 1}`,
      name: sanitizeText(rawParticipants[idx].name, 40) || `Person ${idx + 1}`,
      phone,
      amount: participantAmounts[idx],
      status: 'pending',
      receipt: null,
      checkoutRequestId: stkResults[idx].CheckoutRequestID,
      merchantRequestId: stkResults[idx].MerchantRequestID,
      attempts: 1,
      updatedAt: nowIso,
      failureReason: null,
    }));

    const signaturePayload = `${billId}|${numericTotal}|${idempotencyKey}|${normalizedPhones.join(',')}`;
    const signatureHash = computeHmacSignature(signaturePayload).slice(0, 24);

    const newBill: Bill = {
      id: billId,
      title: billTitle,
      category: billCategory,
      total: Number((totalCents / 100).toFixed(2)),
      splitMode,
      createdAt: nowIso,
      updatedAt: nowIso,
      idempotencyKey,
      signatureHash,
      mode: isDarajaConfigured() ? 'daraja' : 'sandbox',
      participants,
    };

    await billStore.save(newBill);

    appendAuditLog({
      event: 'BILL_CREATED',
      billId: newBill.id,
      actor: 'Organizer',
      details: `Sent ${participants.length} M-Pesa payment requests totaling KES ${newBill.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      severity: 'info',
    });

    const responsePayload = {
      message: 'M-Pesa payment requests sent!',
      billId: newBill.id,
      bill: newBill,
    };

    saveIdempotency(idempotencyKey, rawBody, 200, responsePayload);
    res.status(200).json(responsePayload);
  } catch {
    res.status(500).json({
      message:
        'We could not send the M-Pesa payment prompts right now. Please check your connection and try again.',
    });
  }
};

export const handleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback || !stkCallback.CheckoutRequestID) {
      res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback request' });
      return;
    }

    const checkoutRequestId = String(stkCallback.CheckoutRequestID);
    const replayCheck = verifyAndRecordCallback(checkoutRequestId);
    if (!replayCheck.allowed) {
      res.status(409).json({ ResultCode: 1, ResultDesc: 'Duplicate callback ignored' });
      return;
    }

    const match = await billStore.findByCheckoutId(checkoutRequestId);
    if (match) {
      const { bill, participantIndex } = match;
      const participant = bill.participants[participantIndex];

      if (Number(stkCallback.ResultCode) === 0) {
        const items: Array<{ Name: string; Value?: string | number }> =
          stkCallback.CallbackMetadata?.Item || [];
        const receiptItem = items.find((item) => item.Name === 'MpesaReceiptNumber');
        participant.status = 'paid';
        participant.receipt = receiptItem?.Value ? String(receiptItem.Value) : generateReceipt();
        participant.failureReason = null;
        participant.updatedAt = new Date().toISOString();
      } else {
        participant.status = 'failed';
        participant.failureReason = 'Payment prompt was cancelled or timed out';
        participant.updatedAt = new Date().toISOString();
      }
      await billStore.save(bill);
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch {
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

export const getBillStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const billId = String(req.params.billId || '');
    const bill = await billStore.get(billId);

    if (!bill) {
      res.status(404).json({
        message: 'We could not find that bill. It may have been removed.',
        billId,
        participants: [],
      });
      return;
    }

    const nextPending = bill.participants.find((p) => p.status === 'pending');
    if (nextPending && nextPending.checkoutRequestId) {
      try {
        const queryRes = await stkPushQuery(nextPending.checkoutRequestId);
        if (queryRes.ResultCode === '0') {
          nextPending.status = 'paid';
          nextPending.receipt = nextPending.receipt || generateReceipt();
          nextPending.failureReason = null;
          nextPending.updatedAt = new Date().toISOString();
          recordCallbackVerified();
          await billStore.save(bill);
        }
      } catch {
        // Ignore transient status check errors
      }
    }

    res.status(200).json({
      billId: bill.id,
      bill,
      participants: bill.participants,
      auditLogs: billStore.getAuditLogs(),
      security: getSecurityPosture(isTokenCacheActive()),
    });
  } catch {
    res.status(500).json({
      message: 'We could not refresh the payment status right now. Please try again.',
    });
  }
};

export const simulateParticipantStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const billId = String(req.params.billId || '');
    const { phone, status } = req.body as { phone?: string; status?: PaymentStatus };

    const bill = await billStore.get(billId);
    if (!bill) {
      res.status(404).json({ message: 'We could not find that bill.' });
      return;
    }

    const normalized = phone ? normalizeKenyanPhone(phone) : '';
    const participant = bill.participants.find((p) => p.phone === normalized);
    if (!participant) {
      res.status(404).json({ message: 'We could not find that person on this bill.' });
      return;
    }

    const targetStatus: PaymentStatus = status || 'paid';
    participant.status = targetStatus;
    participant.updatedAt = new Date().toISOString();

    if (targetStatus === 'paid') {
      participant.receipt = participant.receipt || generateReceipt();
      participant.failureReason = null;
      recordCallbackVerified();
    } else if (targetStatus === 'failed') {
      participant.receipt = null;
      participant.failureReason = 'Payment prompt was cancelled on phone';
    } else if (targetStatus === 'pending') {
      const stkResponse = await stkPush(participant.phone, participant.amount, bill.id, bill.title);
      participant.checkoutRequestId = stkResponse.CheckoutRequestID;
      participant.merchantRequestId = stkResponse.MerchantRequestID;
      participant.receipt = null;
      participant.failureReason = null;
      participant.attempts = (participant.attempts || 1) + 1;
    }

    await billStore.save(bill);

    res.status(200).json({
      billId: bill.id,
      bill,
      participants: bill.participants,
      auditLogs: billStore.getAuditLogs(),
      security: getSecurityPosture(isTokenCacheActive()),
    });
  } catch {
    res.status(500).json({
      message: 'We could not update that payment right now. Please try again.',
    });
  }
};

export const settleAllPending = async (req: Request, res: Response): Promise<void> => {
  try {
    const billId = String(req.params.billId || '');
    const bill = await billStore.get(billId);
    if (!bill) {
      res.status(404).json({ message: 'We could not find that bill.' });
      return;
    }

    let settledCount = 0;
    for (const p of bill.participants) {
      if (p.status !== 'paid') {
        p.status = 'paid';
        p.receipt = p.receipt || generateReceipt();
        p.failureReason = null;
        p.updatedAt = new Date().toISOString();
        recordCallbackVerified();
        settledCount += 1;
      }
    }

    if (settledCount > 0) {
      await billStore.save(bill);
    }

    res.status(200).json({
      billId: bill.id,
      bill,
      participants: bill.participants,
      auditLogs: billStore.getAuditLogs(),
      security: getSecurityPosture(isTokenCacheActive()),
    });
  } catch {
    res.status(500).json({
      message: 'We could not mark all payments as paid right now. Please try again.',
    });
  }
};

export const scanToPayBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const billId = String(req.params.billId || '');
    const { participantId, name, phone, amount, completeImmediately } = req.body as {
      participantId?: string;
      name?: string;
      phone?: string;
      amount?: number;
      completeImmediately?: boolean;
    };

    const bill = await billStore.get(billId);
    if (!bill) {
      res.status(404).json({ message: 'We could not find this bill.' });
      return;
    }

    const rawPhone = String(phone || '').trim();
    if (!isValidKenyanPhone(rawPhone)) {
      res.status(400).json({
        message: 'Please enter a valid Kenyan M-Pesa number (for example, 0712 345 678).',
      });
      return;
    }
    const normalizedPhone = normalizeKenyanPhone(rawPhone);

    let targetParticipant: Participant;

    if (participantId) {
      const found = bill.participants.find(
        (p) => p.id === participantId || p.phone === participantId
      );
      if (!found) {
        res.status(404).json({ message: 'We could not find your name on this bill.' });
        return;
      }
      found.phone = normalizedPhone;
      targetParticipant = found;
    } else {
      const cleanName = sanitizeText(name, 40) || 'Guest Payer';
      const customAmt = Number(amount);
      const shareAmount =
        Number.isFinite(customAmt) && customAmt >= 1
          ? Number(customAmt.toFixed(2))
          : bill.participants[0]?.amount || 500;

      targetParticipant = {
        id: `P-${bill.id}-${bill.participants.length + 1}`,
        name: cleanName,
        phone: normalizedPhone,
        amount: shareAmount,
        status: 'pending',
        receipt: null,
        checkoutRequestId: null,
        merchantRequestId: null,
        attempts: 1,
        updatedAt: new Date().toISOString(),
        failureReason: null,
      };
      bill.participants.push(targetParticipant);
      bill.total = Number(
        bill.participants.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
      );
    }

    const stkResponse = await stkPush(
      targetParticipant.phone,
      targetParticipant.amount,
      bill.id,
      bill.title
    );
    targetParticipant.checkoutRequestId = stkResponse.CheckoutRequestID;
    targetParticipant.merchantRequestId = stkResponse.MerchantRequestID;
    targetParticipant.attempts = (targetParticipant.attempts || 0) + 1;
    targetParticipant.updatedAt = new Date().toISOString();

    if (completeImmediately && !isDarajaConfigured()) {
      targetParticipant.status = 'paid';
      targetParticipant.receipt = targetParticipant.receipt || generateReceipt();
      targetParticipant.failureReason = null;
      recordCallbackVerified();
    } else {
      targetParticipant.status = 'pending';
      targetParticipant.failureReason = null;
    }

    await billStore.save(bill);

    appendAuditLog({
      event: 'QR_SCAN_PAYMENT_INITIATED',
      billId: bill.id,
      actor: targetParticipant.name,
      details: `Initiated QR scan payment of KES ${targetParticipant.amount.toFixed(2)} from +${targetParticipant.phone}`,
      severity: 'success',
    });

    res.status(200).json({
      message:
        targetParticipant.status === 'paid'
          ? `Payment confirmed! M-Pesa Receipt: ${targetParticipant.receipt}`
          : `M-Pesa PIN prompt sent to +${targetParticipant.phone}. Check your phone to complete payment.`,
      billId: bill.id,
      bill,
      participant: targetParticipant,
    });
  } catch {
    res.status(500).json({
      message: 'We could not start your M-Pesa payment right now. Please try again.',
    });
  }
};

