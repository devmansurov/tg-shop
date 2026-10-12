import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cloudStorage } from '@tma.js/sdk-react';

import { findProduct } from '@/data/catalog.ts';

export interface CartLine {
  id: number;
  size: string;   // '' for one-size goods
  qty: number;
}

const KEY = 'cart';
// the dev mock of the Telegram environment does not answer CloudStorage calls
const cloudAvailable = () => !import.meta.env.DEV && cloudStorage.isSupported();

/** Telegram CloudStorage keeps the cart across devices; outside Telegram fall back to localStorage. */
async function load(): Promise<CartLine[]> {
  try {
    const value = cloudAvailable() ? await cloudStorage.getItem(KEY) : localStorage.getItem(KEY);
    const lines = JSON.parse(value || '[]') as CartLine[];
    return lines.filter((l) => findProduct(l.id) && l.qty > 0);
  } catch {
    return [];
  }
}

function save(lines: CartLine[]) {
  const value = JSON.stringify(lines);
  try {
    if (cloudAvailable()) {
      void cloudStorage.setItem(KEY, value).catch(() => localStorage.setItem(KEY, value));
    } else {
      localStorage.setItem(KEY, value);
    }
  } catch { /* storage unavailable: the cart lives only in memory */ }
}

interface CartApi {
  lines: CartLine[];
  count: number;
  total: number;
  has: (id: number, size: string) => boolean;
  add: (id: number, size: string) => void;
  setQty: (id: number, size: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    void load().then((l) => {
      setLines((cur) => (cur.length ? cur : l));   // do not overwrite items added while loading
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (loaded.current) save(lines);
  }, [lines]);

  const api = useMemo<CartApi>(() => {
    const same = (l: CartLine, id: number, size: string) => l.id === id && l.size === size;
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * (findProduct(l.id)?.price ?? 0), 0),
      has: (id, size) => lines.some((l) => same(l, id, size)),
      add: (id, size) => setLines((cur) => (cur.some((l) => same(l, id, size))
        ? cur.map((l) => (same(l, id, size) ? { ...l, qty: l.qty + 1 } : l))
        : [...cur, { id, size, qty: 1 }])),
      setQty: (id, size, qty) => setLines((cur) => (qty <= 0
        ? cur.filter((l) => !same(l, id, size))
        : cur.map((l) => (same(l, id, size) ? { ...l, qty } : l)))),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const api = useContext(CartContext);
  if (!api) throw new Error('useCart outside CartProvider');
  return api;
}
