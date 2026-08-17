import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import PayablesNav from '../../../../PayablesNav';

interface Board {
    summary: {
        open_ap: number;
        open_bills: number;
        draft_bills: number;
        posted_this_month: number;
        payments_posted: number;
        payments_voided: number;
    };
    aging: {
        buckets: {
            current: number;
            '1_30': number;
            '31_60': number;
            '61_90': number;
            '90_plus': number;
        };
        overdue_count: number;
        overdue_amount: number;
    };
    alerts: {
        draft_bills: number;
        attention: number;
    };
    top_partners: Array<{
        partner_id: number;
        code: string | null;
        name: string;
        outstanding: number;
        overdue: number;
    }>;
    recent: Array<{
        id: number;
        code: string;
        amount: number;
        method: string;
        status: string;
        payment_date: string | null;
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

const BUCKET_KEYS = ['current', '1_30', '31_60', '61_90', '90_plus'] as const;

function sharePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
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

function IconUsers(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
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
    const isPosted = status === 'posted';

    const style = isPosted
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50';

    const dot = isPosted ? 'bg-emerald-500' : 'bg-rose-500';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`payables.status.${status}`, undefined, status)}
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
    const { summary, aging, alerts, top_partners, recent } = board;
    const overdueShare = sharePercent(aging.overdue_amount, summary.open_ap);
    const partnerMax = Math.max(...top_partners.map((row) => row.outstanding), 1);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('payables.title')}
                    description={t('payables.dashboard.subtitle')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('payables.payments.create')}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">➕ {t('payables.payments.create')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('payables.dashboard.title')} />

            <PayablesNav />

            {/* Stat Overview Cards Grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('payables.dashboard.open_ap')}
                    value={formatMoney(summary.open_ap)}
                    hint={t('payables.dashboard.open_bills', { count: summary.open_bills })}
                    tone="sky"
                    icon={<IconInbox />}
                    href={prefixedRoute('payables.bills.index')}
                />
                <StatCard
                    label={t('payables.dashboard.overdue')}
                    value={formatMoney(aging.overdue_amount)}
                    hint={t('payables.dashboard.overdue_hint', { count: aging.overdue_count })}
                    tone={aging.overdue_count > 0 ? 'rose' : 'slate'}
                    icon={<IconAlert />}
                    progress={overdueShare}
                    progressLabel={t('payables.dashboard.of_open_ap')}
                    href={prefixedRoute('payables.bills.index')}
                />
                <StatCard
                    label={t('payables.dashboard.paid_this_month')}
                    value={formatMoney(summary.posted_this_month)}
                    hint={t('payables.dashboard.posted_payments', { count: summary.payments_posted })}
                    tone="emerald"
                    icon={<IconCash />}
                    href={prefixedRoute('payables.payments.index')}
                />
                <StatCard
                    label={t('payables.dashboard.needs_attention')}
                    value={alerts.attention}
                    hint={t('payables.dashboard.needs_attention_hint')}
                    tone={alerts.attention > 0 ? 'amber' : 'slate'}
                    icon={<IconUsers />}
                    meta={[
                        { label: t('payables.dashboard.overdue_short'), value: aging.overdue_count },
                        { label: t('payables.dashboard.draft_bills'), value: alerts.draft_bills },
                    ]}
                />
            </div>

            {/* Aging Buckets Overview */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {BUCKET_KEYS.map((key) => (
                    <div key={key} className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {t(`payables.buckets.${key}`)}
                        </p>
                        <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">{formatMoney(aging.buckets[key])}</p>
                        <p className="mt-1 text-xs text-slate-400">
                            {sharePercent(aging.buckets[key], summary.open_ap)}% {t('payables.dashboard.of_open_ap')}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Section: Top Suppliers & Recent Payments */}
            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                {/* Left Column: Top Suppliers */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">🏬 {t('payables.dashboard.top_suppliers')}</h3>
                            <p className="mt-0.5 text-xs text-slate-400">{t('payables.dashboard.top_suppliers_help')}</p>
                        </div>
                    </div>
                    {top_partners.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400">{t('payables.bills.empty')}</p>
                    ) : (
                        <div className="space-y-4">
                            {top_partners.map((row) => (
                                <div key={row.partner_id}>
                                    <div className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span className="truncate">
                                            {row.name}
                                            {row.code ? ` (${row.code})` : ''}
                                        </span>
                                        <span className="shrink-0 font-mono text-slate-900 dark:text-white">{formatMoney(row.outstanding)}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-indigo-500"
                                            style={{ width: `${Math.max(8, (row.outstanding / partnerMax) * 100)}%` }}
                                        />
                                    </div>
                                    {row.overdue > 0 && (
                                        <p className="mt-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                            ⚠️ {t('payables.dashboard.partner_overdue', {
                                                amount: formatMoney(row.overdue),
                                            })}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Recent Payments Table */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">💸 {t('payables.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-slate-400">{t('payables.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('payables.payments.index')}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            {t('payables.dashboard.view_payments')} →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.code')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.supplier')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.method')}</th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.amount')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payables.fields.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                                            {t('payables.payments.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((payment) => (
                                        <tr key={payment.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={prefixedRoute('payables.payments.show', payment.id)}
                                                    className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {payment.code}
                                                </Link>
                                                <p className="mt-0.5 font-mono text-[10px] text-slate-400">{payment.payment_date ?? '—'}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{payment.partner?.name ?? '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                                {t(`payables.methods.${payment.method}`, undefined, payment.method)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {formatMoney(payment.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={payment.status} />
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
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">⚡ {t('payables.dashboard.quick_actions')}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <QuickAction
                        href={prefixedRoute('payables.bills.index')}
                        title={t('payables.nav.bills')}
                        description={t('payables.dashboard.quick_bills')}
                    />
                    <QuickAction
                        href={prefixedRoute('payables.payments.index')}
                        title={t('payables.nav.payments')}
                        description={t('payables.dashboard.quick_payments')}
                    />
                    {can.create && (
                        <QuickAction
                            href={prefixedRoute('payables.payments.create')}
                            title={t('payables.payments.create')}
                            description={t('payables.dashboard.quick_create_payment')}
                        />
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
