import 'server-only';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Sliding-window limits stored in the `rate_limits` table (service role only).
 * If the service role key is missing (local dev without it), limits are skipped rather than blocking everyone.
 */
function db() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/** How many hits `key` has had in the last `windowSec` seconds, and when the oldest one expires. */
export async function usage(key: string, windowSec: number) {
  const admin = db();
  if (!admin) return { count: 0, retryAfter: 0 };
  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  const { data, count } = await admin
    .from('rate_limits')
    .select('created_at', { count: 'exact' })
    .eq('key', key)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(1);
  const oldest = data?.[0]?.created_at ? new Date(data[0].created_at).getTime() : Date.now();
  return { count: count ?? 0, retryAfter: Math.max(1, Math.ceil((oldest + windowSec * 1000 - Date.now()) / 1000)) };
}

export async function record(key: string) {
  const admin = db();
  if (!admin) return;
  await admin.from('rate_limits').insert({ key });
}

export async function clear(key: string) {
  const admin = db();
  if (!admin) return;
  await admin.from('rate_limits').delete().eq('key', key);
}

/**
 * Checks every rule and records a hit on all of them when allowed.
 * Returns { ok: false, retryAfter } (seconds) when any rule is over its limit.
 */
export async function limit(rules: { key: string; max: number; windowSec: number }[]) {
  for (const r of rules) {
    const u = await usage(r.key, r.windowSec);
    if (u.count >= r.max) return { ok: false as const, retryAfter: u.retryAfter };
  }
  await Promise.all(rules.map((r) => record(r.key)));
  return { ok: true as const, retryAfter: 0 };
}

/** Best-effort client IP for per-IP limits. */
export function clientIp() {
  const h = headers();
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim();
}
