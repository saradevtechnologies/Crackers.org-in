import { json, langOf, preflight, readJson } from '@/lib/api';
import { clientIp } from '@/lib/rate-limit';
import { startApplication, type BulkApplyInput } from '@/lib/bulk';

/**
 * Mobile app: start a bulk buyer application.
 * Body: { shop_name, owner_name, mobile, email, address, city, state, pincode, gstin, licence_number,
 *         licence_expiry, files: [{name,size,type}], confirm: true, turnstileToken?, lang? }
 * 200 → { ok: true, id, applicationNo, uploads: [{ path, token, signedUrl }] }
 *       Upload each file in order to its signed URL, then POST /api/bulk/finalize.
 */
export async function POST(req: Request) {
  const body = await readJson<BulkApplyInput & { lang: string }>(req);
  if (!body) return json({ ok: false, error: 'Send a JSON body.' }, 400, true);
  const r = await startApplication(body as BulkApplyInput, clientIp(), langOf(body));
  return json(r, r.ok ? 200 : 'retryAfter' in r && r.retryAfter ? 429 : 400, true);
}

export const OPTIONS = preflight;
