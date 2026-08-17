import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import BillingNav from '../../../../BillingNav';
import { formatMoney } from '@/utils/money';

interface Partner {
    id: number;
    code: string;
    name: string;
}

interface InvoiceableOrder {
    id: number;
    code: string;
    pickup_address: string;
    delivery_address: string;
    delivered_at: string | null;
    charge: { id: number; amount: string } | null;
}

interface Props {
    partners: Partner[];
    selectedPartnerId: string | null;
    invoiceableOrders: InvoiceableOrder[];
}

export default function Create({ partners, selectedPartnerId, invoiceableOrders }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm<{
        partner_id: string;
        order_ids: number[];
    }>({
        partner_id: selectedPartnerId || '',
        order_ids: [],
    });

    const selectPartner = (partnerId: string) => {
        setData((current) => ({ ...current, partner_id: partnerId, order_ids: [] }));
        router.get(prefixedRoute('billing.invoices.create'), { partner_id: partnerId || undefined }, {
            preserveState: true,
            replace: true,
            only: ['invoiceableOrders', 'selectedPartnerId'],
        });
    };

    const toggleOrder = (orderId: number) => {
        setData('order_ids', data.order_ids.includes(orderId)
            ? data.order_ids.filter((id) => id !== orderId)
            : [...data.order_ids, orderId]);
    };

    const subtotal = invoiceableOrders
        .filter((order) => data.order_ids.includes(order.id))
        .reduce((sum, order) => sum + Number(order.charge?.amount ?? 0), 0);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('billing.invoices.store'));
    };

    return (
        <DynamicLayout
            header={<PageHeader title={t('billing.invoices.head')} />}
        >
            <Head title={t('billing.invoices.title')} />

            <BillingNav />

            <form onSubmit={submit} className="max-w-3xl space-y-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="partner_id" value={`${t('billing.invoices.partner')} *`} />
                        <Select
                            id="partner_id"
                            className="mt-1"
                            value={data.partner_id}
                            onChange={selectPartner}
                            placeholder={t('billing.invoices.select_partner')}
                            options={partners.map((partner) => ({
                                value: String(partner.id),
                                label: `${partner.name} (${partner.code})`,
                            }))}
                        />
                        <InputError message={errors.partner_id} className="mt-2" />
                    </div>
                </div>

                {data.partner_id && (
                    <div>
                        <InputLabel value={t('billing.invoices.orders_label')} />
                        <InputError message={errors.order_ids} className="mt-2" />
                        {invoiceableOrders.length === 0 ? (
                            <p className="mt-2 text-xs font-bold text-slate-400">{t('billing.invoices.orders_empty')}</p>
                        ) : (
                            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                {invoiceableOrders.map((order) => (
                                    <li key={order.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                        <label className="flex flex-1 cursor-pointer items-center gap-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                checked={data.order_ids.includes(order.id)}
                                                onChange={() => toggleOrder(order.id)}
                                            />
                                            <div>
                                                <span className="block text-xs font-bold text-slate-900 dark:text-white font-mono">{order.code}</span>
                                                <span className="block text-[11px] text-slate-400">{order.pickup_address} → {order.delivery_address}</span>
                                            </div>
                                        </label>
                                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                            {order.charge && Number(order.charge.amount) > 0 ? formatMoney(order.charge.amount) : (
                                                <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">{t('billing.charges.price_missing')}</span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {data.order_ids.length > 0 && (
                            <div className="mt-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 text-right">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Selection: </span>
                                <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                                    {formatMoney(subtotal)} ({data.order_ids.length} orders)
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href={prefixedRoute('billing.charges.index')}>
                        <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing || data.order_ids.length === 0} className="!rounded-xl text-xs shadow-sm">
                        📄 {t('billing.invoices.create_draft')}
                    </PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}
