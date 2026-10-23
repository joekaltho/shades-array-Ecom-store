import type { ReactNode } from 'react';
import { Overlay } from '../components/Overlay';
import type { OrderStatus, ProductStatus } from '../types';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="hint">{hint}</p>
      )}
    </div>
  );
}

export function Card({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      {title && <h2 className="text-sm font-bold">{title}</h2>}
      {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label={label}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-ink" />
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-neutral-500">{children}</div>}
    </div>
  );
}

const PRODUCT_STATUS: Record<ProductStatus, { label: string; cls: string }> = {
  active: { label: 'Live', cls: 'bg-emerald-50 text-emerald-700' },
  draft: { label: 'Draft', cls: 'bg-neutral-100 text-neutral-600' },
  archived: { label: 'Archived', cls: 'bg-amber-50 text-amber-700' },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const s = PRODUCT_STATUS[status];
  return <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-blue-50 text-blue-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-violet-50 text-violet-700' },
  paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700' },
  delivered: { label: 'Delivered', cls: 'bg-neutral-900 text-white' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Overlay open={open} onClose={onCancel} title={title} variant="modal" widthClass="max-w-sm">
      <div className="p-6">
        <h2 className="pr-8 text-lg font-bold">{title}</h2>
        <div className="mt-2 text-sm text-neutral-600">{message}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="btn btn-outline btn-sm" data-autofocus>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className={`btn btn-sm ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-emerald-600' : 'bg-neutral-300'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}
