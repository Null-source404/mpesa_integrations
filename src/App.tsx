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
  Lock,
  Copy,
  Check,
  X,
  ArrowUpRight,
  LayoutDashboard,
  Receipt,
  ListOrdered,
  Users,
  Scale,
  LogOut,
  Globe,
  UserPlus,
} from 'lucide-react';
import type {
  Bill,
  ParticipantInput,
  PaymentStatus,
  SplitMode,
  AuditLogEntry,
  SecurityMetrics,
  SplitBillResponse,
  User,
  Contact,
  ContactGroup,
} from './types.js';
import { PublicWebsite, type PublicPage } from './components/PublicPages.js';

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
      second: '2-digit',
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
type PortalSection =
  | 'overview'
  | 'new-split'
  | 'bills'
  | 'transactions'
  | 'contacts'
  | 'security';
type BillFilter = 'all' | 'settled' | 'pending' | 'attention';

const getBillSettlementState = (bill: Bill): 'settled' | 'pending' | 'attention' => {
  const hasFailed = bill.participants.some((p) => p.status === 'failed');
  if (hasFailed) return 'attention';
  const allPaid =
    bill.participants.length > 0 && bill.participants.every((p) => p.status === 'paid');
  return allPaid ? 'settled' : 'pending';
};

export default function App() {
  // Multi-page Website vs Authenticated Portal Route
  const [siteRoute, setSiteRoute] = useState<SiteRoute>('home');
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
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    idempotencyKeysActive: 0,
    callbacksVerified: 0,
    replayAttacksBlocked: 0,
    rateLimitRequestsTracked: 0,
    tokenCacheValid: false,
    hmacSigningActive: true,
  });
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

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
  const [newContactTag, setNewContactTag] = useState<string>('Colleague');
  const [contactError, setContactError] = useState<string>('');

  // Ledger Search & Filtering
  const [billFilter, setBillFilter] = useState<BillFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [busyBills, setBusyBills] = useState<Record<string, boolean>>({});
  const [selectedReceiptBill, setSelectedReceiptBill] = useState<Bill | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [securityBanner, setSecurityBanner] = useState<{
    type: 'success' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const fetchAllData = async () => {
    try {
      const res = await fetch(`${API}/bills`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        bills?: Bill[];
        auditLogs?: AuditLogEntry[];
        contacts?: Contact[];
        groups?: ContactGroup[];
        security?: SecurityMetrics;
      };
      if (Array.isArray(data.bills)) setBills(data.bills);
      if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      if (Array.isArray(data.contacts)) setContacts(data.contacts);
      if (Array.isArray(data.groups)) setGroups(data.groups);
      if (data.security) setSecurityMetrics(data.security);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Validate saved token on mount
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
        name: existing ? existing.name : `Participant ${idx + 1}`,
        phone: existing ? existing.phone : `071234567${idx}`,
        amount: Number((calcTotal / count).toFixed(2)),
      };
    });
    setDraftParticipants(baseParticipants);
    setPortalSection('new-split');
  };

  // Calculate Equal or Custom Split shares with exact integer-cent math
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
    setTitle(`${group.name} Split`);
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
      setFormError('Enter a valid total bill amount of at least KES 1.00.');
      return;
    }

    const activeParticipants = draftParticipants.map((p, idx) => ({
      name: p.name.trim() || `Participant ${idx + 1}`,
      phone: p.phone.trim(),
      amount: computedShares[idx],
    }));

    if (activeParticipants.some((p) => !p.phone)) {
      setFormError('Please provide an M-Pesa phone number for every participant.');
      return;
    }

    const invalidP = activeParticipants.find((p) => !isValidKenyanInput(p.phone));
    if (invalidP) {
      setFormError(
        `Invalid Kenyan M-Pesa number "${invalidP.phone}" (${invalidP.name}). Use 07XXXXXXXX or 2547XXXXXXXX.`
      );
      return;
    }

    if (splitMode === 'custom' && Math.abs(unallocatedDiff) > 0.01) {
      setFormError(
        `Custom amounts must equal KES ${fmt(numericTotal)}. Remaining difference: KES ${fmt(
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

      const data = (await res.json()) as SplitBillResponse & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to dispatch M-Pesa STK Pushes.');
      }

      await fetchAllData();
      setFormNotice(
        `Dispatched ${data.bill.participants.length} M-Pesa STK Push prompts for Bill #${data.bill.id}.`
      );
      setTitle('');
      setIdempotencyKey(generateIdempotencyKey());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to process split request.');
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
      const data = (await res.json()) as { contacts?: Contact[]; message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed to save contact');
      if (data.contacts) setContacts(data.contacts);
      setNewContactName('');
      setNewContactPhone('');
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to save contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    const res = await fetch(`${API}/contacts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const data = (await res.json()) as { contacts?: Contact[] };
      if (data.contacts) setContacts(data.contacts);
    }
  };

  const handleRefreshBill = async (billId: string) => {
    setBusyBills((prev) => ({ ...prev, [billId]: true }));
    try {
      const res = await fetch(`${API}/bill-status/${billId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        bill?: Bill;
        auditLogs?: AuditLogEntry[];
        security?: SecurityMetrics;
      };
      if (data.bill) {
        setBills((prev) => prev.map((b) => (b.id === billId ? data.bill! : b)));
        if (selectedReceiptBill?.id === billId) setSelectedReceiptBill(data.bill);
      }
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.security) setSecurityMetrics(data.security);
    } finally {
      setBusyBills((prev) => ({ ...prev, [billId]: false }));
    }
  };

  const handleSimulateParticipant = async (
    billId: string,
    phone: string,
    status: PaymentStatus
  ) => {
    setBusyBills((prev) => ({ ...prev, [billId]: true }));
    try {
      const res = await fetch(`${API}/simulate-status/${billId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, status }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        bill?: Bill;
        auditLogs?: AuditLogEntry[];
        security?: SecurityMetrics;
      };
      if (data.bill) {
        setBills((prev) => prev.map((b) => (b.id === billId ? data.bill! : b)));
        if (selectedReceiptBill?.id === billId) setSelectedReceiptBill(data.bill);
      }
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.security) setSecurityMetrics(data.security);
    } finally {
      setBusyBills((prev) => ({ ...prev, [billId]: false }));
    }
  };

  const handleSettleAll = async (billId: string) => {
    setBusyBills((prev) => ({ ...prev, [billId]: true }));
    try {
      const res = await fetch(`${API}/settle-all/${billId}`, {
        method: 'POST',
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        bill?: Bill;
        auditLogs?: AuditLogEntry[];
        security?: SecurityMetrics;
      };
      if (data.bill) {
        setBills((prev) => prev.map((b) => (b.id === billId ? data.bill! : b)));
        if (selectedReceiptBill?.id === billId) setSelectedReceiptBill(data.bill);
      }
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.security) setSecurityMetrics(data.security);
    } finally {
      setBusyBills((prev) => ({ ...prev, [billId]: false }));
    }
  };

  const handleTestWebhookReplayGuard = async () => {
    const sampleCheckoutId =
      bills[0]?.participants[0]?.checkoutRequestId || 'ws_CO_20261006_254712345678';
    const payload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'MR-REPLAY-TEST',
          CheckoutRequestID: sampleCheckoutId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [{ Name: 'MpesaReceiptNumber', Value: 'SJKREPLAY01' }],
          },
        },
      },
    };

    await fetch(`${API}/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const secondRes = await fetch(`${API}/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    await fetchAllData();
    if (secondRes.status === 409) {
      setSecurityBanner({
        type: 'success',
        text: `Webhook Replay Guard verified: Duplicate callback for ${sampleCheckoutId} was rejected with HTTP 409 Conflict and logged in the SHA-256 audit chain.`,
      });
    }
  };

  const handleTestIdempotencyGuard = async () => {
    const testKey = 'idem_verification_demo_key';
    const testBody = {
      title: 'Idempotency Verification Test',
      category: 'General Expense',
      total: 1000,
      splitMode: 'equal',
      participants: [
        { name: 'Test User A', phone: '254711223344', amount: 500 },
        { name: 'Test User B', phone: '254755667788', amount: 500 },
      ],
    };

    await fetch(`${API}/split-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': testKey,
      },
      body: JSON.stringify(testBody),
    });

    const replayRes = await fetch(`${API}/split-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': testKey,
      },
      body: JSON.stringify(testBody),
    });
    const replayData = (await replayRes.json()) as SplitBillResponse;
    await fetchAllData();

    if (replayData.idempotentReplay) {
      setSecurityBanner({
        type: 'info',
        text: `Idempotency Guard verified: Second request with key "${testKey}" returned the cached Bill #${replayData.billId} without dispatching duplicate M-Pesa STK Pushes.`,
      });
    }
  };

  const exportLedgerCsv = () => {
    const headers = [
      'Bill ID',
      'Title',
      'Category',
      'Created At',
      'Participant Name',
      'Phone Number',
      'Share Amount (KES)',
      'Status',
      'M-Pesa Receipt',
      'HMAC Signature',
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
          p.receipt || 'PENDING',
          bill.signatureHash,
        ]);
      }
    }
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splitpesa-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
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
      <PublicWebsite
        currentPage={siteRoute}
        onNavigate={(next) => {
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
    );
  }

  // Render Authenticated Sidebar Portal Workspace
  const sectionLabels: Record<PortalSection, string> = {
    overview: 'Executive Overview',
    'new-split': 'Create Split Bill',
    bills: 'Active Bills & Vouchers',
    transactions: 'Transactions Ledger',
    contacts: 'Contacts & Split Groups',
    security: 'Reconciliation & Audit',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Left Sidebar Navigation (260px fixed width on desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSiteRoute('home')}
              className="text-lg font-bold tracking-tight text-slate-900 cursor-pointer"
            >
              SplitPesa
            </button>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
              PORTAL
            </span>
          </div>

          {/* Sidebar Nav Items */}
          <nav aria-label="Workspace Sidebar" className="p-3.5 space-y-1">
            {(
              [
                { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
                { id: 'new-split', label: 'New Split Request', Icon: Plus },
                {
                  id: 'bills',
                  label: `Bills & Vouchers (${bills.length})`,
                  Icon: Receipt,
                },
                {
                  id: 'transactions',
                  label: 'Transactions Ledger',
                  Icon: ListOrdered,
                },
                {
                  id: 'contacts',
                  label: `Contacts & Groups (${contacts.length})`,
                  Icon: Users,
                },
                {
                  id: 'security',
                  label: 'Reconciliation & Audit',
                  Icon: Scale,
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

        {/* Sidebar Footer: Website Switcher & User Account */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <button
            type="button"
            onClick={() => setSiteRoute('home')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Website Pages</span>
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
              Sign In / Register
            </button>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Contextual Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>SplitPesa Portal</span>
            <span>/</span>
            <span className="font-semibold text-slate-900">
              {sectionLabels[portalSection]}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportLedgerCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setPortalSection('new-split')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Split Bill</span>
            </button>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 p-8 max-w-[1200px] w-full mx-auto space-y-8">
          {/* PORTAL SECTION 1: EXECUTIVE OVERVIEW */}
          {portalSection === 'overview' && (
            <div className="space-y-8">
              {/* Top KPI Grid */}
              <section className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Gross Split Volume
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    KES {fmt(financialSummary.grossVolume)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Across {bills.length} active bills
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Verified M-Pesa Collections
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
                    KES {fmt(financialSummary.settledVolume)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {financialSummary.settledPrompts} of {financialSummary.totalPrompts} prompts
                    settled ({financialSummary.settlementRate}%)
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Pending STK Prompts
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-amber-700 font-mono tabular-nums">
                    KES {fmt(financialSummary.pendingVolume)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Awaiting participant PIN entry
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-slate-500">
                    Declined / Action Needed
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-rose-700 font-mono tabular-nums">
                    KES {fmt(financialSummary.failedVolume)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Eligible for 1-click STK retry
                  </div>
                </div>
              </section>

              {/* Quick Launch Split Groups + Recent Bills */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Recent Split Bills
                      </h2>
                      <p className="text-xs text-slate-500">
                        Click any bill to inspect receipts or trigger STK callbacks
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPortalSection('bills')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      View All Bills ({bills.length})
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
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              Ref #{bill.id} · {bill.participants.length} people ·{' '}
                              {bill.category}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right font-mono tabular-nums">
                              <div className="text-sm font-bold text-slate-900">
                                KES {fmt(bill.total)}
                              </div>
                              <div className="text-xs text-emerald-700 font-semibold">
                                {pct}% settled
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPortalSection('bills');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              Manage
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Saved Groups Quick Dispatch */}
                <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Quick-Split Saved Groups
                      </h2>
                      <p className="text-xs text-slate-500">
                        Pre-fill participant M-Pesa numbers in one click
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPortalSection('contacts')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Manage Contacts
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
                          Use Group
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* PORTAL SECTION 2: DEDICATED NEW SPLIT REQUEST COMPOSER */}
          {portalSection === 'new-split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
                <div className="pb-4 mb-6 border-b border-slate-200">
                  <h1 className="text-xl font-bold text-slate-900">
                    Dispatch New M-Pesa Split Request
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure equal or itemized custom shares and dispatch Daraja STK Push prompts.
                  </p>
                </div>

                <form onSubmit={handleCreateSplitBill} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="bill-title-input"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Bill Description
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
                        Expense Category
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

                  {/* Total Amount & Split Mode */}
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
                        Split Allocation Method
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
                          Equal Split
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
                          Custom Shares
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Participants Rows */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Participants ({draftParticipants.length})
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Allocated: KES {fmt(allocatedTotal)} / KES {fmt(numericTotal)}
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
                              aria-label={`Participant ${idx + 1} Name`}
                              value={p.name}
                              onChange={(e) =>
                                updateParticipant(idx, 'name', e.target.value)
                              }
                              placeholder="Participant name"
                              className="w-full rounded-md bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <input
                              type="tel"
                              aria-label={`Participant ${idx + 1} Phone`}
                              value={p.phone}
                              onChange={(e) =>
                                updateParticipant(idx, 'phone', e.target.value)
                              }
                              placeholder="0712345678"
                              className="w-full rounded-md bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="number"
                              step="any"
                              aria-label={`Participant ${idx + 1} Share`}
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
                                aria-label={`Remove participant ${idx + 1}`}
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
                      <span>Add Participant Row</span>
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

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Idempotency Key: {idempotencyKey}</span>
                    </span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {submitting
                          ? 'Dispatching...'
                          : `Dispatch STK Pushes (KES ${fmt(numericTotal)})`}
                      </span>
                    </button>
                  </div>
                </form>
              </section>

              {/* Right 4 Columns: Saved Contacts Quick-Picker */}
              <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Add from Saved Contacts
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click a saved M-Pesa contact to append them to this bill.
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

          {/* PORTAL SECTION 3: ACTIVE BILLS & VOUCHERS */}
          {portalSection === 'bills' && (
            <section className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  {(
                    [
                      { id: 'all', label: 'All Bills' },
                      { id: 'pending', label: 'Awaiting PIN' },
                      { id: 'settled', label: 'Settled' },
                      { id: 'attention', label: 'Failed / Retry' },
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
                    placeholder="Search bill, phone, receipt..."
                    aria-label="Search bills, phones, or M-Pesa receipts"
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
                    No matching M-Pesa split bills
                  </h2>
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
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-mono">
                              <span>Ref #{bill.id}</span>
                              <span>·</span>
                              <span className="font-sans">{bill.category}</span>
                              <span>·</span>
                              <span>
                                {bill.splitMode === 'equal'
                                  ? 'Equal Split'
                                  : 'Custom Split'}
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
                              {paidParticipants.length}/{bill.participants.length} settled (
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
                                      <span>Receipt: {p.receipt}</span>
                                      {copiedId === p.receipt ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  ) : p.failureReason ? (
                                    <span className="text-rose-600 font-sans">
                                      {p.failureReason}
                                    </span>
                                  ) : (
                                    <span>STK Attempt #{p.attempts || 1} dispatched</span>
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
                                        <span>Awaiting PIN</span>
                                      </span>
                                    )}
                                    {p.status === 'failed' && (
                                      <span className="inline-flex items-center gap-1 text-rose-700">
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>Failed</span>
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
                                      Confirm PIN
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
                                      Decline
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
                                      <span>Retry STK</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-mono text-slate-500">
                            HMAC: {bill.signatureHash}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptBill(bill)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Official Receipt</span>
                            </button>

                            {hasUnpaid && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSettleAll(bill.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Settle All</span>
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
                              <span>{isBusy ? 'Querying...' : 'Query STK Status'}</span>
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

          {/* PORTAL SECTION 4: TRANSACTIONS LEDGER */}
          {portalSection === 'transactions' && (
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-base font-bold text-slate-900">
                    M-Pesa STK Push Transactions Ledger
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Every participant payment prompt, CheckoutRequestID, and verified receipt number.
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by phone, name, receipt..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Bill Ref</th>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">M-Pesa MSISDN</th>
                      <th className="py-3 px-4">CheckoutRequestID</th>
                      <th className="py-3 px-4">M-Pesa Receipt</th>
                      <th className="py-3 px-4 text-right">Amount (KES)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredBills.flatMap((bill) =>
                      bill.participants.map((p) => (
                        <tr key={`${bill.id}-${p.phone}`} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            #{bill.id}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                            +{p.phone}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 truncate max-w-[180px]">
                            {p.checkoutRequestId || '—'}
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
                                <span>Awaiting PIN</span>
                              </span>
                            )}
                            {p.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Failed</span>
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
                                Settle Now
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptBill(bill)}
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                              >
                                <span>Voucher</span>
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

          {/* PORTAL SECTION 5: SAVED CONTACTS & GROUPS */}
          {portalSection === 'contacts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Save Frequent M-Pesa Contact
                </h2>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Full Name
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
                      Kenyan M-Pesa Number
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="0712345678"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-tag"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Relationship / Group Tag
                    </label>
                    <input
                      id="contact-tag"
                      type="text"
                      value={newContactTag}
                      onChange={(e) => setNewContactTag(e.target.value)}
                      placeholder="Colleague, Housemate, Client..."
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
                    <span>Save Contact</span>
                  </button>
                </form>
              </section>

              <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-base font-bold text-slate-900">
                    Saved Directory ({contacts.length})
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
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* PORTAL SECTION 6: RECONCILIATION & CRYPTOGRAPHIC AUDIT */}
          {portalSection === 'security' && (
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
                  <div>
                    <h1 className="text-base font-bold text-slate-900">
                      Payment Security & Cryptographic Audit Trail
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Verify request idempotency, webhook replay protection, and SHA-256 hash-chained logs.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestIdempotencyGuard}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      Verify Idempotency Guard
                    </button>
                    <button
                      type="button"
                      onClick={handleTestWebhookReplayGuard}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Simulate Webhook Replay Attack
                    </button>
                  </div>
                </div>

                {securityBanner && (
                  <div
                    role="status"
                    className="mb-6 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{securityBanner.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecurityBanner(null)}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-900">
                      Idempotency Keys
                    </div>
                    <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">
                      {securityMetrics.idempotencyKeysActive} Active
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-900">
                      Replays Blocked
                    </div>
                    <div className="mt-1 text-xl font-bold font-mono tabular-nums text-emerald-700">
                      {securityMetrics.replayAttacksBlocked} Blocked
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-900">
                      Callbacks Verified
                    </div>
                    <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">
                      {securityMetrics.callbacksVerified} Verified
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-900">
                      Rate Limit Guard
                    </div>
                    <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">
                      25 req / min
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">
                    Immutable SHA-256 Hash-Chained Audit Log ({auditLogs.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Event</th>
                        <th className="py-3 px-4">Ref</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Details</th>
                        <th className="py-3 px-4">Chain Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                            {formatTime(log.timestamp)}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                            <span
                              className={
                                log.severity === 'error'
                                  ? 'text-rose-700'
                                  : log.severity === 'warning'
                                  ? 'text-amber-700'
                                  : log.severity === 'success'
                                  ? 'text-emerald-700'
                                  : 'text-slate-900'
                              }
                            >
                              {log.event}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                            #{log.billId}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{log.actor}</td>
                          <td className="py-3 px-4 text-slate-700 max-w-md">
                            {log.details}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {log.prevHash.slice(0, 8)} →{' '}
                            <span className="text-slate-900 font-semibold">
                              {log.hash.slice(0, 12)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Printable Official Receipt Voucher Modal */}
      {selectedReceiptBill && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-dialog-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 id="receipt-dialog-title" className="text-base font-bold text-slate-900">
                  SplitPesa Payment Voucher
                </h2>
                <p className="text-xs font-mono text-slate-500">
                  Ref #{selectedReceiptBill.id} · {selectedReceiptBill.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptBill(null)}
                aria-label="Close receipt modal"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Bill Description</div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedReceiptBill.title}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total Split Amount</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                    KES {fmt(selectedReceiptBill.total)}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {selectedReceiptBill.participants.map((p) => (
                  <div
                    key={p.phone}
                    className="px-3.5 py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="font-mono text-slate-500">
                        +{p.phone} · {p.receipt ? `Receipt ${p.receipt}` : 'Unsettled'}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-900">KES {fmt(p.amount)}</div>
                      <div
                        className={
                          p.status === 'paid'
                            ? 'text-emerald-700 font-semibold'
                            : p.status === 'failed'
                            ? 'text-rose-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {p.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
                <div>Idempotency Key: {selectedReceiptBill.idempotencyKey}</div>
                <div>HMAC-SHA256 Signature: {selectedReceiptBill.signatureHash}</div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Print Voucher
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptBill(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
