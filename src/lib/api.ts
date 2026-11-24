import 'server-only';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js';
import type { Lang } from '@/lib/copy';

/** CORS for the public routes only (native apps don't need it; Expo web does). */
export const PUBLIC_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function json(body: unknown, status = 200, cors = false) {
  return NextResponse.json(body, { status, headers: cors ? PUBLIC_CORS : undefined });
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: PUBLIC_CORS });
}

/** Parses a JSON body; returns null for anything that isn't a JSON object. */
export async function readJson<T extends object>(req: Request): Promise<Partial<T> | null> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function langOf(body: { lang?: unknown } | null): Lang {
  return body?.lang === 'ta' ? 'ta' : 'en';
}

/**
 * The user behind `Authorization: Bearer <access_token>`, checked with Supabase,
 * plus a client that acts as that user (so RLS applies).
 */
export async function bearerUser(req: Request): Promise<{ user: User; token: string } | null> {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '');
  if (!m) return null;
  const token = m[1].trim();
  const client = userClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, token };
}

export function userClient(token: string) {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
