import type { OrderStatus, SubOrderStatus } from './types';

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function inr(n: number | string | null | undefined) {
  return inrFmt.format(Number(n ?? 0));
}

export function discountPct(mrp: number, price: number) {
  if (!mrp || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function dateTime(s: string | null | undefined) {
  if (!s) return '';
  return new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  payment_pending: { label: 'Payment pending', tone: 'gold' },
  payment_submitted: { label: 'Verifying payment', tone: 'blue' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  completed: { label: 'Completed', tone: 'green' },
  rejected: { label: 'Payment rejected', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
};

export const SUB_STATUS: Record<SubOrderStatus, { label: string; tone: Tone }> = {
  awaiting_payment: { label: 'Awaiting payment', tone: 'gold' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  packed: { label: 'Packed', tone: 'gold' },
  dispatched: { label: 'Dispatched', tone: 'blue' },
  delivered: { label: 'Delivered', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
};

export type Tone = 'gold' | 'green' | 'blue' | 'red' | 'gray';

export const TONE_CLASS: Record<Tone, string> = {
  gold: 'bg-gold-light text-gold-dark',
  green: 'bg-leaf-light text-leaf-dark',
  blue: 'bg-[#E8EEF8] text-[#1E3A6B]',
  red: 'bg-maroon-light text-maroon-dark',
  gray: 'bg-[#EFEBE4] text-[#4A4238]',
};

/** Turn a Supabase/Postgres error into a short message for the user. */
export function errMsg(e: unknown) {
  if (!e) return 'Something went wrong. Try again.';
  if (typeof e === 'string') return e;
  const m = (e as { message?: string }).message;
  return m || 'Something went wrong. Try again.';
}
