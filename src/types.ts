export type ProductStatus = 'draft' | 'active' | 'archived';
export type OrderStatus = 'new' | 'confirmed' | 'paid' | 'delivered' | 'cancelled';
export type OrderSource = 'website' | 'whatsapp' | 'instagram' | 'walk-in' | 'other';

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
}

export interface ProductSpecs {
  frame?: string;
  lens?: string;
  material?: string;
  uv?: string;
  size?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Whole naira. */
  price: number;
  compareAtPrice: number | null;
  categoryId: string | null;
  status: ProductStatus;
  featured: boolean;
  badge: string | null;
  stock: number;
  allowPreorder: boolean;
  sku: string | null;
  images: string[];
  specs: ProductSpecs;
  createdAt: string;
  updatedAt: string;
}

/** What the editor sends when saving; id is absent for a new product. */
export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type CategoryInput = Omit<Category, 'id'> & { id?: string };

export interface OrderItem {
  productId: string | null;
  name: string;
  price: number;
  qty: number;
  image: string | null;
  /** Set by the database when stock is taken for this order. */
  stockDeducted?: number;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  source: OrderSource;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  items: OrderItem[];
  total: number;
  stockApplied: boolean;
  createdAt: string;
  updatedAt: string;
}
export type OrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'stockApplied'> & { id?: string };

export interface Settings {
  brandName: string;
  tagline: string;
  /** Digits only, with country code, e.g. 2348012345678. */
  whatsapp: string;
  instagram: string;
  email: string;
  address: string;
  deliveryNote: string;
  announcement: { enabled: boolean; text: string };
  hero: { headline: string; subheadline: string; imageUrl: string };
  about: { title: string; body: string };
  footerBlurb: string;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface AdminSession {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export interface StorefrontData {
  categories: Category[];
  products: Product[];
  settings: Settings;
}

export interface AdminData {
  categories: Category[];
  products: Product[];
  orders: Order[];
  settings: Settings;
}
