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
        <div className="text-xs font-semibold text-emerald-700">
          Trust, Privacy & Legal Center
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
          Clear, Honest Policies You Can Trust
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          We wrote our policies in plain, everyday English so you know exactly how SplitPesa protects your privacy, handles M-Pesa payment requests, and complies with the Kenya Data Protection Act, 2019 (ODPC) and National Payment System guidelines.
        </p>
      </div>

      {/* Policy Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
        {(
          [
            { id: 'privacy', label: '1. Privacy Policy', Icon: Lock },
            { id: 'terms', label: '2. Terms & Conditions', Icon: FileText },
            { id: 'cookies', label: '3. Cookie & Storage Notice', Icon: Cookie },
            { id: 'aml', label: '4. Fair Use & Safety Policy', Icon: Scale },
            { id: 'reversals', label: '5. Refunds & M-Pesa Reversals', Icon: RotateCcw },
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
                  Prepared in accordance with the Kenya Data Protection Act, 2019 (ODPC)
                </p>
              </div>
              <span className="text-xs text-slate-500">Updated: October 2026</span>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Information We Collect
              </h3>
              <p>
                We only collect the minimum details needed to split your bill and send M-Pesa payment requests:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 pl-2">
                <li>
                  <strong>Your Account Details:</strong> Your name, email address, and M-Pesa phone number when you create an account. Your password is encrypted before saving so nobody—not even our team—can read it.
                </li>
                <li>
                  <strong>Shared Bill Details:</strong> The bill description (such as &ldquo;Friday Team Lunch&rdquo;), each friend’s name, phone number, and their share of the bill.
                </li>
                <li>
                  <strong>Payment Confirmation Details:</strong> Whether a payment succeeded or was cancelled, the amount paid, and the M-Pesa receipt code (for example, <code>SJK94M2QW1</code>) so everyone has proof of payment.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. We Never Ask For or See Your M-Pesa PIN
              </h3>
              <p>
                <strong>SplitPesa never asks for, sees, or stores your M-Pesa PIN.</strong> When a payment request is sent, the official M-Pesa prompt pops up directly on your phone screen from Safaricom. You enter your PIN privately on your own phone—never on our website.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                3. How We Use Your Information
              </h3>
              <p>
                We use your information solely to calculate each person’s share of a bill, send the M-Pesa payment prompt to their phone, update your bill tracker when payments arrive, and prevent accidental double charges.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                4. No Selling of Personal Data
              </h3>
              <p>
                We never sell, rent, or share phone numbers or payment records with advertisers or marketing companies. Phone numbers and payment amounts are shared only with Safaricom M-Pesa when sending a payment request you initiated.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                5. Your Privacy Rights
              </h3>
              <p>
                Under the Kenya Data Protection Act, 2019, you can view your payment history at any time, download a copy of your records as a spreadsheet (CSV), update your saved contacts, or delete saved friends from your address book whenever you wish.
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
                  Governed by the Laws of the Republic of Kenya
                </p>
              </div>
              <span className="text-xs text-slate-500">Effective: October 2026</span>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. What SplitPesa Does
              </h3>
              <p>
                SplitPesa is a bill-splitting and payment-tracking tool that helps friends, housemates, and businesses divide shared expenses and send M-Pesa payment prompts. SplitPesa is a software tool—<strong>not a bank or deposit-taking institution</strong>. All payments go directly from the payer’s M-Pesa account to the configured PayBill or BuyGoods Till number.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. Getting Permission Before Sending Payment Prompts
              </h3>
              <p>
                When you enter phone numbers into SplitPesa, you agree that:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-2">
                <li>
                  Everyone listed on the bill knows about the shared expense and expects to receive an M-Pesa payment request on their phone.
                </li>
                <li>
                  You will not send unsolicited payment prompts to strangers or repeatedly send prompts to annoy anyone.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                3. M-Pesa Payment Limits
              </h3>
              <p>
                In line with standard Safaricom M-Pesa rules, each person’s share must be between <strong>KES 1.00 and KES 250,000.00</strong>, and a single shared bill cannot exceed <strong>KES 500,000.00</strong> across 2 to 15 people.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                4. Demo Mode vs. Live M-Pesa Mode
              </h3>
              <p>
                When run without live Safaricom business credentials, SplitPesa operates in a safe <strong>Demo & Practice Mode</strong> so you can test splitting bills and confirming payments without deducting real money. When connected to live Safaricom M-Pesa credentials, real M-Pesa PIN prompts are sent to participants’ phones.
              </p>
            </section>
          </div>
        )}

        {activePolicy === 'cookies' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Cookie & Browser Storage Notice
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Essential Storage Only · Zero Advertising Trackers
                </p>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">
                No Ad Trackers Used
              </span>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. How We Use Browser Storage
              </h3>
              <p>
                SplitPesa does <strong>not</strong> use advertising cookies, tracking pixels, or analytics scripts that follow you across other websites. We only save basic settings on your device so the app works smoothly:
              </p>
            </section>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4">Setting</th>
                    <th className="py-2.5 px-4">Why It Is Needed</th>
                    <th className="py-2.5 px-4">How Long It Stays</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Sign-In Session
                    </td>
                    <td className="py-2.5 px-4">
                      Keeps you signed in so you do not have to enter your password every time you refresh the page.
                    </td>
                    <td className="py-2.5 px-4">7 days or until you Sign Out</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Privacy Notice Choice
                    </td>
                    <td className="py-2.5 px-4">
                      Remembers that you closed the bottom privacy banner so it does not keep popping up.
                    </td>
                    <td className="py-2.5 px-4">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Offline App Cache
                    </td>
                    <td className="py-2.5 px-4">
                      Helps the installed mobile and desktop app open quickly even when your internet connection is slow.
                    </td>
                    <td className="py-2.5 px-4">Updated automatically</td>
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
                Fair Use, Anti-Fraud & Safety Policy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Aligned with the Proceeds of Crime and Anti-Money Laundering Act (POCAMLA) of Kenya
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. What Is Not Allowed on SplitPesa
              </h3>
              <p>
                To keep everyone safe, you may not use SplitPesa for:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 pl-2">
                <li>
                  <strong>Spamming Payment Prompts:</strong> Repeatedly sending unwanted M-Pesa prompts to someone’s phone.
                </li>
                <li>
                  <strong>Misleading Bill Names:</strong> Naming a bill to impersonate a bank, utility company, or government office to trick someone into paying.
                </li>
                <li>
                  <strong>Unlawful Activity:</strong> Collecting money for illegal goods, scams, or unauthorized fundraising.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. Built-In Protections
              </h3>
              <p>
                SplitPesa automatically prevents listing the same phone number twice on the same bill, blocks rapid-fire spam requests, and ensures every bill share adds up accurately before any request is sent.
              </p>
            </section>
          </div>
        )}

        {activePolicy === 'reversals' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Refunds, Disputes & M-Pesa Reversal Policy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                How Accidental Payments and Reversals Work
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Protection Against Double Charges
              </h3>
              <p>
                If your internet connection blinks and you accidentally tap &ldquo;Send M-Pesa Requests&rdquo; twice for the same bill, SplitPesa automatically recognizes the duplicate click and will not send a second charge to your friends.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. How to Request an M-Pesa Reversal
              </h3>
              <p>
                Because M-Pesa payments go directly to the organizer’s or restaurant’s PayBill / BuyGoods Till account:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 pl-2">
                <li>
                  Always keep your 10-character M-Pesa receipt code (such as <code>SJK94M2QW1</code>), which appears in your M-Pesa SMS and on your SplitPesa receipt.
                </li>
                <li>
                  Contact the bill organizer or business directly with your receipt code for an immediate refund, or forward the M-Pesa confirmation SMS to <strong>456</strong> (Safaricom’s official M-Pesa reversal service).
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
      aria-label="Privacy Notice"
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-6 py-3.5 shadow-lg"
    >
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong>Your Privacy Matters:</strong> SplitPesa uses essential browser storage only to keep you signed in and prevent duplicate charges. We never use advertising trackers and never ask for your M-Pesa PIN.{' '}
            <button
              type="button"
              onClick={() => onOpenPolicies('privacy')}
              className="font-semibold text-slate-900 underline hover:text-emerald-700 cursor-pointer"
            >
              Privacy Policy
            </button>{' '}
            ·{' '}
            <button
              type="button"
              onClick={() => onOpenPolicies('cookies')}
              className="font-semibold text-slate-900 underline hover:text-emerald-700 cursor-pointer"
            >
              Cookie Notice
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
            <span>Got It</span>
          </button>
        </div>
      </div>
    </div>
  );
};
