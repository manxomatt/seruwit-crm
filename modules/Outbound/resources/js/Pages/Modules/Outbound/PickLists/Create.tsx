import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import OutboundNav from '../../../../OutboundNav';
import PageHeader from '@/Components/PageHeader';

interface Order {
    id: number;
    code: string;
    status: string;
    order_date: string;
    items_count: number;
    partner: { id: number; name: string; code: string };
}

interface Warehouse {
    id: number;
    name: string;
}

interface Props {
    orders: Order[];
    warehouses: Warehouse[];
    selectedOrderId: number | null;
}

export default function Create({ orders, warehouses, selectedOrderId }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        delivery_order_id: selectedOrderId ? String(selectedOrderId) : '',
        warehouse_id: warehouses[0] ? String(warehouses[0].id) : '',
        notes: '',
    });

    const orderOptions = useMemo(
        () =>
            orders.map((o) => ({
                value: String(o.id),
                label: t('outbound.pick_lists.create.order_option', {
                    code: o.code,
                    partner: o.partner.name,
                    count: o.items_count,
                    status: t(`orders.status.${o.status}`, undefined, o.status),
                }),
            })),
        [orders, t],
    );

    const warehouseOptions = useMemo(
        () => warehouses.map((w) => ({ value: String(w.id), label: w.name })),
        [warehouses],
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('outbound.pick-lists.store'));
    };

    return (
        <DynamicLayout header={<PageHeader title={t('outbound.pick_lists.create.title')} />}>
            <Head title={t('outbound.pick_lists.create.title')} />

            <OutboundNav />

            <form onSubmit={submit} className="space-y-5 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                <div>
                    <InputLabel value={t('outbound.pick_lists.create.delivery_order')} />
                    <Select
                        className="mt-1"
                        value={data.delivery_order_id}
                        onChange={(value) => setData('delivery_order_id', value)}
                        placeholder={t('outbound.pick_lists.create.select_do')}
                        options={orderOptions}
                        searchable
                    />
                    <InputError message={errors.delivery_order_id} className="mt-2" />
                    {orders.length === 0 && (
                        <p className="mt-2 text-sm text-gray-500">{t('outbound.pick_lists.create.no_eligible_do')}</p>
                    )}
                </div>

                <div>
                    <InputLabel value={t('outbound.pick_lists.create.source_warehouse')} />
                    <Select
                        className="mt-1"
                        value={data.warehouse_id}
                        onChange={(value) => setData('warehouse_id', value)}
                        options={warehouseOptions}
                        searchable
                    />
                    <InputError message={errors.warehouse_id} className="mt-2" />
                </div>

                <div>
                    <InputLabel value={t('outbound.pick_lists.create.notes')} />
                    <textarea
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows={2}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Link href={prefixedRoute('outbound.pick-lists.index')}>
                        <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing || !data.delivery_order_id}>{t('outbound.actions.generate')}</PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}
