import type { ReactNode } from 'react';

export const STATUS_CONFIG: Record<
    string,
    {
        bg: string;
        text: string;
        border: string;
        dot: string;
        pulse?: boolean;
    }
> = {
    draft: {
        bg: 'bg-slate-50 dark:bg-slate-800/80',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
    pending: {
        bg: 'bg-slate-50 dark:bg-slate-800/80',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
    pending_reserved: {
        bg: 'bg-indigo-50 dark:bg-indigo-950/60',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500',
        pulse: true,
    },
    confirmed: {
        bg: 'bg-sky-50 dark:bg-sky-950/60',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800',
        dot: 'bg-sky-500',
        pulse: true,
    },
    active: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-800 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        pulse: true,
    },
    returned: {
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
    },
    completed: {
        bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200/80 dark:border-emerald-800/80',
        dot: 'bg-emerald-500',
    },
    cancelled: {
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
    },
    cancelled_paid: {
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-800 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
    },
    no_show: {
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-800 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
    },
    no_show_paid: {
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-900 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
    },
};

export const PAYMENT_CONFIG: Record<
    string,
    {
        bg: string;
        text: string;
        border: string;
        dot: string;
    }
> = {
    none: {
        bg: 'bg-slate-50 dark:bg-slate-800/80',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
    draft: {
        bg: 'bg-slate-50 dark:bg-slate-800/80',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
    unpaid: {
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
    },
    partial: {
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
    },
    paid: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
    },
};

export function StatusBadge({ status, label }: { status: string; label: string }): JSX.Element {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold shadow-2xs ${config.bg} ${config.text} ${config.border}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${config.dot} ${
                    config.pulse ? 'animate-ping opacity-75' : ''
                }`}
            />
            <span>{label}</span>
        </span>
    );
}

export function PaymentBadge({ status, label }: { status: string; label: string }): JSX.Element {
    const config = PAYMENT_CONFIG[status] ?? PAYMENT_CONFIG.none;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold shadow-2xs ${config.bg} ${config.text} ${config.border}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            <span>{label}</span>
        </span>
    );
}

export function StatCard({
    label,
    value,
    hint,
    icon,
    tone = 'default',
}: {
    label: string;
    value: string;
    hint?: string;
    icon?: string;
    tone?: 'default' | 'warning' | 'danger' | 'success' | 'indigo';
}): JSX.Element {
    const toneStyles = {
        default: {
            border: 'border-slate-200/80 dark:border-slate-800',
            bg: 'bg-white dark:bg-slate-900',
            value: 'text-slate-900 dark:text-white',
            badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        },
        indigo: {
            border: 'border-indigo-100 dark:border-indigo-900/50',
            bg: 'bg-white dark:bg-slate-900',
            value: 'text-indigo-600 dark:text-indigo-400',
            badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
        },
        warning: {
            border: 'border-amber-200/80 dark:border-amber-900/50',
            bg: 'bg-white dark:bg-slate-900',
            value: 'text-amber-600 dark:text-amber-400',
            badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        },
        danger: {
            border: 'border-rose-200/80 dark:border-rose-900/50',
            bg: 'bg-white dark:bg-slate-900',
            value: 'text-rose-600 dark:text-rose-400',
            badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
        },
        success: {
            border: 'border-emerald-200/80 dark:border-emerald-900/50',
            bg: 'bg-white dark:bg-slate-900',
            value: 'text-emerald-600 dark:text-emerald-400',
            badge: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        },
    }[tone];

    return (
        <div
            className={`rounded-2xl border p-4 shadow-xs transition duration-200 ${toneStyles.border} ${toneStyles.bg}`}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {label}
                </p>
                {icon && <span className="text-base">{icon}</span>}
            </div>
            <p className={`mt-2 text-xl font-black tracking-tight tabular-nums ${toneStyles.value}`}>
                {value}
            </p>
            {hint && (
                <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${toneStyles.badge}`}>
                        {hint}
                    </span>
                </div>
            )}
        </div>
    );
}

export function DetailRow({
    label,
    children,
    compact = false,
}: {
    label: string;
    children: ReactNode;
    compact?: boolean;
}): JSX.Element {
    return (
        <div
            className={`flex flex-col gap-1 border-b border-slate-100 last:border-0 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${
                compact ? 'py-2' : 'py-3'
            }`}
        >
            <dt className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {label}
            </dt>
            <dd className="text-xs font-bold text-slate-900 dark:text-slate-100 sm:text-right">
                {children}
            </dd>
        </div>
    );
}

export function SectionCard({
    title,
    subtitle,
    action,
    icon,
    children,
    className = '',
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    icon?: string;
    children: ReactNode;
    className?: string;
}): JSX.Element {
    return (
        <section
            className={`overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-850/50 sm:px-6">
                <div className="flex items-center gap-2.5">
                    {icon && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-sm dark:bg-slate-800">
                            {icon}
                        </span>
                    )}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-400">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {action}
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

export function EmptyBlock({ children }: { children: ReactNode }): JSX.Element {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-xs font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-500">
            {children}
        </div>
    );
}

export function ModalHeader({
    icon,
    title,
    subtitle,
    onClose,
    badge,
    tone = 'primary',
}: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    onClose: () => void;
    badge?: ReactNode;
    tone?: 'primary' | 'danger' | 'amber' | 'emerald' | 'purple' | 'slate';
}): JSX.Element {
    const toneBg = {
        primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
        danger: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
        slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    }[tone];

    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneBg} text-xl shadow-2xs`}>
                    {icon}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {title}
                        </h3>
                        {badge}
                    </div>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
                title="Tutup"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export function FuelLevelPicker({
    value,
    onChange,
    disabled = false,
}: {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}): JSX.Element {
    const levels = [
        { key: 'empty', label: '0%', short: 'E', color: 'text-rose-600 bg-rose-50 border-rose-300 dark:border-rose-800 dark:bg-rose-950/40' },
        { key: 'quarter', label: '25%', short: '1/4', color: 'text-amber-600 bg-amber-50 border-amber-300 dark:border-amber-800 dark:bg-amber-950/40' },
        { key: 'half', label: '50%', short: '1/2', color: 'text-sky-600 bg-sky-50 border-sky-300 dark:border-sky-800 dark:bg-sky-950/40' },
        { key: 'three_quarters', label: '75%', short: '3/4', color: 'text-indigo-600 bg-indigo-50 border-indigo-300 dark:border-indigo-800 dark:bg-indigo-950/40' },
        { key: 'full', label: '100%', short: 'F', color: 'text-emerald-600 bg-emerald-50 border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/40' },
    ];

    return (
        <div className="grid grid-cols-5 gap-1.5">
            {levels.map((item) => {
                const active = value === item.key;
                return (
                    <button
                        key={item.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(item.key)}
                        className={`flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-center transition-all ${
                            active
                                ? `border-2 font-bold shadow-2xs ${item.color} ring-2 ring-offset-1 ring-slate-400/20`
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
                        } disabled:opacity-50`}
                    >
                        <span className="text-xs font-black">{item.short}</span>
                        <span className="mt-0.5 text-[10px] opacity-75">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export function ChecklistToggleCard({
    label,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}): JSX.Element {
    return (
        <label
            className={`flex items-center justify-between gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all ${
                checked
                    ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 shadow-2xs font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                        checked
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700'
                    }`}
                >
                    {checked && '✓'}
                </div>
                <span className="text-xs truncate">{label}</span>
            </div>
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
                className="hidden"
            />
        </label>
    );
}

