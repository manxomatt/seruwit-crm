import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import BillingNav from '../../../../BillingNav';
import { formatMoney } from '@/utils/money';

interface Tariff {
    id: number;
    partner_id: number | null;
    origin: string;
    destination: string;
    price: string;
}

interface Charge {
    id: number;
    amount: string;
    tariff: { id: number; origin: string; destination: string } | null;
    invoice: { id: number; code: string; status: string } | null;
}

interface Order {
    id: number;
    code: string;
    status: string;
    pickup_address: string;
    delivery_address: string;
    order_date: string;
    partner: { id: number; code: string; name: string };
    charge: Charge | null;
}

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    orders: PaginatedOrders;
    tariffs: Tariff[];
    filters: { search: string | null; status: string | null; uninvoiced: boolean };
    can: { update: boolean };
}

const STATUSES = ['confirmed', 'assigned', 'in_transit', 'delivered'];

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'confirmed':
            return 'bg-blue-100 text-blue-800';
        case 'assigned':
            return 'bg-indigo-100 text-indigo-800';
        case 'in_transit':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-green-100 text-green-800';
    }
};

export default function Index({ orders, tariffs, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [pricing, setPricing] = useState<Order | null>(null);

    const form = useForm({ tariff_id: '', amount: '' });

    const isLocked = (order: Order) =>
        order.charge?.invoice != null && ['issued', 'paid'].includes(order.charge.invoice.status);

    const openPricing = (order: Order) => {
        form.clearErrors();
        form.setData({
            tariff_id: order.charge?.tariff ? String(order.charge.tariff.id) : '',
            amount: order.charge?.amount ?? '',
        });
        setPricing(order);
    };

    const applyTariff = (tariffId: string) => {
        form.setData('tariff_id', tariffId);
        const tariff = tariffs.find((t) => String(t.id) === tariffId);
        if (tariff) {
            form.setData((data) => ({ ...data, tariff_id: tariffId, amount: tariff.price }));
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!pricing) return;
        form.patch(prefixedRoute('billing.charges.update', pricing.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPricing(null);
                form.reset();
            },
        });
    };

    const applyFilters = (overrides: Record<string, string | boolean | undefined>) => {
        router.get(prefixedRoute('billing.charges.index'), {
            search: search || undefined,
            status: filters.status || undefined,
            uninvoiced: filters.uninvoiced || undefined,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({});
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Billing</h2>}
        >
            <Head title="Order Charges" />

            <BillingNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap items-center gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder="Search by code or address..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-44"
                            value={filters.status || ''}
                            onChange={(status) => applyFilters({ status: status || undefined })}
                            placeholder="All statuses"
                            options={[
                                { value: '', label: 'All statuses' },
                                ...STATUSES.map((status) => ({ value: status, label: status.replace('_', ' ') })),
                            ]}
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={filters.uninvoiced}
                                onChange={(e) => applyFilters({ uninvoiced: e.target.checked || undefined })}
                            />
                            Uninvoiced only
                        </label>
                        <PrimaryButton type="submit">Search</PrimaryButton>
                    </form>

                    {orders.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">No billable orders</h3>
                            <p className="mt-1 text-sm text-gray-500">Confirmed orders appear here to be priced.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Partner</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Route</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Invoice</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {orders.data.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{order.code}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.partner.name}</td>
                                                <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">{order.pickup_address} → {order.delivery_address}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                    {order.charge ? (
                                                        Number(order.charge.amount) > 0 ? formatMoney(order.charge.amount) : (
                                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">harga belum diisi</span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">harga belum diisi</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.charge?.invoice?.code || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    {can.update && !isLocked(order) && (
                                                        <button onClick={() => openPricing(order)} className="text-indigo-600 hover:text-indigo-900">
                                                            Set harga
                                                        </button>
                                                    )}
                                                    {isLocked(order) && <span className="text-xs text-gray-400">locked</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {orders.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {(orders.current_page - 1) * orders.per_page + 1} to{' '}
                                        {Math.min(orders.current_page * orders.per_page, orders.total)} of {orders.total} results
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

            <Modal show={pricing !== null} onClose={() => setPricing(null)} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Set harga — {pricing?.code}</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="c_tariff_id" value="Tarif (opsional)" />
                            <Select
                                id="c_tariff_id"
                                className="mt-1"
                                value={form.data.tariff_id}
                                onChange={applyTariff}
                                placeholder="Harga manual"
                                options={[
                                    { value: '', label: 'Harga manual' },
                                    ...tariffs.map((tariff) => ({
                                        value: String(tariff.id),
                                        label: `${tariff.origin} → ${tariff.destination} — ${formatMoney(tariff.price)}`,
                                    })),
                                ]}
                            />
                            <InputError message={form.errors.tariff_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="c_amount" value="Amount (Rp)" />
                            <TextInput
                                id="c_amount"
                                type="number"
                                min={0}
                                step="0.01"
                                className="mt-1 block w-full"
                                value={form.data.amount}
                                onChange={(e) => form.setData((data) => ({ ...data, amount: e.target.value, tariff_id: '' }))}
                            />
                            <InputError message={form.errors.amount} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setPricing(null)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={form.processing}>Save</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
