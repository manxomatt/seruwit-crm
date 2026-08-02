import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import InventoryNav from '../../../../InventoryNav';

interface Board {
    warehouses: {
        total: number;
        active: number;
        inactive: number;
        warehouse: number;
        store: number;
        showroom: number;
    };
    stock: {
        lines: number;
        on_hand: number;
        reserved: number;
        available: number;
        low_stock: number;
    };
    alerts: {
        expired: number;
        near_expiry: number;
        expiry_horizon_days: number;
        putaway_pending: number;
        opnames_open: number;
        attention: number;
    };
    activity: {
        movements_today: number;
    };
    sites: Array<{
        id: number;
        name: string;
        kind: string;
        status: string;
        location: string | null;
        stock_lines: number;
    }>;
    recent: Array<{
        id: number;
        type: string;
        quantity: number;
        reference_code: string | null;
        product: { id: number; name: string; code: string } | null;
        warehouse: { id: number; name: string } | null;
        recorded_at: string | null;
    }>;
}

interface Props {
    board: Board;
    can: { create: boolean; adjust: boolean };
}

type StatTone = 'emerald' | 'sky' | 'violet' | 'amber' | 'slate' | 'rose';

const STAT_TONES: Record<
    StatTone,
    { card: string; icon: string; value: string; bar: string; track: string; accent: string }
> = {
    emerald: {
        card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
        icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
        value: 'text-emerald-900',
        bar: 'bg-emerald-500',
        track: 'bg-emerald-100',
        accent: 'bg-emerald-500',
    },
    sky: {
        card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50',
        icon: 'bg-sky-500 text-white shadow-sky-500/30',
        value: 'text-sky-900',
        bar: 'bg-sky-500',
        track: 'bg-sky-100',
        accent: 'bg-sky-500',
    },
    violet: {
        card: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50',
        icon: 'bg-violet-500 text-white shadow-violet-500/30',
        value: 'text-violet-900',
        bar: 'bg-violet-500',
        track: 'bg-violet-100',
        accent: 'bg-violet-500',
    },
    amber: {
        card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-900',
        bar: 'bg-amber-500',
        track: 'bg-amber-100',
        accent: 'bg-amber-500',
    },
    slate: {
        card: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-gray-100',
        icon: 'bg-slate-500 text-white shadow-slate-500/30',
        value: 'text-slate-900',
        bar: 'bg-slate-500',
        track: 'bg-slate-200',
        accent: 'bg-slate-500',
    },
    rose: {
        card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-900',
        bar: 'bg-rose-500',
        track: 'bg-rose-100',
        accent: 'bg-rose-500',
    },
};

function sharePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function formatQty(value: number): string {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function formatWhen(value: string | null): string {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function IconWarehouse(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
            />
        </svg>
    );
}

function IconBoxes(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
            />
        </svg>
    );
}

function IconAlert(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
        </svg>
    );
}

function IconClock(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function IconMove(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
        </svg>
    );
}

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
    progress,
    progressLabel,
    href,
    meta,
}: {
    label: string;
    value: number | string;
    hint?: string;
    tone: StatTone;
    icon: JSX.Element;
    progress?: number;
    progressLabel?: string;
    href?: string;
    meta?: Array<{ label: string; value: number | string }>;
}): JSX.Element {
    const styles = STAT_TONES[tone];
    const clampedProgress = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));
    const body = (
        <>
            <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className={`mt-2 text-3xl font-bold tabular-nums ${styles.value}`}>{value}</p>
                    {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>{icon}</div>
            </div>
            {clampedProgress !== undefined && (
                <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-medium text-gray-500">
                        <span className="truncate">{progressLabel}</span>
                        <span className="tabular-nums">{clampedProgress}%</span>
                    </div>
                    <div className={`h-1.5 w-full overflow-hidden rounded-full ${styles.track}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${styles.bar}`} style={{ width: `${clampedProgress}%` }} />
                    </div>
                </div>
            )}
            {meta && meta.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {meta.map((item) => (
                        <span
                            key={item.label}
                            className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-black/5"
                        >
                            <span className="tabular-nums text-gray-900">{item.value}</span>
                            <span>{item.label}</span>
                        </span>
                    ))}
                </div>
            )}
        </>
    );

    const className = `relative overflow-hidden rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${styles.card} ${
        href ? 'block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500' : ''
    }`;

    if (href) {
        return (
            <Link href={href} className={className}>
                {body}
            </Link>
        );
    }

    return <div className={className}>{body}</div>;
}

