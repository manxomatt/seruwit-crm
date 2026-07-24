import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import PurchasingNav from '../../../../PurchasingNav';
import { formatMoney } from '@/utils/money';

interface PurchaseOrder {
    id: number;
    po_number: string;
    status: string;
    ordered_at: string;
    expected_at: string | null;
    total_amount: string;
    progress_percent: number;
    progress_ordered: number;
    progress_received: number;
    partner: { id: number; name: string; code: string };
    warehouse: { id: number; name: string };
}

interface Props {
    orders: {
        data: PurchaseOrder[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
    filters: { status: string; search: string };
    can: { create: boolean; update: boolean; receive: boolean };
}

const STATUS_FILTERS = [
    { value: '', label: 'Semua' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'partial_received', label: 'Partial' },
    { value: 'fully_received', label: 'Fully Received' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const statusBadge = (status: string): string => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300';
        case 'submitted':
            return 'bg-blue-50 text-blue-700';
        case 'approved':
            return 'bg-sky-100 text-sky-800';
        case 'partial_received':
            return 'bg-amber-50 text-amber-700';
        case 'fully_received':
            return 'bg-emerald-50 text-emerald-700';
        case 'closed':
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200';
        case 'cancelled':
            return 'bg-red-50 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const statusLabel = (status: string): string => {
    const map: Record<string, string> = {
        partial_received: 'Partial',
        fully_received: 'Received',
    };
    return map[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
};

export default function Index({ orders, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = (status: string, searchValue: string) => {
        router.get(
            prefixedRoute('purchasing.purchase-orders.index'),
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
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory</h2>
                    {can.create && (
                        <Link href={prefixedRoute('purchasing.purchase-orders.create')}>
                            <PrimaryButton>New PO</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Purchase Orders" />
            <PurchasingNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-200 p-4">
                    <div className="mb-4 flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((filter) => (
                            <button
                                key={filter.value || 'all'}
                                type="button"
                                onClick={() => applyFilters(filter.value, search)}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                    (filters.status || '') === filter.value
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSearch} className="max-w-sm">
                        <TextInput
                            type="text"
                            placeholder="Search PO number or supplier..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">No. PO</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Supplier</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gudang</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tgl Order</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Exp. Tiba</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Progress</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                                        No purchase orders yet.
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{order.po_number}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{order.partner.name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{order.warehouse.name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                            {new Date(order.ordered_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                            {order.expected_at ? new Date(order.expected_at).toLocaleDateString('id-ID') : '—'}
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
                                                {statusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <div className="flex justify-end gap-3">
                                                <Link
                                                    href={prefixedRoute(
                                                        order.status === 'draft'
                                                            ? 'purchasing.purchase-orders.edit'
                                                            : 'purchasing.purchase-orders.show',
                                                        order.id,
                                                    )}
                                                    className="font-medium text-indigo-600 hover:text-indigo-900"
                                                >
                                                    {order.status === 'draft' ? 'Edit' : 'Lihat'}
                                                </Link>
                                                {can.create && ['approved', 'partial_received'].includes(order.status) && (
                                                    <Link
                                                        href={prefixedRoute('purchasing.purchase-orders.grn.create', order.id)}
                                                        className="font-medium text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        GRN
                                                    </Link>
                                                )}
                                                {can.update && order.status === 'draft' && (
                                                    <button
                                                        type="button"
                                                        className="font-medium text-indigo-600 hover:text-indigo-900"
                                                        onClick={() =>
                                                            router.post(prefixedRoute('purchasing.purchase-orders.submit', order.id), {}, { preserveScroll: true })
                                                        }
                                                    >
                                                        Submit
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
            </div>
        </DynamicLayout>
    );
}
