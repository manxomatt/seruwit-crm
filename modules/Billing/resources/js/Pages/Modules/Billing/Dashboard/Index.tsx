import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import BillingNav from '../../../../BillingNav';

interface Board {
    charges: {
        billable: number;
        unpriced: number;
        uninvoiced: number;
        uninvoiced_amount: number;
        this_month_amount: number;
        this_month_count: number;
    };
    tariffs: {
        active: number;
        total: number;
    };
    allowances: {
        issued: number;
        outstanding_advance: number;
        settled_this_month: number;
    };
    alerts: {
        attention: number;
    };
    recent: Array<{
        id: number;
        code: string;
        status: string;
        order_date: string | null;
        route: string;
        amount: number;
        partner: { id: number; code: string; name: string } | null;
    }>;
}

interface Props {
    board: Board;
    can: { create: boolean; update: boolean };
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

function IconTruck(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.933c0-.829-.422-1.568-.971-2.04a20.01 20.01 0 00-5.444-2.756 1.936 1.936 0 00-1.67.158 20.066 20.066 0 00-4.356 3.063c-.55.472-.971 1.211-.971 2.04v.933m10.5 0a48.667 48.667 0 00-7.5 0"
            />
        </svg>
    );
}

function IconTag(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
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
    const { charges, tariffs, allowances, alerts, recent } = board;
    const uninvoicedShare = sharePercent(charges.uninvoiced, charges.billable);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('billing.title')}
                    description={t('billing.dashboard.subtitle')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('billing.invoices.create')}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">➕ {t('billing.nav.invoices')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('billing.dashboard.title')} />

            <BillingNav />

            {/* Stat Overview Cards Grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('billing.dashboard.uninvoiced_amount')}
                    value={formatMoney(charges.uninvoiced_amount)}
                    hint={t('billing.dashboard.uninvoiced_count', { count: charges.uninvoiced })}
                    tone="sky"
                    icon={<IconCash />}
                    progress={uninvoicedShare}
                    progressLabel={t('billing.dashboard.of_billable')}
                    href={prefixedRoute('billing.charges.index')}
                />
                <StatCard
                    label={t('billing.dashboard.needs_attention')}
                    value={alerts.attention}
                    hint={t('billing.dashboard.unpriced_charges', { count: charges.unpriced })}
                    tone={alerts.attention > 0 ? 'amber' : 'slate'}
                    icon={<IconAlert />}
                    href={prefixedRoute('billing.charges.index')}
                />
                <StatCard
                    label={t('billing.dashboard.active_tariffs')}
                    value={`${tariffs.active} / ${tariffs.total}`}
                    hint={t('billing.dashboard.tariff_rules')}
                    tone="violet"
                    icon={<IconTag />}
                    href={prefixedRoute('billing.tariffs.index')}
                />
                <StatCard
                    label={t('billing.dashboard.driver_allowances')}
                    value={formatMoney(allowances.outstanding_advance)}
                    hint={t('billing.dashboard.unsettled_allowances', { count: allowances.issued })}
                    tone="emerald"
                    icon={<IconTruck />}
                    href={prefixedRoute('billing.allowances.index')}
                />
            </div>

            {/* Main Section: Recent Uninvoiced Orders */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">📦 {t('billing.dashboard.recent_uninvoiced')}</h3>
                        <p className="mt-0.5 text-xs text-slate-400">{t('billing.dashboard.recent_help')}</p>
                    </div>
                    <Link
                        href={prefixedRoute('billing.charges.index')}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {t('billing.dashboard.view_charges')} →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.dashboard.col_order')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.dashboard.col_partner')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.dashboard.col_route')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('billing.dashboard.col_amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {recent.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold">
                                        {t('billing.dashboard.empty_uninvoiced')}
                                    </td>
                                </tr>
                            ) : (
                                recent.map((order) => (
                                    <tr key={order.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">{order.code}</span>
                                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">{order.order_date ?? '—'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{order.partner?.name ?? '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">{order.route}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {formatMoney(order.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">⚡ {t('billing.dashboard.quick_actions')}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickAction
                        href={prefixedRoute('billing.invoices.create')}
                        title={t('billing.nav.invoices')}
                        description={t('billing.dashboard.quick_invoice')}
                    />
                    <QuickAction
                        href={prefixedRoute('billing.charges.index')}
                        title={t('billing.nav.charges')}
                        description={t('billing.dashboard.quick_charges')}
                    />
                    <QuickAction
                        href={prefixedRoute('billing.tariffs.index')}
                        title={t('billing.nav.tariffs')}
                        description={t('billing.dashboard.quick_tariffs')}
                    />
                    <QuickAction
                        href={prefixedRoute('billing.allowances.index')}
                        title={t('billing.nav.allowances')}
                        description={t('billing.dashboard.quick_allowances')}
                    />
                </div>
            </div>
        </DynamicLayout>
    );
}
