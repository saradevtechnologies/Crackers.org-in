import { bearerUser, json, langOf, readJson } from '@/lib/api';
import { renewalUploadUrls, type FileMeta } from '@/lib/bulk';

/**
 * Mobile app (signed-in bulk buyer): signed upload URLs for a licence renewal.
 * Header: Authorization: Bearer <access_token>. Body: { files: [{name,size,type}], lang? }
 * → { ok: true, uploads: [{ path, token, signedUrl }] }. Upload, then call the
 *   request_bulk_renewal RPC with the paths using the app's own session.
 */
export async function POST(req: Request) {
  const auth = await bearerUser(req);
  if (!auth) return json({ ok: false, error: 'Sign in again.' }, 401);
  const body = await readJson<{ files: FileMeta[]; lang: string }>(req);
  if (!body || !Array.isArray(body.files)) return json({ ok: false, error: 'Send { files }.' }, 400);
  const r = await renewalUploadUrls(auth.user.id, body.files, langOf(body));
  return json(r, r.ok ? 200 : 400);
}
