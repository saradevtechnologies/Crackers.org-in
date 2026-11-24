import 'server-only';
import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { t, waitText, type Lang, type MsgKey } from '@/lib/copy';
import { limit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { flushWhatsappQueue } from '@/lib/whatsapp';
import { MOBILE_RE, tenDigits } from '@/lib/validate';
import {
  FILE_TYPES,
  MAX_FILE_BYTES,
  MAX_FILES,
  fileError,
  normalize,
  todayIST,
  validateStep1,
  validateStep2,
  type BulkApplyInput,
  type BulkStep1,
  type FieldErrors,
  type FileMeta,
} from '@/lib/bulk-validate';

export * from '@/lib/bulk-validate';
import type { BulkApplication, BulkStatus } from '@/lib/types';

/**
 * Bulk buyer applications: the logic behind the website's server actions AND the /api routes the mobile app uses.
 * Everything here runs with the service role. Never import this from a client component.
 */

const BUCKET = 'bulk-docs';
const OPEN_STATUSES = ['pending', 'approved', 'renewal_pending'];

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

type Fail = { ok: false; error: string; fieldErrors?: FieldErrors; statusLink?: boolean; retryAfter?: number };

async function queue(phone: string, name: string, text: string) {
  const admin = createAdminClient();
  await admin.rpc('queue_message', { p_phone: phone, p_name: name, p_text: text });
  await flushWhatsappQueue();
}

/** Signed upload URLs for files in applications/<id>/. Only the server can create these. */
async function uploadUrls(applicationId: string, files: FileMeta[]) {
  const admin = createAdminClient();
  const out: { path: string; token: string; signedUrl: string }[] = [];
  for (const f of files) {
    const path = `applications/${applicationId}/${randomUUID()}.${FILE_TYPES[f.type]}`;
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error('signed url');
    out.push({ path, token: data.token, signedUrl: data.signedUrl });
  }
  return out;
}

/**
 * Step 1 of submission: checks, rate limits, creates the row, and returns signed upload URLs.
 * The client uploads the files, then calls finalizeApplication().
 */
export async function startApplication(raw: BulkApplyInput, ip: string, lang: Lang) {
  const v = normalize(raw);
  const fieldErrors = { ...validateStep1(v, lang), ...validateStep2(v, lang) };
  if (!v.confirm) fieldErrors.confirm = t('bulk.e.confirm', lang);
  if (Object.keys(fieldErrors).length) return { ok: false, error: t('bulk.e.fixStep', lang), fieldErrors } as Fail;

  if (!(await verifyTurnstile(v.turnstileToken, ip))) return { ok: false, error: t('bulk.e.captcha', lang) } as Fail;

  const phone = `+91${v.mobile}`;
  const admin = createAdminClient();

  // Rows whose uploads never finished (empty document_paths) don't count as applications: clear them.
  // (Separate .eq() filters, never string-built .or(), so user input can't change the query.)
  for (const [col, val] of [['email', v.email], ['phone', phone]] as const) {
    await admin.from('bulk_applications').delete().eq(col, val).eq('status', 'pending').eq('document_paths', '{}');
  }

  for (const [col, val] of [['email', v.email], ['phone', phone]] as const) {
    const { data: dup } = await admin.from('bulk_applications').select('id').eq(col, val).in('status', OPEN_STATUSES).limit(1);
    if (dup?.length) return { ok: false, error: t('bulk.e.duplicate', lang), statusLink: true } as Fail;
  }

  const rl = await limit([
    { key: `bulk_apply:${phone}`, max: 3, windowSec: 86400 },
    { key: `bulk_apply_ip:${ip}`, max: 10, windowSec: 86400 },
  ]);
  if (!rl.ok) return { ok: false, error: t('bulk.e.rateLimit', lang), retryAfter: rl.retryAfter } as Fail;

  const { data: row, error } = await admin
    .from('bulk_applications')
    .insert({
      shop_name: v.shop_name,
      owner_name: v.owner_name,
      phone,
      email: v.email,
      address: v.address,
      city: v.city,
      state: v.state,
      pincode: v.pincode,
      gstin: v.gstin,
      licence_number: v.licence_number,
      licence_expiry: v.licence_expiry,
      document_paths: [],
    })
    .select('id, application_no')
    .single();
  if (error?.code === '23505') return { ok: false, error: t('bulk.e.duplicate', lang), statusLink: true } as Fail;
  if (error || !row) return { ok: false, error: t('common.tryAgain', lang) } as Fail;

  try {
    const uploads = await uploadUrls(row.id, v.files);
    return { ok: true as const, id: row.id as string, applicationNo: row.application_no as string, uploads };
  } catch {
    await admin.from('bulk_applications').delete().eq('id', row.id);
    return { ok: false, error: t('common.tryAgain', lang) } as Fail;
  }
}

/** Objects actually stored under applications/<id>/, with sizes. */
async function storedFiles(applicationId: string) {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).list(`applications/${applicationId}`, { limit: 100 });
  return new Map(
    (data ?? []).map((o) => [
      `applications/${applicationId}/${o.name}`,
      { size: Number(o.metadata?.size ?? 0), type: String(o.metadata?.mimetype ?? '') },
    ]),
  );
}

