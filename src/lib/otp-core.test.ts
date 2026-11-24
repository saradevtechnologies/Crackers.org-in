// Run with: npm test  (Node's built-in test runner; Node 22.6+ strips the TypeScript types)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_ATTEMPTS,
  OTP_TTL_MS,
  VERIFIED_WINDOW_MS,
  checkCode,
  generateCode,
  hashCode,
  isFreshlyVerified,
  newRow,
  resendWait,
} from './otp-core.ts';

const UID = '11111111-2222-3333-4444-555555555555';
const T0 = Date.UTC(2026, 10, 24, 10, 0, 0);

test('generateCode is always 6 digits, zero-padded', () => {
  assert.equal(generateCode(() => 42), '000042');
  assert.equal(generateCode(() => 999999), '999999');
  for (let i = 0; i < 200; i++) assert.match(generateCode(), /^\d{6}$/);
});

test('hash is sha256(code || user_id) and never the plain code', () => {
  const h = hashCode('123456', UID);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.notEqual(h, '123456');
  assert.equal(h, hashCode('123456', UID));
  assert.notEqual(h, hashCode('123456', '99999999-2222-3333-4444-555555555555'), 'salted by user id');
  const row = newRow('123456', UID, T0);
  assert.ok(!JSON.stringify(row).includes('123456'));
});

test('correct code within 10 minutes verifies', () => {
  const row = newRow('654321', UID, T0);
  const r = checkCode(row, '654321', UID, T0 + OTP_TTL_MS - 1000);
  assert.equal(r.ok, true);
  assert.ok(r.ok && r.row.verified_at);
});

test('code expires after 10 minutes', () => {
  const row = newRow('654321', UID, T0);
  const r = checkCode(row, '654321', UID, T0 + OTP_TTL_MS);
  assert.deepEqual([r.ok, !r.ok && r.reason], [false, 'expired']);
});

test('wrong code counts attempts; 5th wrong try locks; then even the right code fails', () => {
  let row = newRow('111111', UID, T0);
  for (let i = 1; i < MAX_ATTEMPTS; i++) {
    const r = checkCode(row, '222222', UID, T0 + 1000);
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.reason, 'wrong');
    assert.equal(!r.ok && r.attemptsLeft, MAX_ATTEMPTS - i);
    row = r.row!;
  }
  const fifth = checkCode(row, '222222', UID, T0 + 1000);
  assert.equal(!fifth.ok && fifth.reason, 'locked');
  const after = checkCode(fifth.row, '111111', UID, T0 + 2000);
  assert.equal(!after.ok && after.reason, 'locked');
});

test('missing row and malformed codes are rejected', () => {
  assert.equal(checkCode(null, '123456', UID).ok, false);
  const row = newRow('123456', UID, T0);
  assert.equal(checkCode(row, '12345', UID, T0).ok, false);
  assert.equal(checkCode(row, 'abcdef', UID, T0).ok, false);
});

test('verification is only good for 15 minutes', () => {
  const at = new Date(T0).toISOString();
  assert.equal(isFreshlyVerified({ verified_at: at }, T0 + VERIFIED_WINDOW_MS), true);
  assert.equal(isFreshlyVerified({ verified_at: at }, T0 + VERIFIED_WINDOW_MS + 1), false);
  assert.equal(isFreshlyVerified({ verified_at: null }, T0), false);
  assert.equal(isFreshlyVerified(null, T0), false);
});

test('resend: 30 s gap and at most 5 per hour', () => {
  assert.equal(resendWait([], T0), 0);
  assert.equal(resendWait([T0], T0 + 10_000), 20);
  assert.equal(resendWait([T0], T0 + 30_000), 0);
  const five = [0, 1, 2, 3, 4].map((i) => T0 + i * 60_000);
  // 6th send must wait until the first of the five is an hour old
  assert.equal(resendWait(five, T0 + 5 * 60_000), 55 * 60);
  assert.equal(resendWait(five, T0 + 3600_000), 0);
});
