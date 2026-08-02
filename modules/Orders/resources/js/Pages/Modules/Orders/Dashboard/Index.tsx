import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { formatDate, formatDateTime } from '@/utils/date';
import { Head, Link } from '@inertiajs/react';
import OrdersNav from '../../../../OrdersNav';

interface Board {
    summary: {
        open_pipeline: number;
        in_flight: number;
        ready_from_gin: number;
        unassigned_confirmed: number;
        delivered_this_month: number;
        demand_open_kg: number;
        demand_delivered_this_month_kg: number;
    };
    dispatch: {
        overdue_count: number;
        draft_count: number;
        confirmed_count: number;
        assigned_count: number;
        in_transit_count: number;
    };
    by_status: {
        draft: number;
        confirmed: number;
        assigned: number;
        in_transit: number;
        delivered: number;
        cancelled: number;
    };
    alerts: {
        attention: number;
    };
    recent: Array<{
        id: number;
        code: string;
        status: string;
        order_date: string | null;
        promised_at: string | null;
        pickup_address: string;
        delivery_address: string;
        demand_kg: number | null;
        from_gin: boolean;
        is_overdue: boolean;
        partner: { id: number; code: string; name: string } | null;
        trip: { id: number; code: string } | null;
    }>;
}

interface Props {
    board: Board;
    can: { create: boolean };
}

type StatTone = 'emerald' | 'sky' | 'violet' | 'amber' | 'slate' | 'rose';

const STAT_TONES: Record<StatTone, { card: string; icon: string; value: string; accent: string }> = {
    emerald: {
        card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
        icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
        value: 'text-emerald-900',
        accent: 'bg-emerald-500',
    },
    sky: {
        card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50',
        icon: 'bg-sky-500 text-white shadow-sky-500/30',
        value: 'text-sky-900',
        accent: 'bg-sky-500',
    },
    violet: {
        card: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50',
        icon: 'bg-violet-500 text-white shadow-violet-500/30',
        value: 'text-violet-900',
        accent: 'bg-violet-500',
    },
    amber: {
        card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-900',
        accent: 'bg-amber-500',
    },
    slate: {
        card: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-gray-100',
        icon: 'bg-slate-500 text-white shadow-slate-500/30',
        value: 'text-slate-900',
        accent: 'bg-slate-500',
    },
    rose: {
        card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-900',
        accent: 'bg-rose-500',
    },
};

const STATUS_KEYS = ['draft', 'confirmed', 'assigned', 'in_transit', 'delivered', 'cancelled'] as const;

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'bg-slate-100 text-slate-800';
        case 'confirmed':
            return 'bg-sky-100 text-sky-800';
        case 'assigned':
            return 'bg-violet-100 text-violet-800';
        case 'in_transit':
            return 'bg-amber-100 text-amber-800';
        case 'delivered':
            return 'bg-emerald-100 text-emerald-800';
        default:
            return 'bg-rose-100 text-rose-800';
    }
}