async function removeApplication(applicationId: string) {
  const admin = createAdminClient();
  const files = await storedFiles(applicationId);
  if (files.size) await admin.storage.from(BUCKET).remove(Array.from(files.keys()));
  await admin.from('bulk_applications').delete().eq('id', applicationId);
}

/** Checks that every uploaded file exists and is within limits, then saves the paths. Deletes the row if not. */
export async function finalizeApplication(id: string, paths: string[], lang: Lang) {
  const admin = createAdminClient();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: t('common.tryAgain', lang) } as Fail;
  const { data: app } = await admin
    .from('bulk_applications')
    .select('id, application_no, email, phone, owner_name, status, document_paths, created_at')
    .eq('id', id)
    .maybeSingle();
  const fresh = app && Date.now() - new Date(app.created_at).getTime() < 2 * 3600 * 1000;
  if (!app || app.status !== 'pending' || (app.document_paths as string[]).length || !fresh) {
    return { ok: false, error: t('common.tryAgain', lang) } as Fail;
  }

  const prefix = `applications/${id}/`;
  const unique = Array.from(new Set(paths ?? []));
  const stored = await storedFiles(id);
  const bad =
    !unique.length ||
    unique.length > MAX_FILES ||
    unique.some((p) => {
      const f = stored.get(p);
      return !p.startsWith(prefix) || !f || f.size > MAX_FILE_BYTES || (f.type && !FILE_TYPES[f.type]);
    });
  if (bad) {
    await removeApplication(id);
    return { ok: false, error: t('bulk.e.upload', lang) } as Fail;
  }

  const { error } = await admin.from('bulk_applications').update({ document_paths: unique }).eq('id', id);
  if (error) {
    await removeApplication(id);
    return { ok: false, error: t('bulk.e.upload', lang) } as Fail;
  }
  // Remove any extra objects that were uploaded but not submitted.
  const extra = Array.from(stored.keys()).filter((p) => !unique.includes(p));
  if (extra.length) await admin.storage.from(BUCKET).remove(extra);

  await queue(app.phone, app.owner_name, t('bulk.wa.received', lang, { no: app.application_no }));
  return { ok: true as const, applicationNo: app.application_no as string, email: app.email as string };
}

const STATUS_KEY: Record<BulkStatus, MsgKey> = {
  pending: 'bulk.s.pending',
  approved: 'bulk.s.approved',
  rejected: 'bulk.s.rejected',
  suspended: 'bulk.s.suspended',
  renewal_pending: 'bulk.s.renewal_pending',
};

