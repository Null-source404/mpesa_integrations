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
  try {
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
      res.status(400).json({ message: 'Please enter your full name.' });
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ message: 'Please enter a valid email address.' });
      return;
    }

    if (!isValidKenyanPhone(rawPhone)) {
      res.status(400).json({
        message: 'Please enter a valid Kenyan M-Pesa phone number (for example, 0712 345 678).',
      });
      return;
    }

    if (rawPassword.length < 8) {
      res.status(400).json({
        message: 'Please choose a password that is at least 8 characters long.',
      });
      return;
    }

    if (userStore.findByEmail(cleanEmail)) {
      res.status(409).json({
        message: 'An account with this email already exists. Please sign in instead.',
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
      details: `Created new ${newUser.accountType} account`,
      severity: 'success',
    });

    res.status(201).json({
      message: 'Welcome to SplitPesa! Your account is ready.',
      user: userStore.toPublicUser(newUser),
      token,
    });
  } catch {
    res.status(500).json({
      message: 'We could not create your account right now. Please try again in a moment.',
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = sanitizeText(email, 80).toLowerCase();
    const rawPassword = String(password || '');

    if (!cleanEmail || !rawPassword) {
      res.status(400).json({ message: 'Please enter both your email address and password.' });
      return;
    }

    const existing = userStore.findByEmail(cleanEmail);
    if (!existing || !verifyPassword(rawPassword, existing.passwordHash)) {
      res.status(401).json({
        message: 'That email or password did not match our records. Please try again.',
      });
      return;
    }

    const token = createSessionToken(existing.id, existing.email);

    res.status(200).json({
      message: 'Welcome back!',
      user: userStore.toPublicUser(existing),
      token,
    });
  } catch {
    res.status(500).json({
      message: 'We could not sign you in right now. Please try again in a moment.',
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const verified = verifySessionToken(token);

    if (!verified.valid || !verified.userId) {
      res.status(401).json({ message: 'Please sign in to continue.' });
      return;
    }

    const user = userStore.findById(verified.userId);
    if (!user) {
      res.status(401).json({ message: 'Please sign in to continue.' });
      return;
    }

    res.status(200).json({ user: userStore.toPublicUser(user) });
  } catch {
    res.status(401).json({ message: 'Please sign in to continue.' });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token) {
      revokeSessionToken(token);
    }
    res.status(200).json({ message: 'You have been signed out.' });
  } catch {
    res.status(200).json({ message: 'You have been signed out.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ message: 'Please provide a valid email address.' });
      return;
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({
        message: 'Your new password must be at least 8 characters long.',
      });
      return;
    }

    const user = userStore.findByEmail(email);
    if (!user) {
      // Return success-like response to prevent email enumeration
      res.status(200).json({
        message: 'If an account exists with this email, your password has been updated.',
      });
      return;
    }

    const newHash = hashPassword(newPassword);
    userStore.updatePassword(email, newHash);

    res.status(200).json({
      message: 'Password successfully updated! You can now sign in with your new password.',
    });
  } catch {
    res.status(500).json({
      message: 'We could not update your password right now. Please try again.',
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const verified = verifySessionToken(token);

    if (!verified.valid || !verified.userId) {
      res.status(401).json({ message: 'Please sign in to update your profile.' });
      return;
    }

    const { name, phone } = req.body;
    const updated = userStore.updateProfile(verified.userId, { name, phone });
    if (!updated) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: updated,
    });
  } catch {
    res.status(500).json({ message: 'We could not update your profile right now.' });
  }
};

