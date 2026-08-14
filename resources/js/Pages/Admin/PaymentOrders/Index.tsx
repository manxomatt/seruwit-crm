import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

interface PaymentOrder {
    id: number;
    tenant: {
        id: string;
        name: string;
    };
    plan: {
        id: number;
        name: string;
    };
    type: string;
    status: string;
    amount: string;
    unique_code: number;
    total_amount: string;
    currency: string;
    expires_at: string;
    created_at: string;
}

interface PaginatedPaymentOrders {
    data: PaymentOrder[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Filters {
    search: string | null;
    status: string | null;
}

interface Props {
    paymentOrders: PaginatedPaymentOrders;
    filters: Filters;
}

const statusBadge: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    awaiting_confirmation: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-slate-100 text-slate-800',
    cancelled: 'bg-slate-100 text-slate-800',
};

export default function PaymentOrdersIndex({ paymentOrders, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('payment-orders.index'), {
            search: search || undefined,
            status: status || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(prefixedRoute('payment-orders.index'));
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Pesanan Pembayaran"
                    description="Kelola verifikasi pembayaran langganan tenant"
                />
            }
        >
            <Head title="Pesanan Pembayaran" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {/* Filters */}
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <TextInput
                                type="text"
                                placeholder="Cari nama tenant..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="min-w-[150px]">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="awaiting_confirmation">Menunggu Konfirmasi</option>
                                <option value="confirmed">Dikonfirmasi</option>
                                <option value="rejected">Ditolak</option>
                                <option value="expired">Kedaluwarsa</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                        </div>
                        <PrimaryButton type="submit">Filter</PrimaryButton>
                        {(filters.search || filters.status) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Reset
                            </button>
                        )}
                    </form>

                    {paymentOrders.data.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada pesanan pembayaran</h3>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tenant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Plan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nominal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paymentOrders.data.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.tenant.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {order.plan.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    Rp {Number(order.total_amount).toLocaleString('id-ID')}
                                                </div>
                                                {Number(order.unique_code) > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        + kode unik {order.unique_code}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusBadge[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={prefixedRoute('payment-orders.show', order.id)}
                                                    className="text-teal-600 hover:text-teal-900"
                                                >
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {paymentOrders.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Menampilkan {paymentOrders.data.length} dari {paymentOrders.total} pesanan
                            </div>
                            <div className="flex gap-2">
                                {paymentOrders.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        className={`px-3 py-1 rounded-md text-sm ${
                                            link.active
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
