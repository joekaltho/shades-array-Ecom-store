import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, MessageCircle, Plus, Search, Trash2 } from 'lucide-react';
import { useAdminData } from '../AdminContext';
import { ConfirmDialog, EmptyState, Field, ORDER_STATUS, OrderStatusBadge, PageHeader } from '../ui';
import { Overlay } from '../../components/Overlay';
import { useToast } from '../../context/ToastContext';
import { downloadText, ordersToCsv } from '../../lib/csv';
import { displayPhone, formatDateTime, formatNaira, makeOrderRef, normalizePhone, timeAgo } from '../../lib/format';
import { whatsappLink } from '../../lib/whatsapp';
import type { Order, OrderInput, OrderItem, OrderSource, OrderStatus } from '../../types';

const STATUSES = Object.keys(ORDER_STATUS) as OrderStatus[];
const SOURCES: { value: OrderSource; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'other', label: 'Other' },
];

type Filter = 'all' | OrderStatus;

const blankOrder = (): OrderInput => ({
  number: makeOrderRef(),
  status: 'new',
  source: 'whatsapp',
  customerName: '',
  customerPhone: '',
  deliveryAddress: '',
  notes: '',
  items: [],
  total: 0,
});

const toInput = (o: Order): OrderInput => ({
  id: o.id,
  number: o.number,
  status: o.status,
  source: o.source,
  customerName: o.customerName,
  customerPhone: o.customerPhone,
  deliveryAddress: o.deliveryAddress,
  notes: o.notes,
  items: o.items,
  total: o.total,
});

