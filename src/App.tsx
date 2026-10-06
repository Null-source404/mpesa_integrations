import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Search,
  Download,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  FileText,
  Copy,
  Check,
  X,
  ArrowUpRight,
  LayoutDashboard,
  Receipt,
  ListOrdered,
  Users,
  LogOut,
  Globe,
  UserPlus,
  Printer,
} from 'lucide-react';
import type {
  Bill,
  ParticipantInput,
  PaymentStatus,
  SplitMode,
  SplitBillResponse,
  User,
  Contact,
  ContactGroup,
} from './types.js';
import { PublicWebsite, type PublicPage } from './components/PublicPages.js';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstall.js';
import { CookieConsentBanner, type PolicySection } from './components/LegalPolicies.js';

const API = '/api';
const TOKEN_STORAGE_KEY = 'splitpesa_auth_token';
const USER_STORAGE_KEY = 'splitpesa_auth_user';

const fmt = (n: number | string): string =>
  Number(n || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const CATEGORIES = [
  'Dining & Hospitality',
  'Workspace & Utilities',
  'Travel & Transport',
  'Group Event',
  'Household & Rent',
  'General Expense',
];

const isValidKenyanInput = (raw: string): boolean => {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return /^0(7|1)\d{8}$/.test(digits);
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return true;
  }
  return /^254(7|1)\d{8}$/.test(digits);
};

const generateIdempotencyKey = (): string => {
  const rand = Math.random().toString(36).slice(2, 10);
  return `idem_${Date.now().toString(36)}_${rand}`;
};

type SiteRoute = PublicPage | 'portal';
type PortalSection = 'overview' | 'new-split' | 'bills' | 'transactions' | 'contacts';
type BillFilter = 'all' | 'settled' | 'pending' | 'attention';

const getBillSettlementState = (bill: Bill): 'settled' | 'pending' | 'attention' => {
  const hasFailed = bill.participants.some((p) => p.status === 'failed');
  if (hasFailed) return 'attention';
  const allPaid =
    bill.participants.length > 0 && bill.participants.every((p) => p.status === 'paid');
  return allPaid ? 'settled' : 'pending';
};

