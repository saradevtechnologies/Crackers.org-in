import { json, langOf, preflight, readJson } from '@/lib/api';
import { finalizeApplication } from '@/lib/bulk';

/**
 * Mobile app: finish an application after uploading the files.
 * Body: { id, paths: string[], lang? } → { ok: true, applicationNo, email }
 */
export async function POST(req: Request) {
  const body = await readJson<{ id: string; paths: string[]; lang: string }>(req);
  if (!body || typeof body.id !== 'string' || !Array.isArray(body.paths)) {
    return json({ ok: false, error: 'Send { id, paths }.' }, 400, true);
  }
  const r = await finalizeApplication(body.id, body.paths.map(String), langOf(body));
  return json(r, r.ok ? 200 : 400, true);
}

export const OPTIONS = preflight;
