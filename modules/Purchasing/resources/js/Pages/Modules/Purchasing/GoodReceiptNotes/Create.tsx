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
import PurchasingNav from '../../../../PurchasingNav';

interface ReceivableItem {
    id: number;
    product: { id: number; name: string; code: string | null };
    quantity_ordered: string;
    quantity_received: string;
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
    po_number: string;
    partner: { id: number; name: string };
    warehouse: { id: number; name: string };
}

interface Props {
    order: Order;
    receivableItems: ReceivableItem[];
    warehouses: Warehouse[];
    defaultStockLocationId: number | null;
    can: { receive: boolean };
}

interface GrnLine {
    po_item_id: string;
    quantity_received: string;
    location_id: string;
    batch_number: string;
    expiry_date: string;
    notes: string;
    included: boolean;
}

export default function Create({ order, receivableItems, warehouses, defaultStockLocationId, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix()
    const { t } = useTrans()
    const today = new Date().toISOString().slice(0, 10)
    const defaultLocation = defaultStockLocationId ? String(defaultStockLocationId) : ''

    const { data, setData, post, processing, errors, transform } = useForm({
        warehouse_id: String(order.warehouse.id),
        received_at: today,
        supplier_do_number: '',
        notes: '',
        confirm: false as boolean,
        items: receivableItems.map((item) => ({
            po_item_id: String(item.id),
            quantity_received: String(item.remaining),
            location_id: defaultLocation,
            batch_number: '',
            expiry_date: '',
            notes: '',
            included: true,
        })) as GrnLine[],
    })

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

    const updateLine = (index: number, field: keyof GrnLine, value: string | boolean) => {
        const items = data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
        setData('items', items);
    };

    const save = (confirm: boolean) => {
        transform((form) => ({
            ...form,
            confirm,
            items: form.items
                .filter((item) => item.included && Number(item.quantity_received) > 0)
                .map(({ included: _included, ...item }) => item),
        }));
        post(prefixedRoute('purchasing.purchase-orders.grn.store', order.id));
    };

    const submitDraft: FormEventHandler = (e) => {
        e.preventDefault();
        save(false);
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('purchasing.grn.create.title')}</h2>}>
            <Head title={t('purchasing.grn.create.head', { po_number: order.po_number })} />
            <PurchasingNav />

            <div className="mb-4">
                <Link href={prefixedRoute('purchasing.purchase-orders.show', order.id)} className="text-sm text-gray-500 hover:text-gray-700">
                    {t('purchasing.grn.create.back', { po_number: order.po_number })}
                </Link>
            </div>

            <form onSubmit={submitDraft} className="space-y-6">
                <div className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-gray-700">
                    <span className="mr-4">
                        {t('purchasing.grn.create.po')} <strong className="text-indigo-700">{order.po_number}</strong>
                    </span>
                    <span className="mr-4">
                        {t('purchasing.grn.create.supplier')} <strong className="text-indigo-700">{order.partner.name}</strong>
                    </span>
                    <span>
                        {t('purchasing.grn.create.warehouse')} <strong className="text-indigo-700">{order.warehouse.name}</strong>
                    </span>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                        <div>
                            <InputLabel value={`${t('purchasing.fields.received_at')} *`} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={data.received_at}
                                onChange={(e) => setData('received_at', e.target.value)}
                                required
                            />
                            <InputError message={errors.received_at} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel value={t('purchasing.fields.supplier_do_number')} />
                            <TextInput
                                className="mt-1 block w-full"
                                value={data.supplier_do_number}
                                onChange={(e) => setData('supplier_do_number', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel value={`${t('purchasing.fields.receiving_warehouse')} *`} />
                            <Select
                                className="mt-1"
                                value={data.warehouse_id}
                                onChange={changeWarehouse}
                                placeholder={t('purchasing.placeholders.select_warehouse')}
                                options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                            />
                            <InputError message={errors.warehouse_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel value={t('purchasing.fields.notes')} />
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
                            {t('purchasing.grn.create.items_section')}{' '}
                            <span className="font-normal text-gray-500">{t('purchasing.grn.create.items_hint')}</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                    <th className="px-2 py-2"></th>
                                    <th className="px-2 py-2">{t('purchasing.fields.product')}</th>
                                    <th className="px-2 py-2 text-right">{t('purchasing.fields.ordered')}</th>
                                    <th className="px-2 py-2 text-right">{t('purchasing.fields.remaining')}</th>
                                    <th className="px-2 py-2">{t('purchasing.fields.location')}</th>
                                    <th className="px-2 py-2">
                                        {t('purchasing.fields.batch')} · {t('purchasing.fields.expiry')}
                                    </th>
                                    <th className="px-2 py-2 text-right">{t('purchasing.fields.received')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {receivableItems.map((item, index) => (
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
                                                placeholder={t('purchasing.placeholders.select_location')}
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
                                                    placeholder={t('purchasing.placeholders.batch')}
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
                                                value={data.items[index]?.quantity_received || ''}
                                                onChange={(e) => updateLine(index, 'quantity_received', e.target.value)}
                                            />
                                            <InputError message={(errors as Record<string, string>)[`items.${index}.quantity_received`]} className="mt-1" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <InputError message={errors.items} className="mt-2" />
                    </div>

                    <div className="mx-4 mb-4 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-gray-700">
                        {t('purchasing.grn.create.confirm_hint')}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                        <Link href={prefixedRoute('purchasing.purchase-orders.show', order.id)}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <SecondaryButton type="submit" disabled={processing}>
                            {t('purchasing.grn.create.save_draft')}
                        </SecondaryButton>
                        {can.receive && (
                            <PrimaryButton type="button" disabled={processing} onClick={() => save(true)}>
                                {t('purchasing.grn.create.confirm')}
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
