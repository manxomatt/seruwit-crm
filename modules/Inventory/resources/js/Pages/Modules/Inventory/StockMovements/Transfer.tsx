import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import InventoryNav from '../../../../InventoryNav';

interface Product {
    id: number;
    name: string;
    category: string;
    unit: string | null;
}

interface Warehouse {
    id: number;
    name: string;
}

interface Location {
    id: number;
    warehouse_id: number;
    name: string;
    code: string;
}

interface Props {
    products: Product[];
    warehouses: Warehouse[];
    locations: Location[];
}

export default function Transfer({ products, warehouses, locations }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const flash = usePage().props.flash as { error?: string } | undefined;

    const { data, setData, post, processing, errors } = useForm({
        product_id: '',
        from_warehouse_id: warehouses[0] ? String(warehouses[0].id) : '',
        to_warehouse_id: warehouses[1] ? String(warehouses[1].id) : '',
        from_location_id: '',
        to_location_id: '',
        quantity: '',
        reference_code: '',
        notes: '',
    });

    const fromLocations = locations.filter((l) => String(l.warehouse_id) === data.from_warehouse_id);
    const toLocations = locations.filter((l) => String(l.warehouse_id) === data.to_warehouse_id);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('inventory.stock-movements.transfer.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Transfer Stok Antar Gudang</h2>}
        >
            <Head title="Transfer Stok" />
            <InventoryNav />

            <div className="mx-auto max-w-3xl space-y-6">
                <p className="text-sm text-gray-600">
                    Transfer mencatat dua pergerakan sekaligus: <strong>out</strong> dari gudang sumber dan{' '}
                    <strong>in</strong> ke gudang tujuan, dengan satu nomor referensi.
                </p>

                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{flash.error}</div>
                )}

                {warehouses.length < 2 && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Minimal dua gudang aktif dibutuhkan untuk transfer antar gudang.
                    </div>
                )}

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <form onSubmit={submit} className="space-y-6 p-6">
                        <div>
                            <InputLabel value="Produk *" />
                            <Select
                                className="mt-1"
                                value={data.product_id}
                                onChange={(value) => setData('product_id', value)}
                                placeholder="Pilih produk"
                                options={products.map((p) => ({
                                    value: String(p.id),
                                    label: p.unit ? `${p.name} (${p.unit})` : p.name,
                                }))}
                            />
                            <InputError message={errors.product_id} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50/40 p-4">
                                <h3 className="text-sm font-semibold text-red-800">Dari (Out)</h3>
                                <div>
                                    <InputLabel value="Gudang sumber *" />
                                    <Select
                                        className="mt-1"
                                        value={data.from_warehouse_id}
                                        onChange={(value) => {
                                            setData('from_warehouse_id', value);
                                            setData('from_location_id', '');
                                        }}
                                        options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                                    />
                                    <InputError message={errors.from_warehouse_id} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel value="Lokasi sumber (opsional)" />
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.from_location_id}
                                        onChange={(e) => setData('from_location_id', e.target.value)}
                                    >
                                        <option value="">— Tanpa lokasi spesifik —</option>
                                        {fromLocations.map((l) => (
                                            <option key={l.id} value={String(l.id)}>
                                                {l.code} — {l.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.from_location_id} className="mt-2" />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
                                <h3 className="text-sm font-semibold text-emerald-800">Ke (In)</h3>
                                <div>
                                    <InputLabel value="Gudang tujuan *" />
                                    <Select
                                        className="mt-1"
                                        value={data.to_warehouse_id}
                                        onChange={(value) => {
                                            setData('to_warehouse_id', value);
                                            setData('to_location_id', '');
                                        }}
                                        options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                                    />
                                    <InputError message={errors.to_warehouse_id} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel value="Lokasi tujuan (opsional)" />
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.to_location_id}
                                        onChange={(e) => setData('to_location_id', e.target.value)}
                                    >
                                        <option value="">— Tanpa lokasi spesifik —</option>
                                        {toLocations.map((l) => (
                                            <option key={l.id} value={String(l.id)}>
                                                {l.code} — {l.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.to_location_id} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Quantity *" />
                                <TextInput
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="mt-1 block w-full"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    required
                                />
                                <InputError message={errors.quantity} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value="No. Referensi (opsional)" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    placeholder="Otomatis TRF-YYYY-#### jika kosong"
                                    value={data.reference_code}
                                    onChange={(e) => setData('reference_code', e.target.value)}
                                />
                                <InputError message={errors.reference_code} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Catatan" />
                            <textarea
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-3">
                            <PrimaryButton disabled={processing || warehouses.length < 2}>Transfer Stok</PrimaryButton>
                            <Link href={prefixedRoute('inventory.stock-movements.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
