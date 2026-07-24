import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import PurchasingNav from '../../../../PurchasingNav';
import { formatMoney } from '@/utils/money';

interface Option {
    id: number;
    name: string;
    code?: string;
    unit?: string | null;
    stock_unit?: string | null;
    cost?: string | null;
}

interface LineItem {
    product_id: string;
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
    expected_at: string | null;
    notes: string | null;
    items: Array<{
        product_id: number;
        quantity_ordered: string;
        unit_price: string;
        unit: string | null;
        notes: string | null;
    }>;
}

interface Props {
    order: Order;
    suppliers: Option[];
    warehouses: Option[];
    products: Option[];
}

export default function Edit({ order, suppliers, warehouses, products }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const { data, setData, patch, processing, errors } = useForm({
        partner_id: String(order.partner_id),
        warehouse_id: String(order.warehouse_id),
        ordered_at: order.ordered_at.slice(0, 10),
        expected_at: order.expected_at ? order.expected_at.slice(0, 10) : '',
        notes: order.notes || '',
        items: order.items.map((item) => ({
            product_id: String(item.product_id),
            quantity_ordered: String(item.quantity_ordered),
            unit_price: String(item.unit_price),
            unit: item.unit || '',
            notes: item.notes || '',
        })) as LineItem[],
    });

    const updateItem = (index: number, field: keyof LineItem, value: string) => {
        const items = data.items.map((item, i) => {
            if (i !== index) {
                return item;
            }
            const next = { ...item, [field]: value };
            if (field === 'product_id') {
                const product = products.find((p) => String(p.id) === value);
                next.unit = product?.stock_unit || product?.unit || '';
                next.unit_price = product?.cost ? String(product.cost) : item.unit_price;
            }
            return next;
        });
        setData('items', items);
    };

    const addItem = () =>
        setData('items', [
            ...data.items,
            { product_id: '', quantity_ordered: '1', unit_price: '0', unit: '', notes: '' },
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
        patch(prefixedRoute('purchasing.purchase-orders.update', order.id));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Edit Purchase Order</h2>}
        >
            <Head title="Edit Purchase Order" />
            <PurchasingNav />

            <form onSubmit={submit} className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="space-y-6 p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Supplier *" />
                                <Select
                                    className="mt-1"
                                    value={data.partner_id}
                                    onChange={(value) => setData('partner_id', value)}
                                    options={suppliers.map((s) => ({
                                        value: String(s.id),
                                        label: s.code ? `${s.code} — ${s.name}` : s.name,
                                    }))}
                                />
                                <InputError message={errors.partner_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value="Gudang Tujuan *" />
                                <Select
                                    className="mt-1"
                                    value={data.warehouse_id}
                                    onChange={(value) => setData('warehouse_id', value)}
                                    options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                                />
                                <InputError message={errors.warehouse_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value="Tanggal Order *" />
                                <TextInput
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.ordered_at}
                                    onChange={(e) => setData('ordered_at', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Estimasi Tiba" />
                                <TextInput
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.expected_at}
                                    onChange={(e) => setData('expected_at', e.target.value)}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel value="Catatan" />
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
                        <h3 className="text-sm font-semibold text-gray-900">Item Pesanan</h3>
                        <SecondaryButton type="button" onClick={addItem}>
                            + Tambah Item
                        </SecondaryButton>
                    </div>
                    <div className="space-y-4 p-6">
                        {data.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 gap-3 border-b border-gray-100 pb-4 last:border-0 md:grid-cols-12">
                                <div className="md:col-span-4">
                                    <Select
                                        value={item.product_id}
                                        onChange={(value) => updateItem(index, 'product_id', value)}
                                        options={products.map((p) => ({
                                            value: String(p.id),
                                            label: p.code ? `${p.code} — ${p.name}` : p.name,
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
                                <div className="md:col-span-2">
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
                        ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                        <p className="text-lg font-bold tabular-nums">{formatMoney(grandTotal)}</p>
                        <div className="flex gap-3">
                            <Link href={prefixedRoute('purchasing.purchase-orders.show', order.id)}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>Save Changes</PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
