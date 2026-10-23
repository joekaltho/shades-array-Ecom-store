import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, MessageCircle } from 'lucide-react';
import { Overlay } from './Overlay';
import { ProductImage } from './ProductImage';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { maxQuantity } from '../lib/availability';
import { formatNaira } from '../lib/format';
import { useWhatsAppCheckout } from '../lib/checkout';

export function CartDrawer() {
  const cart = useCart();
  const { settings } = useStore();
  const checkout = useWhatsAppCheckout(cart.items);

  return (
    <Overlay open={cart.isOpen} onClose={cart.close} title="Shopping bag">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-6 py-5">
        <ShoppingBag className="h-5 w-5" aria-hidden />
        <h2 className="font-display text-2xl">Your bag</h2>
        {cart.count > 0 && <span className="text-sm text-neutral-500">({cart.count})</span>}
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-sm text-neutral-600">Your bag is empty.</p>
          <Link to="/shop" onClick={cart.close} className="btn btn-primary">
            Browse the collection
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-6">
            {cart.items.map(({ product, qty }) => (
              <li key={product.id} className="flex gap-4 py-4">
                <ProductImage src={product.images[0]} alt={product.name} className="h-20 w-20 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/product/${product.slug}`} onClick={cart.close} className="font-display text-lg leading-tight hover:text-gold">
                      {product.name}
                    </Link>
                    <button
                      onClick={() => cart.remove(product.id)}
                      aria-label={`Remove ${product.name}`}
                      className="p-1 text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center border border-neutral-300">
                      <button
                        onClick={() => cart.setQty(product.id, qty - 1)}
                        aria-label="Decrease quantity"
                        className="p-2 hover:bg-neutral-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
                      <button
                        onClick={() => cart.setQty(product.id, qty + 1)}
                        disabled={qty >= maxQuantity(product)}
                        aria-label="Increase quantity"
                        className="p-2 hover:bg-neutral-100 disabled:opacity-30"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold">{formatNaira(product.price * qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-4 border-t border-neutral-200 px-6 py-5">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatNaira(cart.total)}</span>
            </div>
            {settings.deliveryNote && <p className="text-xs text-neutral-500">{settings.deliveryNote}</p>}
            <a
              href={checkout.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={checkout.record}
              className="btn btn-primary w-full"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
              Order on WhatsApp
            </a>
            <p className="text-center text-xs text-neutral-500">
              Your bag opens as a message to us. Order ref <span className="font-semibold text-ink">{checkout.ref}</span>.
            </p>
            <button onClick={cart.clear} className="mx-auto block text-xs text-neutral-500 underline hover:text-ink">
              Clear bag
            </button>
          </div>
        </>
      )}
    </Overlay>
  );
}
