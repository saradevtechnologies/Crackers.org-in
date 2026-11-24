'use server';

import { getLang } from '@/lib/i18n';
import { clientIp } from '@/lib/rate-limit';
import {
  checkStatus,
  finalizeApplication,
  renewalUploadUrls,
  resubmitPrefill,
  startApplication,
  type BulkApplyInput,
  type FileMeta,
} from '@/lib/bulk';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';
import { revalidatePath } from 'next/cache';

export async function startBulkApplication(input: BulkApplyInput) {
  return startApplication(input, clientIp(), getLang());
}

export async function finalizeBulkApplication(id: string, paths: string[]) {
  return finalizeApplication(id, paths, getLang());
}

export async function checkBulkStatus(appNo: string, mobile: string) {
  return checkStatus(appNo, mobile, clientIp(), getLang());
}

export async function loadResubmit(appNo: string, mobile: string) {
  return resubmitPrefill(appNo, mobile, clientIp(), getLang());
}

/** Renewal: signed upload URLs for the signed-in owner. */
export async function startRenewal(files: FileMeta[]) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false as const, error: 'Sign in again.' };
  return renewalUploadUrls(data.user.id, files, getLang());
}

/** Renewal: save the new licence (runs as the owner, so request_bulk_renewal checks ownership). */
export async function submitRenewal(licenceNumber: string, licenceExpiry: string, paths: string[]) {
  const supabase = createClient();
  const { error } = await supabase.rpc('request_bulk_renewal', {
    p_licence_number: licenceNumber.trim(),
    p_licence_expiry: licenceExpiry,
    p_document_paths: paths,
  });
  if (error) return { ok: false as const, error: errMsg(error) };
  revalidatePath('/', 'layout');
  return { ok: true as const };
}
