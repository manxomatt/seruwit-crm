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
import PageHeader from '@/Components/PageHeader';
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

const getStatusBadgeStyle = (status: string) => {
    switch (status) {
        case 'confirmed':
            return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50';
        case 'assigned':
            return 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/50';
        case 'in_transit':
            return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50';
        default:
            return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50';
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

            {/* Filter Bar Card */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[200px] flex-1">
                        <TextInput
                            type="text"
                            placeholder={t('billing.charges.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full !rounded-2xl text-xs bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
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
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 shadow-sm focus:ring-indigo-500"
                            checked={filters.uninvoiced}
                            onChange={(e) => applyFilters({ uninvoiced: e.target.checked || undefined })}
                        />
                        {t('billing.charges.uninvoiced_only')}
                    </label>
                    <PrimaryButton type="submit" className="!rounded-xl text-xs shadow-sm">{t('common.search')}</PrimaryButton>
                </form>
            </div>

            {/* Charges Table Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.charges.columns.order')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.charges.columns.partner')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.charges.columns.route')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.charges.columns.status')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('billing.charges.columns.amount')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('billing.charges.columns.invoice')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center font-bold text-slate-400">
                                        {t('billing.charges.empty_title')}
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => (
                                    <tr key={order.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">{order.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{order.partner.name}</td>
                                        <td className="px-6 py-4 max-w-xs truncate text-slate-500 dark:text-slate-400 font-medium">{order.pickup_address} → {order.delivery_address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(order.status)}`}>
                                                {t(`billing.status.${order.status}`, undefined, order.status.replace('_', ' '))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {order.charge ? (
                                                Number(order.charge.amount) > 0 ? formatMoney(order.charge.amount) : (
                                                    <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">{t('billing.charges.price_missing')}</span>
                                                )
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">{t('billing.charges.price_missing')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">{order.charge?.invoice?.code || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {can.update && !isLocked(order) && (
                                                <button onClick={() => openPricing(order)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    ✏️ {t('billing.charges.set_price')}
                                                </button>
                                            )}
                                            {isLocked(order) && <span className="text-[10px] font-bold text-slate-400">🔒 {t('billing.charges.locked')}</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {orders.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 px-6 py-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
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

            {/* Set Pricing Modal */}
            <Modal show={pricing !== null} onClose={() => setPricing(null)} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        ✏️ {t('billing.charges.set_price_title', { code: pricing?.code ?? '' })}
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
                                className="mt-1 block w-full !rounded-2xl text-xs font-mono"
                                value={form.data.amount}
                                onChange={(e) => form.setData((data) => ({ ...data, amount: e.target.value, tariff_id: '' }))}
                            />
                            <InputError message={form.errors.amount} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setPricing(null)} className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={form.processing} className="!rounded-xl text-xs shadow-sm">💾 {t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
