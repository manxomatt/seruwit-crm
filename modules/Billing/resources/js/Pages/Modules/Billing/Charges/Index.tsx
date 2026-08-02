import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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
import PageHeader from '@/Components/PageHeader';

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
    const { t } = useTrans();
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
        const tariff = tariffs.find((item) => String(item.id) === tariffId);
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
            header={<PageHeader title={t('billing.title')} />}
        >
            <Head title={t('billing.charges.head')} />

            <BillingNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap items-center gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('billing.charges.search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-44"
                            value={filters.status || ''}
                            onChange={(status) => applyFilters({ status: status || undefined })}
                            placeholder={t('billing.status.all')}
                            options={[
                                { value: '', label: t('billing.status.all') },
                                ...STATUSES.map((status) => ({
                                    value: status,
                                    label: t(`billing.status.${status}`, undefined, status.replace('_', ' ')),
                                })),
                            ]}
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={filters.uninvoiced}
                                onChange={(e) => applyFilters({ uninvoiced: e.target.checked || undefined })}
                            />
                            {t('billing.charges.uninvoiced_only')}
                        </label>
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {orders.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('billing.charges.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('billing.charges.empty_hint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.charges.columns.order')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.charges.columns.partner')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.charges.columns.route')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.charges.columns.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.charges.columns.amount')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('billing.charges.columns.invoice')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
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
                                                        {t(`billing.status.${order.status}`, undefined, order.status.replace('_', ' '))}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                    {order.charge ? (
                                                        Number(order.charge.amount) > 0 ? formatMoney(order.charge.amount) : (
                                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">{t('billing.charges.price_missing')}</span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">{t('billing.charges.price_missing')}</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.charge?.invoice?.code || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    {can.update && !isLocked(order) && (
                                                        <button onClick={() => openPricing(order)} className="text-indigo-600 hover:text-indigo-900">
                                                            {t('billing.charges.set_price')}
                                                        </button>
                                                    )}
                                                    {isLocked(order) && <span className="text-xs text-gray-400">{t('billing.charges.locked')}</span>}
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

            <Modal show={pricing !== null} onClose={() => setPricing(null)} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">
                        {t('billing.charges.set_price_title', { code: pricing?.code ?? '' })}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="c_tariff_id" value={t('billing.charges.tariff_optional')} />
                            <Select
                                id="c_tariff_id"
                                className="mt-1"
                                value={form.data.tariff_id}
                                onChange={applyTariff}
                                placeholder={t('billing.charges.manual_price')}
                                options={[
                                    { value: '', label: t('billing.charges.manual_price') },
                                    ...tariffs.map((tariff) => ({
                                        value: String(tariff.id),
                                        label: `${tariff.origin} → ${tariff.destination} — ${formatMoney(tariff.price)}`,
                                    })),
                                ]}
                            />
                            <InputError message={form.errors.tariff_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="c_amount" value={t('billing.charges.amount')} />
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
                        <SecondaryButton type="button" onClick={() => setPricing(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={form.processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
