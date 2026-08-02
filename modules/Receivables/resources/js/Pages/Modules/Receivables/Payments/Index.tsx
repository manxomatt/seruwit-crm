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
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

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
                            <PrimaryButton>{t('receivables.payments.index.record')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('receivables.payments.index.head')} />

            <ReceivablesNav />

            <div className="space-y-6">
                {alerts.overdue_count > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {t('receivables.payments.index.overdue_alert', {
                            count: alerts.overdue_count,
                            amount: formatMoney(alerts.overdue_amount),
                        })}{' '}
                        <Link href={prefixedRoute('receivables.aging.index')} className="font-medium underline">
                            {t('receivables.payments.index.view_aging')}
                        </Link>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-wider text-gray-500">
                            {t('receivables.payments.index.open_ar')}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                            {formatMoney(summary.open_ar)}
                        </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-wider text-gray-500">
                            {t('receivables.payments.index.received_this_month')}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                            {formatMoney(summary.posted_this_month)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <form onSubmit={submitSearch} className="flex flex-1 flex-wrap gap-2">
                        <TextInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('receivables.placeholders.search')}
                            className="min-w-[200px] max-w-sm flex-1"
                        />
                        <PrimaryButton type="submit">{t('receivables.actions.search')}</PrimaryButton>
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

                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.code')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.partner')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.type')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.method')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.amount')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.date')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.status')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                            {t('receivables.payments.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    payments.data.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                {payment.code}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{payment.partner.name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                {t(`receivables.types.${payment.type}`, undefined, payment.type)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                {t(`receivables.methods.${payment.method}`, undefined, payment.method)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                                {formatMoney(payment.amount)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                {new Date(payment.payment_date).toLocaleDateString(localeTag)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        payment.status === 'posted'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {t(`receivables.status.${payment.status}`, undefined, payment.status)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={prefixedRoute('receivables.payments.show', payment.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
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
                        <div className="flex flex-wrap gap-1 border-t border-gray-200 px-4 py-3">
                            {payments.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                              : 'cursor-not-allowed bg-gray-100 text-gray-400'
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
