import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Order {
    id: number;
    code: string;
    status: string;
    order_date: string;
    pickup_address: string;
    delivery_address: string;
    partner: { id: number; code: string; name: string };
    trip: { id: number; code: string } | null;
}

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
}

interface Props {
    orders: PaginatedOrders;
    filters: Filters;
    can: { create: boolean };
}

const STATUSES = ['draft', 'confirmed', 'assigned', 'in_transit', 'delivered', 'cancelled'];

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'confirmed':
            return 'bg-blue-100 text-blue-800';
        case 'assigned':
            return 'bg-indigo-100 text-indigo-800';
        case 'in_transit':
            return 'bg-yellow-100 text-yellow-800';
        case 'delivered':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-red-100 text-red-800';
    }
};

const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export default function Index({ orders, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('orders.index'), {
            search: search || undefined,
            status: filters.status || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(prefixedRoute('orders.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('orders.index.head')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('orders.create')}>
                            <PrimaryButton>{t('orders.index.new')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('orders.title')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('orders.index.search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.status || ''}
                            onChange={handleStatusFilter}
                            placeholder={t('orders.status.all')}
                            options={[
                                { value: '', label: t('orders.status.all') },
                                ...STATUSES.map((status) => ({
                                    value: status,
                                    label: t(`orders.status.${status}`, undefined, status),
                                })),
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {orders.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('orders.index.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('orders.index.empty_hint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('orders.index.columns.code')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('orders.index.columns.partner')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('orders.index.columns.route')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('orders.index.columns.order_date')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('orders.index.columns.trip')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('orders.index.columns.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('orders.index.columns.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {orders.data.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{order.code}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.partner.name}</td>
                                                <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">{order.pickup_address} → {order.delivery_address}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.order_date}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.trip?.code || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                                        {t(`orders.status.${order.status}`, undefined, order.status)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end">
                                                        <Link
                                                            href={prefixedRoute('orders.show', order.id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title={t('orders.index.view')}
                                                        >
                                                            <EyeIcon />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
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
                        </>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
