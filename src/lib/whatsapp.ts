import { formatNaira } from './format';

export interface MessageLine {
  name: string;
  price: number;
  qty: number;
}

export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, '');
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

export function buildOrderMessage(brand: string, lines: MessageLine[], ref?: string): string {
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const parts = [
    `Hi ${brand}! I'd like to place an order:`,
    '',
    ...lines.map((l) => `• ${l.name} — ${formatNaira(l.price)} × ${l.qty}`),
    '',
    `Total: ${formatNaira(total)}`,
  ];
  if (ref) parts.push(`Order ref: ${ref}`);
  parts.push('', 'Please let me know how I can complete the order.');
  return parts.join('\n');
}

export function buildGeneralMessage(brand: string): string {
  return `Hi ${brand}! I'd like to know more about your sunglasses.`;
}
