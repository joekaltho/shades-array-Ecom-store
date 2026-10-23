import { IMAGE_BUCKET, supabase } from './supabase';
import { prepareImage } from './image';
import { mergeSettings } from './settings';
import type { Backend } from './backend';
import type {
  Category,
  Order,
  OrderItem,
  OrderSource,
  OrderStatus,
  Product,
  ProductSpecs,
  ProductStatus,
} from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function client() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function fail(error: { message: string; code?: string } | null, fallback = 'Something went wrong.'): never {
  if (error?.code === '23505') {
    if (error.message.includes('slug')) throw new Error('Another item already uses that URL name. Change it and try again.');
    if (error.message.includes('number')) throw new Error('That order number already exists.');
    throw new Error('That already exists.');
  }
  if (error?.code === '42501') throw new Error("You don't have permission to do that. Sign in with an admin account.");
  throw new Error(error?.message || fallback);
}

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const text = (v: unknown) => (typeof v === 'string' ? v : '');

function toCategory(r: Row): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline ?? '',
    description: r.description ?? '',
    imageUrl: r.image_url ?? null,
    sortOrder: num(r.sort_order),
  };
}

function toProduct(r: Row): Product {
  const specs: ProductSpecs = r.specs && typeof r.specs === 'object' && !Array.isArray(r.specs) ? r.specs : {};
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? '',
    price: num(r.price),
    compareAtPrice: r.compare_at_price ?? null,
    categoryId: r.category_id ?? null,
    status: r.status as ProductStatus,
    featured: Boolean(r.featured),
    badge: r.badge ?? null,
    stock: num(r.stock),
    allowPreorder: Boolean(r.allow_preorder),
    sku: r.sku ?? null,
    images: Array.isArray(r.images) ? r.images : [],
    specs,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toOrder(r: Row): Order {
  const items: OrderItem[] = (Array.isArray(r.items) ? r.items : []).map((i: Row) => ({
    productId: i.productId ?? null,
    name: text(i.name),
    price: num(i.price),
    qty: num(i.qty, 1),
    image: i.image ?? null,
    ...(typeof i.stockDeducted === 'number' ? { stockDeducted: i.stockDeducted } : {}),
  }));
  return {
    id: r.id,
    number: r.number,
    status: r.status as OrderStatus,
    source: r.source as OrderSource,
    customerName: r.customer_name ?? '',
    customerPhone: r.customer_phone ?? '',
    deliveryAddress: r.delivery_address ?? '',
    notes: r.notes ?? '',
    items,
    total: num(r.total),
    stockApplied: Boolean(r.stock_applied),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const PUBLIC_PREFIX = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
function storagePath(url: string): string | null {
  const i = url.indexOf(PUBLIC_PREFIX);
  return i === -1 ? null : decodeURIComponent(url.slice(i + PUBLIC_PREFIX.length).split('?')[0]);
}

export const supabaseBackend: Backend = {
  mode: 'supabase',

  async fetchStorefront() {
    const sb = client();
    const [cats, prods, sets] = await Promise.all([
      sb.from('categories').select('*').order('sort_order').order('name'),
      sb.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      sb.from('settings').select('data').eq('id', 1).maybeSingle(),
    ]);
    if (cats.error) fail(cats.error);
    if (prods.error) fail(prods.error);
    return {
      categories: (cats.data ?? []).map(toCategory),
      products: (prods.data ?? []).map(toProduct),
      settings: mergeSettings(sets.data?.data),
    };
  },

  async recordWebsiteOrder(ref, lines) {
    const { error } = await client().rpc('create_website_order', { p_ref: ref, p_items: lines });
    if (error) throw new Error(error.message);
  },

  async getAdminSession() {
    const sb = client();
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const { data: row } = await sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    return { userId: user.id, email: user.email ?? '', isAdmin: Boolean(row) };
  },

  async signIn(email, password) {
    const { error } = await client().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (/invalid login/i.test(error.message)) throw new Error('Wrong email or password.');
      throw new Error(error.message);
    }
  },

  async signOut() {
    await client().auth.signOut();
  },

  async updatePassword(password) {
    const { error } = await client().auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  onAuthChange(cb) {
    const { data } = client().auth.onAuthStateChange(() => cb());
    return () => data.subscription.unsubscribe();
  },

  async fetchAdmin() {
    const sb = client();
    const [cats, prods, orders, sets] = await Promise.all([
      sb.from('categories').select('*').order('sort_order').order('name'),
      sb.from('products').select('*').order('created_at', { ascending: false }),
      sb.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
      sb.from('settings').select('data').eq('id', 1).maybeSingle(),
    ]);
    if (cats.error) fail(cats.error);
    if (prods.error) fail(prods.error);
    if (orders.error) fail(orders.error);
    return {
      categories: (cats.data ?? []).map(toCategory),
      products: (prods.data ?? []).map(toProduct),
      orders: (orders.data ?? []).map(toOrder),
      settings: mergeSettings(sets.data?.data),
    };
  },

  async saveProduct(input) {
    const sb = client();
    const row = {
      slug: input.slug,
      name: input.name.trim(),
      description: input.description,
      price: input.price,
      compare_at_price: input.compareAtPrice,
      category_id: input.categoryId,
      status: input.status,
      featured: input.featured,
      badge: input.badge?.trim() || null,
      stock: input.stock,
      allow_preorder: input.allowPreorder,
      sku: input.sku?.trim() || null,
      images: input.images,
      specs: input.specs,
    };
    const q = input.id ? sb.from('products').update(row).eq('id', input.id) : sb.from('products').insert(row);
    const { data, error } = await q.select().single();
    if (error) fail(error);
    return toProduct(data);
  },

  async deleteProduct(id) {
    const { error } = await client().from('products').delete().eq('id', id);
    if (error) fail(error);
  },

  async saveCategory(input) {
    const sb = client();
    const row = {
      slug: input.slug,
      name: input.name.trim(),
      tagline: input.tagline,
      description: input.description,
      image_url: input.imageUrl,
      sort_order: input.sortOrder,
    };
    const q = input.id ? sb.from('categories').update(row).eq('id', input.id) : sb.from('categories').insert(row);
    const { data, error } = await q.select().single();
    if (error) fail(error);
    return toCategory(data);
  },

  async deleteCategory(id) {
    const { error } = await client().from('categories').delete().eq('id', id);
    if (error) fail(error);
  },

  async saveOrder(input) {
    const sb = client();
    const row = {
      number: input.number,
      status: input.status,
      source: input.source,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      delivery_address: input.deliveryAddress,
      notes: input.notes,
      items: input.items,
      total: input.items.reduce((s, i) => s + i.price * i.qty, 0),
    };
    const q = input.id ? sb.from('orders').update(row).eq('id', input.id) : sb.from('orders').insert(row);
    const { data, error } = await q.select().single();
    if (error) fail(error);
    return toOrder(data);
  },

  async deleteOrder(id) {
    const { error } = await client().from('orders').delete().eq('id', id);
    if (error) fail(error);
  },

  async saveSettings(settings) {
    const { data, error } = await client()
      .from('settings')
      .upsert({ id: 1, data: settings })
      .select('data')
      .single();
    if (error) fail(error);
    return mergeSettings(data.data);
  },

  async uploadImage(file, folder) {
    const sb = client();
    const { blob, ext } = await prepareImage(file);
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage
      .from(IMAGE_BUCKET)
      .upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
    if (error) fail(error, 'Upload failed.');
    return sb.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async deleteImages(urls) {
    const paths = urls.map(storagePath).filter((p): p is string => Boolean(p));
    if (paths.length === 0) return;
    await client().storage.from(IMAGE_BUCKET).remove(paths);
  },
};
