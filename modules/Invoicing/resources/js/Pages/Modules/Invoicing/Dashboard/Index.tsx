import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import InvoicingNav from '../../../../InvoicingNav';

interface Board {
    summary: {
        outstanding: number;
        open_count: number;
        draft_count: number;
        void_count: number;
        paid_this_month: number;
        issued_this_month: number;
    };
    aging: {
        overdue_count: number;
        overdue_amount: number;
        current_count: number;
        current_amount: number;
    };
    by_status: {
        draft: number;
        issued: number;
        partially_paid: number;
        paid: number;
        void: number;
    };
    alerts: {
        attention: number;
    };
    recent: Array<{
        id: number;
        code: string;
        status: string;
        issue_date: string | null;
        due_date: string | null;
        total: number;
        balance: number;
        is_overdue: boolean;
        partner: { id: number; code: string; name: string } | null;
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

const STATUS_KEYS = ['draft', 'issued', 'partially_paid', 'paid', 'void'] as const;

function sharePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function IconDocument(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
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

function IconCash(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
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
        case 'issued':
            return 'bg-blue-100 text-blue-800';
        case 'partially_paid':
            return 'bg-amber-100 text-amber-800';
        case 'paid':
            return 'bg-emerald-100 text-emerald-800';
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
    const { summary, aging, by_status, alerts, recent } = board;
    const overdueShare = sharePercent(aging.overdue_amount, summary.outstanding);
    const statusTotal = STATUS_KEYS.reduce((sum, key) => sum + by_status[key], 0);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('invoicing.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('invoicing.invoices.create')}>
                                <PrimaryButton>{t('invoicing.index.new')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('invoicing.dashboard.title')} />

            <InvoicingNav />

            <p className="mb-6 text-sm text-gray-600">{t('invoicing.dashboard.subtitle')}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('invoicing.dashboard.outstanding')}
                    value={formatMoney(summary.outstanding)}
                    hint={t('invoicing.dashboard.open_invoices', { count: summary.open_count })}
                    tone="sky"
                    icon={<IconDocument />}
                    href={prefixedRoute('invoicing.invoices.index', { status: 'issued' })}
                />
                <StatCard
                    label={t('invoicing.dashboard.overdue')}
                    value={formatMoney(aging.overdue_amount)}
                    hint={t('invoicing.dashboard.overdue_hint', { count: aging.overdue_count })}
                    tone={aging.overdue_count > 0 ? 'rose' : 'slate'}
                    icon={<IconAlert />}
                    progress={overdueShare}
                    progressLabel={t('invoicing.dashboard.of_outstanding')}
                    href={prefixedRoute('invoicing.invoices.index')}
                />
                <StatCard
                    label={t('invoicing.dashboard.paid_month')}
                    value={formatMoney(summary.paid_this_month)}
                    hint={t('invoicing.dashboard.issued_month', { count: summary.issued_this_month })}
                    tone="emerald"
                    icon={<IconCash />}
                    href={prefixedRoute('invoicing.invoices.index', { status: 'paid' })}
                />
                <StatCard
                    label={t('invoicing.dashboard.needs_attention')}
                    value={alerts.attention}
                    hint={t('invoicing.dashboard.needs_attention_hint')}
                    tone={alerts.attention > 0 ? 'amber' : 'slate'}
                    icon={<IconInbox />}
                    meta={[
                        { label: t('invoicing.dashboard.overdue_short'), value: aging.overdue_count },
                        { label: t('invoicing.dashboard.draft_short'), value: summary.draft_count },
                    ]}
                    href={prefixedRoute('invoicing.invoices.index', { status: 'draft' })}
                />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t('invoicing.dashboard.aging_current')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{formatMoney(aging.current_amount)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                        {aging.current_count} · {t('invoicing.dashboard.aging_current_hint')}
                    </p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                        {t('invoicing.dashboard.aging_overdue')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-rose-900">{formatMoney(aging.overdue_amount)}</p>
                    <p className="mt-1 text-xs text-rose-700/80">
                        {aging.overdue_count} · {t('invoicing.dashboard.aging_overdue_hint')}
                    </p>
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{t('invoicing.dashboard.by_status')}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{t('invoicing.dashboard.by_status_help')}</p>
                    </div>
                    <div className="space-y-3">
                        {STATUS_KEYS.map((key) => (
                            <div key={key}>
                                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-600">
                                    <span className="font-medium text-gray-800">{t(`invoicing.status.${key}`)}</span>
                                    <span className="tabular-nums">{by_status[key]}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
                                    <div
                                        className="h-full rounded-full bg-indigo-500"
                                        style={{
                                            width: `${Math.max(statusTotal > 0 ? (by_status[key] / statusTotal) * 100 : 0, by_status[key] > 0 ? 8 : 0)}%`,
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
                            <h3 className="text-sm font-semibold text-gray-900">{t('invoicing.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('invoicing.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('invoicing.invoices.index')}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                            {t('invoicing.dashboard.view_invoices')}
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('invoicing.dashboard.col_code')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('invoicing.dashboard.col_partner')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('invoicing.dashboard.col_due')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                        {t('invoicing.dashboard.col_balance')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('invoicing.dashboard.col_status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            {t('invoicing.dashboard.empty_open')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('invoicing.invoices.show', invoice.id)}
                                                    className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                                                >
                                                    {invoice.code}
                                                </Link>
                                                <p className="text-xs text-gray-500">{invoice.issue_date ?? '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{invoice.partner?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {invoice.due_date ?? '—'}
                                                {invoice.is_overdue && (
                                                    <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                                                        {t('invoicing.dashboard.overdue_badge')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                                                {formatMoney(invoice.balance)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(invoice.status)}`}
                                                >
                                                    {t(`invoicing.status.${invoice.status}`, undefined, invoice.status)}
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
                <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('invoicing.dashboard.quick_actions')}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickAction
                        href={prefixedRoute('invoicing.invoices.index')}
                        title={t('invoicing.nav.invoices')}
                        description={t('invoicing.dashboard.quick_invoices')}
                    />
                    {can.create && (
                        <QuickAction
                            href={prefixedRoute('invoicing.invoices.create')}
                            title={t('invoicing.index.new')}
                            description={t('invoicing.dashboard.quick_create')}
                        />
                    )}
                    <QuickAction
                        href={prefixedRoute('invoicing.invoices.index', { status: 'draft' })}
                        title={t('invoicing.status.draft')}
                        description={t('invoicing.dashboard.quick_drafts')}
                    />
                    <QuickAction
                        href={prefixedRoute('invoicing.invoices.index', { status: 'issued' })}
                        title={t('invoicing.status.issued')}
                        description={t('invoicing.dashboard.quick_open')}
                    />
                </div>
            </div>
        </DynamicLayout>
    );
}
