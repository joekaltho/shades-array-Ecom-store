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
  StorefrontData,
} from '../types';

export type ImageFolder = 'products' | 'categories' | 'site';

/** Everything the app needs from a server. Implemented for Supabase (production) and an in-browser stand-in (dev only). */
export interface Backend {
  mode: 'supabase' | 'local';

  // Public storefront
  fetchStorefront(): Promise<StorefrontData>;
  /** Fire-and-forget record of a WhatsApp checkout. Prices are re-read on the server. */
  recordWebsiteOrder(ref: string, lines: { productId: string; qty: number }[]): Promise<void>;

  // Admin auth
  getAdminSession(): Promise<AdminSession | null>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  updatePassword(password: string): Promise<void>;
  onAuthChange(cb: () => void): () => void;

  // Admin data
  fetchAdmin(): Promise<AdminData>;
  saveProduct(input: ProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  saveCategory(input: CategoryInput): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  saveOrder(input: OrderInput): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  saveSettings(settings: Settings): Promise<Settings>;
  uploadImage(file: File, folder: ImageFolder): Promise<string>;
  deleteImages(urls: string[]): Promise<void>;
}
