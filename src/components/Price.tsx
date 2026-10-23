import { formatNaira } from '../lib/format';
import type { Product } from '../types';

export function Price({ product, large }: { product: Pick<Product, 'price' | 'compareAtPrice'>; large?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`font-semibold ${large ? 'text-3xl' : 'text-base'}`}>{formatNaira(product.price)}</span>
      {product.compareAtPrice && (
        <span className={`text-neutral-400 line-through ${large ? 'text-lg' : 'text-sm'}`}>
          {formatNaira(product.compareAtPrice)}
        </span>
      )}
    </span>
  );
}
