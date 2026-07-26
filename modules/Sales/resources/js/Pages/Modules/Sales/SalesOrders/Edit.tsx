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
import { FormEventHandler } from 'react';
import SalesNav from '../../../../SalesNav';
import { formatMoney } from '@/utils/money';

interface Packaging {
    id: number;
    name: string;
    qty: string;
}

interface Option {
    id: number;
    name: string;
    code?: string;
    unit?: string | null;
    stock_unit?: string | null;
    price?: string | null;
    cost?: string | null;
    price_list_id?: number | null;
    packagings?: Packaging[];
}

interface LineItem {
    product_id: string;
    product_packaging_id: string;
    quantity_ordered: string;
    unit_price: string;
    unit: string;
    notes: string;
}

interface Order {
    id: number;
    partner_id: number;
    warehouse_id: number;
    ordered_at: string;
    promised_at: string | null;
    notes: string | null;
    items: Array<{
        product_id: number;
        product_packaging_id: number | null;
        quantity_ordered: string;
        unit_price: string;
        unit: string | null;
        notes: string | null;
    }>;
}

interface Props {
    order: Order;
    customers: Option[];
    warehouses: Option[];
    products: Option[];
    priceMaps?: Record<string, Record<string, number>>;
}

const catalogUnitPrice = (product: Option | undefined): string => {
    if (product?.price) {
        return String(product.price);
    }
    if (product?.cost) {
        return String(product.cost);
    }

    return '0';
};