/** Public status check: application number + mobile must both match. Returns status only. */
export async function checkStatus(appNoRaw: string, mobileRaw: string, ip: string, lang: Lang) {
  const rl = await limit([{ key: `status_check:${ip}`, max: 10, windowSec: 3600 }]);
  if (!rl.ok) return { ok: false, error: t('common.tooManyTries', lang, { wait: waitText(rl.retryAfter, lang) }) } as Fail;
  const appNo = appNoRaw.trim().toUpperCase().replace(/^(\d)/, 'BLK-$1');
  const mobile = tenDigits(mobileRaw);
  if (!MOBILE_RE.test(mobile) || !/^BLK-\d+$/.test(appNo)) return { ok: false, error: t('bulk.status.notFound', lang) } as Fail;
  const admin = createAdminClient();
  const { data } = await admin
    .from('bulk_applications')
    .select('application_no, status, admin_note')
    .eq('application_no', appNo)
    .eq('phone', `+91${mobile}`)
    .neq('document_paths', '{}')
    .maybeSingle();
  if (!data) return { ok: false, error: t('bulk.status.notFound', lang) } as Fail;
  const status = data.status as BulkStatus;
  return {
    ok: true as const,
    applicationNo: data.application_no as string,
    status,
    label: t(`bulk.label.${status}` as MsgKey, lang),
    message: t(STATUS_KEY[status], lang, { reason: data.admin_note || '—' }),
    resubmitUrl: status === 'rejected' ? `/bulk/apply?resubmit=${data.application_no}` : null,
  };
}

/** Prefill for "apply again" after a rejection. Mobile must match; returns step 1 fields only. */
export async function resubmitPrefill(appNoRaw: string, mobileRaw: string, ip: string, lang: Lang) {
  const rl = await limit([{ key: `status_check:${ip}`, max: 10, windowSec: 3600 }]);
  if (!rl.ok) return { ok: false, error: t('common.tooManyTries', lang, { wait: waitText(rl.retryAfter, lang) }) } as Fail;
  const mobile = tenDigits(mobileRaw);
  const admin = createAdminClient();
  const { data } = await admin
    .from('bulk_applications')
    .select('shop_name, owner_name, phone, email, address, city, state, pincode, gstin, licence_number')
    .eq('application_no', appNoRaw.trim().toUpperCase())
    .eq('phone', `+91${mobile}`)
    .eq('status', 'rejected')
    .maybeSingle();
  if (!data) return { ok: false, error: t('bulk.status.notFound', lang) } as Fail;
  const step1: BulkStep1 = {
    shop_name: data.shop_name,
    owner_name: data.owner_name,
    mobile,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
  };
  return { ok: true as const, step1, gstin: data.gstin as string, licence_number: data.licence_number as string };
}

// ---------------------------------------------------------------------------
// Admin: approve and (re)send the invite
// ---------------------------------------------------------------------------

/**
 * Approve an application: invite (or link) the login, make the profile a bulk buyer, mark approved, WhatsApp the owner.
 * `adminId` must already be verified as an admin by the caller.
 */
export async function approveApplication(id: string, adminId: string) {
  const admin = createAdminClient();
  const { data: app } = await admin.from('bulk_applications').select('*').eq('id', id).maybeSingle();
  const a = app as BulkApplication | null;
  if (!a) return { ok: false, error: 'Application not found.' } as Fail;
  if (a.status !== 'pending') return { ok: false, error: `This application is ${a.status.replace('_', ' ')}, not pending.` } as Fail;
  if (a.licence_expiry < todayIST()) return { ok: false, error: 'The licence has expired. Reject with "Licence expired" instead.' } as Fail;

  const sent = await sendLoginEmail(a.email, a.owner_name);
  if (!sent.ok) return sent;

  const { error: pErr } = await admin
    .from('profiles')
    .update({ account_type: 'bulk', phone: a.phone, full_name: a.owner_name })
    .eq('id', sent.userId);
  if (pErr) return { ok: false, error: 'Could not update the profile. Try again.' } as Fail;

  const { error: aErr } = await admin
    .from('bulk_applications')
    .update({
      status: 'approved',
      user_id: sent.userId,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_note: null,
    })
    .eq('id', id);
  if (aErr) return { ok: false, error: aErr.code === '23505' ? 'This login is already linked to another bulk application.' : 'Could not save the approval. Try again.' } as Fail;

  await admin.from('rate_limits').insert({ key: `invite:${id}` });
  await queue(a.phone, a.owner_name, t('bulk.wa.approved', 'en', { email: a.email }));
  return { ok: true as const, invite: sent.kind };
}

