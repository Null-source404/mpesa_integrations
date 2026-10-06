import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const HMAC_SECRET =
  process.env.MPESA_WEBHOOK_SECRET ||
  process.env.DARAJA_PASSKEY ||
  'splitpesa-institutional-hmac-secret-key-2026';

export const computeSha256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const computeHmacSignature = (payload: string): string => {
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
};

export const sanitizeText = (input: unknown, maxLength = 80): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>[\]{}\\/]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
};

// Password Hashing using scrypt + timingSafeEqual
export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
};

// Signed Session Token Management
const revokedTokens = new Set<string>();

export const createSessionToken = (userId: string, email: string): string => {
  const payload = {
    sub: userId,
    email,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = computeHmacSignature(encoded);
  return `${encoded}.${signature}`;
};

export const verifySessionToken = (
  token: string
): { valid: boolean; userId?: string; email?: string } => {
  if (!token || revokedTokens.has(token)) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };

  const [encoded, sig] = parts;
  const expectedSig = computeHmacSignature(encoded);
  if (sig !== expectedSig) return { valid: false };

  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as {
      sub: string;
      email: string;
      exp: number;
    };
    if (Date.now() > decoded.exp) return { valid: false };
    return { valid: true, userId: decoded.sub, email: decoded.email };
  } catch {
    return { valid: false };
  }
};

export const revokeSessionToken = (token: string): void => {
  if (token) revokedTokens.add(token);
};

// Idempotency store: key -> { payloadHash, status, body, timestamp }
interface IdempotencyRecord {
  payloadHash: string;
  status: number;
  body: unknown;
  timestamp: number;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Replay protection for Daraja CheckoutRequestIDs
const processedCallbacks = new Set<string>();
let callbacksVerifiedCount = 0;
let replayAttacksBlockedCount = 0;

// Sliding window rate limiter
interface RateBucket {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateBucket>();

export const securityHeadersMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
};

export const apiRateLimiter = (maxRequests = 60, windowMs = 60_000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    let bucket = ipRateLimits.get(clientIp);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      ipRateLimits.set(clientIp, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, maxRequests - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > maxRequests) {
      res.status(429).json({
        message: 'Too many payment requests from this IP. Please wait before retrying.',
      });
      return;
    }

    next();
  };
};

export const checkIdempotency = (
  key: string,
  payload: unknown
): { hit: boolean; conflict: boolean; record?: IdempotencyRecord } => {
  const now = Date.now();
  for (const [k, v] of idempotencyStore.entries()) {
    if (now - v.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(k);
    }
  }

  const payloadHash = computeSha256(JSON.stringify(payload));
  const existing = idempotencyStore.get(key);
  if (!existing) {
    return { hit: false, conflict: false };
  }
  if (existing.payloadHash !== payloadHash) {
    return { hit: true, conflict: true, record: existing };
  }
  return { hit: true, conflict: false, record: existing };
};

export const saveIdempotency = (
  key: string,
  payload: unknown,
  status: number,
  body: unknown
): void => {
  const payloadHash = computeSha256(JSON.stringify(payload));
  idempotencyStore.set(key, {
    payloadHash,
    status,
    body,
    timestamp: Date.now(),
  });
};

export const verifyAndRecordCallback = (checkoutRequestId: string): { allowed: boolean } => {
  const replayKey = `${checkoutRequestId}`;
  if (processedCallbacks.has(replayKey)) {
    replayAttacksBlockedCount += 1;
    return { allowed: false };
  }
  processedCallbacks.add(replayKey);
  callbacksVerifiedCount += 1;
  return { allowed: true };
};

export const recordCallbackVerified = (): void => {
  callbacksVerifiedCount += 1;
};

export const getSecurityPosture = (tokenCacheValid: boolean) => ({
  idempotencyKeysActive: idempotencyStore.size,
  callbacksVerified: callbacksVerifiedCount,
  replayAttacksBlocked: replayAttacksBlockedCount,
  rateLimitRequestsTracked: ipRateLimits.size,
  tokenCacheValid,
  hmacSigningActive: true,
});
