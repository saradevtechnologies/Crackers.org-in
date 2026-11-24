import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/safe-next';

const TYPES: EmailOtpType[] = ['invite', 'recovery', 'email', 'signup', 'magiclink', 'email_change'];

/**
 * Landing point for every email link (see the email templates in the README):
 *   /auth/confirm?token_hash=…&type=invite|recovery|email&next=/auth/set-password
 * Verifies the one-time token, which signs the user in, then sends them on.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const code = url.searchParams.get('code');

  // Recovery always goes through the extra phone check; invites always go to set-password.
  const next =
    type === 'recovery'
      ? '/auth/reset-verify'
      : type === 'invite'
        ? '/auth/set-password'
        : safeNext(url.searchParams.get('next'), '/');

  const supabase = createClient();
  let ok = false;
  if (tokenHash && type && TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    // Links sent with Supabase's default template + PKCE
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const dest = ok ? next : `/auth/link-expired${type ? `?type=${encodeURIComponent(type)}` : ''}`;
  return NextResponse.redirect(new URL(dest, url.origin));
}