function QuickAction({
    href,
    title,
    description,
}: {
    href: string;
    title: string;
    description: string;
}): JSX.Element {
    return (
        <Link
            href={href}
            className="group rounded-lg border border-gray-200 bg-white px-3 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/40"
        >
            <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{title}</p>
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </Link>
    );
}

export default function Index({ board, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { warehouses, stock, alerts, activity, sites, recent } = board;
    const attentionTone: StatTone = alerts.attention > 0 ? 'rose' : 'slate';

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('inventory.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('inventory.warehouses.create')}>
                                <PrimaryButton>{t('inventory.warehouses.add')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('inventory.dashboard.title')} />

            <InventoryNav />

            <p className="mb-6 text-sm text-gray-600">{t('inventory.dashboard.subtitle')}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    label={t('inventory.dashboard.active_sites')}
                    value={warehouses.active}
                    hint={t('inventory.dashboard.of_sites', { total: warehouses.total })}
                    tone="emerald"
                    icon={<IconWarehouse />}
                    progress={sharePercent(warehouses.active, warehouses.total)}
                    progressLabel={t('inventory.dashboard.sites_ready')}
                    href={prefixedRoute('inventory.warehouses.index')}
                    meta={[
                        { label: t('inventory.warehouse_kinds.warehouse'), value: warehouses.warehouse },
                        { label: t('inventory.warehouse_kinds.store'), value: warehouses.store },
                        { label: t('inventory.warehouse_kinds.showroom'), value: warehouses.showroom },
                    ]}
                />
                <StatCard
                    label={t('inventory.dashboard.available')}
                    value={formatQty(stock.available)}
                    hint={t('inventory.dashboard.available_hint', {
                        on_hand: formatQty(stock.on_hand),
                        reserved: formatQty(stock.reserved),
                    })}
                    tone="sky"
                    icon={<IconBoxes />}
                    progress={sharePercent(stock.available, stock.on_hand || 1)}
                    progressLabel={t('inventory.dashboard.available_share')}
                    href={prefixedRoute('inventory.stock-levels.index')}
                />
                <StatCard
                    label={t('inventory.dashboard.low_stock')}
                    value={stock.low_stock}
                    hint={t('inventory.dashboard.low_stock_hint')}
                    tone={stock.low_stock > 0 ? 'amber' : 'slate'}
                    icon={<IconAlert />}
                    href={prefixedRoute('inventory.stock-levels.index')}
                />
                <StatCard
                    label={t('inventory.dashboard.needs_attention')}
                    value={alerts.attention}
                    hint={t('inventory.dashboard.needs_attention_hint')}
                    tone={attentionTone}
                    icon={<IconAlert />}
                    meta={[
                        { label: t('inventory.dashboard.expired'), value: alerts.expired },
                        { label: t('inventory.dashboard.near_expiry'), value: alerts.near_expiry },
                        { label: t('inventory.dashboard.putaway'), value: alerts.putaway_pending },
                        { label: t('inventory.dashboard.opnames'), value: alerts.opnames_open },
                    ]}
                />
                <StatCard
                    label={t('inventory.dashboard.movements_today')}
                    value={activity.movements_today}
                    hint={t('inventory.dashboard.movements_hint', { lines: stock.lines })}
                    tone="violet"
                    icon={<IconMove />}
                    href={prefixedRoute('inventory.stock-movements.index')}
                />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('inventory.dashboard.sites')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('inventory.dashboard.sites_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('inventory.warehouses.index')}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                            {t('inventory.dashboard.view_sites')}
                        </Link>
                    </div>
                    {sites.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('inventory.dashboard.empty_sites')}</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {sites.map((site) => (
                                <li key={site.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <Link
                                            href={prefixedRoute('inventory.warehouses.show', site.id)}
                                            className="truncate text-sm font-medium text-indigo-600 hover:underline"
                                        >
                                            {site.name}
                                        </Link>
                                        <p className="truncate text-xs text-gray-500">
                                            {t(`inventory.warehouse_kinds.${site.kind}`, undefined, site.kind)}
                                            {site.location ? ` · ${site.location}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold tabular-nums text-gray-900">{site.stock_lines}</p>
                                        <p className="text-[11px] text-gray-500">{t('inventory.dashboard.stock_lines')}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('inventory.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('inventory.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('inventory.stock-movements.index')}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                            {t('inventory.dashboard.view_movements')}
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('inventory.dashboard.col_product')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('inventory.dashboard.col_site')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('inventory.dashboard.col_type')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                        {t('inventory.dashboard.col_qty')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('inventory.dashboard.col_when')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            {t('inventory.dashboard.empty_movements')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{row.product?.name ?? '—'}</p>
                                                <p className="font-mono text-xs text-gray-500">
                                                    {row.product?.code ?? row.reference_code ?? '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{row.warehouse?.name ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                                    {t(`inventory.movement_types.${row.type}`, undefined, row.type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-gray-800">
                                                {formatQty(row.quantity)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                <span className="inline-flex items-center gap-1">
                                                    <IconClock />
                                                    {formatWhen(row.recorded_at)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('inventory.dashboard.quick_actions')}</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <QuickAction
                            href={prefixedRoute('inventory.stock-levels.index')}
                            title={t('inventory.nav.stock_levels')}
                            description={t('inventory.dashboard.quick_stock')}
                        />
                        <QuickAction
                            href={prefixedRoute('inventory.stock-movements.index')}
                            title={t('inventory.nav.stock_movements')}
                            description={t('inventory.dashboard.quick_movements')}
                        />
                        <QuickAction
                            href={prefixedRoute('inventory.putaway.index')}
                            title={t('inventory.nav.putaway')}
                            description={t('inventory.dashboard.quick_putaway')}
                        />
                        <QuickAction
                            href={prefixedRoute('inventory.expiry-report.index')}
                            title={t('inventory.nav.expiry_report')}
                            description={t('inventory.dashboard.quick_expiry')}
                        />
                        <QuickAction
                            href={prefixedRoute('inventory.stock-opnames.index')}
                            title={t('inventory.nav.stock_opnames')}
                            description={t('inventory.dashboard.quick_opnames')}
                        />
                        {can.adjust && (
                            <QuickAction
                                href={prefixedRoute('inventory.stock-movements.create')}
                                title={t('inventory.dashboard.record_movement')}
                                description={t('inventory.dashboard.quick_adjust')}
                            />
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('inventory.dashboard.alert_summary')}</h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <dt className="text-gray-600">{t('inventory.dashboard.expired')}</dt>
                            <dd className="font-semibold tabular-nums text-rose-700">{alerts.expired}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <dt className="text-gray-600">
                                {t('inventory.dashboard.near_expiry_days', { days: alerts.expiry_horizon_days })}
                            </dt>
                            <dd className="font-semibold tabular-nums text-amber-700">{alerts.near_expiry}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <dt className="text-gray-600">{t('inventory.dashboard.putaway')}</dt>
                            <dd className="font-semibold tabular-nums text-indigo-700">{alerts.putaway_pending}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <dt className="text-gray-600">{t('inventory.dashboard.opnames')}</dt>
                            <dd className="font-semibold tabular-nums text-gray-900">{alerts.opnames_open}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                            <dt className="text-gray-600">{t('inventory.dashboard.inactive_sites')}</dt>
                            <dd className="font-semibold tabular-nums text-gray-900">{warehouses.inactive}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </DynamicLayout>
    );
}