export default function Edit({ order, customers, warehouses, products, priceMaps = {} }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const { data, setData, patch, processing, errors, transform } = useForm({
        partner_id: String(order.partner_id),
        warehouse_id: String(order.warehouse_id),
        ordered_at: order.ordered_at.slice(0, 10),
        promised_at: order.promised_at ? order.promised_at.slice(0, 10) : '',
        notes: order.notes || '',
        items: order.items.map((item) => ({
            product_id: String(item.product_id),
            product_packaging_id: item.product_packaging_id ? String(item.product_packaging_id) : '',
            quantity_ordered: String(item.quantity_ordered),
            unit_price: String(item.unit_price),
            unit: item.unit || '',
            notes: item.notes || '',
        })) as LineItem[],
    });

    const resolveUnitPrice = (partnerId: string, productId: string): string => {
        const customer = customers.find((c) => String(c.id) === partnerId);
        const listId = customer?.price_list_id ? String(customer.price_list_id) : '';
        const listed = listId && productId ? priceMaps[listId]?.[productId] : undefined;
        if (listed !== undefined) {
            return String(listed);
        }

        return catalogUnitPrice(products.find((p) => String(p.id) === productId));
    };

    const packagingsFor = (productId: string): Packaging[] =>
        products.find((p) => String(p.id) === productId)?.packagings ?? [];

    const changePartner = (partnerId: string) => {
        setData({
            ...data,
            partner_id: partnerId,
            items: data.items.map((item) =>
                item.product_id
                    ? { ...item, unit_price: resolveUnitPrice(partnerId, item.product_id) }
                    : item,
            ),
        });
    };

    const updateItem = (index: number, field: keyof LineItem, value: string) => {
        const items = data.items.map((item, i) => {
            if (i !== index) {
                return item;
            }
            const next = { ...item, [field]: value };
            if (field === 'product_id') {
                const product = products.find((p) => String(p.id) === value);
                next.product_packaging_id = '';
                next.unit = product?.stock_unit || product?.unit || '';
                next.unit_price = resolveUnitPrice(data.partner_id, value);
            }
            if (field === 'product_packaging_id') {
                const packaging = packagingsFor(next.product_id).find((p) => String(p.id) === value);
                next.unit = packaging?.name
                    || products.find((p) => String(p.id) === next.product_id)?.stock_unit
                    || products.find((p) => String(p.id) === next.product_id)?.unit
                    || '';
            }
            return next;
        });
        setData('items', items);
    };

    const addItem = () =>
        setData('items', [
            ...data.items,
            { product_id: '', product_packaging_id: '', quantity_ordered: '1', unit_price: '0', unit: '', notes: '' },
        ]);

    const removeItem = (index: number) => {
        if (data.items.length === 1) {
            return;
        }
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const grandTotal = data.items.reduce(
        (sum, item) => sum + Number(item.quantity_ordered || 0) * Number(item.unit_price || 0),
        0,
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((form) => ({
            ...form,
            items: form.items.map((item) => ({
                ...item,
                product_packaging_id: item.product_packaging_id || null,
            })),
        }));
        patch(prefixedRoute('sales.sales-orders.update', order.id));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('sales.sales_orders.edit.title')}</h2>}
        >
            <Head title={t('sales.sales_orders.edit.title')} />
            <SalesNav />

            <form onSubmit={submit} className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="space-y-6 p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel value={`${t('sales.fields.customer')} *`} />
                                <Select
                                    className="mt-1"
                                    searchable
                                    value={data.partner_id}
                                    onChange={changePartner}
                                    placeholder={t('sales.placeholders.select_customer')}
                                    searchPlaceholder={t('sales.placeholders.search_customer')}
                                    emptyText={t('common.no_options')}
                                    noResultsText={t('common.no_results')}
                                    options={customers.map((c) => ({
                                        value: String(c.id),
                                        label: c.code ? `${c.code} — ${c.name}` : c.name,
                                    }))}
                                />
                                <InputError message={errors.partner_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value={`${t('sales.fields.source_warehouse')} *`} />
                                <Select
                                    className="mt-1"
                                    value={data.warehouse_id}
                                    onChange={(value) => setData('warehouse_id', value)}
                                    placeholder={t('sales.placeholders.select_warehouse')}
                                    options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                                />
                                <InputError message={errors.warehouse_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value={`${t('sales.fields.ordered_at')} *`} />
                                <TextInput
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.ordered_at}
                                    onChange={(e) => setData('ordered_at', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value={t('sales.fields.promised_at')} />
                                <TextInput
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.promised_at}
                                    onChange={(e) => setData('promised_at', e.target.value)}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel value={t('sales.fields.notes')} />
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={2}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h3 className="text-sm font-semibold text-gray-900">{t('sales.sales_orders.create.items_section')}</h3>
                        <SecondaryButton type="button" onClick={addItem}>
                            {t('sales.sales_orders.create.add_item')}
                        </SecondaryButton>
                    </div>
                    <div className="space-y-4 p-6">
                        {data.items.map((item, index) => {
                            const packagings = packagingsFor(item.product_id);

                            return (
                                <div key={index} className="grid grid-cols-1 gap-3 border-b border-gray-100 pb-4 last:border-0 md:grid-cols-12">
                                    <div className="md:col-span-3">
                                        <Select
                                            searchable
                                            value={item.product_id}
                                            onChange={(value) => updateItem(index, 'product_id', value)}
                                            placeholder={t('sales.placeholders.select_product')}
                                            searchPlaceholder={t('sales.placeholders.search_product')}
                                            emptyText={t('common.no_options')}
                                            noResultsText={t('common.no_results')}
                                            options={products.map((p) => ({
                                                value: String(p.id),
                                                label: p.code ? `${p.code} — ${p.name}` : p.name,
                                            }))}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Select
                                            value={item.product_packaging_id}
                                            onChange={(value) => updateItem(index, 'product_packaging_id', value)}
                                            placeholder={t('sales.placeholders.select_packaging')}
                                            options={packagings.map((p) => ({
                                                value: String(p.id),
                                                label: `${p.name} (×${p.qty})`,
                                            }))}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            className="block w-full"
                                            value={item.quantity_ordered}
                                            onChange={(e) => updateItem(index, 'quantity_ordered', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <TextInput
                                            className="block w-full"
                                            value={item.unit}
                                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            className="block w-full"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between md:col-span-2">
                                        <span className="text-sm font-semibold tabular-nums">
                                            {formatMoney(Number(item.quantity_ordered || 0) * Number(item.unit_price || 0))}
                                        </span>
                                        <button type="button" className="text-lg text-gray-400 hover:text-red-600" onClick={() => removeItem(index)}>
                                            ×
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                        <p className="text-lg font-bold tabular-nums">{formatMoney(grandTotal)}</p>
                        <div className="flex gap-3">
                            <Link href={prefixedRoute('sales.sales-orders.show', order.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>{t('sales.sales_orders.edit.save')}</PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