/** Resend the "set your password" email. Limited to once per 2 minutes per application. */
export async function resendInvite(id: string) {
  const admin = createAdminClient();
  const { data: app } = await admin.from('bulk_applications').select('email, owner_name, status').eq('id', id).maybeSingle();
  if (!app || app.status !== 'approved') return { ok: false, error: 'Only approved applications can get a new invite.' } as Fail;
  const rl = await limit([{ key: `invite:${id}`, max: 1, windowSec: 120 }]);
  if (!rl.ok) return { ok: false, error: `Wait ${rl.retryAfter} seconds before sending again.` } as Fail;
  const sent = await sendLoginEmail(app.email, app.owner_name);
  return sent.ok ? { ok: true as const, invite: sent.kind } : sent;
}

/**
 * New email → Supabase invite ("Set your password" link).
 * Existing login with this email → password reset email instead, so no second account is created.
 */
async function sendLoginEmail(email: string, fullName: string) {
  const admin = createAdminClient();
  const { data: existingId } = await admin.rpc('find_user_by_email', { p_email: email });

  if (existingId) {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', existingId).maybeSingle();
    if (prof && prof.role !== 'customer') {
      return { ok: false, error: `This email belongs to a ${prof.role} login. Ask the applicant for a different email.` } as Fail;
    }
    // Invited but never set a password → the invite can simply be sent again.
    const { data: u } = await admin.auth.admin.getUserById(existingId as string);
    if (u.user && !u.user.last_sign_in_at && u.user.invited_at) {
      const r = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo: `${siteUrl()}/auth/confirm?next=/auth/set-password`,
      });
      if (!r.error) return { ok: true as const, userId: existingId as string, kind: 'invite' as const };
    }
    const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/confirm?next=/auth/reset-verify` });
    if (error) return { ok: false, error: emailError(error.message) } as Fail;
    return { ok: true as const, userId: existingId as string, kind: 'reset' as const };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${siteUrl()}/auth/confirm?next=/auth/set-password`,
  });
  if (error || !data.user) return { ok: false, error: emailError(error?.message) } as Fail;
  return { ok: true as const, userId: data.user.id, kind: 'invite' as const };
}

function emailError(msg?: string) {
  if (msg && /rate|limit/i.test(msg)) {
    return 'Supabase refused to send more emails right now (email rate limit). Set up custom SMTP (see README), then use "Resend invite".';
  }
  return `Could not send the email${msg ? `: ${msg}` : ''}. Check SMTP settings in Supabase, then use "Resend invite".`;
}

// ---------------------------------------------------------------------------
// Owner: licence renewal uploads
// ---------------------------------------------------------------------------

/** Signed upload URLs for a renewal. `userId` must be the verified caller. */
export async function renewalUploadUrls(userId: string, files: FileMeta[], lang: Lang) {
  const err = fileError(files, true, lang);
  if (err) return { ok: false, error: err } as Fail;
  const admin = createAdminClient();
  const { data: app } = await admin.from('bulk_applications').select('id, status').eq('user_id', userId).maybeSingle();
  if (!app || !['approved', 'renewal_pending', 'rejected'].includes(app.status)) {
    return { ok: false, error: t('common.tryAgain', lang) } as Fail;
  }
  const rl = await limit([{ key: `renewal_upload:${userId}`, max: 10, windowSec: 86400 }]);
  if (!rl.ok) return { ok: false, error: t('bulk.e.rateLimit', lang) } as Fail;
  try {
    return { ok: true as const, uploads: await uploadUrls(app.id, files) };
  } catch {
    return { ok: false, error: t('common.tryAgain', lang) } as Fail;
  }
}

/** Signed download links (10 minutes) for the admin review screen. */
export async function documentLinks(paths: string[]) {
  if (!paths.length) return [];
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).createSignedUrls(paths, 600);
  return (data ?? []).map((d, i) => ({ path: paths[i], url: d.signedUrl }));
}

/** Why bulk prices are off for a bulk account (null = they're on). */
export function pausedReason(a: Pick<BulkApplication, 'status' | 'licence_expiry'> | null): MsgKey | null {
  if (!a) return 'bulk.reason.suspended';
  if (a.status === 'suspended') return 'bulk.reason.suspended';
  if (a.status === 'renewal_pending') return 'bulk.reason.renewal';
  if (a.status === 'rejected') return 'bulk.reason.rejected';
  if (a.licence_expiry < todayIST()) return 'bulk.reason.expired';
  return null;
}