export default function Orders() {
  const { data, deleteOrder } = useAdminData();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('status') as Filter | null) ?? 'all';
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ order: Order | null } | null>(null);
  const [toDelete, setToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { orders } = data;
  const openId = params.get('open');

  // Deep link from the overview: /admin/orders?open=<id>
  useEffect(() => {
    if (!openId) return;
    const match = orders.find((o) => o.id === openId);
    if (match) setEditing({ order: match });
    const next = new URLSearchParams(params);
    next.delete('open');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: orders.length, new: 0, confirmed: 0, paid: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => (c[o.status] += 1));
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (filter === 'all' || o.status === filter) &&
        (!q || `${o.number} ${o.customerName} ${o.customerPhone}`.toLowerCase().includes(q)),
    );
  }, [orders, filter, query]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteOrder(toDelete.id);
      toast.success(`Order #${toDelete.number} deleted`);
      setToDelete(null);
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  }

  const tabs: [Filter, string][] = [['all', 'All'], ...STATUSES.map((s): [Filter, string] => [s, ORDER_STATUS[s].label])];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every “Order on WhatsApp” tap lands here as New. Add the customer’s details once you’re chatting."
        actions={
          <>
            <button
              onClick={() => downloadText(`orders-${new Date().toISOString().slice(0, 10)}.csv`, ordersToCsv(visible))}
              disabled={visible.length === 0}
              className="btn btn-outline btn-sm"
            >
              <Download className="h-4 w-4" aria-hidden /> Export
            </button>
            <button onClick={() => setEditing({ order: null })} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" aria-hidden /> New order
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => {
                const next = new URLSearchParams(params);
                if (key === 'all') next.delete('status');
                else next.set('status', key);
                setParams(next, { replace: true });
              }}
              className={`whitespace-nowrap px-3 py-2 text-sm font-semibold ${filter === key ? 'bg-ink text-white' : 'text-neutral-600 hover:bg-neutral-200'}`}
            >
              {label} <span className="opacity-60">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, name or phone" aria-label="Search orders" className="input pl-9" />
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet">They’ll show up here when shoppers tap “Order on WhatsApp”, or add one yourself.</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState title="No orders match" />
      ) : (
        <ul className="card divide-y divide-neutral-100">
          {visible.map((o) => (
            <li key={o.id}>
              <button onClick={() => setEditing({ order: o })} className="flex w-full items-center gap-3 p-4 text-left hover:bg-neutral-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    #{o.number}
                    <span className="font-normal text-neutral-500"> · {o.customerName || 'No name yet'}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {o.items.reduce((n, i) => n + i.qty, 0)} item{o.items.reduce((n, i) => n + i.qty, 0) === 1 ? '' : 's'} · {SOURCES.find((s) => s.value === o.source)?.label} · {timeAgo(o.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm font-semibold">{formatNaira(o.total)}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <OrderEditor
          key={editing.order?.id ?? 'new'}
          order={editing.order}
          onClose={() => setEditing(null)}
          onDelete={(o) => setToDelete(o)}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this order?"
        message={
          <>
            Order <strong>#{toDelete?.number}</strong> will be removed for good.
            {toDelete?.stockApplied && ' Its stock will not be put back; set it to Cancelled first if you want that.'}
          </>
        }
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function OrderEditor({ order, onClose, onDelete }: { order: Order | null; onClose: () => void; onDelete: (o: Order) => void }) {
  const { data, saveOrder } = useAdminData();
  const toast = useToast();
  const [draft, setDraft] = useState<OrderInput>(() => (order ? toInput(order) : blankOrder()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pick, setPick] = useState('');

  const locked = Boolean(order?.stockApplied) && ['confirmed', 'paid', 'delivered'].includes(draft.status);
  const total = draft.items.reduce((s, i) => s + i.price * i.qty, 0);
  const phone = normalizePhone(draft.customerPhone);

  const set = <K extends keyof OrderInput>(k: K, v: OrderInput[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setItem = (idx: number, patch: Partial<OrderItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));

  function addProduct(id: string) {
    const p = data.products.find((x) => x.id === id);
    if (!p) return;
    setDraft((d) => {
      const existing = d.items.findIndex((i) => i.productId === p.id);
      if (existing >= 0) return { ...d, items: d.items.map((i, k) => (k === existing ? { ...i, qty: i.qty + 1 } : i)) };
      return { ...d, items: [...d.items, { productId: p.id, name: p.name, price: p.price, qty: 1, image: p.images[0] ?? null }] };
    });
    setPick('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (draft.items.length === 0) return setError('Add at least one item.');
    setSaving(true);
    setError('');
    try {
      await saveOrder({ ...draft, customerPhone: phone, customerName: draft.customerName.trim(), total });
      toast.success(order ? 'Order updated' : 'Order added');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  return (
    <Overlay open onClose={onClose} title={order ? `Order ${order.number}` : 'New order'} widthClass="max-w-xl">
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="pr-8">
            <h2 className="text-lg font-bold">{order ? `Order #${order.number}` : 'New order'}</h2>
            {order && <p className="text-xs text-neutral-500">Placed {formatDateTime(order.createdAt)}</p>}
          </div>

          <div>
            <span className="label">Status</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Order status">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={draft.status === s}
                  onClick={() => set('status', s)}
                  className={`px-3 py-1.5 text-xs font-semibold ${draft.status === s ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  {ORDER_STATUS[s].label}
                </button>
              ))}
            </div>
            <p className="hint">Confirmed, Paid and Delivered take the items out of stock. Cancelled puts them back.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name" htmlFor="o-name">
              <input id="o-name" value={draft.customerName} onChange={(e) => set('customerName', e.target.value)} className="input" />
            </Field>
            <Field label="Phone / WhatsApp" htmlFor="o-phone" hint={phone ? displayPhone(phone) : 'e.g. 0803 123 4567'}>
              <input id="o-phone" inputMode="tel" value={draft.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} className="input" />
            </Field>
            <Field label="Delivery address" htmlFor="o-address" className="sm:col-span-2">
              <textarea id="o-address" rows={2} value={draft.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} className="input" />
            </Field>
            <Field label="Where from" htmlFor="o-source">
              <select id="o-source" value={draft.source} onChange={(e) => set('source', e.target.value as OrderSource)} className="input">
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            {phone.length >= 10 && (
              <div className="flex items-end">
                <a href={whatsappLink(phone)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm w-full">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden /> Open WhatsApp chat
                </a>
              </div>
            )}
            <Field label="Notes" htmlFor="o-notes" className="sm:col-span-2">
              <textarea id="o-notes" rows={2} value={draft.notes} onChange={(e) => set('notes', e.target.value)} className="input" />
            </Field>
          </div>

          <div>
            <span className="label">Items</span>
            {locked && (
              <p className="mb-2 bg-amber-50 p-2.5 text-xs text-amber-800">
                Stock has been taken for this order. Set it back to New if you need to change the items.
              </p>
            )}
            {draft.items.length === 0 ? (
              <p className="border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500">No items yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100 border border-neutral-200">
                {draft.items.map((it, idx) => (
                  <li key={`${it.productId}-${idx}`} className="flex items-center gap-3 p-3">
                    {it.image ? <img src={it.image} alt="" className="h-10 w-10 shrink-0 object-cover" /> : <div className="h-10 w-10 shrink-0 bg-neutral-100" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{it.name}</p>
                      {locked ? (
                        <p className="text-xs text-neutral-500">{formatNaira(it.price)} × {it.qty}</p>
                      ) : (
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <label className="flex items-center gap-1">
                            <span className="sr-only">Price</span>₦
                            <input
                              inputMode="numeric"
                              value={it.price}
                              onChange={(e) => setItem(idx, { price: Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0) })}
                              className="input w-24 px-2 py-1"
                            />
                          </label>
                          ×
                          <label>
                            <span className="sr-only">Quantity</span>
                            <input
                              inputMode="numeric"
                              value={it.qty}
                              onChange={(e) => setItem(idx, { qty: Math.min(50, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)) })}
                              className="input w-14 px-2 py-1"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{formatNaira(it.price * it.qty)}</span>
                    {!locked && (
                      <button type="button" onClick={() => set('items', draft.items.filter((_, i) => i !== idx))} aria-label={`Remove ${it.name}`} className="p-1.5 text-neutral-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!locked && (
              <select value={pick} onChange={(e) => addProduct(e.target.value)} aria-label="Add a product" className="input mt-2">
                <option value="">+ Add a product…</option>
                {data.products
                  .filter((p) => p.status !== 'archived')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatNaira(p.price)} ({p.stock} in stock)
                    </option>
                  ))}
              </select>
            )}
            <div className="mt-3 flex items-center justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </div>
            <p className="hint">Change a price here if you agreed a discount with the customer.</p>
          </div>

          {error && <p className="bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-6 py-4">
          {order ? (
            <button type="button" onClick={() => onDelete(order)} className="btn btn-danger btn-sm" disabled={saving}>
              <Trash2 className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Delete</span>
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Close</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm px-6">{saving ? 'Saving…' : order ? 'Save order' : 'Add order'}</button>
          </div>
        </div>
      </form>
    </Overlay>
  );
}
