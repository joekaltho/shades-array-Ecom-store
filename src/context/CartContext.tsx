import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore } from './StoreContext';
import { canPurchase, maxQuantity } from '../lib/availability';
import type { CartLine, Product } from '../types';

const KEY = 'sa_cart_v2';

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartValue {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

function read(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (l): l is CartLine => l && typeof l.productId === 'string' && Number.isInteger(l.qty) && l.qty > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, status } = useStore();
  const [lines, setLines] = useState<CartLine[]>(read);
  const [isOpen, setIsOpen] = useState(false);

  // The cart only stores ids + quantities; prices and stock always come from the live catalogue.
  const items = useMemo<CartItem[]>(() => {
    const out: CartItem[] = [];
    for (const l of lines) {
      const product = products.find((p) => p.id === l.productId);
      if (!product || !canPurchase(product)) continue;
      out.push({ product, qty: Math.min(l.qty, maxQuantity(product)) });
    }
    return out;
  }, [lines, products]);

  // Once the catalogue has loaded, drop anything that is no longer for sale.
  useEffect(() => {
    if (status !== 'ready') return;
    const valid = items.map((i) => ({ productId: i.product.id, qty: i.qty }));
    if (valid.length !== lines.length || valid.some((v, i) => v.qty !== lines[i].qty)) setLines(valid);
  }, [status, items, lines]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage full or blocked: the cart just won't persist */
    }
  }, [lines]);

  const add = useCallback((product: Product, qty = 1) => {
    const cap = maxQuantity(product);
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, qty: Math.min(l.qty + qty, cap) } : l));
      }
      return [...prev, { productId: product.id, qty: Math.min(qty, cap) }];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.qty * i.product.price, 0),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, isOpen, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
