import type { Order } from '../types';

function cell(value: string | number): string {
  const s = String(value);
  // Guard against spreadsheet formula injection from customer-supplied text.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function ordersToCsv(orders: Order[]): string {
  const header = ['Order', 'Date', 'Status', 'Source', 'Customer', 'Phone', 'Address', 'Items', 'Total (NGN)', 'Notes'];
  const rows = orders.map((o) => [
    o.number,
    o.createdAt,
    o.status,
    o.source,
    o.customerName,
    o.customerPhone,
    o.deliveryAddress,
    o.items.map((i) => `${i.name} x${i.qty}`).join('; '),
    o.total,
    o.notes,
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  // BOM so Excel reads UTF-8 (names with accents, ₦) correctly.
  const blob = new Blob(['\ufeff', text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
