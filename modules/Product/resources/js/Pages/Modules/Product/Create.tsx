import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ProductNav from '../../../ProductNav';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface UnitOption {
    value: string;
    label: string;
}

interface BrandOption {
    id: number;
    name: string;
    principal: { id: number; name: string } | null;
}

interface ProductTypeOption {
    id: number;
    name: string;
    parent_id: number | null;
}

interface Props {
    units: UnitOption[];
    brands: BrandOption[];
    productTypes: ProductTypeOption[];
}

export default function Create({ units, brands, productTypes }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        brand_id: '',
        product_type_id: '',
        sku: '',
        barcode: '',
        name: '',
        unit: '',
        description: '',
        price: '',
        status: 'active',
        category: 'merchandise',
        reorder_threshold: '10',
        reorder_quantity: '50',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Add Product</h2>}
        >
            <Head title="Add Product" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="name" value="Nama Produk" />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="brand_id" value="Brand" />
                                <Select
                                    id="brand_id"
                                    className="mt-1"
                                    value={data.brand_id}
                                    onChange={(value) => setData('brand_id', value)}
                                    placeholder="Pilih brand..."
                                    options={brands.map((b) => ({ value: String(b.id), label: `${b.name}${b.principal ? ` (${b.principal.name})` : ''}` }))}
                                />
                                <InputError message={errors.brand_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="product_type_id" value="Tipe Produk" />
                                <Select
                                    id="product_type_id"
                                    className="mt-1"
                                    value={data.product_type_id}
                                    onChange={(value) => setData('product_type_id', value)}
                                    placeholder="Pilih tipe..."
                                    options={productTypes.map((pt) => ({ value: String(pt.id), label: pt.name }))}
                                />
                                <InputError message={errors.product_type_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="sku" value="SKU" />
                                <TextInput id="sku" className="mt-1 block w-full" value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="Opsional" />
                                <InputError message={errors.sku} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="barcode" value="Barcode" />
                                <TextInput id="barcode" className="mt-1 block w-full" value={data.barcode} onChange={(e) => setData('barcode', e.target.value)} placeholder="Opsional" />
                                <InputError message={errors.barcode} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="unit" value="Satuan" />
                                <Select
                                    id="unit"
                                    className="mt-1"
                                    value={data.unit}
                                    onChange={(value) => setData('unit', value)}
                                    placeholder="Pilih satuan"
                                    options={units.map((unit) => ({ value: unit.value, label: `${unit.label} (${unit.value})` }))}
                                />
                                <InputError message={errors.unit} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="price" value="Harga (opsional)" />
                                <TextInput id="price" type="number" step="0.01" min="0" className="mt-1 block w-full" value={data.price} onChange={(e) => setData('price', e.target.value)} />
                                <InputError message={errors.price} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <Select
                                    id="status"
                                    className="mt-1"
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' },
                                    ]}
                                />
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="mb-1 text-sm font-semibold text-gray-700">Inventory Settings</h3>
                            <p className="mb-4 text-xs text-gray-500">
                                Merchandise dapat dikirim/dijual ke pelanggan; fleet sparepart untuk bengkel/maintenance saja.
                            </p>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                <div>
                                    <InputLabel htmlFor="category" value="Kategori" />
                                    <Select
                                        id="category"
                                        className="mt-1"
                                        value={data.category}
                                        onChange={(value) => setData('category', value)}
                                        options={[
                                            { value: 'merchandise', label: 'Merchandise' },
                                            { value: 'fleet_sparepart', label: 'Fleet Sparepart' },
                                        ]}
                                    />
                                    <InputError message={errors.category} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="reorder_threshold" value="Reorder Threshold" />
                                    <TextInput id="reorder_threshold" type="number" min="0" className="mt-1 block w-full" value={data.reorder_threshold} onChange={(e) => setData('reorder_threshold', e.target.value)} required />
                                    <InputError message={errors.reorder_threshold} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="reorder_quantity" value="Reorder Quantity" />
                                    <TextInput id="reorder_quantity" type="number" min="0" className="mt-1 block w-full" value={data.reorder_quantity} onChange={(e) => setData('reorder_quantity', e.target.value)} required />
                                    <InputError message={errors.reorder_quantity} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value="Deskripsi (opsional)" />
                            <textarea id="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Simpan Produk</PrimaryButton>
                            <Link href={prefixedRoute('products.index')}>
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
