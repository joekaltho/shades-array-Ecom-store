import { slugify } from '../lib/format';
import type { Product, ProductInput, ProductSpecs, ProductStatus } from '../types';

export interface ProductDraft {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  allowPreorder: boolean;
  status: ProductStatus;
  featured: boolean;
  badge: string;
  images: string[];
  frame: string;
  lens: string;
  material: string;
  uv: string;
  size: string;
}

export type ProductErrors = Partial<Record<keyof ProductDraft, string>>;

export function toDraft(p?: Product): ProductDraft {
  return {
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    description: p?.description ?? '',
    categoryId: p?.categoryId ?? '',
    price: p ? String(p.price) : '',
    compareAtPrice: p?.compareAtPrice ? String(p.compareAtPrice) : '',
    stock: p ? String(p.stock) : '1',
    sku: p?.sku ?? '',
    allowPreorder: p?.allowPreorder ?? false,
    status: p?.status ?? 'draft',
    featured: p?.featured ?? false,
    badge: p?.badge ?? '',
    images: p?.images ?? [],
    frame: p?.specs.frame ?? '',
    lens: p?.specs.lens ?? '',
    material: p?.specs.material ?? '',
    uv: p?.specs.uv ?? '',
    size: p?.specs.size ?? '',
  };
}

/** Accepts "38000" and "38,000". Returns NaN for anything else. */
export function parseWholeNumber(input: string): number {
  const cleaned = input.replace(/[,\s₦]/g, '');
  return /^\d+$/.test(cleaned) ? Number(cleaned) : NaN;
}

export function validateProduct(d: ProductDraft): ProductErrors {
  const e: ProductErrors = {};
  if (!d.name.trim()) e.name = 'Give the product a name.';
  if (!d.slug) e.slug = 'A URL name is required.';
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) e.slug = 'Use lowercase letters, numbers and single dashes only.';

  const price = parseWholeNumber(d.price);
  if (!d.price.trim() || Number.isNaN(price) || price < 1) e.price = 'Enter a price in naira, e.g. 38000.';

  if (d.compareAtPrice.trim()) {
    const compare = parseWholeNumber(d.compareAtPrice);
    if (Number.isNaN(compare)) e.compareAtPrice = 'Enter a whole number or leave it empty.';
    else if (!Number.isNaN(price) && compare <= price) e.compareAtPrice = 'The old price must be higher than the price.';
  }

  const stock = parseWholeNumber(d.stock);
  if (d.stock.trim() === '' || Number.isNaN(stock)) e.stock = 'Enter how many you have (0 if none).';

  if (d.status === 'active' && d.images.length === 0) e.images = 'Add at least one photo before making this live.';
  return e;
}

export function toInput(d: ProductDraft, id?: string): ProductInput {
  const specs: ProductSpecs = {};
  (['frame', 'lens', 'material', 'uv', 'size'] as const).forEach((k) => {
    const v = d[k].trim();
    if (v) specs[k] = v;
  });
  return {
    id,
    name: d.name.trim(),
    slug: d.slug,
    description: d.description.trim(),
    categoryId: d.categoryId || null,
    price: parseWholeNumber(d.price),
    compareAtPrice: d.compareAtPrice.trim() ? parseWholeNumber(d.compareAtPrice) : null,
    stock: parseWholeNumber(d.stock),
    sku: d.sku.trim() || null,
    allowPreorder: d.allowPreorder,
    status: d.status,
    featured: d.featured,
    badge: d.badge.trim() || null,
    images: d.images,
    specs,
  };
}

export function productToInput(p: Product): ProductInput {
  const { createdAt: _c, updatedAt: _u, ...rest } = p;
  void _c;
  void _u;
  return rest;
}

export { slugify };