function IconBox(): JSX.Element {
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

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
    href,
}: {
    label: string;
    value: number | string;
    hint?: string;
    tone: StatTone;
    icon: JSX.Element;
    href?: string;
}): JSX.Element {
    const styles = STAT_TONES[tone];
    const body = (
        <>
            <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className={`mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${styles.value}`}>{value}</p>
                    {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>{icon}</div>
            </div>
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

function QuickAction({ href, title, description }: { href: string; title: string; description: string }): JSX.Element {
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
    const locale = useLocaleTag();
    const { summary, dispatch, by_status, alerts, recent } = board;
    const statusTotal = STATUS_KEYS.reduce((sum, key) => sum + by_status[key], 0);
    const demandOpen = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(summary.demand_open_kg);
    const demandDelivered = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
        summary.demand_delivered_this_month_kg,
    );

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('orders.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('orders.create')}>
                                <PrimaryButton>{t('orders.index.new')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('orders.dashboard.title')} />

            <OrdersNav />

            <p className="mb-6 text-sm text-gray-600">{t('orders.dashboard.subtitle')}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('orders.dashboard.open_pipeline')}
                    value={summary.open_pipeline}
                    hint={t('orders.dashboard.open_pipeline_hint', { kg: demandOpen })}
                    tone="sky"
                    icon={<IconBox />}
                    href={prefixedRoute('orders.index')}
                />
                <StatCard
                    label={t('orders.dashboard.ready_from_gin')}
                    value={summary.ready_from_gin}
                    hint={t('orders.dashboard.ready_from_gin_hint')}
                    tone={summary.ready_from_gin > 0 ? 'violet' : 'slate'}
                    icon={<IconBox />}
                    href={prefixedRoute('orders.index', { queue: 'ready_from_gin' })}
                />
                <StatCard
                    label={t('orders.dashboard.in_flight')}
                    value={summary.in_flight}
                    hint={t('orders.dashboard.in_flight_hint', {
                        assigned: dispatch.assigned_count,
                        transit: dispatch.in_transit_count,
                    })}
                    tone={summary.in_flight > 0 ? 'amber' : 'slate'}
                    icon={<IconBox />}
                    href={prefixedRoute('orders.index', { status: 'in_transit' })}
                />
                <StatCard
                    label={t('orders.dashboard.needs_attention')}
                    value={alerts.attention}
                    hint={t('orders.dashboard.needs_attention_hint')}
                    tone={alerts.attention > 0 ? 'rose' : 'slate'}
                    icon={<IconAlert />}
                />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                        {t('orders.dashboard.overdue')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-rose-900">{dispatch.overdue_count}</p>
                    <p className="mt-1 text-xs text-rose-700/80">{t('orders.dashboard.overdue_hint')}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t('orders.dashboard.unassigned')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{summary.unassigned_confirmed}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('orders.dashboard.unassigned_hint')}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t('orders.dashboard.drafts')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{dispatch.draft_count}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('orders.dashboard.drafts_hint')}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        {t('orders.dashboard.delivered_month')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-emerald-900">{summary.delivered_this_month}</p>
                    <p className="mt-1 text-xs text-emerald-800/80">
                        {t('orders.dashboard.delivered_month_hint', { kg: demandDelivered })}
                    </p>
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{t('orders.dashboard.by_status')}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{t('orders.dashboard.by_status_help')}</p>
                    </div>
                    <div className="space-y-3">
                        {STATUS_KEYS.map((key) => (
                            <div key={key}>
                                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-600">
                                    <span className="font-medium text-gray-800">{t(`orders.status.${key}`)}</span>
                                    <span className="tabular-nums">{by_status[key]}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
                                    <div
                                        className="h-full rounded-full bg-indigo-500"
                                        style={{
                                            width: `${Math.max(
                                                statusTotal > 0 ? (by_status[key] / statusTotal) * 100 : 0,
                                                by_status[key] > 0 ? 8 : 0,
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('orders.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('orders.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('orders.index')}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                            {t('orders.dashboard.view_orders')}
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('orders.dashboard.col_order')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('orders.dashboard.col_route')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('orders.dashboard.col_trip')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('orders.dashboard.col_when')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('orders.dashboard.col_status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            {t('orders.dashboard.empty_open')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('orders.show', order.id)}
                                                    className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                                                >
                                                    {order.code}
                                                </Link>
                                                {order.partner && (
                                                    <p className="text-xs text-gray-500">{order.partner.name}</p>
                                                )}
                                                {order.from_gin && (
                                                    <span className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                                                        {t('orders.index.from_gin_badge')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                <p className="truncate">{order.pickup_address}</p>
                                                <p className="truncate text-xs text-gray-500">→ {order.delivery_address}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {order.trip?.code ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                <p>{order.order_date ? formatDate(order.order_date, locale) : '—'}</p>
                                                {order.promised_at && (
                                                    <p className="text-gray-500">
                                                        {formatDateTime(order.promised_at, locale)}
                                                    </p>
                                                )}
                                                {order.is_overdue && (
                                                    <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                                                        {t('orders.dashboard.overdue_badge')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(order.status)}`}
                                                >
                                                    {t(`orders.status.${order.status}`, undefined, order.status)}
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

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('orders.dashboard.quick_actions')}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickAction
                        href={prefixedRoute('orders.index')}
                        title={t('orders.nav.orders')}
                        description={t('orders.dashboard.quick_orders')}
                    />
                    {can.create && (
                        <QuickAction
                            href={prefixedRoute('orders.create')}
                            title={t('orders.index.new')}
                            description={t('orders.dashboard.quick_create')}
                        />
                    )}
                    <QuickAction
                        href={prefixedRoute('orders.index', { queue: 'ready_from_gin' })}
                        title={t('orders.index.queue_ready_from_gin')}
                        description={t('orders.dashboard.quick_gin')}
                    />
                    <QuickAction
                        href={prefixedRoute('orders.index', { status: 'confirmed' })}
                        title={t('orders.status.confirmed')}
                        description={t('orders.dashboard.quick_confirmed')}
                    />
                </div>
            </div>
        </DynamicLayout>
    );
}
