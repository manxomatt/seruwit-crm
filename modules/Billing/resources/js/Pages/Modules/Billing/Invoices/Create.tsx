import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import BillingNav from '../../../../BillingNav';
import { formatMoney } from '@/utils/money';
import PageHeader from '@/Components/PageHeader';

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

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="partner_id" value={t('billing.invoices.partner')} />
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
                                    <p className="mt-2 text-sm text-gray-500">{t('billing.invoices.orders_empty')}</p>
                                ) : (
                                    <ul className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200">
                                        {invoiceableOrders.map((order) => (
                                            <li key={order.id} className="flex items-center justify-between gap-4 p-3">
                                                <label className="flex flex-1 cursor-pointer items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                        checked={data.order_ids.includes(order.id)}
                                                        onChange={() => toggleOrder(order.id)}
                                                    />
                                                    <span>
                                                        <span className="block text-sm font-medium text-gray-900">{order.code}</span>
                                                        <span className="block text-sm text-gray-500">{order.pickup_address} → {order.delivery_address}</span>
                                                    </span>
                                                </label>
                                                <span className="text-sm text-gray-900">
                                                    {order.charge && Number(order.charge.amount) > 0 ? formatMoney(order.charge.amount) : (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">{t('billing.charges.price_missing')}</span>
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {data.order_ids.length > 0 && (
                                    <p className="mt-3 text-right text-sm font-medium text-gray-900">
                                        {t('billing.invoices.subtotal', {
                                            count: data.order_ids.length,
                                            amount: formatMoney(subtotal),
                                        })}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing || data.order_ids.length === 0}>{t('billing.invoices.create_draft')}</PrimaryButton>
                            <Link href={prefixedRoute('billing.charges.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
