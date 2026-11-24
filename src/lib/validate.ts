/**
 * Validation patterns shared by forms, server actions and API routes.
 * No imports, so it can be copied into the mobile app (lib/validate.ts).
 */
export const MOBILE_RE = /^[6-9]\d{9}$/; // 10 digits, Indian mobile
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PIN_RE = /^\d{6}$/;
export const GSTIN_RE = /^[0-9]{2}[A-Z0-9]{13}$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const UPI_UTR_RE = /^\d{12}$/;
export const BANK_REF_RE = /^[A-Za-z0-9]{10,22}$/;
export const OTP_RE = /^\d{6}$/;

/** Digits only, last 10 (drops +91 / 0 prefixes people type). */
export function tenDigits(input: string) {
  const d = (input || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

/** "9876543210" → "+919876543210". Returns null when not a valid Indian mobile. */
export function toE164(input: string): string | null {
  const d = tenDigits(input);
  return MOBILE_RE.test(d) ? `+91${d}` : null;
}

/** "+919876546047" → "******6047" */
export function maskPhone(p: string | null | undefined) {
  return '******' + (p || '').replace(/\D/g, '').slice(-4);
}

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];
