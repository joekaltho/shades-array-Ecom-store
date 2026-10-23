import type { Product } from '../types';

export const LOW_STOCK_THRESHOLD = 3;

export type Availability = 'in_stock' | 'low' | 'out' | 'preorder';

type StockInfo = Pick<Product, 'stock' | 'allowPreorder'>;

export function getAvailability(p: StockInfo): Availability {
  if (p.stock > 0) return p.stock <= LOW_STOCK_THRESHOLD ? 'low' : 'in_stock';
  return p.allowPreorder ? 'preorder' : 'out';
}

export function canPurchase(p: StockInfo): boolean {
  return p.stock > 0 || p.allowPreorder;
}

/** Most of this product one person can put in a bag. */
export function maxQuantity(p: StockInfo): number {
  if (p.stock > 0) return p.stock;
  return p.allowPreorder ? 10 : 0;
}

export function availabilityLabel(p: StockInfo): string {
  switch (getAvailability(p)) {
    case 'in_stock':
      return 'In stock';
    case 'low':
      return `Only ${p.stock} left`;
    case 'preorder':
      return 'Pre-order';
    default:
      return 'Sold out';
  }
}
