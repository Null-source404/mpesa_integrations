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
  Eye,
  EyeOff,
  QrCode,
  KeyRound,
  RotateCcw,
  Check,
  ExternalLink,
  HelpCircle,
  Send,
  SmartphoneNfc,
  Layers,
  Activity,
  Clock,
  CreditCard,
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Interactive Example Walkthrough on How It Works page
  const [activeExampleTab, setActiveExampleTab] = useState<
    'dinner' | 'utilities' | 'roadtrip'
  >('dinner');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Auth Form State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetMessage, setResetMessage] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regAccountType, setRegAccountType] = useState<'personal' | 'merchant'>('personal');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regAcceptedTerms, setRegAcceptedTerms] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Interactive Live M-Pesa STK Simulator for Auth page
  const [simPhone, setSimPhone] = useState<string>('0722 123 456');
  const [simAmount] = useState<string>('1,450');
  const [simStatus, setSimStatus] = useState<'idle' | 'prompt' | 'success'>('idle');
  const [simPin, setSimPin] = useState<string>('4321');
  const [simReceiptCode, setSimReceiptCode] = useState<string>('SKE9821LM7');

  const numericCalcTotal = Math.max(0, Math.round(parseFloat(calcTotal) || 0));
  const safePeople = Math.min(15, Math.max(2, calcPeople || 2));

  // Whole shillings split breakdown: STK Push accepts whole shillings only
  const calcBaseShare = safePeople > 0 ? Math.floor(numericCalcTotal / safePeople) : 0;
  const calcRemainder = safePeople > 0 ? numericCalcTotal - calcBaseShare * safePeople : 0;
  const calcShares: number[] = Array.from({ length: safePeople }, (_, idx) =>
    idx < calcRemainder ? calcBaseShare + 1 : calcBaseShare
  );

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

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'We could not update your password. Please try again.');
      }
      setResetMessage(
        data.message || 'Password successfully updated! You can now sign in with your new password.'
      );
      setLoginEmail(resetEmail);
      setLoginPassword(resetNewPassword);
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : 'Could not reset password right now.'
      );
    } finally {
      setResetLoading(false);
    }
  };

  const triggerSimPrompt = () => {
    setSimStatus('prompt');
  };

  const confirmSimPin = () => {
    setSimStatus('success');
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    setSimReceiptCode(`SK${randomHex}9M`);
  };

  const resetSim = () => {
    setSimStatus('idle');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar with Mobile Drawer Support */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                onNavigate('home');
              }}
              className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
            >
              SplitPesa
            </a>
          </div>

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

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="header" />
            {currentUser ? (
              <button
                type="button"
                onClick={() => onNavigate('portal')}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setIsMobileMenuOpen(false);
                    onNavigate('login');
                  }}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setIsMobileMenuOpen(false);
                    onNavigate('register');
                  }}
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu (360px optimized) */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-1 bg-white">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('home');
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                currentPage === 'home'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('how-it-works');
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                currentPage === 'how-it-works'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('pricing');
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                currentPage === 'pricing'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('security-info');
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                currentPage === 'security-info'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Safety & Trust
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('legal', 'privacy');
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                currentPage === 'legal'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Privacy & Legal
            </button>
            {!currentUser && (
              <div className="pt-2 pb-1 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setIsMobileMenuOpen(false);
                    onNavigate('register');
                  }}
                  className="w-full py-2.5 px-3 text-center text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Create Free Account
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* PAGE 1: HOME PAGE */}
      {currentPage === 'home' && (
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-white border-b border-slate-200 py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
            <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                <div className="text-xs font-semibold text-emerald-700">
                  Simple Group Payments with M-Pesa · Built for Kenya
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.15] max-w-2xl">
                  Split shared bills with friends and collect M-Pesa payments effortlessly.
                </h1>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-xl">
                  Whether it is a group dinner, shared apartment bills, a weekend road trip, or an office lunch, SplitPesa sends an M-Pesa payment prompt to everyone’s phone and shows pending and settled payments in real time—no more chasing screenshots.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate(currentUser ? 'portal' : 'register')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
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

                {/* Friendly Highlights with Softened, Honest Claims */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900">
                      Live Sync
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Prompts sent to all phones together
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900">
                      100%
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Exact whole shilling arithmetic
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900">
                      Guarded
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Idempotency duplicate protection
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
                          People Sharing ({safePeople})
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCalcPeople(Math.max(2, safePeople - 1))}
                            disabled={safePeople <= 2}
                            className="w-9 h-9 flex items-center justify-center text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            aria-label="Decrease number of people"
                          >
                            −
                          </button>
                          <input
                            id="hero-calc-people"
                            type="number"
                            min="2"
                            max="15"
                            value={calcPeople}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setCalcPeople(isNaN(val) ? 2 : Math.min(15, Math.max(1, val)));
                            }}
                            className="w-full text-center py-2 text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => setCalcPeople(Math.min(15, safePeople + 1))}
                            disabled={safePeople >= 15}
                            className="w-9 h-9 flex items-center justify-center text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            aria-label="Increase number of people"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                          <span>Min: 2</span>
                          <div className="flex gap-1 text-[10px] font-mono">
                            {[2, 3, 4, 5, 6, 8].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setCalcPeople(preset)}
                                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                                  safePeople === preset
                                    ? 'bg-slate-900 text-white font-bold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                          <span>Max: 15</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Each Person Pays (Whole Shillings)</span>
                        <span className="font-mono text-emerald-800 font-semibold">{safePeople} people</span>
                      </div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800">
                        {calcRemainder === 0 ? (
                          <span>KES {calcBaseShare.toLocaleString('en-KE')} each</span>
                        ) : (
                          <span>
                            KES {(calcBaseShare + 1).toLocaleString('en-KE')} / {calcBaseShare.toLocaleString('en-KE')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed font-sans">
                        {calcRemainder === 0 ? (
                          <span>
                            Exact equal split of KES {numericCalcTotal.toLocaleString('en-KE')} across all {safePeople} people.
                          </span>
                        ) : (
                          <span>
                            M-Pesa STK prompts require whole shillings: <strong className="text-slate-900">{calcRemainder} person{calcRemainder > 1 ? 's pay' : ' pays'} KES {(calcBaseShare + 1).toLocaleString('en-KE')}</strong> and <strong className="text-slate-900">{safePeople - calcRemainder} pay KES {calcBaseShare.toLocaleString('en-KE')}</strong> = exactly KES {numericCalcTotal.toLocaleString('en-KE')}.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Secondary Outline CTA - prevents competing with primary 'Start Splitting Bills Free' button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onPreloadCalculator) {
                          onPreloadCalculator(numericCalcTotal, safePeople, calcTitle);
                        }
                        onNavigate('portal');
                      }}
                      className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 hover:border-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Preview Split in Portal</span>
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
                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-700">
                  <span>Works with Kenyan 07XX and 01XX numbers</span>
                  <span>·</span>
                  <span>Splits whole shillings across 2 to 15 people</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 mb-2">
                    02. Equal or Custom Shares
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Split evenly in whole shillings or enter custom dish amounts
                  </h3>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    Divide a shared bill equally in whole shillings with exact balance matching, or switch to Custom Amounts when friends ordered different meals and drinks.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-emerald-800 font-semibold">
                  Validates that all individual shares sum exactly to the bill
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 mb-2">
                    03. Safe & Worry-Free
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Idempotency safeguards to help prevent duplicate submissions
                  </h3>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    If your mobile connection stutters and you tap Send twice, built-in idempotency keys ensure the server processes your split request only once.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-700">
                  Your M-Pesa PIN is never requested or stored by SplitPesa
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
                    <div className="text-xs font-semibold text-slate-700">
                      Restaurants & Cafes · Kilimani, Nairobi
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Kilimani Bistro & Grill
                    </h3>
                    <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                      Group tables of 6 to 12 guests settle their dinner bill in under two minutes without passing a calculator around the table.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-800">
                      2 Mins to Settle
                    </div>
                    <div className="text-xs text-slate-700 mt-0.5">
                      Every diner gets their own M-Pesa receipt
                    </div>
                  </div>
                </article>

                <article className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">
                      Apartments & Coworking · Westlands
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Shared Monthly Bills
                    </h3>
                    <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                      Housemates and office teams save their group once and split monthly Wi-Fi, water, and electricity bills in seconds.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-800">
                      Saved Groups
                    </div>
                    <div className="text-xs text-slate-700 mt-0.5">
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
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
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
                title: '2. Idempotency Safeguards on Duplicate Taps',
                body: 'If your mobile connection stutters and you tap "Send M-Pesa Requests" more than once, SplitPesa checks an idempotency key on the backend to suppress duplicate bill creation and avoid multiple prompts for the same expense.',
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
        <main className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto">
          {/* Header Title & Breadcrumb */}
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safaricom Daraja 2.0 Powered · Nairobi, Kenya</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentPage === 'login' ? 'Sign in to SplitPesa' : 'Create your SplitPesa account'}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              {currentPage === 'login'
                ? 'Manage group expenses, send instant M-Pesa payment requests, and track settlement receipts in real time.'
                : 'Join Kenyans splitting restaurant bills, rent, roadtrips, and group gifts without manual PayBill typing.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: Modern, Spacious Authentication Form */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              {/* Segmented Tab Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setShowForgotPassword(false);
                    onNavigate('login');
                  }}
                  className={`py-2.5 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    currentPage === 'login' && !showForgotPassword
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-700" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setShowForgotPassword(false);
                    onNavigate('register');
                  }}
                  className={`py-2.5 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    currentPage === 'register'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Forgot Password View */}
              {showForgotPassword ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Reset your password</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter your account email and choose a new password.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>

                  {resetMessage && (
                    <div
                      role="status"
                      className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Success!</div>
                        <div>{resetMessage}</div>
                      </div>
                    </div>
                  )}

                  {resetError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="reset-email"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Account Email Address
                      </label>
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="reset-new-password"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        New Password (at least 8 characters)
                      </label>
                      <input
                        id="reset-new-password"
                        type="password"
                        required
                        minLength={8}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{resetLoading ? 'Updating Password...' : 'Save New Password'}</span>
                    </button>
                  </form>
                </div>
              ) : currentPage === 'login' ? (
                /* LOGIN FORM */
                <div className="space-y-5">
                  {/* Quick Demo Explorer */}
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-emerald-950 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Instant Demo Account (One Click)</span>
                      </div>
                      <div className="text-[11px] text-emerald-800 mt-0.5">
                        Explore with preloaded friends, dining bills, and active M-Pesa receipts.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDemoSignIn}
                      disabled={authLoading}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      Open Demo Account
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
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="login-password"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(loginEmail);
                            setShowForgotPassword(true);
                          }}
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {authError && (
                      <div
                        role="alert"
                        className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{authLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* REGISTRATION FORM */
                <div className="space-y-5">
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
                        className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="reg-phone"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          Safaricom M-Pesa Phone
                        </label>
                        <input
                          id="reg-phone"
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0712 345 678"
                          className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        How will you use SplitPesa?
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRegAccountType('personal')}
                          className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                            regAccountType === 'personal'
                              ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/20 text-slate-900'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Users
                              className={`w-4 h-4 ${
                                regAccountType === 'personal'
                                  ? 'text-emerald-700'
                                  : 'text-slate-400'
                              }`}
                            />
                            <div className="text-xs font-bold">Personal & Friends</div>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Dinners, rent, roadtrips, gifts & drinks
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRegAccountType('merchant')}
                          className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                            regAccountType === 'merchant'
                              ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/20 text-slate-900'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2
                              className={`w-4 h-4 ${
                                regAccountType === 'merchant'
                                  ? 'text-emerald-700'
                                  : 'text-slate-400'
                              }`}
                            />
                            <div className="text-xs font-bold">Restaurant / Business</div>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Table bill split, Till QR codes & POS sync
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-password"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Choose a Secure Password (at least 8 characters)
                      </label>
                      <div className="relative">
                        <input
                          id="reg-password"
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                        >
                          {showRegPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Use 8+ characters. Passwords are salted and hashed on the server.
                      </p>
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
                        I accept the{' '}
                        <button
                          type="button"
                          onClick={() => onNavigate('legal', 'terms')}
                          className="font-semibold text-emerald-800 underline hover:text-emerald-950"
                        >
                          Terms & Conditions
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => onNavigate('legal', 'privacy')}
                          className="font-semibold text-emerald-800 underline hover:text-emerald-950"
                        >
                          Privacy Policy
                        </button>
                        .
                      </span>
                    </label>

                    {authError && (
                      <div
                        role="alert"
                        className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{authLoading ? 'Creating Account...' : 'Create My Account'}</span>
                    </button>
                  </form>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>256-Bit SSL · Zero M-Pesa PIN Storage</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-slate-900 underline cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Service Showcase & Live M-Pesa Phone Simulator */}
            <div className="lg:col-span-5 space-y-6">
              {/* INTERACTIVE PHONE SIMULATOR */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold tracking-wide uppercase text-emerald-400">
                      Live M-Pesa Experience
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Safaricom Daraja 2.0</span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Experience how painless group payments are. Try sending an M-Pesa STK prompt
                    right now:
                  </p>

                  {/* Phone Mockup Screen */}
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-left relative overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-2 pb-2 border-b border-slate-800/80">
                      <span>SIM 1 · Safaricom</span>
                      <span>4G LTE · 98%</span>
                    </div>

                    {simStatus === 'idle' && (
                      <div className="space-y-3 py-2">
                        <div className="text-xs text-slate-400">
                          Target phone number:{' '}
                          <span className="font-mono text-white font-semibold">{simPhone}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                          <div className="text-slate-400 text-[11px]">Bill to split:</div>
                          <div className="font-bold text-white text-sm">
                            Fogo Gaucho Dinner (4 people)
                          </div>
                          <div className="text-emerald-400 font-mono font-bold mt-1">
                            Your share: KES {simAmount}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={triggerSimPrompt}
                          className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Simulate STK Push to Phone</span>
                        </button>
                      </div>
                    )}

                    {simStatus === 'prompt' && (
                      <div className="space-y-3 py-1">
                        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-xs space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <Smartphone className="w-4 h-4" />
                            <span>M-PESA SIM TOOLKIT</span>
                          </div>
                          <p className="text-white text-xs leading-relaxed font-sans">
                            Do you want to pay <span className="font-bold">KES {simAmount}</span> to{' '}
                            <span className="font-bold">SplitPesa #SP-204</span>?
                          </p>
                          <div>
                            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                              Enter 4-Digit M-Pesa PIN:
                            </label>
                            <input
                              type="password"
                              maxLength={4}
                              value={simPin}
                              onChange={(e) => setSimPin(e.target.value)}
                              placeholder="••••"
                              className="w-full py-2 px-3 rounded-md bg-slate-900 border border-emerald-500 text-center font-mono text-white text-base tracking-widest focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={resetSim}
                              className="flex-1 py-1.5 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={confirmSimPin}
                              className="flex-1 py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                            >
                              Confirm PIN
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {simStatus === 'success' && (
                      <div className="space-y-3 py-2">
                        <div className="p-3 rounded-lg bg-emerald-900/40 border border-emerald-500/50 text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>M-Pesa SMS Confirmation</span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-200 leading-relaxed">
                            <span className="font-bold text-emerald-300">{simReceiptCode}</span>{' '}
                            Confirmed. Ksh{simAmount} sent to SplitPesa Bill #SP-204. New M-PESA
                            balance is Ksh14,210.00. Transaction cost Ksh0.00.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={resetSim}
                          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Try Simulation Again</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* THREE CORE SERVICE HIGHLIGHT CARDS */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                    <SmartphoneNfc className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">
                      Zero Manual PayBill Typing
                    </h2>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      SplitPesa triggers prompt directly on participants’ phones. No wrong account
                      numbers or erroneous reversals.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">
                      Dynamic Bill QR Scan-to-Pay
                    </h2>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Friends scan your table QR code with camera or M-Pesa app to settle instantly
                      without needing to create an account.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 text-purple-700">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">
                      Itemized Restaurant Dishes & WhatsApp Receipts
                    </h2>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Allocate who ate what, add tips/taxes, and broadcast an instant WhatsApp
                      breakdown with settlement badges.
                    </p>
                  </div>
                </div>
              </div>
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