export default function App() {
  const [siteRoute, setSiteRoute] = useState<SiteRoute>('home');
  const [policySection, setPolicySection] = useState<PolicySection>('privacy');
  const [portalSection, setPortalSection] = useState<PortalSection>('overview');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState<string>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Application Data State
  const [bills, setBills] = useState<Bill[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string>('');

  // Split Bill Composer State
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Dining & Hospitality');
  const [total, setTotal] = useState<string>('3000');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [draftParticipants, setDraftParticipants] = useState<ParticipantInput[]>([
    { name: 'Amina Wanjiku', phone: '0712345678', amount: 1500 },
    { name: 'Brian Ochieng', phone: '0722987654', amount: 1500 },
  ]);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateIdempotencyKey);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formNotice, setFormNotice] = useState<string>('');

  // New Contact Form State
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactTag, setNewContactTag] = useState<string>('Friend');
  const [contactError, setContactError] = useState<string>('');

  // Search & Filtering
  const [billFilter, setBillFilter] = useState<BillFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [busyBills, setBusyBills] = useState<Record<string, boolean>>({});
  const [selectedReceiptBill, setSelectedReceiptBill] = useState<Bill | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      const res = await fetch(`${API}/bills`);
      if (!res.ok) return;
      const data = (await res.json().catch(() => ({}))) as {
        bills?: Bill[];
        contacts?: Contact[];
        groups?: ContactGroup[];
      };
      if (Array.isArray(data.bills)) setBills(data.bills);
      if (Array.isArray(data.contacts)) setContacts(data.contacts);
      if (Array.isArray(data.groups)) setGroups(data.groups);
    } catch {
      // Keep existing state if offline
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!authToken) return;
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: User } | null) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, [authToken]);

  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore storage errors
    }
    setSiteRoute('portal');
    setPortalSection('overview');
    fetchAllData();
  };

  const handleLogout = async () => {
    if (authToken) {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    setCurrentUser(null);
    setAuthToken('');
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // ignore
    }
    setSiteRoute('home');
  };

  const handlePreloadFromHero = (calcTotal: number, count: number, calcTitle: string) => {
    setTitle(calcTitle);
    setTotal(String(calcTotal));
    setSplitMode('equal');
    const baseParticipants: ParticipantInput[] = Array.from({ length: count }, (_, idx) => {
      const existing = contacts[idx];
      return {
        name: existing ? existing.name : `Friend ${idx + 1}`,
        phone: existing ? existing.phone : `071234567${idx}`,
        amount: Number((calcTotal / count).toFixed(2)),
      };
    });
    setDraftParticipants(baseParticipants);
    setPortalSection('new-split');
  };

  const numericTotal = parseFloat(total) || 0;
  const computedShares = useMemo(() => {
    const count = draftParticipants.length || 1;
    if (splitMode === 'equal') {
      const totalCents = Math.round(numericTotal * 100);
      const baseCents = Math.floor(totalCents / count);
      const remainder = totalCents - baseCents * count;
      return draftParticipants.map((_, idx) =>
        Number(((idx < remainder ? baseCents + 1 : baseCents) / 100).toFixed(2))
      );
    }
    return draftParticipants.map((p) => Number(p.amount) || 0);
  }, [numericTotal, draftParticipants, splitMode]);

  const allocatedTotal = useMemo(
    () => computedShares.reduce((acc, val) => acc + val, 0),
    [computedShares]
  );

  const unallocatedDiff = Number((numericTotal - allocatedTotal).toFixed(2));

  const handleSplitModeChange = (mode: SplitMode) => {
    if (mode === 'custom' && splitMode === 'equal') {
      setDraftParticipants((prev) =>
        prev.map((p, idx) => ({
          ...p,
          amount: computedShares[idx] || 0,
        }))
      );
    }
    setSplitMode(mode);
  };

  const updateParticipant = (
    index: number,
    field: keyof ParticipantInput,
    value: string | number
  ) => {
    setDraftParticipants((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const addParticipant = (prefill?: { name: string; phone: string }) => {
    if (draftParticipants.length >= 15) return;
    setDraftParticipants((prev) => [
      ...prev,
      {
        name: prefill?.name || '',
        phone: prefill?.phone || '',
        amount: splitMode === 'custom' ? Math.max(0, unallocatedDiff) : 0,
      },
    ]);
  };

  const removeParticipant = (index: number) => {
    if (draftParticipants.length <= 2) return;
    setDraftParticipants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const loadGroupIntoComposer = (group: ContactGroup) => {
    setTitle(`${group.name}`);
    setSplitMode('equal');
    setDraftParticipants(
      group.members.map((m) => ({
        name: m.name,
        phone: m.phone,
        amount: 0,
      }))
    );
    setPortalSection('new-split');
  };

  const handleCreateSplitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormNotice('');

    if (!numericTotal || numericTotal < 1) {
      setFormError('Please enter a total bill amount of at least KES 1.00.');
      return;
    }

    const activeParticipants = draftParticipants.map((p, idx) => ({
      name: p.name.trim() || `Person ${idx + 1}`,
      phone: p.phone.trim(),
      amount: computedShares[idx],
    }));

    if (activeParticipants.some((p) => !p.phone)) {
      setFormError('Please enter an M-Pesa phone number for everyone on the bill.');
      return;
    }

    const invalidP = activeParticipants.find((p) => !isValidKenyanInput(p.phone));
    if (invalidP) {
      setFormError(
        `Please enter a valid Kenyan M-Pesa phone number for ${invalidP.name} (for example, 0712 345 678).`
      );
      return;
    }

    if (splitMode === 'custom' && Math.abs(unallocatedDiff) > 0.01) {
      setFormError(
        `Individual shares must add up to KES ${fmt(numericTotal)}. Difference remaining: KES ${fmt(
          unallocatedDiff
        )}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/split-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          title: title.trim() || undefined,
          category,
          total: numericTotal,
          splitMode,
          participants: activeParticipants,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as Partial<SplitBillResponse> & {
        message?: string;
      };
      if (!res.ok || !data.bill) {
        throw new Error(
          data.message || 'We could not send the M-Pesa requests right now. Please try again.'
        );
      }

      await fetchAllData();
      setFormNotice(
        `Sent M-Pesa payment prompts to ${data.bill.participants.length} people for "${data.bill.title}".`
      );
      setTitle('');
      setIdempotencyKey(generateIdempotencyKey());
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'We could not send the M-Pesa requests right now. Please check your connection.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    try {
      const res = await fetch(`${API}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContactName,
          phone: newContactPhone,
          tag: newContactTag,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        contacts?: Contact[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Could not save this contact. Please check the number.');
      }
      if (data.contacts) setContacts(data.contacts);
      setNewContactName('');
      setNewContactPhone('');
    } catch (err) {
      setContactError(
        err instanceof Error ? err.message : 'Could not save this contact right now.'
      );
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await fetch(`${API}/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { contacts?: Contact[] };
        if (data.contacts) setContacts(data.contacts);
      }
    } catch {
      setActionError('We could not remove that contact right now. Please try again.');
    }
  };

  const handleRefreshBill = async (billId: string) => {
    setActionError('');
    setBusyBills((prev) => ({ ...prev, [billId]: true }));
    try {
      const res = await fetch(`${API}/bill-status/${billId}`);
      if (!res.ok) {
        throw new Error('Could not refresh bill status right now.');
      }
      const data = (await res.json().catch(() => ({}))) as {
        bill?: Bill;
      };
      if (data.bill) {
        setBills((prev) => prev.map((b) => (b.id === billId ? data.bill! : b)));
        if (selectedReceiptBill?.id === billId) setSelectedReceiptBill(data.bill);
      }
    } catch {
      setActionError('We could not refresh the payment status right now. Please try again.');
    } finally {
      setBusyBills((prev) => ({ ...prev, [billId]: false }));
    }
  };

  const handleSimulateParticipant = async (
    billId: string,
    phone: string,
    status: PaymentStatus
  ) => {
    setActionError('');
    setBusyBills((prev) => ({ ...prev, [billId]: true }));
    try {
      const res = await fetch(`${API}/simulate-status/${billId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, status }),
      });
      if (!res.ok) {
        throw new Error('Could not update payment status right now.');
      }
      const data = (await res.json().catch(() => ({}))) as {
        bill?: Bill;
      };
      if (data.bill) {
        setBills((prev) => prev.map((b) => (b.id === billId ? data.bill! : b)));
        if (selectedReceiptBill?.id === billId) setSelectedReceiptBill(data.bill);
      }
    } catch {
      setActionError('We could not update that payment right now. Please try again.');
    } finally {
      setBusyBills((prev) => ({ ...prev, [billId]: false }));
    }
  };

  const handleSettleAll = async (billId: string) => {
    setActionError('');
    setBusyBills((prev) => ({ ...prev, [billId]: true }));
    try {
      const res = await fetch(`${API}/settle-all/${billId}`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Could not mark all payments as paid.');
      }
      const data = (await res.json().catch(() => ({}))) as {
        bill?: Bill;
      };
      if (data.bill) {
        setBills((prev) => prev.map((b) => (b.id === billId ? data.bill! : b)));
        if (selectedReceiptBill?.id === billId) setSelectedReceiptBill(data.bill);
      }
    } catch {
      setActionError('We could not mark all shares as paid right now. Please try again.');
    } finally {
      setBusyBills((prev) => ({ ...prev, [billId]: false }));
    }
  };

  const exportLedgerCsv = () => {
    const headers = [
      'Bill Reference',
      'Bill Description',
      'Category',
      'Date Created',
      'Person Name',
      'M-Pesa Phone Number',
      'Share Amount (KES)',
      'Payment Status',
      'M-Pesa Receipt Code',
    ];
    const rows: string[][] = [];
    for (const bill of bills) {
      for (const p of bill.participants) {
        rows.push([
          bill.id,
          `"${bill.title.replace(/"/g, '""')}"`,
          `"${bill.category}"`,
          bill.createdAt,
          `"${p.name.replace(/"/g, '""')}"`,
          p.phone,
          p.amount.toFixed(2),
          p.status.toUpperCase(),
          p.receipt || 'WAITING',
        ]);
      }
    }
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splitpesa-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const state = getBillSettlementState(bill);
      if (billFilter !== 'all' && state !== billFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchBill =
        bill.id.toLowerCase().includes(q) ||
        bill.title.toLowerCase().includes(q) ||
        bill.category.toLowerCase().includes(q);
      const matchParticipant = bill.participants.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          (p.receipt && p.receipt.toLowerCase().includes(q))
      );
      return matchBill || matchParticipant;
    });
  }, [bills, billFilter, searchQuery]);

  const financialSummary = useMemo(() => {
    let grossVolume = 0;
    let settledVolume = 0;
    let pendingVolume = 0;
    let failedVolume = 0;
    let totalPrompts = 0;
    let settledPrompts = 0;

    for (const bill of bills) {
      grossVolume += bill.total;
      for (const p of bill.participants) {
        totalPrompts += 1;
        if (p.status === 'paid') {
          settledVolume += p.amount;
          settledPrompts += 1;
        } else if (p.status === 'pending') {
          pendingVolume += p.amount;
        } else if (p.status === 'failed') {
          failedVolume += p.amount;
        }
      }
    }

    const settlementRate =
      grossVolume > 0 ? Math.round((settledVolume / grossVolume) * 100) : 0;

    return {
      grossVolume,
      settledVolume,
      pendingVolume,
      failedVolume,
      totalPrompts,
      settledPrompts,
      settlementRate,
    };
  }, [bills]);

  // Render Public Multi-Page Website when route is not 'portal'
  if (siteRoute !== 'portal') {
    return (
      <>
        <OfflineIndicator />
        <PublicWebsite
          currentPage={siteRoute}
          initialPolicySection={policySection}
          onNavigate={(next, section) => {
            if (section) setPolicySection(section);
            if (next === 'portal' && !currentUser) {
              setSiteRoute('login');
            } else {
              setSiteRoute(next);
            }
          }}
          currentUser={currentUser}
          onAuthSuccess={handleAuthSuccess}
          onPreloadCalculator={handlePreloadFromHero}
        />
        <CookieConsentBanner
          onOpenPolicies={(sec) => {
            setPolicySection(sec);
            setSiteRoute('legal');
          }}
        />
      </>
    );
  }

  const sectionLabels: Record<PortalSection, string> = {
    overview: 'Dashboard',
    'new-split': 'Split a Bill',
    bills: 'My Bills & Receipts',
    transactions: 'Payment History',
    contacts: 'Friends & Groups',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      <OfflineIndicator />

      {/* Left Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0">
        <div>
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSiteRoute('home')}
              className="text-lg font-bold tracking-tight text-slate-900 cursor-pointer"
            >
              SplitPesa
            </button>
            <span className="text-[11px] font-semibold text-emerald-700">
              DASHBOARD
            </span>
          </div>

          <nav aria-label="Workspace Sidebar" className="p-3.5 space-y-1">
            {(
              [
                { id: 'overview', label: 'Dashboard', Icon: LayoutDashboard },
                { id: 'new-split', label: 'Split a Bill', Icon: Plus },
                {
                  id: 'bills',
                  label: `My Bills & Receipts (${bills.length})`,
                  Icon: Receipt,
                },
                {
                  id: 'transactions',
                  label: 'Payment History',
                  Icon: ListOrdered,
                },
                {
                  id: 'contacts',
                  label: `Friends & Groups (${contacts.length})`,
                  Icon: Users,
                },
              ] as const
            ).map((item) => {
              const Icon = item.Icon;
              const isActive = portalSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPortalSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <PWAInstallButton variant="sidebar" />

          <button
            type="button"
            onClick={() => setSiteRoute('home')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPolicySection('privacy');
              setSiteRoute('legal');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy & Legal Policies</span>
          </button>

          {currentUser ? (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  +{currentUser.phone}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSiteRoute('login')}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Sign In / Create Account
            </button>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setSiteRoute('home')}
              className="font-bold text-slate-900 lg:font-normal lg:text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              SplitPesa
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-900">
              {sectionLabels[portalSection]}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <PWAInstallButton variant="header" />
            <button
              type="button"
              onClick={exportLedgerCsv}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setPortalSection('new-split')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Split a Bill</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Strip */}
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto"
        >
          {(
            [
              { id: 'overview', label: 'Dashboard' },
              { id: 'new-split', label: 'Split a Bill' },
              { id: 'bills', label: `My Bills (${bills.length})` },
              { id: 'transactions', label: 'Payments' },
              { id: 'contacts', label: 'Friends' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPortalSection(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                portalSection === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Main Viewport Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1200px] w-full mx-auto space-y-8">
          {actionError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionError('')}
                aria-label="Dismiss message"
                className="text-rose-600 hover:text-rose-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SECTION 1: DASHBOARD OVERVIEW */}
          {portalSection === 'overview' && (
            <div className="space-y-8">
              <section className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Total Bills Split
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    KES {fmt(financialSummary.grossVolume)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Across {bills.length} shared bills
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Collected via M-Pesa
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
                    KES {fmt(financialSummary.settledVolume)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {financialSummary.settledPrompts} of {financialSummary.totalPrompts} people paid ({financialSummary.settlementRate}%)
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Waiting for Payment
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-amber-700 font-mono tabular-nums">
                    KES {fmt(financialSummary.pendingVolume)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Waiting for friends to enter PIN
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Cancelled / Needs Resend
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-rose-700 font-mono tabular-nums">
                    KES {fmt(financialSummary.failedVolume)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Can be resent in one click
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Recent Shared Bills
                      </h2>
                      <p className="text-xs text-slate-500">
                        Select any bill to see receipts or resend a payment prompt
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPortalSection('bills')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      See All ({bills.length})
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {bills.slice(0, 4).map((bill) => {
                      const settled = bill.participants
                        .filter((p) => p.status === 'paid')
                        .reduce((s, p) => s + p.amount, 0);
                      const pct =
                        bill.total > 0 ? Math.round((settled / bill.total) * 100) : 0;

                      return (
                        <div
                          key={bill.id}
                          className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50"
                        >
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {bill.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Bill #{bill.id} · {bill.participants.length} people ·{' '}
                              {bill.category}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right font-mono tabular-nums">
                              <div className="text-sm font-bold text-slate-900">
                                KES {fmt(bill.total)}
                              </div>
                              <div className="text-xs text-emerald-700 font-semibold">
                                {pct}% paid
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPortalSection('bills')}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              View Bill
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Saved Groups Quick Split */}
                <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Saved Friend Groups
                      </h2>
                      <p className="text-xs text-slate-500">
                        Fill everyone’s phone number in one tap
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPortalSection('contacts')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Manage Friends
                    </button>
                  </div>

                  <div className="space-y-3">
                    {groups.map((grp) => (
                      <div
                        key={grp.id}
                        className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {grp.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {grp.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadGroupIntoComposer(grp)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap cursor-pointer"
                        >
                          Split with Group
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* SECTION 2: SPLIT A BILL */}
          {portalSection === 'new-split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
                <div className="pb-4 mb-6 border-b border-slate-200">
                  <h1 className="text-xl font-bold text-slate-900">
                    Split a Shared Bill
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the total bill and choose your friends to send M-Pesa payment requests to their phones.
                  </p>
                </div>

                <form onSubmit={handleCreateSplitBill} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="bill-title-input"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        What is this bill for?
                      </label>
                      <input
                        id="bill-title-input"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Dinner at Kilimani Bistro"
                        className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="bill-category-select"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Category
                      </label>
                      <select
                        id="bill-category-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="bill-total-input"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Total Bill Amount (KES)
                      </label>
                      <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 overflow-hidden">
                        <span className="px-3.5 py-2 text-xs font-mono font-semibold text-slate-600 bg-slate-100 border-r border-slate-300">
                          KES
                        </span>
                        <input
                          id="bill-total-input"
                          type="number"
                          step="any"
                          min="1"
                          max="500000"
                          value={total}
                          onChange={(e) => setTotal(e.target.value)}
                          className="flex-1 px-3 py-2 text-base font-bold font-mono tabular-nums text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                        How should we divide it?
                      </span>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSplitModeChange('equal')}
                          className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            splitMode === 'equal'
                              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Split Equally
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSplitModeChange('custom')}
                          className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            splitMode === 'custom'
                              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Custom Amounts
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* People Sharing Rows */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        People Sharing This Bill ({draftParticipants.length})
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Total Assigned: KES {fmt(allocatedTotal)} of KES {fmt(numericTotal)}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {draftParticipants.map((p, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              aria-label={`Person ${idx + 1} Name`}
                              value={p.name}
                              onChange={(e) =>
                                updateParticipant(idx, 'name', e.target.value)
                              }
                              placeholder="Friend's name"
                              className="w-full rounded-md bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <input
                              type="tel"
                              aria-label={`Person ${idx + 1} M-Pesa Phone`}
                              value={p.phone}
                              onChange={(e) =>
                                updateParticipant(idx, 'phone', e.target.value)
                              }
                              placeholder="0712 345 678"
                              className="w-full rounded-md bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="number"
                              step="any"
                              aria-label={`Person ${idx + 1} Share Amount`}
                              disabled={splitMode === 'equal'}
                              value={
                                splitMode === 'equal'
                                  ? computedShares[idx] ?? 0
                                  : p.amount ?? ''
                              }
                              onChange={(e) =>
                                updateParticipant(idx, 'amount', e.target.value)
                              }
                              className={`w-full rounded-md border px-2.5 py-1.5 text-xs font-mono tabular-nums text-right ${
                                splitMode === 'equal'
                                  ? 'bg-slate-100 border-slate-200 text-slate-600'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-end">
                            {draftParticipants.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeParticipant(idx)}
                                aria-label={`Remove person ${idx + 1}`}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addParticipant()}
                      className="w-full mt-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-dashed border-slate-300 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Person</span>
                    </button>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formNotice && (
                    <div
                      role="status"
                      className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{formNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPortalSection('bills')}
                        className="font-semibold underline cursor-pointer"
                      >
                        View Bill →
                      </button>
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Protected against accidental double charges</span>
                    </span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {submitting
                          ? 'Sending Requests...'
                          : `Send M-Pesa Requests (KES ${fmt(numericTotal)})`}
                      </span>
                    </button>
                  </div>
                </form>
              </section>

              {/* Right Column: Saved Friends Picker */}
              <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Quick-Add Saved Friends
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tap a friend below to add them to this bill.
                  </p>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {c.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          +{c.phone} · {c.tag}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addParticipant({ name: c.name, phone: c.phone })}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* SECTION 3: MY BILLS & RECEIPTS */}
          {portalSection === 'bills' && (
            <section className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto">
                  {(
                    [
                      { id: 'all', label: 'All Bills' },
                      { id: 'pending', label: 'Waiting for Payment' },
                      { id: 'settled', label: 'Fully Paid' },
                      { id: 'attention', label: 'Cancelled / Resend' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBillFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        billFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bill, friend, receipt..."
                    aria-label="Search bills, friends, or M-Pesa receipts"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
              </div>

              {initialLoading ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
                  <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                  <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <h2 className="text-sm font-bold text-slate-900">
                    No matching bills found
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Try clearing your search filter or split a new bill with your friends.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBills.map((bill) => {
                    const paidParticipants = bill.participants.filter(
                      (p) => p.status === 'paid'
                    );
                    const paidAmount = paidParticipants.reduce(
                      (sum, p) => sum + p.amount,
                      0
                    );
                    const pct =
                      bill.total > 0
                        ? Math.min(100, Math.round((paidAmount / bill.total) * 100))
                        : 0;
                    const isBusy = Boolean(busyBills[bill.id]);
                    const hasUnpaid = bill.participants.some((p) => p.status !== 'paid');

                    return (
                      <article
                        key={bill.id}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                      >
                        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              {bill.title}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span className="font-mono">Bill #{bill.id}</span>
                              <span>·</span>
                              <span>{bill.category}</span>
                              <span>·</span>
                              <span>
                                {bill.splitMode === 'equal'
                                  ? 'Equal Split'
                                  : 'Custom Amounts'}
                              </span>
                              <span>·</span>
                              <span>{formatTime(bill.createdAt)}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-500">Total Bill</div>
                            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                              KES {fmt(bill.total)}
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-600 font-medium">
                              Collected{' '}
                              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                KES {fmt(paidAmount)}
                              </span>{' '}
                              of{' '}
                              <span className="font-mono tabular-nums">
                                KES {fmt(bill.total)}
                              </span>
                            </span>
                            <span className="font-mono font-semibold text-slate-900 tabular-nums">
                              {paidParticipants.length} of {bill.participants.length} paid (
                              {pct}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="divide-y divide-slate-200">
                          {bill.participants.map((p) => (
                            <div
                              key={p.id || p.phone}
                              className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900">
                                  {p.name}
                                </div>
                                <div className="text-xs text-slate-500 font-mono tabular-nums flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span>+{p.phone}</span>
                                  <span>·</span>
                                  {p.receipt ? (
                                    <button
                                      type="button"
                                      onClick={() => copyText(p.receipt!, p.receipt!)}
                                      className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline cursor-pointer"
                                    >
                                      <span>M-Pesa Receipt: {p.receipt}</span>
                                      {copiedId === p.receipt ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  ) : p.failureReason ? (
                                    <span className="text-rose-600 font-sans">
                                      Prompt cancelled on phone
                                    </span>
                                  ) : (
                                    <span className="font-sans">
                                      M-Pesa prompt sent to phone
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 ml-auto">
                                <div className="text-right">
                                  <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                                    KES {fmt(p.amount)}
                                  </div>
                                  <div className="mt-0.5 flex items-center justify-end gap-1 text-xs font-medium">
                                    {p.status === 'paid' && (
                                      <span className="inline-flex items-center gap-1 text-emerald-700">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Paid</span>
                                      </span>
                                    )}
                                    {p.status === 'pending' && (
                                      <span className="inline-flex items-center gap-1 text-amber-700">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Waiting for PIN</span>
                                      </span>
                                    )}
                                    {p.status === 'failed' && (
                                      <span className="inline-flex items-center gap-1 text-rose-700">
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>Cancelled</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                                  {p.status !== 'paid' && (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        handleSimulateParticipant(bill.id, p.phone, 'paid')
                                      }
                                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md cursor-pointer"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                  {p.status === 'pending' && (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        handleSimulateParticipant(
                                          bill.id,
                                          p.phone,
                                          'failed'
                                        )
                                      }
                                      className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  {p.status === 'failed' && (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        handleSimulateParticipant(
                                          bill.id,
                                          p.phone,
                                          'pending'
                                        )
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Resend Prompt</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-500">
                            {pct === 100
                              ? 'All shares paid and verified'
                              : 'Waiting for remaining M-Pesa payments'}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptBill(bill)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>

                            {hasUnpaid && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSettleAll(bill.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark All Paid</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRefreshBill(bill.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`}
                              />
                              <span>{isBusy ? 'Checking...' : 'Refresh Status'}</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* SECTION 4: PAYMENT HISTORY */}
          {portalSection === 'transactions' && (
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-base font-bold text-slate-900">
                    M-Pesa Payment History
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Every individual share, phone number, and M-Pesa receipt code in one place.
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, phone, receipt..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Bill</th>
                      <th className="py-3 px-4">Person</th>
                      <th className="py-3 px-4">M-Pesa Number</th>
                      <th className="py-3 px-4">M-Pesa Receipt</th>
                      <th className="py-3 px-4 text-right">Amount (KES)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredBills.flatMap((bill) =>
                      bill.participants.map((p) => (
                        <tr key={`${bill.id}-${p.phone}`} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{bill.title}</div>
                            <div className="text-[11px] font-mono text-slate-400">
                              #{bill.id}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                            +{p.phone}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                            {p.receipt || '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                            {fmt(p.amount)}
                          </td>
                          <td className="py-3 px-4">
                            {p.status === 'paid' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Paid</span>
                              </span>
                            )}
                            {p.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Waiting</span>
                              </span>
                            )}
                            {p.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancelled</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {p.status !== 'paid' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSimulateParticipant(bill.id, p.phone, 'paid')
                                }
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptBill(bill)}
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                              >
                                <span>Receipt</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION 5: FRIENDS & GROUPS */}
          {portalSection === 'contacts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Save a Friend’s M-Pesa Number
                </h2>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Friend’s Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="e.g. Samuel Mutua"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      M-Pesa Phone Number
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-tag"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Group / Label
                    </label>
                    <input
                      id="contact-tag"
                      type="text"
                      value={newContactTag}
                      onChange={(e) => setNewContactTag(e.target.value)}
                      placeholder="Friend, Colleague, Housemate..."
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {contactError && (
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {contactError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Save Friend</span>
                  </button>
                </form>
              </section>

              <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-base font-bold text-slate-900">
                    Saved Friends ({contacts.length})
                  </h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {c.name}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          +{c.phone} · {c.tag}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        aria-label={`Remove ${c.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Printable Payment Receipt Modal */}
      {selectedReceiptBill && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-700 font-semibold">
                  SplitPesa Payment Summary
                </div>
                <h3 id="receipt-modal-title" className="text-base font-bold text-slate-900">
                  {selectedReceiptBill.title} (Bill #{selectedReceiptBill.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptBill(null)}
                aria-label="Close receipt modal"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-slate-500">Category</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedReceiptBill.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">Total Bill Amount</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    KES {fmt(selectedReceiptBill.total)}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-2">
                  Individual Shares & M-Pesa Receipts
                </div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                  {selectedReceiptBill.participants.map((p) => (
                    <div
                      key={p.id || p.phone}
                      className="p-3 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="font-mono text-slate-500">+{p.phone}</div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="font-bold text-slate-900">
                          KES {fmt(p.amount)}
                        </div>
                        <div
                          className={
                            p.status === 'paid'
                              ? 'text-emerald-700 font-semibold'
                              : 'text-amber-700'
                          }
                        >
                          {p.receipt ? `Receipt: ${p.receipt}` : p.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptBill(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CookieConsentBanner
        onOpenPolicies={(sec) => {
          setPolicySection(sec);
          setSiteRoute('legal');
        }}
      />
    </div>
  );
}
