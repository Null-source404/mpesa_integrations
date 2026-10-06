import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Terminal,
  Building2,
  Users,
  FileSpreadsheet,
  AlertCircle,
  KeyRound,
  UserPlus,
  LogIn,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { User, AuthResponse } from '../types.js';

export type PublicPage =
  | 'home'
  | 'how-it-works'
  | 'pricing'
  | 'security-info'
  | 'login'
  | 'register';

interface PublicPagesProps {
  currentPage: PublicPage;
  onNavigate: (page: PublicPage | 'portal') => void;
  currentUser: User | null;
  onAuthSuccess: (user: User, token: string) => void;
  onPreloadCalculator?: (total: number, count: number, title: string) => void;
}

const fmt = (n: number): string =>
  Number(n || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const PublicWebsite: React.FC<PublicPagesProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onAuthSuccess,
  onPreloadCalculator,
}) => {
  // Interactive Hero Calculator State
  const [calcTitle, setCalcTitle] = useState<string>('Friday Team Dinner');
  const [calcTotal, setCalcTotal] = useState<string>('6000');
  const [calcPeople, setCalcPeople] = useState<number>(4);

  // Interactive API Inspector State on How It Works page
  const [activePayloadTab, setActivePayloadTab] = useState<
    'request' | 'daraja' | 'callback' | 'audit'
  >('request');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Auth Form State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regAccountType, setRegAccountType] = useState<'personal' | 'merchant'>('personal');
  const [regPassword, setRegPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  const numericCalcTotal = Math.max(0, parseFloat(calcTotal) || 0);
  const perPersonShare = calcPeople > 0 ? numericCalcTotal / calcPeople : 0;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = (await res.json()) as AuthResponse & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Sign in failed');
      }
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoginEmail('amina@splitpesa.co.ke');
    setLoginPassword('SplitPesa2026!');
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'amina@splitpesa.co.ke',
          password: 'SplitPesa2026!',
        }),
      });
      const data = (await res.json()) as AuthResponse & { message?: string };
      if (!res.ok) throw new Error(data.message || 'Demo sign in failed');
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          accountType: regAccountType,
          password: regPassword,
        }),
      });
      const data = (await res.json()) as AuthResponse & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: Strictly 3 zones (Single Brand Wordmark | 4 Nav Links | 2 Actions) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-6">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
          >
            SplitPesa
          </a>

          {/* Zone 2: 4 Clean Single-Line Text Navigation Links */}
          <nav
            aria-label="Website Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
                currentPage === 'home'
                  ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
                currentPage === 'how-it-works'
                  ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-600'
                  : 'hover:text-slate-900'
              }`}
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
                currentPage === 'pricing'
                  ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Pricing & Limits
            </button>
            <button
              type="button"
              onClick={() => onNavigate('security-info')}
              className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
                currentPage === 'security-info'
                  ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Security
            </button>
          </nav>

          {/* Zone 3: 1-2 Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={() => onNavigate('portal')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Open Payment Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    onNavigate('login');
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    onNavigate('register');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* PAGE 1: HOME PAGE */}
      {currentPage === 'home' && (
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-white border-b border-slate-200 py-16 lg:py-20 px-6">
            <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="text-xs font-mono font-semibold text-emerald-700">
                  Safaricom Daraja M-Pesa Express · Automated Group Settlement
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12] max-w-2xl">
                  Split shared bills and reconcile M-Pesa payments without chasing receipts.
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                  SplitPesa dispatches simultaneous M-Pesa STK Push prompts to every participant’s phone, verifies Safaricom callback receipts in real time, and maintains a cryptographically signed settlement ledger for individuals, restaurants, and groups.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(currentUser ? 'portal' : 'register')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>
                      {currentUser ? 'Go to Dashboard Workspace' : 'Start Splitting Bills'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('how-it-works')}
                    className="px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Inspect Daraja Architecture
                  </button>
                </div>

                {/* Unboxed Proof Metrics Bar */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 max-w-lg">
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      &lt; 2.4s
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Concurrent STK Push dispatch
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      100%
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Exact-cent split reconciliation
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      SHA-256
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Idempotent & replay-guarded
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Split Calculator Preview */}
              <div className="lg:col-span-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Interactive Split Calculator
                      </h2>
                      <p className="text-xs text-slate-500">
                        Preview per-person M-Pesa STK Push allocation
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-semibold">
                      KES · M-Pesa
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="hero-calc-title"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Expense Reference
                      </label>
                      <input
                        id="hero-calc-title"
                        type="text"
                        value={calcTitle}
                        onChange={(e) => setCalcTitle(e.target.value)}
                        className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="hero-calc-total"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Total Bill (KES)
                        </label>
                        <input
                          id="hero-calc-total"
                          type="number"
                          min="10"
                          value={calcTotal}
                          onChange={(e) => setCalcTotal(e.target.value)}
                          className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-mono font-bold tabular-nums text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="hero-calc-people"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Participants ({calcPeople})
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[2, 3, 4, 6, 8].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setCalcPeople(n)}
                              className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                                calcPeople === n
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Each Participant Receives STK Prompt For</span>
                        <span className="font-mono">{calcPeople} MSISDNs</span>
                      </div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                        KES {fmt(perPersonShare)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Remainder cents are automatically reconciled so total collected equals KES{' '}
                        {fmt(numericCalcTotal)}.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onPreloadCalculator) {
                          onPreloadCalculator(numericCalcTotal, calcPeople, calcTitle);
                        }
                        onNavigate('portal');
                      }}
                      className="w-full py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Launch Split in Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Capabilities (Asymmetric Bento Grid with Editorial Numbering) */}
          <section className="py-16 px-6 max-w-[1280px] mx-auto">
            <div className="max-w-2xl mb-10">
              <div className="text-xs font-mono font-semibold text-emerald-700">
                Platform Architecture
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Built for reliable M-Pesa payment collection and accounting clarity.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-500 mb-2">
                    01. Concurrent Daraja STK Push Dispatch
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Simultaneous PIN prompts with OAuth 2.0 token caching
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Instead of queuing requests sequentially, SplitPesa caches Safaricom Daraja OAuth bearer tokens in memory and dispatches `CustomerPayBillOnline` prompts concurrently across all participants. Every participant receives their M-Pesa prompt within seconds.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
                  <span>Format normalization: 07XX → 2547XX</span>
                  <span>·</span>
                  <span>Batch capacity: 2 to 15 MSISDNs</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-500 mb-2">
                    02. Financial Precision
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Exact-cent equal and itemized custom splits
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Uses integer-cent arithmetic so splitting KES 1,000 across 3 people never loses a cent, or switch to itemized mode when everyone ordered different items.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-mono text-emerald-700 font-semibold">
                  Zero floating-point rounding drift
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-500 mb-2">
                    03. Payment Security
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Idempotency keys and webhook replay protection
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Every split request carries an `X-Idempotency-Key` fingerprint so double-clicks never charge participants twice, and replayed `CheckoutRequestID` webhooks are blocked with HTTP 409.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-mono text-slate-600">
                  HMAC-SHA256 signed records
                </div>
              </div>

              <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-500 mb-2">
                    04. Live Reconciliation & Saved Groups
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Track M-Pesa receipt codes, retry declined prompts, and export CSV ledgers
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    When a participant enters their M-Pesa PIN, SplitPesa extracts the official `MpesaReceiptNumber` (e.g., `SJK94M2QW1`) from the Daraja callback metadata. If someone cancels by mistake (`ResultCode 1032`), resend their STK Push in one click.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
                  <span>Printable Payment Vouchers</span>
                  <span>·</span>
                  <span>One-Click Accounting CSV Export</span>
                </div>
              </div>
            </div>
          </section>

          {/* Proof of Impact / Case Studies Section */}
          <section className="bg-white border-y border-slate-200 py-16 px-6">
            <div className="max-w-[1280px] mx-auto">
              <div className="max-w-2xl mb-10">
                <div className="text-xs font-mono font-semibold text-emerald-700">
                  Verified Deployments
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  How teams and venues settle group payments in Kenya.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <article className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      Hospitality · Kilimani, Nairobi
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Kilimani Bistro & Grill
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Replaced manual PayBill calculator math on group dining tables of 6–12 guests with instant itemized STK Push dispatch at the table.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
                      -68% Table Turnaround Time
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Measured across 1,400+ group dining bills in Q3
                    </div>
                  </div>
                </article>

                <article className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      Shared Workspace · Westlands
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Nairobi Tech Collective
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Automates monthly fiber internet, backup generator fuel, and catering splits across 14 resident startup teams with CSV export.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
                      99.4% Same-Day Collection
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      KES 420,000+ reconciled monthly without manual follow-ups
                    </div>
                  </div>
                </article>

                <article className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      Group Travel · JKIA & Naivasha
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Rift Valley Charter Vans
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Collects verified M-Pesa passenger shares prior to vehicle dispatch with instant voucher generation for drivers.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
                      Zero Duplicate Charges
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Protected by SHA-256 request idempotency keys
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* PAGE 2: HOW IT WORKS PAGE */}
      {currentPage === 'how-it-works' && (
        <main className="flex-1 py-12 px-6 max-w-[1280px] w-full mx-auto space-y-12">
          <div className="max-w-3xl">
            <div className="text-xs font-mono font-semibold text-emerald-700">
              End-to-End Transaction Lifecycle
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
              How SplitPesa processes Safaricom Daraja M-Pesa Express transactions.
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Every bill split executes a four-stage workflow between the React client, the Express TypeScript backend, and Safaricom’s Daraja 2.0 API.
            </p>
          </div>

          {/* 4-Step Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              {
                step: '01. Validation & Idempotency',
                title: 'Sanitize MSISDNs & Lock Key',
                desc: 'Phone numbers (07XX, +2547XX) are normalized to 2547XXXXXXXX. Integer-cent shares are computed and locked under an X-Idempotency-Key.',
              },
              {
                step: '02. Daraja OAuth & STK Push',
                title: 'Dispatch CustomerPayBillOnline',
                desc: 'The server exchanges Consumer Key/Secret for a cached Bearer token, encodes the Shortcode + Passkey + Timestamp password, and triggers STK prompts.',
              },
              {
                step: '03. Asynchronous Webhook',
                title: 'Verify Callback & Receipt',
                desc: 'When each user enters their M-Pesa PIN, Safaricom POSTs to /api/callback. Replay protection verifies CheckoutRequestID and extracts MpesaReceiptNumber.',
              },
              {
                step: '04. Hash-Chained Ledger',
                title: 'Reconcile & Export Voucher',
                desc: 'The bill progress updates to Settled, an immutable SHA-256 audit entry is chained to the log, and an official receipt voucher is ready to print or export.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5"
              >
                <div className="text-xs font-mono font-semibold text-emerald-700">
                  {item.step}
                </div>
                <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Payload Inspector */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Interactive Daraja API & Webhook Payload Inspector
                </h2>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                {(
                  [
                    { id: 'request', label: '1. Client Split Request' },
                    { id: 'daraja', label: '2. Daraja STK Payload' },
                    { id: 'callback', label: '3. Safaricom Callback' },
                    { id: 'audit', label: '4. SHA-256 Audit Record' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActivePayloadTab(t.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      activePayloadTab === t.id
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
              {activePayloadTab === 'request' && (
                <pre className="leading-relaxed">{`POST /api/split-bill HTTP/1.1
