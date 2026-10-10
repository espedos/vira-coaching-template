import { useEffect, type ReactNode } from 'react';
import { X, Loader2, type LucideIcon } from 'lucide-react';

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
} as const;
export type Tone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'indigo',
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={cn('rounded-xl p-2.5 ring-1', TONES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[tone])}>
      {children}
    </span>
  );
}

export function Card({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn('card', className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {action}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 rounded-2xl bg-slate-100 p-3.5 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-indigo-600', className)} />;
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase('tr-TR'))
    .join('');
  const palette = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  const color = palette[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold text-white', color, sizes[size])}>
      {initials || '?'}
    </div>
  );
}

export function ProgressBar({ value, tone = 'indigo' }: { value: number; tone?: 'indigo' | 'emerald' | 'amber' }) {
  const colors = { indigo: 'bg-indigo-600', emerald: 'bg-emerald-500', amber: 'bg-amber-500' };
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn('h-full rounded-full transition-all duration-500', colors[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Alert({ tone = 'rose', children }: { tone?: 'rose' | 'emerald' | 'amber'; children: ReactNode }) {
  const styles = {
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return <div className={cn('rounded-lg border px-4 py-3 text-sm', styles[tone])}>{children}</div>;
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR', opts ?? { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return formatDate(iso, { day: 'numeric', month: 'short' });
}
