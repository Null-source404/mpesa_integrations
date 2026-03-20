const axios = require('axios');

// ── 1. Get Access Token ──────────────────────────
const getAccessToken = async () => {
    const credentials = Buffer
        .from(`${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`)
        .toString('base64');

    const res = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        { headers: { Authorization: `Basic ${credentials}` } }
    );

    return res.data.access_token;
};

// ── 2. Generate Password ─────────────────────────
const generatePassword = () => {
    const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, 14);

    const password = Buffer
        .from(`${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`)
        .toString('base64');

    return { password, timestamp };
};

// ── 3. STK Push ──────────────────────────────────
const stkPush = async (phone, amount) => {
    // your old code had this right — just pulling token properly now
    const token = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
            BusinessShortCode: process.env.DARAJA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(amount), // M-Pesa doesn't like decimals
            PartyA: phone,
            PartyB: process.env.DARAJA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: process.env.DARAJA_CALLBACK_URL,
            AccountReference: 'BillSplit',
            TransactionDesc: 'Split bill payment'
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data; // 👈 return data — controller decides what to do with it
};

module.exports = { stkPush };