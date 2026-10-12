import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cloudStorage } from '@tma.js/sdk-react';

import { type DeliveryKey, findProduct, priceFor } from '@/data/catalog.ts';

export interface CartLine {
  id: number;
  size: string;   // '' for one-size goods
  qty: number;
}

const KEY = 'cart';
const DELIVERY_KEY = 'delivery';
// the dev mock of the Telegram environment does not answer CloudStorage calls
const cloudAvailable = () => !import.meta.env.DEV && cloudStorage.isSupported();

/** Telegram CloudStorage keeps the cart across devices; outside Telegram fall back to localStorage. */
async function read(key: string): Promise<string | null> {
  try {
    return cloudAvailable() ? await cloudStorage.getItem(key) : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    if (cloudAvailable()) {
      void cloudStorage.setItem(key, value).catch(() => localStorage.setItem(key, value));
    } else {
      localStorage.setItem(key, value);
    }
  } catch { /* storage unavailable: the cart lives only in memory */ }
}

async function load(): Promise<{ lines: CartLine[]; delivery: DeliveryKey }> {
  const [lines, delivery] = await Promise.all([read(KEY), read(DELIVERY_KEY)]);
  let parsed: CartLine[] = [];
  try {
    parsed = (JSON.parse(lines || '[]') as CartLine[])
      .filter((l) => { const p = findProduct(l.id); return p && l.qty > 0 && (!p.sizes.length || p.sizes.some((s) => s.size === l.size)); });
  } catch { /* broken value: start with an empty cart */ }
  return { lines: parsed, delivery: delivery === 'express' ? 'express' : 'regular' };
}

interface CartApi {
  lines: CartLine[];
  count: number;
  goods: number;          // items with regular delivery included
  expressExtra: number;   // surcharge for the whole cart if express is chosen
  total: number;
  delivery: DeliveryKey;
  setDelivery: (d: DeliveryKey) => void;
  has: (id: number, size: string) => boolean;
  add: (id: number, size: string) => void;
  setQty: (id: number, size: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [delivery, setDelivery] = useState<DeliveryKey>('regular');
  const loaded = useRef(false);

  useEffect(() => {
    void load().then((saved) => {
      setLines((cur) => (cur.length ? cur : saved.lines));   // do not overwrite items added while loading
      setDelivery(saved.delivery);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (loaded.current) write(KEY, JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    if (loaded.current) write(DELIVERY_KEY, delivery);
  }, [delivery]);

  const api = useMemo<CartApi>(() => {
    const same = (l: CartLine, id: number, size: string) => l.id === id && l.size === size;
    const goods = lines.reduce((s, l) => s + l.qty * priceFor(findProduct(l.id)!, l.size), 0);
    const expressExtra = lines.reduce((s, l) => s + l.qty * findProduct(l.id)!.expressExtra, 0);
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      goods,
      expressExtra,
      total: goods + (delivery === 'express' ? expressExtra : 0),
      delivery,
      setDelivery,
      has: (id, size) => lines.some((l) => same(l, id, size)),
      add: (id, size) => setLines((cur) => (cur.some((l) => same(l, id, size))
        ? cur.map((l) => (same(l, id, size) ? { ...l, qty: l.qty + 1 } : l))
        : [...cur, { id, size, qty: 1 }])),
      setQty: (id, size, qty) => setLines((cur) => (qty <= 0
        ? cur.filter((l) => !same(l, id, size))
        : cur.map((l) => (same(l, id, size) ? { ...l, qty } : l)))),
      clear: () => setLines([]),
    };
  }, [lines, delivery]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const api = useContext(CartContext);
  if (!api) throw new Error('useCart outside CartProvider');
  return api;
}
