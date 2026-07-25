import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import SalesNav from '../../../../SalesNav';
import { formatMoney } from '@/utils/money';

interface SalesOrder {
    id: number;
    so_number: string;
    status: string;
    ordered_at: string;
    promised_at: string | null;
    total_amount: string;
    progress_percent: number;
    progress_ordered: number;
    progress_delivered: number;
    partner: { id: number; name: string; code: string };
    warehouse: { id: number; name: string };
}

interface PaginatedOrders {
    data: SalesOrder[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    orders: PaginatedOrders;
    filters: { status: string; search: string };
    can: { create: boolean; update: boolean; issue: boolean };
}

const STATUS_FILTER_VALUES = ['', 'draft', 'confirmed', 'partial_delivered', 'fully_delivered', 'closed', 'cancelled'] as const;

const statusBadge = (status: string): string => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300';
        case 'confirmed':
            return 'bg-sky-100 text-sky-800';
        case 'partial_delivered':
            return 'bg-amber-50 text-amber-700';
        case 'fully_delivered':
            return 'bg-emerald-50 text-emerald-700';
        case 'closed':
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200';
        case 'cancelled':
            return 'bg-red-50 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const ClipboardIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const ConfirmIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export default function Index({ orders, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = (status: string, searchValue: string) => {
        router.get(
            prefixedRoute('sales.sales-orders.index'),
            {
                status: status || undefined,
                search: searchValue || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters(filters.status, search);
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('sales.sales_orders.index.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('sales.sales-orders.create')}>
                            <PrimaryButton>{t('sales.sales_orders.index.new')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('sales.sales_orders.index.title')} />
            <SalesNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-200 p-4">
                    <div className="mb-4 flex flex-wrap gap-2">
                        {STATUS_FILTER_VALUES.map((value) => (
                            <button
                                key={value || 'all'}
                                type="button"
                                onClick={() => applyFilters(value, search)}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                    (filters.status || '') === value
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                {value === '' ? t('sales.status.all') : t(`sales.status.${value}`, undefined, value)}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSearch} className="max-w-sm">
                        <TextInput
                            type="text"
                            placeholder={t('sales.placeholders.search_so')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </form>
                </div>

                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sales.fields.so_number')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sales.fields.customer')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sales.fields.warehouse')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sales.fields.ordered_at')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sales.fields.promised_at')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('sales.fields.total')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sales.fields.progress')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sales.fields.status')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                                            {t('sales.sales_orders.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    orders.data.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{order.so_number}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{order.partner.name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{order.warehouse.name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                                {new Date(order.ordered_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                                {order.promised_at ? new Date(order.promised_at).toLocaleDateString('id-ID') : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                                                {formatMoney(order.total_amount)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <div className="w-20">
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                                                        <div
                                                            className={`h-full rounded-full ${order.progress_percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                                            style={{ width: `${order.progress_percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}>
                                                    {t(`sales.status.${order.status}`, undefined, order.status)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {order.status === 'draft' ? (
                                                        <Link
                                                            href={prefixedRoute('sales.sales-orders.edit', order.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title={t('common.edit')}
                                                        >
                                                            <PencilIcon />
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            href={prefixedRoute('sales.sales-orders.show', order.id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title={t('common.view')}
                                                        >
                                                            <EyeIcon />
                                                        </Link>
                                                    )}
                                                    {can.issue && ['confirmed', 'partial_delivered'].includes(order.status) && (
                                                        <Link
                                                            href={prefixedRoute('sales.sales-orders.gin.create', order.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title={t('sales.sales_orders.index.gin')}
                                                        >
                                                            <ClipboardIcon />
                                                        </Link>
                                                    )}
                                                    {can.update && order.status === 'draft' && (
                                                        <button
                                                            type="button"
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title={t('sales.sales_orders.index.confirm')}
                                                            onClick={() =>
                                                                router.post(prefixedRoute('sales.sales-orders.confirm', order.id), {}, { preserveScroll: true })
                                                            }
                                                        >
                                                            <ConfirmIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {orders.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-gray-700">
                                {t('common.showing_results', {
                                    from: (orders.current_page - 1) * orders.per_page + 1,
                                    to: Math.min(orders.current_page * orders.per_page, orders.total),
                                    total: orders.total,
                                })}
                            </p>
                            <div className="flex gap-1">
                                {orders.links.map((link, index) => (
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
                </div>
            </div>
        </DynamicLayout>
    );
}
