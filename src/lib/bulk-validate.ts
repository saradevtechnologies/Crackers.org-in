/**
 * Bulk application validation, shared by the browser form and the server (and copyable into the app).
 * No server-only imports here.
 */
import { t, type Lang } from './copy';
import { EMAIL_RE, GSTIN_RE, MOBILE_RE, PIN_RE, tenDigits } from './validate';

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_FILES = 3;
export const FILE_TYPES: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };


export interface BulkStep1 {
  shop_name: string;
  owner_name: string;
  mobile: string; // 10 digits
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}
export interface BulkStep2 {
  gstin: string;
  licence_number: string;
  licence_expiry: string; // YYYY-MM-DD
}
export interface FileMeta {
  name: string;
  size: number;
  type: string;
}
export interface BulkApplyInput extends BulkStep1, BulkStep2 {
  files: FileMeta[];
  confirm: boolean;
  turnstileToken?: string | null;
}

export type FieldErrors = Partial<Record<keyof BulkApplyInput, string>>;

/** Today in India (IST) as YYYY-MM-DD. */
export function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function normalize(input: BulkApplyInput): BulkApplyInput {
  const s = (v: unknown) => String(v ?? '').trim();
  return {
    shop_name: s(input.shop_name),
    owner_name: s(input.owner_name),
    mobile: tenDigits(s(input.mobile)),
    email: s(input.email).toLowerCase(),
    address: s(input.address),
    city: s(input.city),
    state: s(input.state),
    pincode: s(input.pincode),
    gstin: s(input.gstin).toUpperCase().replace(/\s/g, ''),
    licence_number: s(input.licence_number),
    licence_expiry: s(input.licence_expiry),
    files: Array.isArray(input.files) ? input.files : [],
    confirm: !!input.confirm,
    turnstileToken: input.turnstileToken ?? null,
  };
}

export function validateStep1(v: BulkStep1, lang: Lang): FieldErrors {
  const e: FieldErrors = {};
  const req = t('bulk.e.required', lang);
  for (const k of ['shop_name', 'owner_name', 'address', 'city', 'state'] as const) if (!v[k]?.trim()) e[k] = req;
  if (!MOBILE_RE.test(v.mobile)) e.mobile = t('login.badMobile', lang);
  if (!EMAIL_RE.test(v.email)) e.email = t('bulk.e.email', lang);
  if (!PIN_RE.test(v.pincode)) e.pincode = t('bulk.e.pincode', lang);
  return e;
}

export function validateStep2(v: BulkStep2 & { files: FileMeta[] }, lang: Lang): FieldErrors {
  const e: FieldErrors = {};
  if (!GSTIN_RE.test(v.gstin)) e.gstin = t('bulk.e.gstin', lang);
  if (!v.licence_number?.trim()) e.licence_number = t('bulk.e.required', lang);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.licence_expiry) || v.licence_expiry <= todayIST()) e.licence_expiry = t('bulk.e.expiry', lang);
  e.files = fileError(v.files, true, lang) ?? undefined;
  if (!e.files) delete e.files;
  return e;
}

export function fileError(files: FileMeta[], licenceRequired: boolean, lang: Lang): string | null {
  if (licenceRequired && !files.length) return t('bulk.e.licenceFile', lang);
  if (files.length > MAX_FILES) return t('bulk.e.tooManyFiles', lang);
  for (const f of files) {
    if (!FILE_TYPES[f.type]) return t('bulk.e.fileType', lang);
    if (!(f.size > 0) || f.size > MAX_FILE_BYTES) return t('bulk.e.fileSize', lang);
  }
  return null;
}

