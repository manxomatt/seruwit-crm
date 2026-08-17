import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ReceivablesNav from '../../../../ReceivablesNav';
import PageHeader from '@/Components/PageHeader';

interface Payment {
    id: number;
    code: string;
    payment_date: string;
    amount: string;
    type: string;
    method: string;
    status: string;
    reference_number: string | null;
    partner: { id: number; code: string; name: string };
}

interface Props {
    payments: {
        data: Payment[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
    };
    alerts: { overdue_count: number; overdue_amount: number };
    summary: { posted_this_month: number; open_ar: number };
    filters: { search?: string; status?: string };
    can: { create: boolean; update: boolean; delete: boolean };
}

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

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
            {t(`receivables.status.${status}`, undefined, status)}
        </span>
    );
}

export default function Index({ payments, alerts, summary, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: { search?: string; status?: string }) => {
        router.get(
            prefixedRoute('receivables.payments.index'),
            {
                search: next.search || undefined,
                status: next.status || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search, status: filters.status });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('receivables.payments.index.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('receivables.payments.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">➕ {t('receivables.payments.index.record')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('receivables.payments.index.head')} />

            <ReceivablesNav />

            <div className="space-y-6">
                {alerts.overdue_count > 0 && (
                    <div className="rounded-3xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/40 p-4 text-xs font-bold text-amber-950 dark:text-amber-200 shadow-sm flex items-center justify-between gap-3">
                        <span>
                            ⚠️ {t('receivables.payments.index.overdue_alert', {
                                count: alerts.overdue_count,
                                amount: formatMoney(alerts.overdue_amount),
                            })}
                        </span>
                        <Link href={prefixedRoute('receivables.aging.index')} className="text-indigo-600 dark:text-indigo-400 underline shrink-0">
                            {t('receivables.payments.index.view_aging')} →
                        </Link>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {t('receivables.payments.index.open_ar')}
                        </p>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                            {formatMoney(summary.open_ar)}
                        </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {t('receivables.payments.index.received_this_month')}
                        </p>
                        <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(summary.posted_this_month)}
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <form onSubmit={submitSearch} className="flex flex-1 flex-wrap gap-2">
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('receivables.placeholders.search')}
                                className="min-w-[200px] flex-1 !rounded-2xl text-xs bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                            />
                            <PrimaryButton type="submit" className="!rounded-xl text-xs shadow-sm">{t('receivables.actions.search')}</PrimaryButton>
                        </form>
                        <Select
                            className="w-44"
                            value={filters.status ?? ''}
                            onChange={(value) => applyFilters({ search, status: value })}
                            placeholder={t('receivables.payments.index.all_statuses')}
                            options={[
                                { value: '', label: t('receivables.payments.index.all_statuses') },
                                { value: 'posted', label: t('receivables.status.posted') },
                                { value: 'voided', label: t('receivables.status.voided') },
                            ]}
                        />
                    </div>
                </div>

                {/* Payments Table */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.code')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.partner')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.type')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.method')}</th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.amount')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.date')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('receivables.fields.status')}</th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                {payments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-2xl mb-2">
                                                💳
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">{t('receivables.payments.index.empty')}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.data.map((payment) => (
                                        <tr key={payment.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                <Link href={prefixedRoute('receivables.payments.show', payment.id)} className="hover:underline">
                                                    {payment.code}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{payment.partner.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                                {t(`receivables.types.${payment.type}`, undefined, payment.type)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                                {t(`receivables.methods.${payment.method}`, undefined, payment.method)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {formatMoney(payment.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                {new Date(payment.payment_date).toLocaleDateString(localeTag)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={payment.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={prefixedRoute('receivables.payments.show', payment.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                                        title={t('common.view')}
                                                    >
                                                        <EyeIcon />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {payments.links.length > 3 && (
                        <div className="flex items-center justify-end gap-1 border-t border-slate-100 dark:border-slate-800/60 px-6 py-4">
                            {payments.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
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
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
