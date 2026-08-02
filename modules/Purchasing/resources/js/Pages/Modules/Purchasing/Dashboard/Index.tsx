import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import PurchasingNav from '../../../../PurchasingNav';

interface Board {
    summary: {
        open_pipeline: number;
        awaiting_receipt: number;
        open_amount: number;
        draft_count: number;
        submitted_count: number;
        ordered_this_month: number;
        ordered_this_month_amount: number;
    };
    receipts: {
        overdue_count: number;
        overdue_amount: number;
        grn_draft: number;
        grn_confirmed_this_month: number;
    };
    returns: {
        draft: number;
        confirmed_this_month: number;
    };
    by_status: {
        draft: number;
        submitted: number;
        approved: number;
        partial_received: number;
        fully_received: number;
        closed: number;
        cancelled: number;
    };
    alerts: {
        attention: number;
    };
    recent: Array<{
        id: number;
        po_number: string;
        status: string;
        ordered_at: string | null;
        expected_at: string | null;
        total_amount: number;
        is_overdue: boolean;
        partner: { id: number; code: string; name: string } | null;
        warehouse: { id: number; name: string } | null;
    }>;
}

interface Props {
    board: Board;
    can: { create: boolean };
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

const STATUS_KEYS = [
    'draft',
    'submitted',
    'approved',
    'partial_received',
    'fully_received',
    'closed',
    'cancelled',
] as const;

function sharePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function IconTruck(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
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

function IconClipboard(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3-12.75H15a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0115 21H9a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 019 4.5h1.5m3.75 0v3.75H9.75V4.5m6.75 0A2.25 2.25 0 0014.25 2.25H9.75A2.25 2.25 0 007.5 4.5"
            />
        </svg>
    );
}

function IconInbox(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3"
            />
        </svg>
    );
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'submitted':
            return 'bg-blue-100 text-blue-800';
        case 'approved':
            return 'bg-sky-100 text-sky-800';
        case 'partial_received':
            return 'bg-amber-100 text-amber-800';
        case 'fully_received':
            return 'bg-emerald-100 text-emerald-800';
        case 'closed':
            return 'bg-slate-100 text-slate-700';
        default:
            return 'bg-rose-100 text-rose-800';
    }
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
                    <p className={`mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${styles.value}`}>{value}</p>
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
    const { summary, receipts, returns, by_status, alerts, recent } = board;
    const overdueShare = sharePercent(receipts.overdue_amount, summary.open_amount);
    const statusTotal = STATUS_KEYS.reduce((sum, key) => sum + by_status[key], 0);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('purchasing.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('purchasing.purchase-orders.create')}>
                                <PrimaryButton>{t('purchasing.purchase_orders.index.new')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('purchasing.dashboard.title')} />

            <PurchasingNav />

            <p className="mb-6 text-sm text-gray-600">{t('purchasing.dashboard.subtitle')}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('purchasing.dashboard.open_pipeline')}
                    value={summary.open_pipeline}
                    hint={t('purchasing.dashboard.open_pipeline_hint', { count: summary.open_pipeline })}
                    tone="sky"
                    icon={<IconClipboard />}
                    href={prefixedRoute('purchasing.purchase-orders.index')}
                />
                <StatCard
                    label={t('purchasing.dashboard.awaiting_receipt')}
                    value={summary.awaiting_receipt}
                    hint={t('purchasing.dashboard.awaiting_receipt_hint', {
                        amount: formatMoney(summary.open_amount),
                    })}
                    tone="violet"
                    icon={<IconTruck />}
                    href={prefixedRoute('purchasing.purchase-orders.index', { status: 'approved' })}
                />
                <StatCard
                    label={t('purchasing.dashboard.ordered_month')}
                    value={formatMoney(summary.ordered_this_month_amount)}
                    hint={t('purchasing.dashboard.ordered_month_hint', { count: summary.ordered_this_month })}
                    tone="emerald"
                    icon={<IconInbox />}
                    href={prefixedRoute('purchasing.purchase-orders.index')}
                />
                <StatCard
                    label={t('purchasing.dashboard.needs_attention')}
                    value={alerts.attention}
                    hint={t('purchasing.dashboard.needs_attention_hint')}
                    tone={alerts.attention > 0 ? 'amber' : 'slate'}
                    icon={<IconAlert />}
                    meta={[
                        { label: t('purchasing.dashboard.overdue_short'), value: receipts.overdue_count },
                        { label: t('purchasing.dashboard.submitted_short'), value: summary.submitted_count },
                        { label: t('purchasing.dashboard.grn_draft_short'), value: receipts.grn_draft },
                        { label: t('purchasing.dashboard.returns_short'), value: returns.draft },
                    ]}
                />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                        {t('purchasing.dashboard.overdue')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-rose-900">
                        {formatMoney(receipts.overdue_amount)}
                    </p>
                    <p className="mt-1 text-xs text-rose-700/80">
                        {receipts.overdue_count} · {t('purchasing.dashboard.overdue_hint')}
                    </p>
                    {summary.open_amount > 0 && (
                        <p className="mt-2 text-[11px] font-medium text-rose-600">
                            {overdueShare}% {t('purchasing.dashboard.of_open_amount')}
                        </p>
                    )}
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t('purchasing.dashboard.grn_queue')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{receipts.grn_draft}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('purchasing.dashboard.grn_queue_hint')}</p>
                    <p className="mt-2 text-[11px] font-medium text-gray-600">
                        {receipts.grn_confirmed_this_month} {t('purchasing.dashboard.grn_confirmed_month')}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t('purchasing.dashboard.returns_card')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{returns.draft}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('purchasing.dashboard.returns_help')}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-gray-600">
                        <span>
                            {returns.draft} {t('purchasing.dashboard.returns_draft')}
                        </span>
                        <span>
                            {returns.confirmed_this_month} {t('purchasing.dashboard.returns_confirmed_month')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{t('purchasing.dashboard.by_status')}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{t('purchasing.dashboard.by_status_help')}</p>
                    </div>
                    <div className="space-y-3">
                        {STATUS_KEYS.map((key) => (
                            <div key={key}>
                                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-600">
                                    <span className="font-medium text-gray-800">{t(`purchasing.status.${key}`)}</span>
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
                            <h3 className="text-sm font-semibold text-gray-900">{t('purchasing.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('purchasing.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('purchasing.purchase-orders.index')}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                            {t('purchasing.dashboard.view_pos')}
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('purchasing.dashboard.col_po')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('purchasing.dashboard.col_supplier')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('purchasing.dashboard.col_expected')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                        {t('purchasing.dashboard.col_total')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('purchasing.dashboard.col_status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            {t('purchasing.dashboard.empty_open')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((po) => (
                                        <tr key={po.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('purchasing.purchase-orders.show', po.id)}
                                                    className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                                                >
                                                    {po.po_number}
                                                </Link>
                                                <p className="text-xs text-gray-500">{po.ordered_at ?? '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                <p>{po.partner?.name ?? '—'}</p>
                                                <p className="text-xs text-gray-500">{po.warehouse?.name ?? ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {po.expected_at ?? '—'}
                                                {po.is_overdue && (
                                                    <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                                                        {t('purchasing.dashboard.overdue_badge')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                                                {formatMoney(po.total_amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(po.status)}`}
                                                >
                                                    {t(`purchasing.status.${po.status}`, undefined, po.status)}
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
                <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('purchasing.dashboard.quick_actions')}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickAction
                        href={prefixedRoute('purchasing.purchase-orders.index')}
                        title={t('purchasing.nav.purchase_orders')}
                        description={t('purchasing.dashboard.quick_pos')}
                    />
                    {can.create && (
                        <QuickAction
                            href={prefixedRoute('purchasing.purchase-orders.create')}
                            title={t('purchasing.purchase_orders.index.new')}
                            description={t('purchasing.dashboard.quick_create')}
                        />
                    )}
                    <QuickAction
                        href={prefixedRoute('purchasing.purchase-orders.index', { status: 'approved' })}
                        title={t('purchasing.status.approved')}
                        description={t('purchasing.dashboard.quick_awaiting')}
                    />
                    <QuickAction
                        href={prefixedRoute('purchasing.purchase-orders.index', { status: 'submitted' })}
                        title={t('purchasing.status.submitted')}
                        description={t('purchasing.dashboard.quick_submitted')}
                    />
                </div>
            </div>
        </DynamicLayout>
    );
}
