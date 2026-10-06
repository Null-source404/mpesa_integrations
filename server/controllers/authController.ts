import type { Request, Response } from 'express';
import { userStore, appendAuditLog, type StoredUser } from '../db/connection.js';
import {
  sanitizeText,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  revokeSessionToken,
} from '../services/security.js';
import { normalizeKenyanPhone, isValidKenyanPhone } from '../services/mpesa.js';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, password, accountType } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    accountType?: 'personal' | 'merchant';
  };

  const cleanName = sanitizeText(name, 60);
  const cleanEmail = sanitizeText(email, 80).toLowerCase();
  const rawPhone = String(phone || '').trim();
  const rawPassword = String(password || '');

  if (!cleanName || cleanName.length < 2) {
    res.status(400).json({ message: 'Please enter your full name (at least 2 characters).' });
    return;
  }

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ message: 'Please provide a valid email address.' });
    return;
  }

  if (!isValidKenyanPhone(rawPhone)) {
    res.status(400).json({
      message: 'Please provide a valid Kenyan M-Pesa number (07XXXXXXXX or 2547XXXXXXXX).',
    });
    return;
  }

  if (rawPassword.length < 8) {
    res.status(400).json({
      message: 'Password must be at least 8 characters long.',
    });
    return;
  }

  if (userStore.findByEmail(cleanEmail)) {
    res.status(409).json({
      message: 'An account with this email address already exists. Please sign in instead.',
    });
    return;
  }

  const normalizedPhone = normalizeKenyanPhone(rawPhone);
  const newUser: StoredUser = {
    id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
    name: cleanName,
    email: cleanEmail,
    phone: normalizedPhone,
    accountType: accountType === 'merchant' ? 'merchant' : 'personal',
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(rawPassword),
  };

  userStore.create(newUser);
  const token = createSessionToken(newUser.id, newUser.email);

  appendAuditLog({
    event: 'USER_REGISTERED',
    billId: 'AUTH',
    actor: newUser.name,
    details: `Registered new ${newUser.accountType} account (${newUser.email}, +${newUser.phone})`,
    severity: 'success',
  });

  res.status(201).json({
    message: 'Account created successfully',
    user: userStore.toPublicUser(newUser),
    token,
  });
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = sanitizeText(email, 80).toLowerCase();
  const rawPassword = String(password || '');

  if (!cleanEmail || !rawPassword) {
    res.status(400).json({ message: 'Please enter both your email address and password.' });
    return;
  }

  const existing = userStore.findByEmail(cleanEmail);
  if (!existing || !verifyPassword(rawPassword, existing.passwordHash)) {
    appendAuditLog({
      event: 'AUTH_LOGIN_FAILED',
      billId: 'AUTH',
      actor: cleanEmail,
      details: `Failed sign-in attempt for email ${cleanEmail}`,
      severity: 'warning',
    });
    res.status(401).json({ message: 'Invalid email or password. Please try again.' });
    return;
  }

  const token = createSessionToken(existing.id, existing.email);
  appendAuditLog({
    event: 'USER_LOGIN',
    billId: 'AUTH',
    actor: existing.name,
    details: `Authenticated session started for ${existing.email}`,
    severity: 'info',
  });

  res.status(200).json({
    message: 'Signed in successfully',
    user: userStore.toPublicUser(existing),
    token,
  });
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const verified = verifySessionToken(token);

  if (!verified.valid || !verified.userId) {
    res.status(401).json({ message: 'Session expired or unauthenticated' });
    return;
  }

  const user = userStore.findById(verified.userId);
  if (!user) {
    res.status(401).json({ message: 'Account not found' });
    return;
  }

  res.status(200).json({ user: userStore.toPublicUser(user) });
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (token) {
    revokeSessionToken(token);
  }
  res.status(200).json({ message: 'Signed out' });
};
