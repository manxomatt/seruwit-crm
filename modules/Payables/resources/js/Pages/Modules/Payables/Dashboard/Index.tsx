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
    const { summary, aging, alerts, top_partners, recent } = board;
    const overdueShare = sharePercent(aging.overdue_amount, summary.open_ap);
    const partnerMax = Math.max(...top_partners.map((row) => row.outstanding), 1);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('payables.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('payables.payments.create')}>
                                <PrimaryButton>{t('payables.payments.create')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('payables.dashboard.title')} />

            <PayablesNav />

            <p className="mb-6 text-sm text-gray-600">{t('payables.dashboard.subtitle')}</p>

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
                        { label: t('payables.dashboard.draft_short'), value: alerts.draft_bills },
                    ]}
                />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {BUCKET_KEYS.map((key) => (
                    <div key={key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {t(`payables.buckets.${key}`)}
                        </p>
                        <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{formatMoney(aging.buckets[key])}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {sharePercent(aging.buckets[key], summary.open_ap)}% {t('payables.dashboard.of_open_ap')}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('payables.dashboard.top_suppliers')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('payables.dashboard.top_suppliers_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('payables.bills.index')}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                            {t('payables.dashboard.view_bills')}
                        </Link>
                    </div>
                    {top_partners.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('payables.dashboard.empty_ap')}</p>
                    ) : (
                        <div className="space-y-3">
                            {top_partners.map((row) => (
                                <div key={row.partner_id}>
                                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-600">
                                        <span className="truncate font-medium text-gray-800">
                                            {row.name}
                                            {row.code ? ` (${row.code})` : ''}
                                        </span>
                                        <span className="shrink-0 tabular-nums">{formatMoney(row.outstanding)}</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
                                        <div
                                            className="h-full rounded-full bg-indigo-500"
                                            style={{ width: `${Math.max(8, (row.outstanding / partnerMax) * 100)}%` }}
                                        />
                                    </div>
                                    {row.overdue > 0 && (
                                        <p className="mt-1 text-[11px] font-medium text-rose-600">
                                            {t('payables.dashboard.partner_overdue', {
                                                amount: formatMoney(row.overdue),
                                            })}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('payables.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('payables.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('payables.payments.index')}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                            {t('payables.dashboard.view_payments')}
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('payables.fields.code')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('payables.fields.supplier')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('payables.fields.method')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                        {t('payables.fields.amount')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('payables.fields.status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            {t('payables.payments.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('payables.payments.show', payment.id)}
                                                    className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                                                >
                                                    {payment.code}
                                                </Link>
                                                <p className="text-xs text-gray-500">{payment.payment_date ?? '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{payment.partner?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {t(`payables.methods.${payment.method}`, undefined, payment.method)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                                                {formatMoney(payment.amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        payment.status === 'posted'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {t(`payables.status.${payment.status}`, undefined, payment.status)}
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
                <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('payables.dashboard.quick_actions')}</h3>
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
                            description={t('payables.dashboard.quick_record')}
                        />
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
