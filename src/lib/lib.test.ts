import { describe, expect, it } from 'vitest';
import { displayPhone, formatNaira, makeOrderRef, normalizePhone, slugify, timeAgo } from './format';
import { buildOrderMessage, whatsappLink } from './whatsapp';
import { getAvailability, maxQuantity, canPurchase } from './availability';
import { mergeSettings, DEFAULT_SETTINGS } from './settings';
import { ordersToCsv } from './csv';
import { parseWholeNumber, toDraft, toInput, validateProduct } from '../admin/productForm';
import type { Order } from '../types';

describe('format', () => {
  it('formats naira', () => {
    expect(formatNaira(38000)).toBe('₦38,000');
    expect(formatNaira(1250.4)).toBe('₦1,250');
  });
  it('slugifies', () => {
    expect(slugify('  Aureate  Aviator! ')).toBe('aureate-aviator');
    expect(slugify('Café Noir / 2')).toBe('cafe-noir-2');
  });
  it('makes order refs the database accepts', () => {
    for (let i = 0; i < 200; i++) expect(makeOrderRef()).toMatch(/^[A-Z2-9]{6}$/);
  });
  it('normalises Nigerian phone numbers', () => {
    expect(normalizePhone('0803 249 8333')).toBe('2348032498333');
    expect(normalizePhone('+234 803 249 8333')).toBe('2348032498333');
    expect(normalizePhone('2348032498333')).toBe('2348032498333');
    expect(displayPhone('2348032498333')).toBe('+234 803 249 8333');
  });
  it('says how long ago', () => {
    const now = Date.parse('2026-10-21T12:00:00Z');
    expect(timeAgo('2026-10-21T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-10-21T10:00:00Z', now)).toBe('2 hr ago');
    expect(timeAgo('2026-10-19T12:00:00Z', now)).toBe('2 days ago');
  });
});

describe('whatsapp', () => {
  it('builds the order message with the ref', () => {
    const msg = buildOrderMessage('Shades Array', [{ name: 'A', price: 1000, qty: 2 }, { name: 'B', price: 500, qty: 1 }], 'K7Q2M9');
    expect(msg).toContain('• A — ₦1,000 × 2');
    expect(msg).toContain('Total: ₦2,500');
    expect(msg).toContain('Order ref: K7Q2M9');
  });
  it('builds a wa.me link', () => {
    expect(whatsappLink('+234 803 249 8333', 'hi there')).toBe('https://wa.me/2348032498333?text=hi%20there');
    expect(whatsappLink('2348032498333')).toBe('https://wa.me/2348032498333');
  });
});

describe('availability', () => {
  it('derives availability from stock', () => {
    expect(getAvailability({ stock: 10, allowPreorder: false })).toBe('in_stock');
    expect(getAvailability({ stock: 2, allowPreorder: false })).toBe('low');
    expect(getAvailability({ stock: 0, allowPreorder: false })).toBe('out');
    expect(getAvailability({ stock: 0, allowPreorder: true })).toBe('preorder');
  });
  it('limits quantity', () => {
    expect(maxQuantity({ stock: 4, allowPreorder: false })).toBe(4);
    expect(maxQuantity({ stock: 0, allowPreorder: false })).toBe(0);
    expect(canPurchase({ stock: 0, allowPreorder: true })).toBe(true);
  });
});

describe('settings', () => {
  it('falls back to defaults and ignores bad types', () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
    const s = mergeSettings({ brandName: 42, whatsapp: '+234 803 111 2222', announcement: { enabled: 'yes', text: 'Sale' } });
    expect(s.brandName).toBe(DEFAULT_SETTINGS.brandName);
    expect(s.whatsapp).toBe('2348031112222');
    expect(s.announcement).toEqual({ enabled: false, text: 'Sale' });
  });
});

describe('product form', () => {
  it('parses whole numbers', () => {
    expect(parseWholeNumber('38,000')).toBe(38000);
    expect(parseWholeNumber('₦ 1 500')).toBe(1500);
    expect(parseWholeNumber('12.5')).toBeNaN();
    expect(parseWholeNumber('')).toBeNaN();
  });
  it('validates', () => {
    const d = toDraft();
    expect(Object.keys(validateProduct(d))).toEqual(expect.arrayContaining(['name', 'slug', 'price']));
    const ok = { ...d, name: 'X', slug: 'x', price: '1000', stock: '3' };
    expect(validateProduct(ok)).toEqual({});
    expect(validateProduct({ ...ok, compareAtPrice: '900' }).compareAtPrice).toBeTruthy();
    expect(validateProduct({ ...ok, status: 'active' }).images).toBeTruthy();
    expect(validateProduct({ ...ok, status: 'active', images: ['a.jpg'] })).toEqual({});
    expect(validateProduct({ ...ok, slug: 'Bad Slug' }).slug).toBeTruthy();
  });
  it('builds the save payload', () => {
    const input = toInput({ ...toDraft(), name: ' X ', slug: 'x', price: '38,000', stock: '4', frame: ' Gold ', lens: '' }, 'id1');
    expect(input).toMatchObject({ id: 'id1', name: 'X', price: 38000, stock: 4, categoryId: null, compareAtPrice: null, specs: { frame: 'Gold' } });
  });
});

describe('csv', () => {
  it('escapes and neutralises formulas', () => {
    const order: Order = {
      id: '1', number: 'ABC234', status: 'paid', source: 'whatsapp', customerName: '=HYPERLINK("x")', customerPhone: '234', deliveryAddress: 'Lekki, Lagos',
      notes: 'say "hi"', items: [{ productId: 'p', name: 'Vanguard', price: 1000, qty: 2, image: null }], total: 2000, stockApplied: false, createdAt: '2026-10-21T00:00:00Z', updatedAt: '',
    };
    const csv = ordersToCsv([order]);
    expect(csv.split('\r\n')[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"Lekki, Lagos"');
    expect(csv).toContain('"say ""hi"""');
    expect(csv).toContain('Vanguard x2');
  });
});
