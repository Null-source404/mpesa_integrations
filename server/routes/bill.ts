import { Router } from 'express';
import {
  listBills,
  splitBill,
  handleCallback,
  getBillStatus,
  simulateParticipantStatus,
  settleAllPending,
  addSavedContact,
  removeSavedContact,
  scanToPayBill,
} from '../controllers/billController.js';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from '../controllers/authController.js';
import { apiRateLimiter } from '../services/security.js';

const router = Router();

// Authentication routes
router.post('/auth/register', apiRateLimiter(20, 60_000), registerUser);
router.post('/auth/login', apiRateLimiter(30, 60_000), loginUser);
router.get('/auth/me', apiRateLimiter(60, 60_000), getCurrentUser);
router.post('/auth/logout', apiRateLimiter(30, 60_000), logoutUser);

// Contacts & Groups routes
router.post('/contacts', apiRateLimiter(40, 60_000), addSavedContact);
router.delete('/contacts/:id', apiRateLimiter(40, 60_000), removeSavedContact);

// Bill splitting & M-Pesa Daraja routes
router.get('/bills', apiRateLimiter(120, 60_000), listBills);
router.post('/split-bill', apiRateLimiter(25, 60_000), splitBill);
router.post('/callback', apiRateLimiter(120, 60_000), handleCallback);
router.get('/bill-status/:billId', apiRateLimiter(60, 60_000), getBillStatus);
router.post('/simulate-status/:billId', apiRateLimiter(60, 60_000), simulateParticipantStatus);
router.post('/settle-all/:billId', apiRateLimiter(30, 60_000), settleAllPending);
router.post('/bills/:billId/scan-pay', apiRateLimiter(40, 60_000), scanToPayBill);

export default router;
