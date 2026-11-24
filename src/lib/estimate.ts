'use client';

import { useSyncExternalStore } from 'react';

export interface EstimateLine {
  productId: string;
  sellerId: string;
  shopId: string;
  name: string;
  price: number;
  mrp: number;
  image: string | null;
  qty: number;
}

const KEY = 'crackers-estimate-v1';
const listeners = new Set<() => void>();
let cache: EstimateLine[] | null = null;
const EMPTY: EstimateLine[] = [];

function read(): EstimateLine[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    cache = [];
  }
  return cache!;
}

function write(lines: EstimateLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // storage full or blocked; keep in memory
  }
  listeners.forEach((l) => l());
}

export const estimate = {
  snapshot(): EstimateLine[] {
    return read();
  },
  add(line: Omit<EstimateLine, 'qty'>, qty = 1) {
    const lines = [...read()];
    const i = lines.findIndex((l) => l.productId === line.productId);
    if (i >= 0) lines[i] = { ...lines[i], ...line, qty: lines[i].qty + qty };
    else lines.push({ ...line, qty });
    write(lines);
  },
  setQty(productId: string, qty: number) {
    write(read().map((l) => (l.productId === productId ? { ...l, qty } : l)).filter((l) => l.qty > 0));
  },
  replace(lines: EstimateLine[]) {
    write(lines);
  },
  clear() {
    write([]);
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useEstimate() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

// ---------- Order type (bulk buyers choose bulk or regular) ----------
const TYPE_KEY = 'crackers-order-type';
const typeListeners = new Set<() => void>();

function readType(): 'retail' | 'bulk' {
  try {
    return localStorage.getItem(TYPE_KEY) === 'bulk' ? 'bulk' : 'retail';
  } catch {
    return 'retail';
  }
}

export function setOrderType(t: 'retail' | 'bulk') {
  try {
    localStorage.setItem(TYPE_KEY, t);
  } catch {
    // ignore
  }
  typeListeners.forEach((l) => l());
}

export function useOrderType() {
  return useSyncExternalStore(
    (cb) => {
      typeListeners.add(cb);
      return () => typeListeners.delete(cb);
    },
    readType,
    () => 'retail' as const,
  );
}
