import axios from 'axios';

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

// OAuth token cache with safety buffer
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export const isDarajaConfigured = (): boolean => {
  return Boolean(
    process.env.DARAJA_CONSUMER_KEY &&
      process.env.DARAJA_CONSUMER_SECRET &&
      process.env.DARAJA_SHORTCODE &&
      process.env.DARAJA_PASSKEY
  );
};

export const isTokenCacheActive = (): boolean => {
  return Boolean(cachedToken && Date.now() < tokenExpiresAt);
};

export const normalizeKenyanPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return `254${digits}`;
  }
  return digits;
};

export const isValidKenyanPhone = (raw: string): boolean => {
  const normalized = normalizeKenyanPhone(raw);
  return /^254(7|1)\d{8}$/.test(normalized);
};

const getAccessToken = async (): Promise<string> => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await axios.get<{ access_token: string; expires_in?: string }>(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: { Authorization: `Basic ${credentials}` },
      timeout: 10000,
    }
  );

  cachedToken = res.data.access_token;
  const expiresInSec = Number(res.data.expires_in) || 3599;
  tokenExpiresAt = now + (expiresInSec - 60) * 1000;
  return cachedToken;
};

const generatePassword = (): { password: string; timestamp: string } => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`
  ).toString('base64');

  return { password, timestamp };
};

export const stkPush = async (
  phone: string,
  amount: number,
  accountRef = 'SplitPesa',
  description = 'Split bill payment'
): Promise<StkPushResponse> => {
  const normalizedPhone = normalizeKenyanPhone(phone);

  if (!isDarajaConfigured()) {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return {
      MerchantRequestID: `MR-${Date.now().toString().slice(-4)}-${rand}`,
      CheckoutRequestID: `ws_CO_${Date.now()}_${normalizedPhone}`,
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      CustomerMessage: 'Success. Request accepted for processing',
    };
  }

  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();

  const response = await axios.post<StkPushResponse>(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: process.env.DARAJA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: normalizedPhone,
      PartyB: process.env.DARAJA_SHORTCODE,
      PhoneNumber: normalizedPhone,
      CallBackURL: process.env.DARAJA_CALLBACK_URL || 'https://example.com/api/callback',
      AccountReference: accountRef.slice(0, 12),
      TransactionDesc: description.slice(0, 13),
    },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    }
  );

  return response.data;
};

export const stkPushQuery = async (checkoutRequestId: string): Promise<StkQueryResponse> => {
  if (!isDarajaConfigured()) {
    return {
      ResponseCode: '0',
      ResponseDescription: 'The service request has been accepted successfully',
      MerchantRequestID: `MR-QUERY-${Date.now().toString().slice(-4)}`,
      CheckoutRequestID: checkoutRequestId,
      ResultCode: '0',
      ResultDesc: 'The service request is processed successfully.',
    };
  }

  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();

  const response = await axios.post<StkQueryResponse>(
    'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
    {
      BusinessShortCode: process.env.DARAJA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    }
  );

  return response.data;
};