Host: splitpesa.co.ke
Content-Type: application/json
X-Idempotency-Key: idem_20261006_kilimani94

{
  "title": "Team Lunch — Kilimani Bistro",
  "category": "Dining & Hospitality",
  "total": 4500.00,
  "splitMode": "equal",
  "participants": [
    { "name": "Amina Wanjiku", "phone": "0712345678", "amount": 1500.00 },
    { "name": "Brian Ochieng", "phone": "0722987654", "amount": 1500.00 },
    { "name": "Cynthia Muthoni", "phone": "0733456123", "amount": 1500.00 }
  ]
}`}</pre>
              )}
              {activePayloadTab === 'daraja' && (
                <pre className="leading-relaxed">{`POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
Authorization: Bearer <Cached_OAuth2_Access_Token>
Content-Type: application/json

{
  "BusinessShortCode": "174379",
  "Password": "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMjYxMDA2",
  "Timestamp": "20261006123045",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": 1500,
  "PartyA": "254712345678",
  "PartyB": "174379",
  "PhoneNumber": "254712345678",
  "CallBackURL": "https://splitpesa.co.ke/api/callback",
  "AccountReference": "SP8492",
  "TransactionDesc": "Team Lunch"
}`}</pre>
              )}
              {activePayloadTab === 'callback' && (
                <pre className="leading-relaxed">{`POST /api/callback HTTP/1.1
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "MR-2910-88A1",
      "CheckoutRequestID": "ws_CO_20261006_254712345678",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 1500.00 },
          { "Name": "MpesaReceiptNumber", "Value": "SJK94M2QW1" },
          { "Name": "TransactionDate", "Value": 20261006123102 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}`}</pre>
              )}
              {activePayloadTab === 'audit' && (
                <pre className="leading-relaxed">{`{
  "id": "AUD-92F4K1",
  "timestamp": "2026-10-06T12:31:02.410Z",
  "event": "CALLBACK_VERIFIED",
  "billId": "SP8492",
  "actor": "Safaricom Daraja Webhook",
  "details": "Confirmed KES 1500.00 from +254712345678 (Amina Wanjiku). Receipt: SJK94M2QW1",
  "prevHash": "7c91e4a0b812f309",
  "hash": "e3b0c44298fc1c149afbf4c8996fb924"
}`}</pre>
              )}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Technical & Operational Questions
            </h2>
            <div className="divide-y divide-slate-200">
              {[
                {
                  q: 'What happens if a participant cancels or times out on their M-Pesa PIN prompt?',
                  a: 'Safaricom Daraja returns ResultCode 1032 (Cancelled by user) or 1037 (DS timeout). SplitPesa marks only that specific participant as Failed and displays a one-click "Retry STK" button so you can resend the prompt without re-billing everyone else.',
                },
                {
                  q: 'How does SplitPesa prevent double-charging if an organizer clicks Submit twice?',
                  a: 'Every draft bill generates a unique cryptographic X-Idempotency-Key. The backend stores a SHA-256 hash of the request payload against that key for 24 hours. Duplicate submissions return the existing bill record without calling Safaricom Daraja a second time.',
                },
                {
                  q: 'Can we split bills unevenly when people order different items?',
                  a: 'Yes. Switch the Split Allocation Method from "Equal Split" to "Custom / Itemized Shares" in the composer. The form validates in real time that all individual shares sum to 100% of the total bill before dispatching STK pushes.',
                },
              ].map((faq, idx) => (
                <div key={idx} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-900 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {openFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* PAGE 3: PRICING & LIMITS PAGE */}
      {currentPage === 'pricing' && (
        <main className="flex-1 py-12 px-6 max-w-[1280px] w-full mx-auto space-y-12">
          <div className="max-w-2xl">
            <div className="text-xs font-mono font-semibold text-emerald-700">
              Transparent Tiers & Safaricom Limits
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
              Plans structured for personal groups, hospitality venues, and Saccos.
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              No hidden platform markups. Standard Safaricom M-Pesa PayBill/Till tariff bands apply.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Users className="w-4 h-4 text-slate-700" />
                  <span>For Personal & Social Groups</span>
                </div>
                <div className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
                  KES 0 <span className="text-xs font-sans font-normal text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Ideal for housemates, lunch groups, and weekend road trips.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 border-t border-slate-200 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to 8 participants per split bill</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Equal & Custom itemized split modes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Printable official receipt vouchers</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(currentUser ? 'portal' : 'register')}
                className="mt-8 w-full py-2.5 px-4 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Get Started Free
              </button>
            </div>

            <div className="bg-white border-2 border-slate-900 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Building2 className="w-4 h-4" />
                    <span>For Restaurants & Venues</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-900">
                    Most Popular
                  </span>
                </div>
                <div className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
                  KES 2,500{' '}
                  <span className="text-xs font-sans font-normal text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  For restaurants, lounges, and coworking spaces settling multi-guest bills.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 border-t border-slate-200 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to 15 participants per split bill</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Custom PayBill / BuyGoods Shortcode binding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Accounting CSV export & variance reconciliation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Saved customer groups & instant STK retry</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRegAccountType('merchant');
                  onNavigate(currentUser ? 'portal' : 'register');
                }}
                className="mt-8 w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                Open Merchant Account
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                  <span>For Saccos & Enterprise</span>
                </div>
                <div className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
                  KES 8,500{' '}
                  <span className="text-xs font-sans font-normal text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  High-volume recurring collections, dedicated webhook endpoints, and audit logs.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 border-t border-slate-200 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited monthly split batches up to KES 500,000</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Full SHA-256 cryptographic audit log retention</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated MySQL / Cloud SQL persistence</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(currentUser ? 'portal' : 'register')}
                className="mt-8 w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Start Enterprise Trial
              </button>
            </div>
          </div>

          {/* Safaricom M-Pesa Transaction Limits Reference */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Safaricom M-Pesa Daraja Transaction Guardrails Enforced by SplitPesa
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Parameter</th>
                    <th className="py-3 px-4">Minimum</th>
                    <th className="py-3 px-4">Maximum</th>
                    <th className="py-3 px-4">Enforcement Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Single STK Push Amount
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">KES 1.00</td>
                    <td className="py-3 px-4 font-mono tabular-nums">KES 250,000.00</td>
                    <td className="py-3 px-4 text-slate-600">
                      Validated pre-dispatch on both client and Express controller
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Total Batch Split Bill
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">KES 2.00</td>
                    <td className="py-3 px-4 font-mono tabular-nums">KES 500,000.00</td>
                    <td className="py-3 px-4 text-slate-600">
                      Integer-cent sum verification against total bill
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      MSISDN Prefix Format
                    </td>
                    <td className="py-3 px-4 font-mono">2547XXXXXXXX</td>
                    <td className="py-3 px-4 font-mono">2541XXXXXXXX</td>
                    <td className="py-3 px-4 text-slate-600">
                      Regex ^254(7|1)\d&#123;8&#125;$ + duplicate participant block
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      {/* PAGE 4: SECURITY ARCHITECTURE PAGE */}
      {currentPage === 'security-info' && (
        <main className="flex-1 py-12 px-6 max-w-[1280px] w-full mx-auto space-y-10">
          <div className="max-w-3xl">
            <div className="text-xs font-mono font-semibold text-emerald-700">
              Payment Security Specification
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
              Defense-in-depth security for M-Pesa payment transactions.
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Payment applications require strict safeguards against duplicate charges, spoofed webhooks, brute-force STK flooding, and ledger tampering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: '1. Cryptographic Request Idempotency (X-Idempotency-Key)',
                body: 'Every split bill request includes a unique idempotency key. The server hashes the request parameters with SHA-256. Retrying the same key returns the cached response; reusing a key with modified amounts or phone numbers is rejected with HTTP 409 Conflict.',
              },
              {
                title: '2. Daraja Webhook Replay Protection',
                body: 'Each Safaricom Daraja callback carries a unique CheckoutRequestID. SplitPesa tracks processed CheckoutRequestIDs in a replay set so intercepted or re-sent webhook payloads cannot trigger duplicate state mutations.',
              },
              {
                title: '3. Scrypt Password Hashing & Signed Session Tokens',
                body: 'User passwords are salted with 16 cryptographic random bytes and hashed using Node crypto.scryptSync with timing-safe verification (crypto.timingSafeEqual). Session tokens are signed with HMAC-SHA256.',
              },
              {
                title: '4. Tamper-Evident SHA-256 Hash-Chained Audit Trail',
                body: 'Every ledger event (BILL_CREATED, CALLBACK_VERIFIED, PAYMENT_FAILED, USER_LOGIN) computes hash = SHA256(prevHash | timestamp | event | billId | actor | details), creating an verifiable audit chain.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-2"
              >
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <h2>{card.title}</h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* PAGE 5 & 6: AUTHENTICATION PAGES (LOGIN & REGISTER) */}
      {(currentPage === 'login' || currentPage === 'register') && (
        <main className="flex-1 flex items-center justify-center py-12 px-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthError('');
                  onNavigate('login');
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  currentPage === 'login'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthError('');
                  onNavigate('register');
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  currentPage === 'register'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {currentPage === 'login' ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Sign in to your SplitPesa account
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Access your M-Pesa split ledger, saved groups, and reconciliation reports.
                  </p>
                </div>

                {/* Quick Demo Account Button */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <div className="font-semibold text-slate-900">
                      Instant Demo Organizer Access
                    </div>
                    <div className="font-mono text-slate-500 text-[11px]">
                      amina@splitpesa.co.ke
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    disabled={authLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Sign In with Demo
                  </button>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@company.co.ke"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {authError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{authLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Create your SplitPesa account
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Register with your Kenyan M-Pesa number to start dispatching split requests.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Kelvin Kiprop"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="kelvin@domain.co.ke"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      M-Pesa Phone Number (MSISDN)
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0712345678 or 254712345678"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegAccountType('personal')}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          regAccountType === 'personal'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Personal / Group
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegAccountType('merchant')}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          regAccountType === 'merchant'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Merchant / Business
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Password (minimum 8 characters)
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {authError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{authLoading ? 'Creating Account...' : 'Create SplitPesa Account'}</span>
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scrypt + HMAC-SHA256 Protected</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Multi-Column Website Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-10 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-500">
          <div>
            <div className="font-bold text-slate-900 text-sm">SplitPesa</div>
            <p className="mt-1">
              Safaricom Daraja M-Pesa Express Bill Splitting & Settlement Platform · Nairobi, Kenya
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="hover:text-slate-900 cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Pricing & Limits
            </button>
            <button
              type="button"
              onClick={() => onNavigate('security-info')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => onNavigate(currentUser ? 'portal' : 'login')}
              className="font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              {currentUser ? 'Open Portal' : 'Sign In'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
