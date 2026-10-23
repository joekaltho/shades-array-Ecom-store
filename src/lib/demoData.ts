// Sample content used ONLY by the dev-mode stand-in backend (`npm run dev` with no
// Supabase env vars). It is not bundled into production builds.
import type { Category, Order, Product, Settings } from '../types';
import { DEFAULT_SETTINGS } from './settings';

export function createDemoData(): { categories: Category[]; products: Product[]; orders: Order[]; settings: Settings } {
const now = Date.now();
const ago = (hours: number) => new Date(now - hours * 3_600_000).toISOString();

const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-classic', slug: 'classic', name: 'Classic', tagline: 'Timeless shapes that never date.', description: '', imageUrl: '/images/classic.jpg', sortOrder: 1 },
  { id: 'cat-bold', slug: 'bold', name: 'Bold', tagline: 'Thick frames with real presence.', description: '', imageUrl: '/images/bold.jpg', sortOrder: 2 },
  { id: 'cat-everyday', slug: 'everyday', name: 'Everyday', tagline: 'Light, simple and easy to live in.', description: '', imageUrl: '/images/hero.jpg', sortOrder: 3 },
  { id: 'cat-statement', slug: 'statement', name: 'Statement', tagline: 'Oversized and visor styles.', description: '', imageUrl: '/images/statement.jpg', sortOrder: 4 },
];

const base = { compareAtPrice: null, allowPreorder: false, sku: null, createdAt: ago(240), updatedAt: ago(240) };

const DEMO_PRODUCTS: Product[] = [
  { ...base, id: 'p-vanguard', slug: 'vanguard-noir', name: 'Vanguard Noir', description: 'Thick black frame with gold-tone hinges and dark polarised lenses.', price: 38000, categoryId: 'cat-bold', status: 'active', featured: true, badge: null, stock: 14, images: ['/images/hero.jpg'], specs: { frame: 'Black / gold', lens: 'Smoke grey', uv: 'UV400' } },
  { ...base, id: 'p-aureate', slug: 'aureate-aviator', name: 'Aureate Aviator', description: 'Slim metal aviator with a double brow bar and amber gradient lenses.', price: 45000, compareAtPrice: 52000, categoryId: 'cat-classic', status: 'active', featured: true, badge: null, stock: 8, images: ['/images/classic.jpg'], specs: { frame: 'Gold', lens: 'Amber gradient', uv: 'UV400' } },
  { ...base, id: 'p-mirage', slug: 'mirage-visor', name: 'Mirage Visor', description: 'One-piece wraparound shield with rose-gold arms and mirrored pink lenses.', price: 58000, categoryId: 'cat-statement', status: 'active', featured: true, badge: 'Limited', stock: 2, images: ['/images/statement.jpg'], specs: { frame: 'Rose gold', lens: 'Pink mirror', uv: 'UV400' } },
  { ...base, id: 'p-kano', slug: 'kano-hex', name: 'Kano Hex', description: 'Hexagonal lenses in a thin brass-tone frame.', price: 42000, categoryId: 'cat-bold', status: 'active', featured: false, badge: null, stock: 0, allowPreorder: true, images: ['/images/bold.jpg'], specs: { frame: 'Brass / black', lens: 'G-15 green', uv: 'UV400' } },
  { ...base, id: 'p-draft', slug: 'solaris-oval', name: 'Solaris Oval', description: '', price: 28000, categoryId: 'cat-everyday', status: 'draft', featured: false, badge: null, stock: 0, images: [], specs: {} },
];

const item = (p: Product, qty: number) => ({ productId: p.id, name: p.name, price: p.price, qty, image: p.images[0] ?? null });
const [vanguard, aureate, mirage] = DEMO_PRODUCTS;

const DEMO_ORDERS: Order[] = [
  { id: 'o-1', number: 'K7Q2M9', status: 'new', source: 'website', customerName: '', customerPhone: '', deliveryAddress: '', notes: '', items: [item(aureate, 1), item(vanguard, 1)], total: 83000, stockApplied: false, createdAt: ago(1), updatedAt: ago(1) },
  { id: 'o-2', number: 'XB4TN8', status: 'paid', source: 'instagram', customerName: 'Amaka Obi', customerPhone: '2348012345678', deliveryAddress: 'Lekki Phase 1, Lagos', notes: 'Deliver after 4pm', items: [item(mirage, 1)], total: 58000, stockApplied: false, createdAt: ago(30), updatedAt: ago(20) },
  { id: 'o-3', number: 'D9HW3A', status: 'delivered', source: 'whatsapp', customerName: 'Tunde A.', customerPhone: '2348098765432', deliveryAddress: 'Wuse 2, Abuja', notes: '', items: [item(vanguard, 2)], total: 76000, stockApplied: false, createdAt: ago(120), updatedAt: ago(96) },
];

const DEMO_SETTINGS: Settings = { ...DEFAULT_SETTINGS, deliveryNote: 'Delivery is arranged on WhatsApp after you order.' };

return { categories: DEMO_CATEGORIES, products: DEMO_PRODUCTS, orders: DEMO_ORDERS, settings: DEMO_SETTINGS };
}
