export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export type SplitMode = 'equal' | 'custom';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: 'personal' | 'merchant';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  tag: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description: string;
  members: Array<{ name: string; phone: string }>;
}

export interface ParticipantInput {
  name: string;
  phone: string;
  amount?: number;
}

export interface Participant {
  id: string;
  name: string;
  phone: string;
  amount: number;
  status: PaymentStatus;
  receipt: string | null;
  checkoutRequestId: string | null;
  merchantRequestId: string | null;
  attempts: number;
  updatedAt: string;
  failureReason: string | null;
}

export interface Bill {
  id: string;
  ownerId?: string;
  title: string;
  category: string;
  total: number;
  splitMode: SplitMode;
  createdAt: string;
  updatedAt: string;
  idempotencyKey: string;
  signatureHash: string;
  mode: 'daraja' | 'sandbox';
  participants: Participant[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: string;
  billId: string;
  actor: string;
  details: string;
  prevHash: string;
  hash: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

export interface SecurityMetrics {
  idempotencyKeysActive: number;
  callbacksVerified: number;
  replayAttacksBlocked: number;
  rateLimitRequestsTracked: number;
  tokenCacheValid: boolean;
  hmacSigningActive: boolean;
}

export interface SplitBillRequest {
  title?: string;
  category?: string;
  total: number;
  splitMode: SplitMode;
  participants: ParticipantInput[];
}

export interface SplitBillResponse {
  message: string;
  billId: string;
  bill: Bill;
  idempotentReplay?: boolean;
}
