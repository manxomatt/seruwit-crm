import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import SalesNav from '../../../../SalesNav';
import PageHeader from '@/Components/PageHeader';

interface DeliverableItem {
    id: number;
    product: { id: number; name: string; code: string | null };
    quantity_ordered: string;
    quantity_delivered: string;
    remaining: number;
    unit: string | null;
    packaging?: { id: number; name: string; qty: string } | null;
}

interface Location {
    id: number;
    name: string;
    code: string;
}

interface Warehouse {
    id: number;
    name: string;
    locations: Location[];
}

interface Order {
    id: number;
    so_number: string;
    partner: { id: number; name: string };
    warehouse: { id: number; name: string };
}

interface Props {
    order: Order;
    deliverableItems: DeliverableItem[];
    warehouses: Warehouse[];
    defaultStockLocationId: number | null;
    can: { issue: boolean };
}

interface GinLine {
    so_item_id: string;
    quantity_issued: string;
    location_id: string;
    batch_number: string;
    expiry_date: string;
    notes: string;
    included: boolean;
}

export default function Create({ order, deliverableItems, warehouses, defaultStockLocationId, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const today = new Date().toISOString().slice(0, 10);
    const defaultLocation = defaultStockLocationId ? String(defaultStockLocationId) : '';

    const { data, setData, post, processing, errors, transform } = useForm({
        warehouse_id: String(order.warehouse.id),
        issued_at: today,
        delivery_note_number: '',
        notes: '',
        confirm: false as boolean,
        items: deliverableItems.map((item) => ({
            so_item_id: String(item.id),
            quantity_issued: String(item.remaining),
            location_id: defaultLocation,
            batch_number: '',
            expiry_date: '',
            notes: '',
            included: true,
        })) as GinLine[],
    });

    const locations = useMemo(() => {
        const warehouse = warehouses.find((w) => String(w.id) === data.warehouse_id);
        return warehouse?.locations ?? [];
    }, [warehouses, data.warehouse_id]);

    const stockLocationIdFor = (warehouseId: string): string => {
        const warehouse = warehouses.find((w) => String(w.id) === warehouseId);
        const stock = warehouse?.locations.find((l) => l.code === 'STOCK');
        return stock ? String(stock.id) : '';
    };

    const changeWarehouse = (value: string) => {
        const locationId = stockLocationIdFor(value);
        setData({
            ...data,
            warehouse_id: value,
            items: data.items.map((item) => ({ ...item, location_id: locationId })),
        });
    };

    const updateLine = (index: number, field: keyof GinLine, value: string | boolean) => {
        const items = data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
        setData('items', items);
    };

    const save = (confirm: boolean) => {
        transform((form) => ({
            ...form,
            confirm,
            items: form.items
                .filter((item) => item.included && Number(item.quantity_issued) > 0)
                .map(({ included: _included, ...item }) => item),
        }));
        post(prefixedRoute('sales.sales-orders.gin.store', order.id));
    };

    const submitDraft: FormEventHandler = (e) => {
        e.preventDefault();
        save(false);
    };

    return (
        <DynamicLayout header={<PageHeader title={t('sales.gin.create.title')} />}>
            <Head title={t('sales.gin.create.head', { so_number: order.so_number })} />
            <SalesNav />

            <div className="mb-4">
                <Link href={prefixedRoute('sales.sales-orders.show', order.id)} className="text-sm text-gray-500 hover:text-gray-700">
                    {t('sales.gin.create.back', { so_number: order.so_number })}
                </Link>
            </div>

            <form onSubmit={submitDraft} className="space-y-6">
                <div className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-gray-700">
                    <span className="mr-4">
                        {t('sales.gin.create.so')} <strong className="text-indigo-700">{order.so_number}</strong>
                    </span>
                    <span className="mr-4">
                        {t('sales.gin.create.customer')} <strong className="text-indigo-700">{order.partner.name}</strong>
                    </span>
                    <span>
                        {t('sales.gin.create.warehouse')} <strong className="text-indigo-700">{order.warehouse.name}</strong>
                    </span>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                        <div>
                            <InputLabel value={`${t('sales.fields.issued_at')} *`} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={data.issued_at}
                                onChange={(e) => setData('issued_at', e.target.value)}
                                required
                            />
                            <InputError message={errors.issued_at} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel value={t('sales.fields.delivery_note_number')} />
                            <TextInput
                                className="mt-1 block w-full"
                                value={data.delivery_note_number}
                                onChange={(e) => setData('delivery_note_number', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel value={`${t('sales.fields.source_warehouse')} *`} />
                            <Select
                                className="mt-1"
                                value={data.warehouse_id}
                                onChange={changeWarehouse}
                                placeholder={t('sales.placeholders.select_warehouse')}
                                options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                            />
                            <InputError message={errors.warehouse_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel value={t('sales.fields.notes')} />
                            <TextInput
                                className="mt-1 block w-full"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            {t('sales.gin.create.items_section')}{' '}
                            <span className="font-normal text-gray-500">{t('sales.gin.create.items_hint')}</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                    <th className="px-2 py-2"></th>
                                    <th className="px-2 py-2">{t('sales.fields.product')}</th>
                                    <th className="px-2 py-2 text-right">{t('sales.fields.ordered')}</th>
                                    <th className="px-2 py-2 text-right">{t('sales.fields.remaining')}</th>
                                    <th className="px-2 py-2">{t('sales.fields.location')}</th>
                                    <th className="px-2 py-2">
                                        {t('sales.fields.batch')} · {t('sales.fields.expiry')}
                                    </th>
                                    <th className="px-2 py-2 text-right">{t('sales.fields.delivered')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {deliverableItems.map((item, index) => (
                                    <tr key={item.id} className={!data.items[index]?.included ? 'opacity-40' : ''}>
                                        <td className="px-2 py-3">
                                            <input
                                                type="checkbox"
                                                checked={data.items[index]?.included ?? false}
                                                onChange={(e) => updateLine(index, 'included', e.target.checked)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 text-sm font-semibold text-gray-900">
                                            {item.product.name}
                                            {(item.packaging || item.unit) && (
                                                <div className="text-xs font-normal text-gray-500">
                                                    {item.packaging
                                                        ? `${item.packaging.name} (×${item.packaging.qty})`
                                                        : item.unit}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 py-3 text-right text-sm tabular-nums text-gray-500">{item.quantity_ordered}</td>
                                        <td className="px-2 py-3 text-right text-sm font-semibold tabular-nums text-amber-700">{item.remaining}</td>
                                        <td className="px-2 py-3">
                                            <Select
                                                value={data.items[index]?.location_id || ''}
                                                onChange={(value) => updateLine(index, 'location_id', value)}
                                                placeholder={t('sales.placeholders.select_location')}
                                                options={locations.map((l) => ({
                                                    value: String(l.id),
                                                    label: l.code ? `${l.code} — ${l.name}` : l.name,
                                                }))}
                                            />
                                        </td>
                                        <td className="px-2 py-3">
                                            <div className="space-y-1">
                                                <TextInput
                                                    className="block w-full text-xs"
                                                    placeholder={t('sales.placeholders.batch')}
                                                    value={data.items[index]?.batch_number || ''}
                                                    onChange={(e) => updateLine(index, 'batch_number', e.target.value)}
                                                />
                                                <TextInput
                                                    type="date"
                                                    className="block w-full text-xs"
                                                    value={data.items[index]?.expiry_date || ''}
                                                    onChange={(e) => updateLine(index, 'expiry_date', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-3">
                                            <TextInput
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max={item.remaining}
                                                className="block w-24 text-right text-sm font-semibold"
                                                value={data.items[index]?.quantity_issued || ''}
                                                onChange={(e) => updateLine(index, 'quantity_issued', e.target.value)}
                                            />
                                            <InputError message={(errors as Record<string, string>)[`items.${index}.quantity_issued`]} className="mt-1" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <InputError message={errors.items} className="mt-2" />
                    </div>

                    <div className="mx-4 mb-4 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-gray-700">
                        {t('sales.gin.create.confirm_hint')}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                        <Link href={prefixedRoute('sales.sales-orders.show', order.id)}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <SecondaryButton type="submit" disabled={processing}>
                            {t('sales.gin.create.save_draft')}
                        </SecondaryButton>
                        {can.issue && (
                            <PrimaryButton type="button" disabled={processing} onClick={() => save(true)}>
                                {t('sales.gin.create.confirm')}
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
