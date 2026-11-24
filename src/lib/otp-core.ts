/**
 * Pure rules for the step-up OTP used in bulk-buyer password resets.
 * No app imports (only node:crypto), so `npm test` can run it directly with Node's test runner.
 */
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

export const OTP_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
export const MAX_ATTEMPTS = 5; // wrong tries before a new code is needed
export const RESEND_GAP_MS = 30 * 1000; // at most one send per 30 s
export const MAX_SENDS_PER_HOUR = 5;
export const VERIFIED_WINDOW_MS = 15 * 60 * 1000; // set-password must happen within 15 min of verifying

export interface OtpRow {
  code_hash: string;
  expires_at: string; // ISO
  attempts: number;
  verified_at: string | null;
}

/** 6 digits from a cryptographically secure source, zero-padded. */
export function generateCode(rand: (min: number, max: number) => number = randomInt) {
  return String(rand(0, 1_000_000)).padStart(6, '0');
}

/** sha256(code || user_id), hex. The plain code is never stored. */
export function hashCode(code: string, userId: string) {
  return createHash('sha256').update(code + userId).digest('hex');
}

export function newRow(code: string, userId: string, now = Date.now()): OtpRow {
  return { code_hash: hashCode(code, userId), expires_at: new Date(now + OTP_TTL_MS).toISOString(), attempts: 0, verified_at: null };
}

export type CheckResult =
  | { ok: true; row: OtpRow }
  | { ok: false; reason: 'missing' | 'expired' | 'locked' | 'wrong'; row: OtpRow | null; attemptsLeft: number };

/** Checks a code and returns the row to save (attempts++ on a wrong code, verified_at on success). */
export function checkCode(row: OtpRow | null, code: string, userId: string, now = Date.now()): CheckResult {
  if (!row) return { ok: false, reason: 'missing', row: null, attemptsLeft: 0 };
  if (new Date(row.expires_at).getTime() <= now) return { ok: false, reason: 'expired', row, attemptsLeft: 0 };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'locked', row, attemptsLeft: 0 };
  const given = Buffer.from(hashCode(String(code).trim(), userId), 'hex');
  const stored = Buffer.from(row.code_hash, 'hex');
  const match = /^\d{6}$/.test(String(code).trim()) && given.length === stored.length && timingSafeEqual(given, stored);
  if (!match) {
    const attempts = row.attempts + 1;
    return {
      ok: false,
      reason: attempts >= MAX_ATTEMPTS ? 'locked' : 'wrong',
      row: { ...row, attempts },
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    };
  }
  return { ok: true, row: { ...row, verified_at: new Date(now).toISOString() } };
}

/** True when the code was verified recently enough to allow setting a new password. */
export function isFreshlyVerified(row: Pick<OtpRow, 'verified_at'> | null, now = Date.now()) {
  if (!row?.verified_at) return false;
  const age = now - new Date(row.verified_at).getTime();
  return age >= 0 && age <= VERIFIED_WINDOW_MS;
}

/** Seconds to wait before another code may be sent (0 = now). `sends` are epoch ms of earlier sends. */
export function resendWait(sends: number[], now = Date.now()) {
  const recent = sends.filter((t) => now - t < 3600_000).sort((a, b) => a - b);
  let wait = 0;
  const last = recent[recent.length - 1];
  if (last !== undefined) wait = Math.max(wait, RESEND_GAP_MS - (now - last));
  if (recent.length >= MAX_SENDS_PER_HOUR) wait = Math.max(wait, 3600_000 - (now - recent[recent.length - MAX_SENDS_PER_HOUR]));
  return Math.max(0, Math.ceil(wait / 1000));
}
