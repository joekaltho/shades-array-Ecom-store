import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronRight, Minus, Plus, MessageCircle, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../lib/hooks';
import { useWhatsAppCheckout } from '../lib/checkout';
import { availabilityLabel, canPurchase, getAvailability, maxQuantity } from '../lib/availability';
import { formatNaira } from '../lib/format';
import { whatsappLink } from '../lib/whatsapp';
import { Price } from '../components/Price';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';
import type { ProductSpecs } from '../types';

const SPEC_LABELS: [keyof ProductSpecs, string][] = [
  ['frame', 'Frame'],
  ['lens', 'Lens'],
  ['material', 'Material'],
  ['uv', 'UV protection'],
  ['size', 'Size'],
];

export default function ProductPage() {
  const { slug } = useParams();
  const { productBySlug, categoryById, products, settings } = useStore();
  const cart = useCart();
  const toast = useToast();
  const product = slug ? productBySlug(slug) : undefined;
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);

  useDocumentTitle(product?.name ?? 'Not found');
  useEffect(() => {
    setImageIndex(0);
    setQty(1);
  }, [product?.id]);

  const checkout = useWhatsAppCheckout(product && canPurchase(product) ? [{ product, qty }] : []);

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl">We couldn’t find that one</h1>
        <p className="text-sm text-neutral-600">It may have sold out or been removed.</p>
        <Link to="/shop" className="btn btn-primary">Back to the collection</Link>
      </div>
    );
  }

  const category = categoryById(product.categoryId);
  const availability = getAvailability(product);
  const purchasable = canPurchase(product);
  const cap = maxQuantity(product);
  const specs = SPEC_LABELS.map(([key, label]) => [label, product.specs[key]] as const).filter(([, v]) => v);
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  const related = products
    .filter((p) => p.id !== product.id && (category ? p.categoryId === category.id : true))
    .slice(0, 4);
  const stockClass =
    availability === 'out' ? 'text-red-700' : availability === 'low' ? 'text-amber-700' : 'text-emerald-700';

  return (
    <div className="container-wide py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-neutral-500">
        <Link to="/shop" className="hover:text-ink">Shop</Link>
        {category && (
          <>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <Link to={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <ProductImage src={product.images[imageIndex]} alt={product.name} eager className="aspect-[4/3] w-full" />
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImageIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === imageIndex}
                  className={`h-16 w-16 shrink-0 overflow-hidden border-2 ${i === imageIndex ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <ProductImage src={img} alt="" className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.badge && <span className="mb-3 inline-block bg-ink px-2 py-1 text-[11px] font-semibold tracking-wide text-gold-bright">{product.badge}</span>}
          <h1 className="font-display text-5xl leading-tight sm:text-6xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price product={product} large />
            {discount > 0 && <span className="bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Save {discount}%</span>}
          </div>
          <p className={`mt-2 flex items-center gap-1 text-sm font-medium ${stockClass}`}>
            <Check className="h-4 w-4" aria-hidden /> {availabilityLabel(product)}
          </p>

          {product.description && <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-neutral-600">{product.description}</p>}

          {specs.length > 0 && (
            <dl className="mt-6 divide-y divide-neutral-100 border-y border-neutral-100 text-sm">
              {specs.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 space-y-3">
            {purchasable ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">Quantity</span>
                  <div className="flex items-center border border-neutral-300">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="p-3 hover:bg-neutral-100">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-10 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(cap, q + 1))} disabled={qty >= cap} aria-label="Increase quantity" className="p-3 hover:bg-neutral-100 disabled:opacity-30">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    cart.add(product, qty);
                    toast.success(`${product.name} added to your bag`, { label: 'View bag', onClick: cart.open });
                  }}
                  className="btn btn-primary w-full py-4"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden /> Add to bag · {formatNaira(product.price * qty)}
                </button>
                <a href={checkout.href} target="_blank" rel="noopener noreferrer" onClick={checkout.record} className="btn btn-outline w-full py-4">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden /> Order this on WhatsApp
                </a>
              </>
            ) : (
              <a
                href={whatsappLink(settings.whatsapp, `Hi ${settings.brandName}! Will the ${product.name} be back in stock?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline w-full py-4"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden /> Ask when it’s back
              </a>
            )}
            {settings.deliveryNote && <p className="text-sm text-neutral-500">{settings.deliveryNote}</p>}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-4xl">You may also like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
