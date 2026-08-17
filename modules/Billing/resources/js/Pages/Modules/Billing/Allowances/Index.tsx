import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import PageHeader from '@/Components/PageHeader';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import BillingNav from '../../../../BillingNav';

interface Allowance {
    id: number;
    advance_amount: string;
    status: string;
    issued_at: string;
    settled_at: string | null;
    expenses_sum_amount: string | null;
    trip: {
        id: number;
        code: string;
        origin: string;
        destination: string;
        driver: { id: number; name: string } | null;
    };
}

interface PaginatedAllowances {
    data: Allowance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    allowances: PaginatedAllowances;
    summary: { unsettled_count: number; outstanding_advance: number };
    filters: { status: string | null };
    can: { create: boolean };
}

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const isSettled = status === 'settled';

    const style = isSettled
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
        : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50';

    const dot = isSettled ? 'bg-emerald-500' : 'bg-sky-500';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`billing.status.${status}`, undefined, status)}
        </span>
    );
}

export default function Index({ allowances, summary, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const handleStatusFilter = (status: string) => {
        router.get(prefixedRoute('billing.allowances.index'), { status: status || undefined }, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('billing.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('billing.allowances.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">➕ {t('billing.allowances.issue')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('billing.allowances.head')} />

            <BillingNav />

            {/* Summary Cards Grid */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.unsettled')}</p>
                    <p className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{summary.unsettled_count}</p>
                    <p className="mt-1 text-xs text-slate-400">{t('billing.allowances.unsettled_hint')}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.outstanding')}</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{formatMoney(summary.outstanding_advance)}</p>
                    <p className="mt-1 text-xs text-slate-400">{t('billing.allowances.outstanding_hint')}</p>
                </div>
            </div>

            {/* Allowances Table Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">🚚 {t('billing.allowances.head')}</h3>
                    <Select
                        className="w-44"
                        value={filters.status || ''}
                        onChange={handleStatusFilter}
                        placeholder={t('billing.status.all')}
                        options={[
                            { value: '', label: t('billing.status.all') },
                            { value: 'issued', label: t('billing.status.issued') },
                            { value: 'settled', label: t('billing.status.settled') },
                        ]}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.columns.trip')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.columns.driver')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.columns.advance')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.columns.expenses')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.columns.balance')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.columns.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {allowances.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center font-bold text-slate-400">
                                        {t('billing.allowances.empty_title')}
                                    </td>
                                </tr>
                            ) : (
                                allowances.data.map((allowance) => {
                                    const expenses = Number(allowance.expenses_sum_amount ?? 0);
                                    const balance = Number(allowance.advance_amount) - expenses;
                                    return (
                                        <tr
                                            key={allowance.id}
                                            className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition cursor-pointer"
                                            onClick={() => router.get(prefixedRoute('billing.allowances.show', allowance.id))}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                                    {allowance.trip.code}
                                                </span>
                                                <span className="block text-[11px] text-slate-400 font-medium">{allowance.trip.origin} → {allowance.trip.destination}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{allowance.trip.driver?.name || '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(allowance.advance_amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(expenses)}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-right font-mono font-bold ${balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                                {formatMoney(balance)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={allowance.status} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {allowances.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 px-6 py-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {t('common.showing_results', {
                                from: (allowances.current_page - 1) * allowances.per_page + 1,
                                to: Math.min(allowances.current_page * allowances.per_page, allowances.total),
                                total: allowances.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {allowances.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-xl px-1 text-xs font-bold transition ${
                                        link.active
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : link.url
                                              ? 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                              : 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
