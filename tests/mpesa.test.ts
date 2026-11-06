import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  stkPush,
} from '../server/services/mpesa.js';

test('normalizeKenyanPhone handles varied Kenyan mobile formats', () => {
  // Standard 07xx format
  assert.equal(normalizeKenyanPhone('0712345678'), '254712345678');
  // Modern 01xx format (Safaricom 011x series)
  assert.equal(normalizeKenyanPhone('0112345678'), '254112345678');
  // Spaces and hyphens
  assert.equal(normalizeKenyanPhone('0712 345 678'), '254712345678');
  assert.equal(normalizeKenyanPhone('+254-712-345-678'), '254712345678');
  // 9 digit without leading zero
  assert.equal(normalizeKenyanPhone('712345678'), '254712345678');
});

test('isValidKenyanPhone correctly validates valid and invalid numbers', () => {
  assert.equal(isValidKenyanPhone('0712345678'), true);
  assert.equal(isValidKenyanPhone('+254712345678'), true);
  assert.equal(isValidKenyanPhone('0110123456'), true);
  assert.equal(isValidKenyanPhone('254722000000'), true);

  // Invalid numbers
  assert.equal(isValidKenyanPhone('0201234567'), false); // Landline
  assert.equal(isValidKenyanPhone('12345'), false); // Too short
  assert.equal(isValidKenyanPhone(''), false); // Empty
  assert.equal(isValidKenyanPhone('071234567899'), false); // Too long
});

test('stkPush fallback returns expected merchant and checkout request IDs', async () => {
  const result = await stkPush('0712345678', 500, 'TestBill', 'Testing M-Pesa STK push');
  assert.ok(result.MerchantRequestID, 'Should return MerchantRequestID');
  assert.ok(result.CheckoutRequestID, 'Should return CheckoutRequestID');
  assert.equal(result.ResponseCode, '0');
  assert.ok(result.CustomerMessage.includes('Success'));
});

test('Equal bill split arithmetic divides sum into whole shillings with zero drift', () => {
  const totalAmount = 3000;
  const participantCount = 4;
  const perPerson = totalAmount / participantCount;
  assert.equal(perPerson, 750);
  assert.equal(perPerson * participantCount, totalAmount);

  // Uneven division (e.g. KES 1,000 amongst 3 people must be 334 + 333 + 333)
  const unevenTotal = 1000;
  const count = 3;
  const baseShillings = Math.floor(unevenTotal / count); // 333
  const remainder = unevenTotal - baseShillings * count; // 1
  const shares = Array.from({ length: count }, (_, idx) =>
    idx < remainder ? baseShillings + 1 : baseShillings
  );

  assert.deepEqual(shares, [334, 333, 333]);
  assert.equal(
    shares.reduce((a, b) => a + b, 0),
    1000
  );
  // All shares are strictly integers (no decimals for STK push)
  assert.ok(shares.every((amt) => Number.isInteger(amt)));
});
