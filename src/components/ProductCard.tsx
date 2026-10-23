import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { canPurchase, getAvailability } from '../lib/availability';
import { ProductImage } from './ProductImage';
import { Price } from './Price';
import type { Product } from '../types';

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const toast = useToast();
  const { categoryById } = useStore();
  const category = categoryById(product.categoryId);
  const availability = getAvailability(product);
  const soldOut = availability === 'out';
  const tag = soldOut ? 'Sold out' : availability === 'preorder' ? 'Pre-order' : product.badge;

  return (
    <article className="group flex flex-col border border-neutral-200 bg-white transition-shadow hover:shadow-lg hover:shadow-black/5">
      <Link to={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${soldOut ? 'opacity-60' : ''}`}
        />
        {product.images[1] && (
          <ProductImage
            src={product.images[1]}
            alt=""
            className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        {tag && (
          <span className="absolute left-3 top-3 bg-white px-2 py-1 text-[11px] font-semibold tracking-wide text-ink">
            {tag}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-5">
        {category && <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{category.name}</span>}
        <Link to={`/product/${product.slug}`} className="font-display text-2xl leading-tight hover:text-gold">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <Price product={product} />
          {canPurchase(product) && (
            <button
              type="button"
              onClick={() => {
                cart.add(product, 1);
                toast.success(`${product.name} added to your bag`, { label: 'View bag', onClick: cart.open });
              }}
              aria-label={`Add ${product.name} to bag`}
              className="inline-flex h-10 w-10 items-center justify-center border border-neutral-300 hover:border-ink hover:bg-ink hover:text-white"
            >
              <ShoppingBag className="h-[1.1rem] w-[1.1rem]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
