import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { Head, Link, router } from '@inertiajs/react';
import BillingNav from '../../../../BillingNav';
import { formatMoney } from '@/utils/money';
import PageHeader from '@/Components/PageHeader';

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
                            <PrimaryButton>{t('billing.allowances.issue')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('billing.allowances.head')} />

            <BillingNav />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <p className="text-sm font-medium text-gray-500">{t('billing.allowances.unsettled')}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.unsettled_count}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('billing.allowances.unsettled_hint')}</p>
                </div>
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <p className="text-sm font-medium text-gray-500">{t('billing.allowances.outstanding')}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(summary.outstanding_advance)}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('billing.allowances.outstanding_hint')}</p>
                </div>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="mb-6 flex justify-end">
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

                    {allowances.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('billing.allowances.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('billing.allowances.empty_hint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.allowances.columns.trip')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.allowances.columns.driver')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.allowances.columns.advance')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.allowances.columns.expenses')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.allowances.columns.balance')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.allowances.columns.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {allowances.data.map((allowance) => {
                                            const expenses = Number(allowance.expenses_sum_amount ?? 0);
                                            const balance = Number(allowance.advance_amount) - expenses;
                                            return (
                                                <tr
                                                    key={allowance.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => router.get(prefixedRoute('billing.allowances.show', allowance.id))}
                                                >
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-indigo-600">
                                                        {allowance.trip.code}
                                                        <span className="block text-xs font-normal text-gray-500">{allowance.trip.origin} → {allowance.trip.destination}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{allowance.trip.driver?.name || '—'}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">{formatMoney(allowance.advance_amount)}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">{formatMoney(expenses)}</td>
                                                    <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {formatMoney(balance)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${allowance.status === 'settled' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {t(`billing.status.${allowance.status}`, undefined, allowance.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {allowances.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
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
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
