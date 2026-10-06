import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Users,
  FileSpreadsheet,
  AlertCircle,
  Lock,
  UserPlus,
  LogIn,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Receipt,
  Sparkles,
} from 'lucide-react';
import type { User, AuthResponse } from '../types.js';
import { PWAInstallButton } from './PWAInstall.js';
import { LegalPoliciesCenter, type PolicySection } from './LegalPolicies.js';

export type PublicPage =
  | 'home'
  | 'how-it-works'
  | 'pricing'
  | 'security-info'
  | 'legal'
  | 'login'
  | 'register';

interface PublicPagesProps {
  currentPage: PublicPage;
  initialPolicySection?: PolicySection;
  onNavigate: (page: PublicPage | 'portal', policySection?: PolicySection) => void;
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
  initialPolicySection = 'privacy',
  onNavigate,
  currentUser,
  onAuthSuccess,
  onPreloadCalculator,
}) => {
  // Interactive Hero Calculator State
  const [calcTitle, setCalcTitle] = useState<string>('Friday Team Dinner');
  const [calcTotal, setCalcTotal] = useState<string>('6000');
  const [calcPeople, setCalcPeople] = useState<number>(4);

  // Interactive Example Walkthrough on How It Works page
  const [activeExampleTab, setActiveExampleTab] = useState<
    'dinner' | 'utilities' | 'roadtrip'
  >('dinner');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Auth Form State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regAccountType, setRegAccountType] = useState<'personal' | 'merchant'>('personal');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regAcceptedTerms, setRegAcceptedTerms] = useState<boolean>(true);
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
      const data = (await res.json().catch(() => ({}))) as Partial<AuthResponse> & {
        message?: string;
      };
      if (!res.ok || !data.user || !data.token) {
        throw new Error(
          data.message || 'We could not sign you in. Please check your email and password.'
        );
      }
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'We could not connect right now. Please try again in a moment.'
      );
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
      const data = (await res.json().catch(() => ({}))) as Partial<AuthResponse> & {
        message?: string;
      };
      if (!res.ok || !data.user || !data.token) {
        throw new Error(data.message || 'We could not open the demo account right now.');
      }
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'We could not sign in right now. Please try again.'
      );
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
      const data = (await res.json().catch(() => ({}))) as Partial<AuthResponse> & {
        message?: string;
      };
      if (!res.ok || !data.user || !data.token) {
        throw new Error(
          data.message || 'We could not create your account. Please check your details.'
        );
      }
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'We could not create your account right now. Please try again.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-6">
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
              Home
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
              Pricing
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
              Safety & Trust
            </button>
            <button
              type="button"
              onClick={() => onNavigate('legal', 'privacy')}
              className={`py-1 whitespace-nowrap transition-colors cursor-pointer ${
                currentPage === 'legal'
                  ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-emerald-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Privacy & Legal
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton variant="header" />
            {currentUser ? (
              <button
                type="button"
                onClick={() => onNavigate('portal')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>My Dashboard</span>
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
                  Create Free Account
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
                <div className="text-xs font-semibold text-emerald-700">
                  Simple Group Payments with M-Pesa · Built for Kenya
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12] max-w-2xl">
                  Split shared bills with friends and collect M-Pesa payments effortlessly.
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                  Whether it is a group dinner, shared apartment bills, a weekend road trip, or an office lunch, SplitPesa sends an instant M-Pesa payment prompt to everyone’s phone and shows you who has paid in real time—no more chasing screenshots.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(currentUser ? 'portal' : 'register')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>
                      {currentUser ? 'Open My Dashboard' : 'Start Splitting Bills Free'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('how-it-works')}
                    className="px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    See How It Works
                  </button>
                  <PWAInstallButton variant="hero" />
                </div>

                {/* Friendly Highlights */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 max-w-lg">
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      Instant
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Phone prompts sent together
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      100%
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Fair to the last shilling
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      Zero
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Accidental double charges
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
                        Quick Bill Calculator
                      </h2>
                      <p className="text-xs text-slate-500">
                        See how much each person will pay on M-Pesa
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
                        What is the bill for?
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
                          People Sharing ({calcPeople})
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
                        <span>Each Person Pays</span>
                        <span className="font-medium">{calcPeople} people</span>
                      </div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                        KES {fmt(perPersonShare)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Any extra cents are balanced automatically so the total collected is exactly KES{' '}
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
                      <span>Split This Bill Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Everyday Features Section */}
          <section className="py-16 px-6 max-w-[1280px] mx-auto">
            <div className="max-w-2xl mb-10">
              <div className="text-xs font-semibold text-emerald-700">
                Why People Love SplitPesa
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Everything you need to split expenses without awkward reminders.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-700 mb-2">
                    01. Direct M-Pesa Phone Prompts
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Everyone gets a payment prompt on their phone at the same time
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Instead of asking everyone to memorize a PayBill or Till number, SplitPesa sends an official M-Pesa payment prompt straight to each person’s phone. They simply check the amount, enter their M-Pesa PIN on their own phone, and they are done.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span>Works with 07XX and 01XX numbers</span>
                  <span>·</span>
                  <span>Split among 2 to 15 people at once</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-700 mb-2">
                    02. Equal or Custom Shares
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Split evenly or enter exact meal amounts
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Divide a shared bill equally in one tap, or switch to Custom Amounts when friends ordered different meals and drinks.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-emerald-700 font-semibold">
                  Automatically checks that shares match the total
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-700 mb-2">
                    03. Safe & Worry-Free
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Built-in protection against double charges
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Even if your mobile internet is slow and you click Send twice, SplitPesa makes sure your friends only receive one payment request.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-600">
                  Your M-Pesa PIN stays 100% private on your phone
                </div>
              </div>

              <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-700 mb-2">
                    04. Live Receipts & Saved Friend Groups
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    See M-Pesa receipts immediately and resend missed prompts in one tap
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    As soon as a friend pays, their M-Pesa receipt code appears on your bill tracker. If someone accidentally closes the prompt on their phone, you can resend it to just that person with a single tap.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span>Printable Payment Receipts</span>
                  <span>·</span>
                  <span>Downloadable Excel / CSV Summary</span>
                </div>
              </div>
            </div>
          </section>

          {/* Real-Life Stories Section */}
          <section className="bg-white border-y border-slate-200 py-16 px-6">
            <div className="max-w-[1280px] mx-auto">
              <div className="max-w-2xl mb-10">
                <div className="text-xs font-semibold text-emerald-700">
                  Made for Everyday Moments
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  How friends, housemates, and restaurants use SplitPesa across Kenya.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <article className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500">
                      Restaurants & Cafes · Kilimani, Nairobi
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Kilimani Bistro & Grill
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Group tables of 6 to 12 guests settle their dinner bill in under two minutes without passing a calculator around the table.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
                      2 Mins to Settle
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Every diner gets their own M-Pesa receipt
                    </div>
                  </div>
                </article>

                <article className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500">
                      Apartments & Coworking · Westlands
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Shared Monthly Bills
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Housemates and office teams save their group once and split monthly Wi-Fi, water, and electricity bills in seconds.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
                      Saved Groups
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      No re-typing phone numbers every month
                    </div>
                  </div>
                </article>

                <article className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500">
                      Weekend Trips & Chamas · Naivasha & Coast
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Group Travel & Events
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Trip organizers collect transport, accommodation, and barbecue contributions fairly and share a printable payment receipt with the group.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
                      Clear Receipts
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Everyone sees who has paid at a glance
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
            <div className="text-xs font-semibold text-emerald-700">
              Simple 4-Step Guide
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
              How splitting a bill works from start to finish.
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              You do not need any accounting or technical knowledge. SplitPesa handles the math, sends the M-Pesa prompts, and organizes the receipts for you.
            </p>
          </div>

          {/* 4-Step Friendly Workflow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              {
                step: 'Step 1',
                title: 'Enter the Bill & Friends',
                desc: 'Type what the bill is for, enter the total amount in KES, and add your friends’ M-Pesa phone numbers (or pick a saved group).',
              },
              {
                step: 'Step 2',
                title: 'Send M-Pesa Requests',
                desc: 'Tap "Send M-Pesa Requests". Everyone receives an official payment prompt on their phone showing their exact share.',
              },
              {
                step: 'Step 3',
                title: 'Friends Enter Their PIN',
                desc: 'Each friend reviews the amount on their own phone and enters their M-Pesa PIN privately to complete their payment.',
              },
              {
                step: 'Step 4',
                title: 'Instant Receipts & Summary',
                desc: 'Your bill tracker updates automatically with each person’s M-Pesa receipt code, ready to view, print, or download.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5"
              >
                <div className="text-xs font-semibold text-emerald-700">
                  {item.step}
                </div>
                <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Real-World Scenarios Preview */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  See Real-Life Examples of SplitPesa in Action
                </h2>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                {(
                  [
                    { id: 'dinner', label: '1. Group Dinner (Equal Split)' },
                    { id: 'utilities', label: '2. House Utilities (Saved Group)' },
                    { id: 'roadtrip', label: '3. Custom Meal Orders' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveExampleTab(t.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      activeExampleTab === t.id
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50">
              {activeExampleTab === 'dinner' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
                    <div className="text-xs text-slate-500">Bill Details</div>
                    <div className="text-sm font-bold text-slate-900">
                      Team Lunch — Kilimani Bistro
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-700 pt-1">
                      Total: KES 4,500.00
                    </div>
                    <div className="text-xs text-slate-500">Split equally among 3 friends</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-700">
                      What Each Friend Receives on Their Phone:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded bg-slate-50 border border-slate-200">
                        <div className="font-semibold text-slate-900">Amina Wanjiku</div>
                        <div className="font-mono text-slate-500">0712 345 678</div>
                        <div className="mt-1 font-mono font-bold text-emerald-700">
                          KES 1,500.00 · Paid (SJK94M2QW1)
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-50 border border-slate-200">
                        <div className="font-semibold text-slate-900">Brian Ochieng</div>
                        <div className="font-mono text-slate-500">0722 987 654</div>
                        <div className="mt-1 font-mono font-bold text-emerald-700">
                          KES 1,500.00 · Paid (SJK71L8KP4)
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-50 border border-slate-200">
                        <div className="font-semibold text-slate-900">Cynthia Muthoni</div>
                        <div className="font-mono text-slate-500">0733 456 123</div>
                        <div className="mt-1 font-mono font-bold text-emerald-700">
                          KES 1,500.00 · Paid (SJK39V5NX8)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeExampleTab === 'utilities' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
                    <div className="text-xs text-slate-500">Saved Housemate Group</div>
                    <div className="text-sm font-bold text-slate-900">
                      Apartment 4B Monthly Wi-Fi & Power
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-700 pt-1">
                      Total: KES 6,900.00
                    </div>
                    <div className="text-xs text-slate-500">3 housemates · KES 2,300.00 each</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Why Saved Groups Save Time:
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Select <strong>Apartment 4B Utilities</strong> from your dashboard to automatically fill in David, Faith, and Kelvin’s names and phone numbers. Enter the month’s total and send all three M-Pesa prompts in under 10 seconds.
                    </p>
                  </div>
                </div>
              )}

              {activeExampleTab === 'roadtrip' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
                    <div className="text-xs text-slate-500">Custom Shares Mode</div>
                    <div className="text-sm font-bold text-slate-900">
                      Airport Transfer Van — JKIA
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-700 pt-1">
                      Total: KES 2,800.00
                    </div>
                    <div className="text-xs text-slate-500">Uneven shares based on drop-off distance</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Custom Amounts Checked Automatically:
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Grace pays <strong>KES 1,600.00</strong> and Samuel pays <strong>KES 1,200.00</strong>. SplitPesa checks that the custom shares add up to exactly <strong>KES 2,800.00</strong> before sending the M-Pesa requests so there is never a shortfall.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Friendly FAQ Section */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-slate-200">
              {[
                {
                  q: 'What happens if a friend accidentally cancels the M-Pesa prompt on their phone?',
                  a: 'No problem! SplitPesa shows that their payment was cancelled and gives you a one-click "Resend Prompt" button next to their name so you can send the M-Pesa request to just that person without bothering everyone else who already paid.',
                },
                {
                  q: 'Will my friends be charged twice if I accidentally click Send twice?',
                  a: 'No. SplitPesa has built-in duplicate protection. If you tap the button twice by mistake, we recognize it as the same bill and only send a single M-Pesa prompt to each person.',
                },
                {
                  q: 'Can we split a bill unevenly when people ordered different meals?',
                  a: 'Yes! Switch from "Split Equally" to "Custom Amounts" when creating your bill. You can enter each person’s exact share, and SplitPesa will make sure all shares add up to the total bill.',
                },
                {
                  q: 'Can I install SplitPesa as an app on my Android phone or iPhone?',
                  a: 'Yes! Tap the "Get App" button at the top of the page to add SplitPesa directly to your Android, iPhone, or computer home screen for instant full-screen access.',
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

      {/* PAGE 3: PRICING PAGE */}
      {currentPage === 'pricing' && (
        <main className="flex-1 py-12 px-6 max-w-[1280px] w-full mx-auto space-y-12">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-emerald-700">
              Simple, Honest Pricing
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
              Free for friends and housemates. Built to scale for restaurants and groups.
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              No hidden SplitPesa fees on personal splits. Standard Safaricom M-Pesa rates apply.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Users className="w-4 h-4 text-slate-700" />
                  <span>Friends & Housemates</span>
                </div>
                <div className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
                  KES 0 <span className="text-xs font-sans font-normal text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Great for lunch groups, housemates, and weekend road trips.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 border-t border-slate-200 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Split bills among up to 8 people</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Equal & Custom amount splits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Printable payment receipts</span>
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
                    <span>Restaurants & Venues</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-900">
                    Most Popular
                  </span>
                </div>
                <div className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
                  KES 2,500{' '}
                  <span className="text-xs font-sans font-normal text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  For restaurants, cafes, and lounges settling group dining tables fast.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 border-t border-slate-200 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Split bills among up to 15 guests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Connect your own PayBill or BuyGoods Till</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>One-click Excel / CSV accounting export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Saved groups & one-tap prompt resend</span>
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
                Open Business Account
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                  <span>Chamas, Saccos & Teams</span>
                </div>
                <div className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
                  KES 8,500{' '}
                  <span className="text-xs font-sans font-normal text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  For larger groups, recurring monthly collections, and full payment history.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 border-t border-slate-200 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited monthly bills up to KES 500,000</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Complete downloadable payment reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated database backup support</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(currentUser ? 'portal' : 'register')}
                className="mt-8 w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Start Organization Plan
              </button>
            </div>
          </div>

          {/* Standard M-Pesa Limits Table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Supported M-Pesa Payment Limits
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Minimum</th>
                    <th className="py-3 px-4">Maximum</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Amount Per Person
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">KES 1.00</td>
                    <td className="py-3 px-4 font-mono tabular-nums">KES 250,000.00</td>
                    <td className="py-3 px-4 text-slate-600">
                      Standard Safaricom M-Pesa single payment limit
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Total Shared Bill
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">KES 2.00</td>
                    <td className="py-3 px-4 font-mono tabular-nums">KES 500,000.00</td>
                    <td className="py-3 px-4 text-slate-600">
                      Split across 2 to 15 people on a single bill
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Supported Phone Numbers
                    </td>
                    <td className="py-3 px-4 font-mono">07XX XXX XXX</td>
                    <td className="py-3 px-4 font-mono">01XX XXX XXX</td>
                    <td className="py-3 px-4 text-slate-600">
                      Also accepts +2547... and +2541... formats automatically
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      {/* PAGE 4: SAFETY & TRUST PAGE */}
      {currentPage === 'security-info' && (
        <main className="flex-1 py-12 px-6 max-w-[1280px] w-full mx-auto space-y-10">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold text-emerald-700">
              Your Safety & Peace of Mind
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
              How we keep your payments and personal details safe.
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Handling money requires trust. SplitPesa is designed from the ground up so that you stay in full control of every payment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: '1. We Never See or Ask For Your M-Pesa PIN',
                body: 'You will never be asked to type your M-Pesa PIN on SplitPesa. When a bill is split, the official M-Pesa prompt appears directly on each person’s phone screen from Safaricom, where they enter their PIN privately.',
                Icon: Smartphone,
              },
              {
                title: '2. Automatic Protection Against Double Charges',
                body: 'If your phone connection is slow and you accidentally tap "Send M-Pesa Requests" twice, SplitPesa automatically detects the duplicate tap so your friends are never billed twice for the same expense.',
                Icon: ShieldCheck,
              },
              {
                title: '3. Official M-Pesa Receipt Verification',
                body: 'Every completed payment records the official 10-character M-Pesa receipt code (such as SJK94M2QW1) so both the organizer and everyone who chipped in have clear proof of payment.',
                Icon: Receipt,
              },
              {
                title: '4. Private, Encrypted Accounts',
                body: 'Your account password is encrypted before saving, your saved friends list is private to your workspace, and we never sell or share phone numbers with advertisers.',
                Icon: Lock,
              },
            ].map((card) => {
              const Icon = card.Icon;
              return (
                <div
                  key={card.title}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <Icon className="w-4 h-4 shrink-0" />
                    <h2>{card.title}</h2>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.body}</p>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* PAGE 5 & 6: AUTHENTICATION PAGES (LOGIN & REGISTER) */}
      {(currentPage === 'login' || currentPage === 'register') && (
        <main className="flex-1 flex items-center justify-center py-12 px-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8">
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
                    Welcome back to SplitPesa
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in to view your shared bills, saved friends, and M-Pesa receipts.
                  </p>
                </div>

                {/* Quick Demo Account Button */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <div className="font-semibold text-slate-900">
                      Want to explore first?
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Try our pre-loaded demo account in one click
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    disabled={authLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Try Demo Account
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
                      placeholder="you@example.com"
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
                    <span>{authLoading ? 'Signing In...' : 'Sign In'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Create your free SplitPesa account
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Start splitting bills and tracking M-Pesa payments in seconds.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Your Full Name
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
                      placeholder="kelvin@example.com"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Your M-Pesa Phone Number
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      How will you use SplitPesa?
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
                        Friends & Groups
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
                        Restaurant / Business
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Choose a Password (at least 8 characters)
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

                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={regAcceptedTerms}
                      onChange={(e) => setRegAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => onNavigate('legal', 'terms')}
                        className="font-semibold text-slate-900 underline"
                      >
                        Terms & Conditions
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => onNavigate('legal', 'privacy')}
                        className="font-semibold text-slate-900 underline"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>

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
                    <span>{authLoading ? 'Creating Account...' : 'Create My Account'}</span>
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Private & Encrypted Account</span>
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

      {/* PAGE 7: LEGAL & PRIVACY CENTER */}
      {currentPage === 'legal' && (
        <main className="flex-1">
          <LegalPoliciesCenter initialSection={initialPolicySection} />
        </main>
      )}

      {/* Website Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-10 mt-auto">
        <div className="max-w-[1280px] mx-auto space-y-6 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="font-bold text-slate-900 text-sm">SplitPesa</div>
              <p className="mt-1">
                Simple M-Pesa Bill Splitting & Group Payment Tracker · Nairobi, Kenya
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Home
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
                Pricing
              </button>
              <button
                type="button"
                onClick={() => onNavigate('security-info')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Safety & Trust
              </button>
              <button
                type="button"
                onClick={() => onNavigate(currentUser ? 'portal' : 'login')}
                className="font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                {currentUser ? 'My Dashboard' : 'Sign In'}
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} SplitPesa. Built for easy group payments with M-Pesa.
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('legal', 'privacy')}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => onNavigate('legal', 'terms')}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                Terms & Conditions
              </button>
              <button
                type="button"
                onClick={() => onNavigate('legal', 'cookies')}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                Cookie Notice
              </button>
              <button
                type="button"
                onClick={() => onNavigate('legal', 'aml')}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                Fair Use Policy
              </button>
              <button
                type="button"
                onClick={() => onNavigate('legal', 'reversals')}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                Refunds & Reversals
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
