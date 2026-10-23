import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { requireApi } from '../lib/api';
import type {
  AdminData,
  AdminSession,
  Category,
  CategoryInput,
  Order,
  OrderInput,
  Product,
  ProductInput,
  Settings,
} from '../types';

/* ───────────── Auth ───────────── */

type AuthState = { status: 'loading' } | { status: 'out' } | { status: 'in'; session: AdminSession };

interface AuthValue {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = requireApi();
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const session = await api.getAdminSession();
      setState(session ? { status: 'in', session } : { status: 'out' });
    } catch {
      setState({ status: 'out' });
    }
  }, [api]);

  useEffect(() => {
    void refresh();
    // Deferred: calling back into the auth client from inside its own listener can deadlock.
    return api.onAuthChange(() => setTimeout(() => void refresh(), 0));
  }, [api, refresh]);

  const value = useMemo<AuthValue>(
    () => ({
      state,
      signIn: async (email, password) => {
        await api.signIn(email, password);
        await refresh();
      },
      signOut: async () => {
        await api.signOut();
        setState({ status: 'out' });
      },
    }),
    [api, refresh, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/* ───────────── Data ───────────── */

interface AdminDataValue {
  data: AdminData | null;
  error: string | null;
  reload: () => Promise<void>;
  saveProduct: (input: ProductInput) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  saveCategory: (input: CategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  saveOrder: (input: OrderInput) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<Settings>;
}

const AdminDataContext = createContext<AdminDataValue | null>(null);

function upsert<T extends { id: string }>(list: T[], item: T, atEnd = false): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : atEnd ? [...list, item] : [item, ...list];
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const api = requireApi();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await api.fetchAdmin());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your store data.');
    }
  }, [api]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<AdminDataValue>(() => {
    const patch = (fn: (d: AdminData) => AdminData) => setData((d) => (d ? fn(d) : d));
    return {
      data,
      error,
      reload,
      saveProduct: async (input) => {
        const saved = await api.saveProduct(input);
        patch((d) => ({ ...d, products: upsert(d.products, saved) }));
        return saved;
      },
      deleteProduct: async (id) => {
        await api.deleteProduct(id);
        patch((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));
      },
      saveCategory: async (input) => {
        const saved = await api.saveCategory(input);
        patch((d) => ({ ...d, categories: upsert(d.categories, saved, true).sort((a, b) => a.sortOrder - b.sortOrder) }));
        return saved;
      },
      deleteCategory: async (id) => {
        await api.deleteCategory(id);
        patch((d) => ({
          ...d,
          categories: d.categories.filter((c) => c.id !== id),
          products: d.products.map((p) => (p.categoryId === id ? { ...p, categoryId: null } : p)),
        }));
      },
      reorderCategories: async (orderedIds) => {
        const current = data?.categories ?? [];
        const changed = orderedIds
          .map((id, i) => ({ cat: current.find((c) => c.id === id), sortOrder: i + 1 }))
          .filter((x): x is { cat: Category; sortOrder: number } => Boolean(x.cat) && x.cat!.sortOrder !== x.sortOrder);
        const saved = await Promise.all(changed.map((x) => api.saveCategory({ ...x.cat, sortOrder: x.sortOrder })));
        patch((d) => ({
          ...d,
          categories: saved.reduce((list, c) => upsert(list, c, true), d.categories).sort((a, b) => a.sortOrder - b.sortOrder),
        }));
      },
      // Orders can change stock on the server, so re-read everything afterwards.
      saveOrder: async (input) => {
        const saved = await api.saveOrder(input);
        await reload();
        return saved;
      },
      deleteOrder: async (id) => {
        await api.deleteOrder(id);
        await reload();
      },
      saveSettings: async (settings) => {
        const saved = await api.saveSettings(settings);
        patch((d) => ({ ...d, settings: saved }));
        return saved;
      },
    };
  }, [api, data, error, reload]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataValue & { data: AdminData } {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used inside AdminDataProvider');
  // The layout only renders pages once data has loaded.
  return ctx as AdminDataValue & { data: AdminData };
}
