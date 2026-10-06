import mysql from 'mysql2/promise';
import type { Bill, AuditLogEntry, User, Contact, ContactGroup } from '../../src/types.js';
import { computeSha256, computeHmacSignature, hashPassword } from '../services/security.js';

let pool: mysql.Pool | null = null;

if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  } catch (err) {
    console.warn('MySQL pool creation failed, falling back to in-memory store:', err);
    pool = null;
  }
}

export interface StoredUser extends User {
  passwordHash: string;
}

const memoryUsers = new Map<string, StoredUser>();
const memoryBills = new Map<string, Bill>();
const memoryContacts = new Map<string, Contact>();
const memoryGroups = new Map<string, ContactGroup>();
const auditLogs: AuditLogEntry[] = [];

export const appendAuditLog = (params: {
  event: string;
  billId: string;
  actor: string;
  details: string;
  severity?: AuditLogEntry['severity'];
  timestamp?: string;
}): AuditLogEntry => {
  const timestamp = params.timestamp || new Date().toISOString();
  const prevHash = auditLogs.length > 0 ? auditLogs[0].hash : '00000000000000000000000000000000';
  const rawPayload = `${prevHash}|${timestamp}|${params.event}|${params.billId}|${params.actor}|${params.details}`;
  const hash = computeSha256(rawPayload).slice(0, 32);

  const entry: AuditLogEntry = {
    id: `AUD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    timestamp,
    event: params.event,
    billId: params.billId,
    actor: params.actor,
    details: params.details,
    prevHash: prevHash.slice(0, 16),
    hash,
    severity: params.severity || 'info',
  };

  auditLogs.unshift(entry);
  return entry;
};

function seedInitialData(): void {
  if (memoryBills.size > 0) return;

  const now = Date.now();
  const t1 = new Date(now - 42 * 60 * 1000).toISOString();
  const t2 = new Date(now - 18 * 60 * 1000).toISOString();
  const t3 = new Date(now - 6 * 60 * 1000).toISOString();

  // Seed default organizer account: amina@splitpesa.co.ke / SplitPesa2026!
  const demoUser: StoredUser = {
    id: 'USR-1001',
    name: 'Amina Wanjiku',
    email: 'amina@splitpesa.co.ke',
    phone: '254712345678',
    accountType: 'merchant',
    createdAt: t1,
    passwordHash: hashPassword('SplitPesa2026!'),
  };
  memoryUsers.set(demoUser.email.toLowerCase(), demoUser);

  // Seed saved contacts
  const initialContacts: Contact[] = [
    { id: 'CNT-01', name: 'Brian Ochieng', phone: '254722987654', tag: 'Colleague' },
    { id: 'CNT-02', name: 'Cynthia Muthoni', phone: '254733456123', tag: 'Colleague' },
    { id: 'CNT-03', name: 'David Kamau', phone: '254701234567', tag: 'Coworking' },
    { id: 'CNT-04', name: 'Faith Njeri', phone: '254745678901', tag: 'Coworking' },
    { id: 'CNT-05', name: 'Kelvin Kiprop', phone: '254798765432', tag: 'Housemate' },
    { id: 'CNT-06', name: 'Grace Wambui', phone: '254719876543', tag: 'Travel' },
  ];
  for (const c of initialContacts) {
    memoryContacts.set(c.id, c);
  }

  // Seed contact groups
  const initialGroups: ContactGroup[] = [
    {
      id: 'GRP-01',
      name: 'Kilimani Lunch Crew',
      description: 'Daily office lunch split group (3 members)',
      members: [
        { name: 'Amina Wanjiku', phone: '254712345678' },
        { name: 'Brian Ochieng', phone: '254722987654' },
        { name: 'Cynthia Muthoni', phone: '254733456123' },
      ],
    },
    {
      id: 'GRP-02',
      name: 'Apartment 4B Utilities',
      description: 'Monthly fiber internet, water, and electricity split (3 members)',
      members: [
        { name: 'David Kamau', phone: '254701234567' },
        { name: 'Faith Njeri', phone: '254745678901' },
        { name: 'Kelvin Kiprop', phone: '254798765432' },
      ],
    },
  ];
  for (const g of initialGroups) {
    memoryGroups.set(g.id, g);
  }

  const bill1: Bill = {
    id: 'SP8492',
    ownerId: demoUser.id,
    title: 'Team Lunch — Kilimani Bistro',
    category: 'Dining & Hospitality',
    total: 4500,
    splitMode: 'equal',
    createdAt: t1,
    updatedAt: t1,
    idempotencyKey: 'idem_sp8492_kilimani',
    signatureHash: computeHmacSignature('SP8492|4500|3').slice(0, 24),
    mode: 'sandbox',
    participants: [
      {
        id: 'P-101',
        name: 'Amina Wanjiku',
        phone: '254712345678',
        amount: 1500,
        status: 'paid',
        receipt: 'SJK94M2QW1',
        checkoutRequestId: 'ws_CO_20261006_254712345678',
        merchantRequestId: 'MR-2910-88A1',
        attempts: 1,
        updatedAt: t1,
        failureReason: null,
      },
      {
        id: 'P-102',
        name: 'Brian Ochieng',
        phone: '254722987654',
        amount: 1500,
        status: 'paid',
        receipt: 'SJK71L8KP4',
        checkoutRequestId: 'ws_CO_20261006_254722987654',
        merchantRequestId: 'MR-2910-88A2',
        attempts: 1,
        updatedAt: t1,
        failureReason: null,
      },
      {
        id: 'P-103',
        name: 'Cynthia Muthoni',
        phone: '254733456123',
        amount: 1500,
        status: 'paid',
        receipt: 'SJK39V5NX8',
        checkoutRequestId: 'ws_CO_20261006_254733456123',
        merchantRequestId: 'MR-2910-88A3',
        attempts: 1,
        updatedAt: t1,
        failureReason: null,
      },
    ],
  };

  const bill2: Bill = {
    id: 'SP9104',
    ownerId: demoUser.id,
    title: 'Shared Coworking Pass — Westlands',
    category: 'Workspace & Utilities',
    total: 3600,
    splitMode: 'equal',
    createdAt: t2,
    updatedAt: t2,
    idempotencyKey: 'idem_sp9104_westlands',
    signatureHash: computeHmacSignature('SP9104|3600|3').slice(0, 24),
    mode: 'sandbox',
    participants: [
      {
        id: 'P-201',
        name: 'David Kamau',
        phone: '254701234567',
        amount: 1200,
        status: 'paid',
        receipt: 'SJK55T9BV2',
        checkoutRequestId: 'ws_CO_20261006_254701234567',
        merchantRequestId: 'MR-3041-19B1',
        attempts: 1,
        updatedAt: t2,
        failureReason: null,
      },
      {
        id: 'P-202',
        name: 'Faith Njeri',
        phone: '254745678901',
        amount: 1200,
        status: 'paid',
        receipt: 'SJK82R4MZ9',
        checkoutRequestId: 'ws_CO_20261006_254745678901',
        merchantRequestId: 'MR-3041-19B2',
        attempts: 1,
        updatedAt: t2,
        failureReason: null,
      },
      {
        id: 'P-203',
        name: 'Kelvin Kiprop',
        phone: '254798765432',
        amount: 1200,
        status: 'pending',
        receipt: null,
        checkoutRequestId: 'ws_CO_20261006_254798765432',
        merchantRequestId: 'MR-3041-19B3',
        attempts: 1,
        updatedAt: t2,
        failureReason: null,
      },
    ],
  };

  const bill3: Bill = {
    id: 'SP9377',
    ownerId: demoUser.id,
    title: 'Airport Charter Van — JKIA Transfer',
    category: 'Travel & Transport',
    total: 2800,
    splitMode: 'custom',
    createdAt: t3,
    updatedAt: t3,
    idempotencyKey: 'idem_sp9377_jkia',
    signatureHash: computeHmacSignature('SP9377|2800|2').slice(0, 24),
    mode: 'sandbox',
    participants: [
      {
        id: 'P-301',
        name: 'Grace Wambui',
        phone: '254719876543',
        amount: 1600,
        status: 'paid',
        receipt: 'SJK60P3CD7',
        checkoutRequestId: 'ws_CO_20261006_254719876543',
        merchantRequestId: 'MR-3190-77C1',
        attempts: 1,
        updatedAt: t3,
        failureReason: null,
      },
      {
        id: 'P-302',
        name: 'Samuel Mutua',
        phone: '254728765432',
        amount: 1200,
        status: 'failed',
        receipt: null,
        checkoutRequestId: 'ws_CO_20261006_254728765432',
        merchantRequestId: 'MR-3190-77C2',
        attempts: 1,
        updatedAt: t3,
        failureReason: 'Request cancelled by user (Daraja ResultCode 1032)',
      },
    ],
  };

  memoryBills.set(bill1.id, bill1);
  memoryBills.set(bill2.id, bill2);
  memoryBills.set(bill3.id, bill3);

  appendAuditLog({
    event: 'BILL_CREATED',
    billId: 'SP8492',
    actor: 'Amina Wanjiku',
    details:
      'Created equal split bill for KES 4,500.00 across 3 participants (Idempotency: idem_sp8492_kilimani)',
    severity: 'info',
    timestamp: t1,
  });
  appendAuditLog({
    event: 'CALLBACK_VERIFIED',
    billId: 'SP8492',
    actor: 'Safaricom Daraja Webhook',
    details:
      'All 3 STK Push payments settled (Receipts: SJK94M2QW1, SJK71L8KP4, SJK39V5NX8). Total collected: KES 4,500.00',
    severity: 'success',
    timestamp: t1,
  });
  appendAuditLog({
    event: 'BILL_CREATED',
    billId: 'SP9104',
    actor: 'Amina Wanjiku',
    details:
      'Created equal split bill for KES 3,600.00 across 3 participants (Idempotency: idem_sp9104_westlands)',
    severity: 'info',
    timestamp: t2,
  });
  appendAuditLog({
    event: 'CALLBACK_VERIFIED',
    billId: 'SP9104',
    actor: 'Safaricom Daraja Webhook',
    details:
      'Settled KES 2,400.00 (2/3 participants). Awaiting STK PIN from +254798765432.',
    severity: 'success',
    timestamp: t2,
  });
  appendAuditLog({
    event: 'PAYMENT_FAILED',
    billId: 'SP9377',
    actor: 'Safaricom Daraja Webhook',
    details:
      'STK Push declined/cancelled for +254728765432 (ResultCode 1032: Request cancelled by user). Eligible for retry.',
    severity: 'warning',
    timestamp: t3,
  });
}

seedInitialData();

export const userStore = {
  findByEmail(email: string): StoredUser | undefined {
    return memoryUsers.get(email.trim().toLowerCase());
  },
  findById(id: string): StoredUser | undefined {
    for (const u of memoryUsers.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  },
  create(user: StoredUser): StoredUser {
    memoryUsers.set(user.email.trim().toLowerCase(), user);
    return user;
  },
  toPublicUser(user: StoredUser): User {
    const { passwordHash: _pw, ...publicUser } = user;
    return publicUser;
  },
};

export const contactStore = {
  listContacts(): Contact[] {
    return Array.from(memoryContacts.values());
  },
  addContact(contact: Contact): Contact {
    memoryContacts.set(contact.id, contact);
    return contact;
  },
  deleteContact(id: string): boolean {
    return memoryContacts.delete(id);
  },
  listGroups(): ContactGroup[] {
    return Array.from(memoryGroups.values());
  },
};

export const billStore = {
  async list(): Promise<Bill[]> {
    return Array.from(memoryBills.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async get(billId: string): Promise<Bill | undefined> {
    return memoryBills.get(billId);
  },

  async save(bill: Bill): Promise<Bill> {
    bill.updatedAt = new Date().toISOString();
    memoryBills.set(bill.id, bill);
    return bill;
  },

  async findByCheckoutId(
    checkoutRequestId: string
  ): Promise<{ bill: Bill; participantIndex: number } | null> {
    for (const bill of memoryBills.values()) {
      const idx = bill.participants.findIndex((p) => p.checkoutRequestId === checkoutRequestId);
      if (idx !== -1) {
        return { bill, participantIndex: idx };
      }
    }
    return null;
  },

  getAuditLogs(): AuditLogEntry[] {
    return auditLogs;
  },
};

export default pool;
