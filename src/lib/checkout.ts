import { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { api } from './api';
import { makeOrderRef } from './format';
import { buildOrderMessage, whatsappLink } from './whatsapp';
import type { Product } from '../types';

export interface CheckoutLine {
  product: Product;
  qty: number;
}

/**
 * One-tap WhatsApp checkout. The link is an ordinary anchor (so mobile browsers never block it)
 * and the order is recorded in the background under the same short reference that appears in the
 * message. The reference only changes when the contents change, so re-tapping never duplicates it.
 */
export function useWhatsAppCheckout(lines: CheckoutLine[]) {
  const { settings } = useStore();
  const signature = lines.map((l) => `${l.product.id}:${l.qty}`).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ref = useMemo(() => makeOrderRef(), [signature]);

  const href = whatsappLink(
    settings.whatsapp,
    buildOrderMessage(
      settings.brandName,
      lines.map((l) => ({ name: l.product.name, price: l.product.price, qty: l.qty })),
      ref,
    ),
  );

  const record = () => {
    if (!api || lines.length === 0) return;
    api.recordWebsiteOrder(ref, lines.map((l) => ({ productId: l.product.id, qty: l.qty }))).catch(() => {
      /* The customer still reaches WhatsApp; the ref in the message lets you add it by hand. */
    });
  };

  return { href, record, ref };
}
