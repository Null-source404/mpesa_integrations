import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  X,
  Smartphone,
  Share2,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  UserPlus,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { Bill, Participant } from '../types.js';

const fmt = (n: number | string): string =>
  Number(n || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatWhatsAppBillSummary = (bill: Bill): string => {
  const paidCount = bill.participants.filter((p) => p.status === 'paid').length;
  const shareUrl = `${window.location.origin}/?payBill=${encodeURIComponent(bill.id)}`;
  const lines = [
    `*SplitPesa Bill: ${bill.title}* (#${bill.id})`,
    `Total: *KES ${fmt(bill.total)}* (${paidCount}/${bill.participants.length} paid)`,
    '',
    '*Individual Shares:*',
    ...bill.participants.map((p) => {
      if (p.status === 'paid') {
        return `✅ ${p.name}: KES ${fmt(p.amount)} — Paid (${p.receipt || 'Verified'})`;
      }
      if (p.status === 'failed') {
        return `❗ ${p.name}: KES ${fmt(p.amount)} — Prompt cancelled`;
      }
      return `⏳ ${p.name}: KES ${fmt(p.amount)} — Waiting for M-Pesa`;
    }),
    '',
    `📲 *Scan or tap to pay your share via M-Pesa:*`,
    shareUrl,
    `Or use M-Pesa PayBill *174379* · Account *${bill.id}*`,
  ];
  return lines.join('\n');
};

interface BillQRModalProps {
  bill: Bill;
  onClose: () => void;
  onOpenGuestPayPreview: (bill: Bill, preselectedParticipantId?: string) => void;
}

export const BillQRModal: React.FC<BillQRModalProps> = ({
  bill,
  onClose,
  onOpenGuestPayPreview,
}) => {
  const [qrMode, setQrMode] = useState<'scan-link' | 'mpesa-paybill'>('scan-link');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'link' | 'whatsapp' | 'paybill' | null>(
    null
  );

  const selectedParticipant: Participant | undefined =
    selectedPersonId === 'all'
      ? undefined
      : bill.participants.find((p) => p.id === selectedPersonId || p.phone === selectedPersonId);

  const unpaidAmount = bill.participants
    .filter((p) => p.status !== 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const targetAmount = selectedParticipant
    ? selectedParticipant.amount
    : unpaidAmount > 0
    ? unpaidAmount
    : bill.total;

  const accountRef = selectedParticipant
    ? `${bill.id}-${selectedParticipant.name.split(' ')[0].toUpperCase().slice(0, 6)}`
    : bill.id;

  const scanLinkUrl = `${window.location.origin}/?payBill=${encodeURIComponent(bill.id)}${
    selectedParticipant
      ? `&person=${encodeURIComponent(selectedParticipant.id || selectedParticipant.phone)}`
      : ''
  }`;

  // Construct payload based on selected QR mode
  const qrPayload =
    qrMode === 'scan-link'
      ? scanLinkUrl
      : JSON.stringify({
          type: 'MPESA_PAYBILL',
          paybill: '174379',
          account: accountRef,
          amount: Math.ceil(targetAmount),
          currency: 'KES',
          merchant: 'SplitPesa',
          billId: bill.id,
          url: scanLinkUrl,
        });

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [qrPayload]);

  const handleCopy = (text: string, type: 'link' | 'whatsapp' | 'paybill') => {
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    window.setTimeout(() => setCopiedType(null), 1800);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `splitpesa-qr-${bill.id.toLowerCase()}.png`;
    a.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-xl my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 id="qr-modal-title" className="text-base font-bold text-slate-900">
                Scan to Pay with M-Pesa · {bill.title}
              </h3>
              <p className="text-xs text-slate-500">
                Bill #{bill.id} · Friends can scan with their phone camera or banking app
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR code modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Mode Selector + Person Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                QR Code Type
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setQrMode('scan-link')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    qrMode === 'scan-link'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Instant STK Link
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode('mpesa-paybill')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    qrMode === 'mpesa-paybill'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PayBill / Bank QR
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="qr-person-select"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Who is scanning?
              </label>
              <select
                id="qr-person-select"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="all">
                  Everyone on Bill (Let them pick their name)
                </option>
                {bill.participants.map((p) => (
                  <option key={p.id || p.phone} value={p.id || p.phone}>
                    {p.name} — KES {fmt(p.amount)} ({p.status === 'paid' ? 'Paid' : 'Unpaid'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Center QR Code Card (Printable Table Tent) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0 shadow-xs">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`M-Pesa QR Code for ${bill.title}`}
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 bg-slate-100 rounded-lg animate-pulse" />
              )}
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <div className="text-xs font-semibold text-emerald-700">
                  {selectedParticipant
                    ? `Personal Share for ${selectedParticipant.name}`
                    : 'Shared Group Bill'}
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  KES {fmt(targetAmount)}
                </div>
                <div className="text-xs text-slate-500">
                  {selectedParticipant
                    ? `Phone: +${selectedParticipant.phone}`
                    : `${bill.participants.length} people sharing KES ${fmt(bill.total)}`}
                </div>
              </div>

              {/* Manual PayBill & USSD Box for Banking Apps */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">M-Pesa PayBill:</span>
                  <span className="font-mono font-bold text-slate-900">174379</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account No:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {accountRef}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">USSD Quick Dial:</span>
                  <span className="font-mono text-slate-700">*334# → Lipa na M-Pesa</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenGuestPayPreview(
                      bill,
                      selectedParticipant
                        ? selectedParticipant.id || selectedParticipant.phone
                        : undefined
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Scan-to-Pay Page</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR PNG</span>
                </button>
              </div>
            </div>
          </div>

          {/* Share Actions Bar: Copy Link, Copy WhatsApp Group Summary, Print */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleCopy(scanLinkUrl, 'link')}
              className="py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedType === 'link' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Payment Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Payment Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleCopy(formatWhatsAppBillSummary(bill), 'whatsapp')}
              className="py-2.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedType === 'whatsapp' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>WhatsApp Update Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copy WhatsApp Summary</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Table QR Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GuestScanPayModalProps {
  bill: Bill;
  initialParticipantId?: string;
  onClose: () => void;
  onBillUpdated: (updatedBill: Bill) => void;
}

export const GuestScanPayModal: React.FC<GuestScanPayModalProps> = ({
  bill,
  initialParticipantId,
  onClose,
  onBillUpdated,
}) => {
  const defaultUnpaid =
    bill.participants.find(
      (p) =>
        (initialParticipantId &&
          (p.id === initialParticipantId || p.phone === initialParticipantId)) ||
        p.status !== 'paid'
    ) || bill.participants[0];

  const [mode, setMode] = useState<'existing' | 'join'>('existing');
  const [selectedId, setSelectedId] = useState<string>(
    defaultUnpaid?.id || defaultUnpaid?.phone || ''
  );
  const [payerPhone, setPayerPhone] = useState<string>(defaultUnpaid?.phone || '');
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>(
    String(defaultUnpaid?.amount || 1000)
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const activeParticipant = bill.participants.find(
    (p) => p.id === selectedId || p.phone === selectedId
  );

  const handleSelectParticipant = (p: Participant) => {
    setSelectedId(p.id || p.phone);
    setPayerPhone(p.phone);
    setFeedback(null);
  };

  const handleTriggerScanPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const payload =
        mode === 'existing'
          ? {
              participantId: selectedId,
              phone: payerPhone,
              completeImmediately: true,
            }
          : {
              name: newName,
              phone: newPhone,
              amount: parseFloat(newAmount) || 0,
              completeImmediately: true,
            };

      const res = await fetch(`/api/bills/${encodeURIComponent(bill.id)}/scan-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        bill?: Bill;
      };

      if (!res.ok || !data.bill) {
        throw new Error(
          data.message || 'Could not initiate M-Pesa payment. Please check your phone number.'
        );
      }

      onBillUpdated(data.bill);
      setFeedback({
        type: 'success',
        text:
          data.message ||
          'M-Pesa payment prompt sent! Your share has been updated on the bill.',
      });
      if (mode === 'join') {
        setMode('existing');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'We could not complete your request right now.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const paidAmount = bill.participants
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0);
  const pct =
    bill.total > 0 ? Math.min(100, Math.round((paidAmount / bill.total) * 100)) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-pay-title"
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl my-auto">
        {/* Top Mobile Checkout Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              S
            </div>
            <div>
              <div className="text-[11px] text-emerald-400 font-semibold">
                SplitPesa QR Express Checkout
              </div>
              <h3 id="guest-pay-title" className="text-sm font-bold">
                {bill.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="p-1 text-slate-300 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bill Summary Strip */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Bill #{bill.id} · Total{' '}
              <strong className="font-mono text-slate-900">
                KES {fmt(bill.total)}
              </strong>
            </span>
            <span className="font-mono font-semibold text-emerald-700">
              {pct}% Paid
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Tabs: Pick My Name vs Join Bill */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('existing');
                setFeedback(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'existing'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tap Your Name
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('join');
                setFeedback(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'join'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Join This Bill
            </button>
          </div>

          <form onSubmit={handleTriggerScanPayment} className="space-y-4">
            {mode === 'existing' ? (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {bill.participants.map((p) => {
                    const isSelected = p.id === selectedId || p.phone === selectedId;
                    return (
                      <button
                        key={p.id || p.phone}
                        type="button"
                        onClick={() => handleSelectParticipant(p)}
                        className={`w-full p-3 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {p.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            +{p.phone}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-slate-900">
                            KES {fmt(p.amount)}
                          </div>
                          <div className="text-[11px] flex items-center justify-end gap-1">
                            {p.status === 'paid' ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Paid ({p.receipt})
                              </span>
                            ) : p.status === 'failed' ? (
                              <span className="text-rose-600 flex items-center gap-0.5">
                                <XCircle className="w-3 h-3" /> Cancelled
                              </span>
                            ) : (
                              <span className="text-amber-700 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> Tap to Pay
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {activeParticipant && (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <label
                      htmlFor="guest-payer-phone"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      M-Pesa Phone Number to Receive PIN Prompt
                    </label>
                    <input
                      id="guest-payer-phone"
                      type="tel"
                      required
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      Paying from a different Safaricom line? Update the number above and we will send the M-Pesa prompt there.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="join-name"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Your Name
                  </label>
                  <input
                    id="join-name"
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Collins Otieno"
                    className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="join-phone"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Your M-Pesa Phone Number
                  </label>
                  <input
                    id="join-phone"
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="join-amount"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Your Share Amount (KES)
                  </label>
                  <input
                    id="join-amount"
                    type="number"
                    min="1"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            )}

            {feedback && (
              <div
                role="status"
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {mode === 'existing' ? (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? 'Sending M-Pesa Prompt...'
                      : `Pay KES ${fmt(activeParticipant?.amount || 0)} via M-Pesa`}
                  </span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? 'Joining & Sending Prompt...'
                      : `Join & Pay KES ${fmt(newAmount || 0)}`}
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enter PIN only on your phone</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
