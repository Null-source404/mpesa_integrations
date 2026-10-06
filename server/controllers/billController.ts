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
  const bills = await billStore.list();
  const auditLogs = billStore.getAuditLogs();
  const contacts = contactStore.listContacts();
  const groups = contactStore.listGroups();
  const security = getSecurityPosture(isTokenCacheActive());
  res.status(200).json({ bills, auditLogs, contacts, groups, security });
};

export const addSavedContact = async (req: Request, res: Response): Promise<void> => {
  const { name, phone, tag } = req.body as { name?: string; phone?: string; tag?: string };
  const cleanName = sanitizeText(name, 50);
  const rawPhone = String(phone || '').trim();
  const cleanTag = sanitizeText(tag, 30) || 'Contact';

  if (!cleanName) {
    res.status(400).json({ message: 'Enter a contact name.' });
    return;
  }
  if (!isValidKenyanPhone(rawPhone)) {
    res.status(400).json({
      message: 'Provide a valid Kenyan M-Pesa number (07XXXXXXXX or 2547XXXXXXXX).',
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
};

export const removeSavedContact = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || '');
  contactStore.deleteContact(id);
  res.status(200).json({ contacts: contactStore.listContacts() });
};

export const splitBill = async (req: Request, res: Response): Promise<void> => {
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

  // Check idempotency key to prevent duplicate M-Pesa charges
  if (req.headers['x-idempotency-key']) {
    const idemCheck = checkIdempotency(idempotencyKey, rawBody);
    if (idemCheck.hit && idemCheck.conflict) {
      appendAuditLog({
        event: 'IDEMPOTENCY_CONFLICT_BLOCKED',
        billId: 'N/A',
        actor: 'Idempotency Guard',
        details: `Blocked reused idempotency key (${idempotencyKey}) with mismatched payment payload.`,
        severity: 'error',
      });
      res.status(409).json({
        message: 'Idempotency conflict: key was already used with different bill parameters.',
      });
      return;
    }
    if (idemCheck.hit && idemCheck.record) {
      appendAuditLog({
        event: 'IDEMPOTENT_REPLAY_PREVENTED',
        billId: 'CACHED',
        actor: 'Idempotency Guard',
        details: `Returned cached transaction for duplicate request key ${idempotencyKey} without re-charging participants.`,
        severity: 'info',
      });
      res.status(idemCheck.record.status).json({
        ...(idemCheck.record.body as Record<string, unknown>),
        idempotentReplay: true,
      });
      return;
    }
  }

  const numericTotal = Number(rawBody.total);
  if (!Number.isFinite(numericTotal) || numericTotal < 1) {
    res.status(400).json({ message: 'Total bill amount must be at least KES 1.00.' });
    return;
  }
  if (numericTotal > 500_000) {
    res.status(400).json({
      message: 'Total bill exceeds maximum batch limit of KES 500,000.00.',
    });
    return;
  }

  // Support both structured participants[] and legacy phones[] array
  let rawParticipants: ParticipantInput[] = [];
  if (Array.isArray(rawBody.participants) && rawBody.participants.length > 0) {
    rawParticipants = rawBody.participants;
  } else if (Array.isArray(rawBody.phones)) {
    rawParticipants = rawBody.phones.map((phone, i) => ({
      name: `Participant ${i + 1}`,
      phone: String(phone),
    }));
  }

  if (rawParticipants.length < 2 || rawParticipants.length > 15) {
    res.status(400).json({
      message: 'A split bill requires between 2 and 15 participants.',
    });
    return;
  }

  const normalizedPhones: string[] = [];
  for (let i = 0; i < rawParticipants.length; i++) {
    const rawPhone = String(rawParticipants[i].phone || '');
    if (!isValidKenyanPhone(rawPhone)) {
      res.status(400).json({
        message: `Invalid Kenyan M-Pesa phone number "${rawPhone}" for participant #${i + 1}. Use 07XXXXXXXX or 2547XXXXXXXX.`,
      });
      return;
    }
    const norm = normalizeKenyanPhone(rawPhone);
    if (normalizedPhones.includes(norm)) {
      res.status(400).json({
        message: `Duplicate M-Pesa number +${norm} detected. Each participant in a split must have a unique phone number.`,
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
      if (!Number.isFinite(amt) || amt < 1) {
        res.status(400).json({
          message: `Participant #${i + 1} must have a valid custom amount of at least KES 1.00.`,
        });
        return;
      }
      if (amt > 250_000) {
        res.status(400).json({
          message: `Participant #${i + 1} amount exceeds Safaricom M-Pesa per-transaction limit of KES 250,000.00.`,
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
        message: `Custom split amounts do not match the total bill (difference: KES ${diffKes}).`,
      });
      return;
    }
  }

  const billId = `SP${Math.floor(1000 + Math.random() * 9000)}`;
  const billTitle = sanitizeText(rawBody.title, 70) || `Split Bill #${billId}`;
  const billCategory = sanitizeText(rawBody.category, 40) || 'General Expense';
  const nowIso = new Date().toISOString();

  try {
    // Dispatch STK pushes concurrently for low latency
    const stkResults = await Promise.all(
       normalizedPhones.map((phone, idx) =>
        stkPush(phone, participantAmounts[idx], billId, billTitle)
      )
    );

    const participants: Participant[] = normalizedPhones.map((phone, idx) => ({
      id: `P-${billId}-${idx + 1}`,
      name: sanitizeText(rawParticipants[idx].name, 40) || `Participant ${idx + 1}`,
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
      actor: 'Organizer / API',
      details: `Dispatched ${participants.length} STK Push prompts totaling KES ${newBill.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })} (${splitMode} split, HMAC ${signatureHash.slice(0, 10)}...)`,
      severity: 'info',
    });

    const responsePayload = {
      message: 'STK pushes dispatched',
      billId: newBill.id,
      bill: newBill,
    };

    saveIdempotency(idempotencyKey, rawBody, 200, responsePayload);
    res.status(200).json(responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initiate M-Pesa STK pushes';
    res.status(500).json({ message });
  }
};

export const handleCallback = async (req: Request, res: Response): Promise<void> => {
  const stkCallback = req.body?.Body?.stkCallback;
  if (!stkCallback || !stkCallback.CheckoutRequestID) {
    res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid Daraja callback payload' });
    return;
  }

  const checkoutRequestId = String(stkCallback.CheckoutRequestID);
  const replayCheck = verifyAndRecordCallback(checkoutRequestId);
  if (!replayCheck.allowed) {
    appendAuditLog({
      event: 'WEBHOOK_REPLAY_BLOCKED',
      billId: 'N/A',
      actor: 'Webhook Replay Guard',
      details: `Blocked duplicate callback replay for CheckoutRequestID ${checkoutRequestId}.`,
      severity: 'error',
    });
    res.status(409).json({ ResultCode: 1, ResultDesc: 'Duplicate callback replay rejected' });
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

      appendAuditLog({
        event: 'CALLBACK_VERIFIED',
        billId: bill.id,
        actor: 'Safaricom Daraja Webhook',
        details: `Confirmed KES ${participant.amount.toFixed(2)} from +${participant.phone} (${participant.name}). Receipt: ${participant.receipt}`,
        severity: 'success',
      });
    } else {
      participant.status = 'failed';
      participant.failureReason = String(
        stkCallback.ResultDesc || 'STK Push declined or timed out'
      );
      participant.updatedAt = new Date().toISOString();

      appendAuditLog({
        event: 'PAYMENT_FAILED',
        billId: bill.id,
        actor: 'Safaricom Daraja Webhook',
        details: `STK Push failed for +${participant.phone} (${participant.name}): ${participant.failureReason}`,
        severity: 'warning',
      });
    }
    await billStore.save(bill);
  }

  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
};

export const getBillStatus = async (req: Request, res: Response): Promise<void> => {
  const billId = String(req.params.billId || '');
  const bill = await billStore.get(billId);

  if (!bill) {
    res.status(404).json({ message: 'Bill not found', billId, participants: [] });
    return;
  }

  // Query pending participant status via Daraja stkPushQuery / sandbox progression
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

        appendAuditLog({
          event: 'STK_QUERY_SETTLED',
          billId: bill.id,
          actor: 'Daraja STK Query',
          details: `Verified payment of KES ${nextPending.amount.toFixed(2)} for +${nextPending.phone} (${nextPending.name}). Receipt: ${nextPending.receipt}`,
          severity: 'success',
        });
      }
    } catch (err) {
      console.warn('stkPushQuery check error:', err);
    }
  }

  res.status(200).json({
    billId: bill.id,
    bill,
    participants: bill.participants,
    auditLogs: billStore.getAuditLogs(),
    security: getSecurityPosture(isTokenCacheActive()),
  });
};

export const simulateParticipantStatus = async (req: Request, res: Response): Promise<void> => {
  const billId = String(req.params.billId || '');
  const { phone, status } = req.body as { phone?: string; status?: PaymentStatus };

  const bill = await billStore.get(billId);
  if (!bill) {
    res.status(404).json({ message: 'Bill not found' });
    return;
  }

  const normalized = phone ? normalizeKenyanPhone(phone) : '';
  const participant = bill.participants.find((p) => p.phone === normalized);
  if (!participant) {
    res.status(404).json({ message: 'Participant not found on this bill' });
    return;
  }

  const targetStatus: PaymentStatus = status || 'paid';
  participant.status = targetStatus;
  participant.updatedAt = new Date().toISOString();

  if (targetStatus === 'paid') {
    participant.receipt = participant.receipt || generateReceipt();
    participant.failureReason = null;
    recordCallbackVerified();
    appendAuditLog({
      event: 'CALLBACK_VERIFIED',
      billId: bill.id,
      actor: 'Daraja Callback Simulator',
      details: `Confirmed KES ${participant.amount.toFixed(2)} from +${participant.phone} (${participant.name}). Receipt: ${participant.receipt}`,
      severity: 'success',
    });
  } else if (targetStatus === 'failed') {
    participant.receipt = null;
    participant.failureReason = 'Request cancelled by user (Daraja ResultCode 1032)';
    appendAuditLog({
      event: 'PAYMENT_FAILED',
      billId: bill.id,
      actor: 'Daraja Callback Simulator',
      details: `STK prompt declined by +${participant.phone} (${participant.name}) — ResultCode 1032`,
      severity: 'warning',
    });
  } else if (targetStatus === 'pending') {
    const stkResponse = await stkPush(participant.phone, participant.amount, bill.id, bill.title);
    participant.checkoutRequestId = stkResponse.CheckoutRequestID;
    participant.merchantRequestId = stkResponse.MerchantRequestID;
    participant.receipt = null;
    participant.failureReason = null;
    participant.attempts = (participant.attempts || 1) + 1;
    appendAuditLog({
      event: 'STK_RETRY_DISPATCHED',
      billId: bill.id,
      actor: 'Organizer / Retry',
      details: `Re-dispatched STK Push (Attempt #${participant.attempts}) to +${participant.phone} (${participant.name}) for KES ${participant.amount.toFixed(2)}`,
      severity: 'info',
    });
  }

  await billStore.save(bill);

  res.status(200).json({
    billId: bill.id,
    bill,
    participants: bill.participants,
    auditLogs: billStore.getAuditLogs(),
    security: getSecurityPosture(isTokenCacheActive()),
  });
};

export const settleAllPending = async (req: Request, res: Response): Promise<void> => {
  const billId = String(req.params.billId || '');
  const bill = await billStore.get(billId);
  if (!bill) {
    res.status(404).json({ message: 'Bill not found' });
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
    appendAuditLog({
      event: 'BATCH_RECONCILED',
      billId: bill.id,
      actor: 'Reconciliation Engine',
      details: `Reconciled ${settledCount} outstanding participant payment(s) on Bill #${bill.id}. Bill is 100% settled.`,
      severity: 'success',
    });
  }

  res.status(200).json({
    billId: bill.id,
    bill,
    participants: bill.participants,
    auditLogs: billStore.getAuditLogs(),
    security: getSecurityPosture(isTokenCacheActive()),
  });
};
