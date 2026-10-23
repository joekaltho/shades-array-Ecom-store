import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { DEFAULT_SETTINGS } from '../lib/settings';
import type { Category, Product, Settings } from '../types';

type Status = 'loading' | 'ready' | 'error' | 'unconfigured';

interface StoreValue {
  status: Status;
  error: string | null;
  categories: Category[];
  products: Product[];
  settings: Settings;
  reload: () => void;
  productBySlug: (slug: string) => Product | undefined;
  categoryById: (id: string | null) => Category | undefined;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(api ? 'loading' : 'unconfigured');
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    api
      .fetchStorefront()
      .then((data) => {
        if (cancelled) return;
        setCategories(data.categories);
        setProducts(data.products);
        setSettings(data.settings);
        setError(null);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load the store.');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const value = useMemo<StoreValue>(
    () => ({
      status,
      error,
      categories,
      products,
      settings,
      reload,
      productBySlug: (slug) => products.find((p) => p.slug === slug),
      categoryById: (id) => (id ? categories.find((c) => c.id === id) : undefined),
    }),
    [status, error, categories, products, settings, reload],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
