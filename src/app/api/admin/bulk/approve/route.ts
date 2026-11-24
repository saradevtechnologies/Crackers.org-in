import { bearerUser, json, readJson, userClient } from '@/lib/api';
import { approveApplication, resendInvite } from '@/lib/bulk';

/**
 * Mobile app (admin): approve a bulk application, or resend its invite.
 * Header: Authorization: Bearer <access_token> of an admin. Body: { id, resend?: boolean }
 * Not CORS-enabled on purpose: native apps don't need it.
 */
export async function POST(req: Request) {
  const auth = await bearerUser(req);
  if (!auth) return json({ ok: false, error: 'Sign in again.' }, 401);
  const { data: profile } = await userClient(auth.token).from('profiles').select('role').eq('id', auth.user.id).single();
  if (profile?.role !== 'admin') return json({ ok: false, error: 'Not allowed.' }, 403);

  const body = await readJson<{ id: string; resend: boolean }>(req);
  if (!body || typeof body.id !== 'string') return json({ ok: false, error: 'Send { id }.' }, 400);
  const r = body.resend ? await resendInvite(body.id) : await approveApplication(body.id, auth.user.id);
  return json(r, r.ok ? 200 : 400);
}
