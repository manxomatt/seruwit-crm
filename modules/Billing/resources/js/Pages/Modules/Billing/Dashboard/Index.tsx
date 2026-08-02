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
    const { charges, tariffs, allowances, alerts, recent } = board;

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('billing.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('billing.invoices.create')}>
                                <PrimaryButton>{t('billing.nav.invoices')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('billing.dashboard.title')} />

            <BillingNav />

            <p className="mb-6 text-sm text-gray-600">{t('billing.dashboard.subtitle')}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('billing.dashboard.uninvoiced')}
                    value={charges.uninvoiced}
                    hint={t('billing.dashboard.uninvoiced_hint', {
                        amount: formatMoney(charges.uninvoiced_amount),
                    })}
                    tone={charges.uninvoiced > 0 ? 'amber' : 'slate'}
                    icon={<IconCash />}
                    href={`${prefixedRoute('billing.charges.index')}?uninvoiced=1`}
                />
                <StatCard
                    label={t('billing.dashboard.unpriced')}
                    value={charges.unpriced}
                    hint={t('billing.dashboard.unpriced_hint', { total: charges.billable })}
                    tone={charges.unpriced > 0 ? 'rose' : 'slate'}
                    icon={<IconAlert />}
                    progress={sharePercent(charges.unpriced, charges.billable)}
                    progressLabel={t('billing.dashboard.of_billable')}
                    href={prefixedRoute('billing.charges.index')}
                />
                <StatCard
                    label={t('billing.dashboard.charges_month')}
                    value={formatMoney(charges.this_month_amount)}
                    hint={t('billing.dashboard.charges_month_hint', { count: charges.this_month_count })}
                    tone="emerald"
                    icon={<IconTruck />}
                    href={prefixedRoute('billing.charges.index')}
                />
                <StatCard
                    label={t('billing.dashboard.needs_attention')}
                    value={alerts.attention}
                    hint={t('billing.dashboard.needs_attention_hint')}
                    tone={alerts.attention > 0 ? 'violet' : 'slate'}
                    icon={<IconTag />}
                    meta={[
                        { label: t('billing.dashboard.unpriced_short'), value: charges.unpriced },
                        { label: t('billing.dashboard.uninvoiced_short'), value: charges.uninvoiced },
                        { label: t('billing.dashboard.allowances_short'), value: allowances.issued },
                    ]}
                />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900">{t('billing.dashboard.tariffs_card')}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{t('billing.dashboard.tariffs_help')}</p>
                    <p className="mt-4 text-3xl font-bold tabular-nums text-gray-900">{tariffs.active}</p>
                    <p className="mt-1 text-xs text-gray-600">
                        {t('billing.dashboard.of_tariffs', { total: tariffs.total })}
                    </p>
                    <Link
                        href={prefixedRoute('billing.tariffs.index')}
                        className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
                    >
                        {t('billing.dashboard.manage_tariffs')}
                    </Link>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('billing.dashboard.allowances_card')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('billing.dashboard.allowances_help')}</p>
                        </div>
                        <Link
                            href={`${prefixedRoute('billing.allowances.index')}?status=issued`}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                            {t('billing.dashboard.view_allowances')}
                        </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {t('billing.dashboard.issued_allowances')}
                            </p>
                            <p className="mt-2 text-2xl font-bold tabular-nums text-amber-800">{allowances.issued}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {t('billing.dashboard.outstanding_advance')}
                            </p>
                            <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
                                {formatMoney(allowances.outstanding_advance)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {t('billing.dashboard.settled_month')}
                            </p>
                            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">
                                {allowances.settled_this_month}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">{t('billing.dashboard.recent')}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{t('billing.dashboard.recent_help')}</p>
                    </div>
                    <Link
                        href={`${prefixedRoute('billing.charges.index')}?uninvoiced=1`}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                        {t('billing.dashboard.view_uninvoiced')}
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    {t('billing.dashboard.col_order')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    {t('billing.dashboard.col_partner')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    {t('billing.dashboard.col_route')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                    {t('billing.dashboard.col_amount')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {recent.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                                        {t('billing.dashboard.empty_uninvoiced')}
                                    </td>
                                </tr>
                            ) : (
                                recent.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs font-medium text-gray-900">{order.code}</p>
                                            <p className="text-xs text-gray-500">{order.order_date ?? '—'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{order.partner?.name ?? '—'}</td>
                                        <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-600">{order.route || '—'}</td>
                                        <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                                            {order.amount > 0 ? formatMoney(order.amount) : t('billing.dashboard.unpriced_label')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('billing.dashboard.quick_actions')}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {can.create && (
                        <QuickAction
                            href={prefixedRoute('billing.invoices.create')}
                            title={t('billing.nav.invoices')}
                            description={t('billing.dashboard.quick_invoice')}
                        />
                    )}
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
