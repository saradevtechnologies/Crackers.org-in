import { json, langOf, preflight, readJson } from '@/lib/api';
import { clientIp } from '@/lib/rate-limit';
import { checkStatus } from '@/lib/bulk';

/**
 * Public status check. Body: { applicationNo, mobile, lang? }
 * → { ok: true, applicationNo, status, label, message, resubmitUrl } (status only, no personal data)
 */
export async function POST(req: Request) {
  const body = await readJson<{ applicationNo: string; mobile: string; lang: string }>(req);
  if (!body) return json({ ok: false, error: 'Send a JSON body.' }, 400, true);
  const r = await checkStatus(String(body.applicationNo ?? ''), String(body.mobile ?? ''), clientIp(), langOf(body));
  return json(r, r.ok ? 200 : 'retryAfter' in r ? 429 : 404, true);
}

export const OPTIONS = preflight;
