// Dev-only stand-in so `npm run dev` works with zero setup. Data lives in this
// browser's localStorage. It is removed from production builds (see api.ts).
import { prepareImage } from './image';
import { createDemoData } from './demoData';
import type { Backend } from './backend';
import type { AdminData, Order, OrderItem } from '../types';

const KEY = 'sa_dev_db_v2';
const SESSION_KEY = 'sa_dev_signed_in';

export function createLocalBackend(): Backend {
function load(): AdminData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AdminData;
  } catch {
    /* ignore */
  }
  return createDemoData();
}

let db = load();
const listeners = new Set<() => void>();
const persist = () => localStorage.setItem(KEY, JSON.stringify(db));
const uid = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();
const wait = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 120));
const APPLIED = ['confirmed', 'paid', 'delivered'];

/** Mirrors the stock trigger in supabase/migrations/0001_init.sql. */
function syncStock(prev: Order | undefined, next: Order): Order {
  const should = APPLIED.includes(next.status);
  const applied = prev?.stockApplied ?? false;
  if (prev && applied && should && JSON.stringify(prev.items) !== JSON.stringify(next.items)) {
    throw new Error('Reopen the order (set it back to New) before changing its items.');
  }
  if (should && !applied) {
    const items: OrderItem[] = [];
    const taken: { id: string; qty: number }[] = [];
    for (const it of next.items) {
      const p = db.products.find((x) => x.id === it.productId);
      let took = 0;
      if (p) {
        if (p.stock >= it.qty) {
          took = it.qty;
          taken.push({ id: p.id, qty: it.qty });
        } else if (!p.allowPreorder) {
          throw new Error(`Not enough stock for "${it.name}" (${p.stock} left, order needs ${it.qty}).`);
        }
      }
      items.push({ ...it, stockDeducted: took });
    }
    taken.forEach((t) => {
      const p = db.products.find((x) => x.id === t.id);
      if (p) p.stock -= t.qty;
    });
    return { ...next, items, stockApplied: true };
  }
  if (!should && applied) {
    next.items.forEach((it) => {
      const p = db.products.find((x) => x.id === it.productId);
      if (p && it.stockDeducted) p.stock += it.stockDeducted;
    });
    return { ...next, items: next.items.map((i) => ({ ...i, stockDeducted: 0 })), stockApplied: false };
  }
  return next;
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read image.'));
    r.readAsDataURL(blob);
  });
}

const backend: Backend = {
  mode: 'local',

  fetchStorefront: () =>
    wait({
      categories: [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder),
      products: db.products.filter((p) => p.status === 'active'),
      settings: db.settings,
    }),

  async recordWebsiteOrder(ref, lines) {
    const items: OrderItem[] = [];
    for (const l of lines) {
      const p = db.products.find((x) => x.id === l.productId && x.status === 'active');
      if (p) items.push({ productId: p.id, name: p.name, price: p.price, qty: l.qty, image: p.images[0] ?? null });
    }
    if (!items.length) return;
    db.orders.unshift({
      id: uid(), number: ref, status: 'new', source: 'website', customerName: '', customerPhone: '',
      deliveryAddress: '', notes: '', items, total: items.reduce((s, i) => s + i.price * i.qty, 0),
      stockApplied: false, createdAt: nowIso(), updatedAt: nowIso(),
    });
    persist();
  },

  getAdminSession: () =>
    wait(localStorage.getItem(SESSION_KEY) ? { userId: 'dev', email: 'dev@localhost', isAdmin: true } : null),
  async signIn() {
    localStorage.setItem(SESSION_KEY, '1');
    listeners.forEach((l) => l());
  },
  async signOut() {
    localStorage.removeItem(SESSION_KEY);
    listeners.forEach((l) => l());
  },
  async updatePassword() {},
  onAuthChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  fetchAdmin: () => wait(db),

  async saveProduct(input) {
    const existing = input.id ? db.products.find((p) => p.id === input.id) : undefined;
    if (db.products.some((p) => p.slug === input.slug && p.id !== input.id)) {
      throw new Error('Another item already uses that URL name. Change it and try again.');
    }
    const saved = { ...input, id: existing?.id ?? uid(), createdAt: existing?.createdAt ?? nowIso(), updatedAt: nowIso() };
    db.products = existing ? db.products.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...db.products];
    persist();
    return wait(saved);
  },
  async deleteProduct(id) {
    db.products = db.products.filter((p) => p.id !== id);
    persist();
  },

  async saveCategory(input) {
    if (db.categories.some((c) => c.slug === input.slug && c.id !== input.id)) {
      throw new Error('Another item already uses that URL name. Change it and try again.');
    }
    const saved = { ...input, id: input.id ?? uid() };
    db.categories = input.id ? db.categories.map((c) => (c.id === saved.id ? saved : c)) : [...db.categories, saved];
    persist();
    return wait(saved);
  },
  async deleteCategory(id) {
    db.categories = db.categories.filter((c) => c.id !== id);
    db.products = db.products.map((p) => (p.categoryId === id ? { ...p, categoryId: null } : p));
    persist();
  },

  async saveOrder(input) {
    const prev = input.id ? db.orders.find((o) => o.id === input.id) : undefined;
    if (db.orders.some((o) => o.number === input.number && o.id !== input.id)) throw new Error('That order number already exists.');
    const draft: Order = {
      ...input,
      id: prev?.id ?? uid(),
      total: input.items.reduce((s, i) => s + i.price * i.qty, 0),
      stockApplied: prev?.stockApplied ?? false,
      createdAt: prev?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    };
    const saved = syncStock(prev, draft);
    db.orders = prev ? db.orders.map((o) => (o.id === saved.id ? saved : o)) : [saved, ...db.orders];
    persist();
    return wait(saved);
  },
  async deleteOrder(id) {
    db.orders = db.orders.filter((o) => o.id !== id);
    persist();
  },

  async saveSettings(settings) {
    db.settings = settings;
    persist();
    return wait(settings);
  },

  async uploadImage(file) {
    const { blob } = await prepareImage(file, 1200, 0.8);
    return toDataUrl(blob);
  },
  async deleteImages() {},
};

  return backend;
}
