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
    { card: string; icon: string; value: string; bar: string; track: string }
> = {
    emerald: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
        value: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
        track: 'bg-emerald-100 dark:bg-emerald-950/60',
    },
    sky: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
        value: 'text-slate-900 dark:text-white',
        bar: 'bg-sky-500',
        track: 'bg-sky-100 dark:bg-sky-950/60',
    },
    violet: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
        value: 'text-violet-600 dark:text-violet-400',
        bar: 'bg-violet-500',
        track: 'bg-violet-100 dark:bg-violet-950/60',
    },
    amber: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
        value: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
        track: 'bg-amber-100 dark:bg-amber-950/60',
    },
    slate: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        value: 'text-slate-900 dark:text-white',
        bar: 'bg-slate-500',
        track: 'bg-slate-200 dark:bg-slate-800',
    },
    rose: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
        value: 'text-rose-600 dark:text-rose-400',
        bar: 'bg-rose-500',
        track: 'bg-rose-100 dark:bg-rose-950/60',
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

function IconArrow(): JSX.Element {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
    );
}

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const isPaid = status === 'paid';
    const isIssued = status === 'issued';
    const isPartial = status === 'partially_paid';
    const isDraft = status === 'draft';

    const style = isPaid
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
        : isIssued
        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50'
        : isPartial
        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
        : isDraft
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50';

    const dot = isPaid ? 'bg-emerald-500' : isIssued ? 'bg-sky-500' : isPartial ? 'bg-amber-500' : isDraft ? 'bg-slate-400' : 'bg-rose-500';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`invoicing.status.${status}`, undefined, status)}
        </span>
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
        <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${styles.icon}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`text-xl font-extrabold truncate ${styles.value}`}>{value}</p>
                {hint && <p className="mt-0.5 text-[11px] text-slate-400 truncate">{hint}</p>}

                {clampedProgress !== undefined && (
                    <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span className="truncate">{progressLabel}</span>
                            <span className="tabular-nums font-mono">{clampedProgress}%</span>
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
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                            >
                                <span className="tabular-nums font-mono text-slate-900 dark:text-white">{item.value}</span>
                                <span>{item.label}</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className={`block rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${styles.card}`}
            >
                {body}
            </Link>
        );
    }

    return <div className={`rounded-3xl border p-5 shadow-sm ${styles.card}`}>{body}</div>;
}

function QuickAction({ href, title, description }: { href: string; title: string; description: string }): JSX.Element {
    return (
        <Link
            href={href}
            className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
        >
            <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{title}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{description}</p>
            </div>
            <span className="mt-0.5 text-slate-400 transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <IconArrow />
            </span>
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
                    description={t('invoicing.dashboard.subtitle')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('invoicing.invoices.create')}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">{t('invoicing.index.new')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('invoicing.dashboard.title')} />

            <InvoicingNav />

            {/* Stat Cards Grid */}
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

            {/* Aging Breakdown Row */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        ⏳ {t('invoicing.dashboard.aging_current')}
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{formatMoney(aging.current_amount)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        {aging.current_count} · {t('invoicing.dashboard.aging_current_hint')}
                    </p>
                </div>
                <div className="rounded-3xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/60 dark:bg-rose-950/30 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        ⚠️ {t('invoicing.dashboard.aging_overdue')}
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-rose-700 dark:text-rose-300">{formatMoney(aging.overdue_amount)}</p>
                    <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-400/80">
                        {aging.overdue_count} · {t('invoicing.dashboard.aging_overdue_hint')}
                    </p>
                </div>
            </div>

            {/* Main Section: By Status & Recent Invoices */}
            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                {/* Left Column: Status Distribution */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">📊 {t('invoicing.dashboard.by_status')}</h3>
                        <p className="mt-0.5 text-xs text-slate-400">{t('invoicing.dashboard.by_status_help')}</p>
                    </div>
                    <div className="space-y-4">
                        {STATUS_KEYS.map((key) => (
                            <div key={key}>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>{t(`invoicing.status.${key}`)}</span>
                                    <span className="font-mono text-slate-900 dark:text-white">{by_status[key]}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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

                {/* Right Column: Recent Invoices Table */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">📑 {t('invoicing.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-slate-400">{t('invoicing.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('invoicing.invoices.index')}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            {t('invoicing.dashboard.view_invoices')} →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.dashboard.col_code')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.dashboard.col_partner')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.dashboard.col_due')}</th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('invoicing.dashboard.col_balance')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.dashboard.col_status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            {t('invoicing.dashboard.empty_open')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((invoice) => (
                                        <tr key={invoice.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={prefixedRoute('invoicing.invoices.show', invoice.id)}
                                                    className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {invoice.code}
                                                </Link>
                                                <p className="mt-0.5 font-mono text-[10px] text-slate-400">{invoice.issue_date ?? '—'}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{invoice.partner?.name ?? '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                {invoice.due_date ?? '—'}
                                                {invoice.is_overdue && (
                                                    <span className="ml-2 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                                                        ⚠️ {t('invoicing.dashboard.overdue_badge')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {formatMoney(invoice.balance)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={invoice.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">⚡ {t('invoicing.dashboard.quick_actions')}</h3>
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
