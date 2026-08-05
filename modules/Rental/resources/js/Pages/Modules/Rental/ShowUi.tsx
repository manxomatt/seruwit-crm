import type { ReactNode } from 'react';

export const STATUS_BADGE: Record<string, string> = {
    draft: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-400/30',
    pending: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-400/30',
    pending_reserved: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-950 dark:text-indigo-200 dark:ring-indigo-400/30',
    confirmed: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-400/30',
    active: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-400/30',
    returned: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-400/30',
    completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-400/30',
    cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-400/30',
    cancelled_paid: 'bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-400/30',
    no_show: 'bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-400/30',
    no_show_paid: 'bg-orange-50 text-orange-900 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-400/30',
};

export const PAYMENT_BADGE: Record<string, string> = {
    none: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300',
    draft: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-200',
    unpaid: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950 dark:text-rose-200',
    partial: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950 dark:text-amber-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-200',
};

export function StatusBadge({ status, label }: { status: string; label: string }): JSX.Element {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? STATUS_BADGE.draft}`}>
            {label}
        </span>
    );
}

export function PaymentBadge({ status, label }: { status: string; label: string }): JSX.Element {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_BADGE[status] ?? PAYMENT_BADGE.none}`}>
            {label}
        </span>
    );
}

export function StatCard({
    label,
    value,
    hint,
    tone = 'default',
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: 'default' | 'warning' | 'danger' | 'success';
}): JSX.Element {
    const valueTone =
        tone === 'danger'
            ? 'text-rose-700 dark:text-rose-300'
            : tone === 'warning'
              ? 'text-amber-700 dark:text-amber-300'
              : tone === 'success'
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-gray-900 dark:text-white';

    return (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${valueTone}`}>{value}</p>
            {hint && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        </div>
    );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
    return (
        <div className="flex flex-col gap-0.5 border-b border-gray-100 py-3 last:border-0 dark:border-gray-700/80 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <dt className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-right">{children}</dd>
        </div>
    );
}

export function SectionCard({
    title,
    subtitle,
    action,
    children,
    className = '',
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}): JSX.Element {
    return (
        <section className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700 sm:px-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
                </div>
                {action}
            </div>
            <div className="px-5 py-4 sm:px-6">{children}</div>
        </section>
    );
}

export function EmptyBlock({ children }: { children: ReactNode }): JSX.Element {
    return (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
            {children}
        </div>
    );
}
