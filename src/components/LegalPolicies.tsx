import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Cookie,
  Scale,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export type PolicySection = 'privacy' | 'terms' | 'cookies' | 'aml' | 'reversals';

const CONSENT_STORAGE_KEY = 'splitpesa_cookie_consent_v1';

interface LegalPoliciesProps {
  initialSection?: PolicySection;
}

export const LegalPoliciesCenter: React.FC<LegalPoliciesProps> = ({
  initialSection = 'privacy',
}) => {
  const [activePolicy, setActivePolicy] = useState<PolicySection>(initialSection);

  useEffect(() => {
    setActivePolicy(initialSection);
  }, [initialSection]);

  return (
    <div className="py-12 px-6 max-w-[1280px] w-full mx-auto space-y-8">
      <div className="max-w-3xl">
        <div className="text-xs font-mono font-semibold text-emerald-700">
          Legal, Regulatory & Data Governance Center
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
          Transparent Policies & Regulatory Compliance
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          SplitPesa operates in strict accordance with the Kenya Data Protection Act, 2019 (ODPC), the National Payment System Act, the Proceeds of Crime and Anti-Money Laundering Act (POCAMLA), and Safaricom Daraja API Developer Terms. Every statement below reflects the exact technical behavior of this application.
        </p>
      </div>

      {/* Policy Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
        {(
          [
            { id: 'privacy', label: '1. Privacy Policy (KDPA 2019)', Icon: Lock },
            { id: 'terms', label: '2. Terms & Conditions', Icon: FileText },
            { id: 'cookies', label: '3. Cookie & Storage Policy', Icon: Cookie },
            { id: 'aml', label: '4. AML & Acceptable Use', Icon: Scale },
            { id: 'reversals', label: '5. Payment & Reversal Policy', Icon: RotateCcw },
          ] as const
        ).map((tab) => {
          const Icon = tab.Icon;
          const active = activePolicy === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePolicy(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                active
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Policy Document Surface */}
      <article className="bg-white border border-slate-200 rounded-xl p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
        {activePolicy === 'privacy' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Privacy Policy & Data Protection Notice
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory Reference: Kenya Data Protection Act, No. 24 of 2019 (ODPC) & GDPR Principles
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">Effective: October 2026</span>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Personal Data We Collect and Process
              </h3>
              <p>
                SplitPesa collects only the minimum personal and transactional data required to initiate Safaricom M-Pesa Express (`CustomerPayBillOnline`) requests and maintain accounting reconciliation records:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-2">
                <li>
                  <strong>Organizer Account Data:</strong> Full Name, Email Address, Kenyan M-Pesa Phone Number (`2547XXXXXXXX` / `2541XXXXXXXX`), and account classification (`personal` or `merchant`). Passwords are never stored in plain text; they are salted with 16 random bytes and hashed via `crypto.scryptSync`.
                </li>
                <li>
                  <strong>Participant Split Data:</strong> Participant Name, Kenyan MSISDN phone number, allocated KES share amount, and expense description.
                </li>
                <li>
                  <strong>Safaricom Daraja Callback Metadata:</strong> `MerchantRequestID`, `CheckoutRequestID`, `ResultCode`, `MpesaReceiptNumber` (e.g., `SJK94M2QW1`), and transaction timestamp returned by Safaricom PLC upon payment completion.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. Zero Access to M-Pesa PINs (Critical Security Disclosure)
              </h3>
              <p>
                <strong>SplitPesa never requests, receives, views, transmits, or stores your M-Pesa PIN.</strong> When an STK Push is dispatched via Safaricom’s Daraja API, the PIN prompt is rendered directly on the participant’s mobile handset via the Safaricom SIM Toolkit over the cellular network. You should never enter your M-Pesa PIN on any website form.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                3. Lawful Basis & Purpose of Processing
              </h3>
              <p>
                Under Section 30 of the Kenya Data Protection Act, 2019, we process personal data strictly for the performance of a payment request initiated by the user, compliance with financial record-keeping and anti-fraud obligations, and legitimate interest in preventing duplicate charges via `X-Idempotency-Key` verification.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                4. Data Sharing & Third-Party Sub-Processors
              </h3>
              <p>
                We do not sell, rent, or trade personal phone numbers or transaction histories to advertisers or data brokers. Participant phone numbers and KES amounts are transmitted exclusively to <strong>Safaricom PLC (Daraja API Gateway)</strong> to deliver the STK Push prompt to the participant’s device.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                5. Your Rights as a Data Subject (Section 26, KDPA 2019)
              </h3>
              <p>
                You have the right to be informed of the use to which your personal data is to be put, to access your transaction ledger in portable CSV format (`Export CSV`), to rectify inaccurate saved contacts, and to delete saved contacts at any time from the <strong>Contacts & Groups</strong> workspace.
              </p>
            </section>
          </div>
        )}

        {activePolicy === 'terms' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Terms & Conditions of Service
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Governing Law: Laws of the Republic of Kenya
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">Version 2026.10</span>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Nature of the Platform (Non-Custodial Technical Software)
              </h3>
              <p>
                SplitPesa is a software application that calculates bill allocations, dispatches payment prompts through the Safaricom Daraja M-Pesa Express API (`CustomerPayBillOnline`), and reconciles webhook receipt notifications. SplitPesa is a technical software interface and <strong>not a licensed bank, deposit-taking microfinance institution, or money remittance operator</strong>. All payments settle directly from the participant’s M-Pesa wallet into the configured Safaricom PayBill or BuyGoods Till shortcode.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. Organizer Consent & Anti-Spam Obligations
              </h3>
              <p>
                By entering participant M-Pesa phone numbers into SplitPesa, you represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-2">
                <li>
                  All listed participants are aware of the shared expense and have consented to receive an M-Pesa STK Push payment prompt on their mobile device.
                </li>
                <li>
                  You will not use SplitPesa to send unsolicited payment prompts to random phone numbers or harass individuals.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                3. Transaction Limits & Mathematical Rounding
              </h3>
              <p>
                In compliance with Safaricom M-Pesa limits, individual participant shares must be between <strong>KES 1.00 and KES 250,000.00</strong>, and total batch bills may not exceed <strong>KES 500,000.00</strong>. Please note that Safaricom’s `CustomerPayBillOnline` endpoint requires whole-shilling integer amounts (`Math.ceil(amount)`) when dispatching the cellular STK prompt.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                4. Sandbox vs. Production Environment Disclosure
              </h3>
              <p>
                When operated without live Safaricom Daraja production credentials, SplitPesa runs in a deterministic <strong>Sandbox Mode</strong> for testing and demonstration. In Sandbox Mode, no real funds are deducted from M-Pesa accounts. Live cellular PIN prompts occur only when valid Safaricom Daraja credentials (`DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_SHORTCODE`, `DARAJA_PASSKEY`, and `DARAJA_CALLBACK_URL`) are configured on the server.
              </p>
            </section>
          </div>
        )}

        {activePolicy === 'cookies' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Cookie & Local Storage Policy
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strict Essential-Only Storage · Zero Third-Party Advertising Trackers
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-semibold">
                Zero Ad Trackers Verified
              </span>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Truthful Disclosure of Browser Storage Used
              </h3>
              <p>
                SplitPesa does <strong>not</strong> use third-party advertising cookies, cross-site tracking pixels, or behavioral profiling scripts. We use browser `localStorage` and Service Worker Cache Storage strictly for essential application functionality:
              </p>
            </section>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4">Storage Key / Mechanism</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Purpose</th>
                    <th className="py-2.5 px-4">Lifespan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      splitpesa_auth_token
                    </td>
                    <td className="py-2.5 px-4">localStorage</td>
                    <td className="py-2.5 px-4">
                      Stores your HMAC-SHA256 signed authentication session token.
                    </td>
                    <td className="py-2.5 px-4 font-mono">7 days / Sign Out</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      splitpesa_auth_user
                    </td>
                    <td className="py-2.5 px-4">localStorage</td>
                    <td className="py-2.5 px-4">
                      Caches your non-sensitive profile display name and phone number.
                    </td>
                    <td className="py-2.5 px-4 font-mono">Until Sign Out</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      splitpesa_cookie_consent_v1
                    </td>
                    <td className="py-2.5 px-4">localStorage</td>
                    <td className="py-2.5 px-4">
                      Remembers your acknowledgment of this Cookie & Storage notice.
                    </td>
                    <td className="py-2.5 px-4 font-mono">365 days</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      workbox-precache / fonts
                    </td>
                    <td className="py-2.5 px-4">Cache Storage (PWA)</td>
                    <td className="py-2.5 px-4">
                      Allows the Progressive Web App to load quickly on Android & iOS devices.
                    </td>
                    <td className="py-2.5 px-4 font-mono">Auto-updated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activePolicy === 'aml' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Acceptable Use, Anti-Fraud & AML Policy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory Reference: Proceeds of Crime and Anti-Money Laundering Act (POCAMLA) & National Payment System Regulations
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Prohibited Activities
              </h3>
              <p>
                Users are strictly prohibited from using SplitPesa to facilitate unlawful transactions, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-2">
                <li>
                  <strong>STK Push Bombing / Harassment:</strong> Repeatedly triggering unsolicited M-Pesa PIN prompts to disrupt a mobile user’s device.
                </li>
                <li>
                  <strong>Phishing or Social Engineering:</strong> Naming bills deceptively (e.g., impersonating a utility provider, bank, or government agency) to trick recipients into entering their M-Pesa PIN.
                </li>
                <li>
                  <strong>Structuring / Smurfing:</strong> Splitting unlawful proceeds into smaller M-Pesa transactions to evade reporting thresholds under POCAMLA.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. Technical Enforcement Controls Active on This Platform
              </h3>
              <p>
                To enforce this policy automatically, SplitPesa implements:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-2">
                <li>
                  <strong>Sliding-Window Rate Limiting:</strong> Maximum 25 split-bill dispatches per minute per IP address (`HTTP 429 Too Many Requests`).
                </li>
                <li>
                  <strong>Duplicate MSISDN Blocking:</strong> A single split bill cannot contain the same phone number more than once.
                </li>
                <li>
                  <strong>Immutable SHA-256 Audit Chaining:</strong> Every bill creation, retry, and callback event is recorded in a hash-chained audit log (`prevHash → hash`).
                </li>
              </ul>
            </section>
          </div>
        )}

        {activePolicy === 'reversals' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Payment Processing, Disputes & M-Pesa Reversal Policy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Procedures for Duplicate Payments, Erroneous Prompts, and Reversals
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Prevention of Accidental Duplicate Charges
              </h3>
              <p>
                Every split bill submission attaches a cryptographic `X-Idempotency-Key` header. If a user’s mobile connection drops and their browser resends the request, our server returns the existing bill record without initiating a second STK Push.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. How M-Pesa Reversals Are Handled
              </h3>
              <p>
                Because payments triggered via `CustomerPayBillOnline` settle directly into the designated Safaricom PayBill or BuyGoods Till shortcode:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-2">
                <li>
                  Participants should retain their 10-character M-Pesa Receipt Code (e.g., `SJK94M2QW1`), which is displayed on both their Safaricom SMS confirmation and the SplitPesa Payment Voucher.
                </li>
                <li>
                  Reversal requests for erroneous payments must be initiated by the Merchant Shortcode Administrator via the Safaricom M-Pesa Org Portal or the Daraja Transaction Reversal API (`/mpesa/reversal/v1/request`), or by the customer forwarding the M-Pesa confirmation SMS to <strong>456</strong> (Safaricom Official Reversal Line).
                </li>
              </ul>
            </section>
          </div>
        )}
      </article>
    </div>
  );
};

interface CookieConsentBannerProps {
  onOpenPolicies: (section: PolicySection) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPolicies,
}) => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Data Privacy Notice"
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-6 py-3.5 shadow-lg"
    >
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong>Privacy & Essential Storage Notice:</strong> SplitPesa uses strictly necessary browser storage (`localStorage` & PWA cache) for authentication and idempotency security. We use zero third-party advertising trackers and never collect your M-Pesa PIN.{' '}
            <button
              type="button"
              onClick={() => onOpenPolicies('privacy')}
              className="font-semibold text-slate-900 underline hover:text-emerald-700 cursor-pointer"
            >
              Privacy Policy (KDPA 2019)
            </button>{' '}
            ·{' '}
            <button
              type="button"
              onClick={() => onOpenPolicies('cookies')}
              className="font-semibold text-slate-900 underline hover:text-emerald-700 cursor-pointer"
            >
              Cookie Policy
            </button>{' '}
            ·{' '}
            <button
              type="button"
              onClick={() => onOpenPolicies('terms')}
              className="font-semibold text-slate-900 underline hover:text-emerald-700 cursor-pointer"
            >
              Terms of Service
            </button>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acknowledge & Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
