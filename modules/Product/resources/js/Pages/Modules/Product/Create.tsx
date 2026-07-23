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

interface TagOption {
    id: number;
    name: string;
    color: string | null;
}

interface AttributeOptionItem {
    id: number;
    name: string;
    color: string | null;
}

interface AttributeOption {
    id: number;
    name: string;
    type: string;
    options: AttributeOptionItem[];
}

interface PackagingRow {
    name: string;
    barcode: string;
    qty: string;
    sort: string;
}

interface Props {
    units: UnitOption[];
    brands: BrandOption[];
    productTypes: ProductTypeOption[];
    tags: TagOption[];
    attributes: AttributeOption[];
}

const TAG_COLORS: Record<string, string> = {
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    pink: 'bg-pink-100 text-pink-800 border-pink-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
};

const ATTR_TYPE_LABELS: Record<string, string> = {
    select: 'Select',
    color: 'Color',
    radio: 'Radio',
    checkbox: 'Checkbox',
};

export default function Create({ units, brands, productTypes, tags, attributes }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm<{
        brand_id: string;
        product_type_id: string;
        sku: string;
        barcode: string;
        name: string;
        unit: string;
        description: string;
        description_sale: string;
        description_purchase: string;
        price: string;
        cost: string;
        weight: string;
        volume: string;
        status: string;
        category: string;
        tracking: string;
        is_storable: boolean;
        reorder_threshold: string;
        reorder_quantity: string;
        tag_ids: number[];
        attribute_ids: number[];
        packagings: PackagingRow[];
    }>({
        brand_id: '',
        product_type_id: '',
        sku: '',
        barcode: '',
        name: '',
        unit: '',
        description: '',
        description_sale: '',
        description_purchase: '',
        price: '',
        cost: '',
        weight: '',
        volume: '',
        status: 'active',
        category: 'merchandise',
        tracking: 'qty',
        is_storable: true,
        reorder_threshold: '10',
        reorder_quantity: '50',
        tag_ids: [],
        attribute_ids: [],
        packagings: [],
    });

    const isService = data.category === 'service';

    const toggleTag = (tagId: number) => {
        setData('tag_ids', data.tag_ids.includes(tagId) ? data.tag_ids.filter((id) => id !== tagId) : [...data.tag_ids, tagId]);
    };

    const toggleAttribute = (attrId: number) => {
        setData('attribute_ids', data.attribute_ids.includes(attrId) ? data.attribute_ids.filter((id) => id !== attrId) : [...data.attribute_ids, attrId]);
    };

    const addPackaging = () => {
        setData('packagings', [...data.packagings, { name: '', barcode: '', qty: '', sort: String(data.packagings.length) }]);
    };

    const updatePackaging = (index: number, field: keyof PackagingRow, value: string) => {
        const updated = [...data.packagings];
        updated[index] = { ...updated[index], [field]: value };
        setData('packagings', updated);
    };

    const removePackaging = (index: number) => {
        setData('packagings', data.packagings.filter((_, i) => i !== index));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Tambah Produk</h2>}
        >
            <Head title="Tambah Produk" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div>
                            <InputLabel htmlFor="category" value="Jenis Produk" />
                            <Select id="category" className="mt-1 w-64" value={data.category} onChange={(value) => setData('category', value)}
                                options={[{ value: 'merchandise', label: 'Barang (Merchandise)' }, { value: 'fleet_sparepart', label: 'Fleet Sparepart' }, { value: 'service', label: 'Jasa (Service)' }]} />
                            <InputError message={errors.category} className="mt-2" />
                            {isService && (
                                <p className="mt-1 text-xs text-amber-600">Jasa/layanan tidak memerlukan brand, tipe produk, harga beli, stok, berat, volume, kemasan, dan atribut.</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-6 border-t pt-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="name" value="Nama Produk" />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            {!isService && (
                                <>
                                    <div>
                                        <InputLabel htmlFor="brand_id" value="Brand" />
                                        <Select id="brand_id" className="mt-1" value={data.brand_id} onChange={(value) => setData('brand_id', value)} placeholder="Pilih brand..."
                                            options={brands.map((b) => ({ value: String(b.id), label: `${b.name}${b.principal ? ` (${b.principal.name})` : ''}` }))} />
                                        <InputError message={errors.brand_id} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="product_type_id" value="Tipe Produk" />
                                        <Select id="product_type_id" className="mt-1" value={data.product_type_id} onChange={(value) => setData('product_type_id', value)} placeholder="Pilih tipe..."
                                            options={productTypes.map((pt) => ({ value: String(pt.id), label: pt.name }))} />
                                        <InputError message={errors.product_type_id} className="mt-2" />
                                    </div>
                                </>
                            )}
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
                                <Select id="unit" className="mt-1" value={data.unit} onChange={(value) => setData('unit', value)} placeholder="Pilih satuan"
                                    options={units.map((unit) => ({ value: unit.value, label: `${unit.label} (${unit.value})` }))} />
                                <InputError message={errors.unit} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <Select id="status" className="mt-1" value={data.status} onChange={(value) => setData('status', value)}
                                    options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">Harga</h3>
                            <div className={`grid grid-cols-1 gap-6 ${isService ? 'sm:grid-cols-1 max-w-xs' : 'sm:grid-cols-4'}`}>
                                <div>
                                    <InputLabel htmlFor="price" value="Harga Jual" />
                                    <TextInput id="price" type="number" step="0.01" min="0" className="mt-1 block w-full" value={data.price} onChange={(e) => setData('price', e.target.value)} />
                                    <InputError message={errors.price} className="mt-2" />
                                </div>
                                {!isService && (
                                    <>
                                        <div>
                                            <InputLabel htmlFor="cost" value="Harga Beli" />
                                            <TextInput id="cost" type="number" step="0.01" min="0" className="mt-1 block w-full" value={data.cost} onChange={(e) => setData('cost', e.target.value)} />
                                            <InputError message={errors.cost} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="weight" value="Berat (kg)" />
                                            <TextInput id="weight" type="number" step="0.0001" min="0" className="mt-1 block w-full" value={data.weight} onChange={(e) => setData('weight', e.target.value)} />
                                            <InputError message={errors.weight} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="volume" value="Volume (m³)" />
                                            <TextInput id="volume" type="number" step="0.0001" min="0" className="mt-1 block w-full" value={data.volume} onChange={(e) => setData('volume', e.target.value)} />
                                            <InputError message={errors.volume} className="mt-2" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {!isService && (
                            <div className="border-t pt-6">
                                <h3 className="mb-4 text-sm font-semibold text-gray-700">Inventory Settings</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div>
                                        <InputLabel htmlFor="tracking" value="Tracking" />
                                        <Select id="tracking" className="mt-1" value={data.tracking} onChange={(value) => setData('tracking', value)}
                                            options={[{ value: 'qty', label: 'By Quantity' }, { value: 'serial', label: 'By Serial' }, { value: 'lot', label: 'By Lot' }, { value: 'none', label: 'No Tracking' }]} />
                                        <InputError message={errors.tracking} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="reorder_threshold" value="Reorder Threshold" />
                                        <TextInput id="reorder_threshold" type="number" min="0" className="mt-1 block w-full" value={data.reorder_threshold} onChange={(e) => setData('reorder_threshold', e.target.value)} />
                                        <InputError message={errors.reorder_threshold} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="reorder_quantity" value="Reorder Quantity" />
                                        <TextInput id="reorder_quantity" type="number" min="0" className="mt-1 block w-full" value={data.reorder_quantity} onChange={(e) => setData('reorder_quantity', e.target.value)} />
                                        <InputError message={errors.reorder_quantity} className="mt-2" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={data.is_storable} onChange={(e) => setData('is_storable', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm text-gray-700">Produk dapat disimpan di gudang (storable)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-6">
                            <InputLabel value="Tags" />
                            {tags.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                                                data.tag_ids.includes(tag.id) ? (TAG_COLORS[tag.color || ''] || 'bg-indigo-100 text-indigo-800 border-indigo-200') : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}>
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-gray-500">Belum ada tag. <Link href={prefixedRoute('products.tags.create')} className="text-indigo-600 hover:text-indigo-900">Buat tag baru</Link></p>
                            )}
                        </div>

                        {!isService && (
                            <div className="border-t pt-6">
                                <InputLabel value="Atribut Produk" />
                                <p className="mb-3 text-xs text-gray-500">Pilih atribut yang berlaku untuk produk ini (misal: Warna, Ukuran). Atribut digunakan untuk membuat varian produk.</p>
                                {attributes.length > 0 ? (
                                    <div className="space-y-2">
                                        {attributes.map((attr) => (
                                            <label key={attr.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                                                data.attribute_ids.includes(attr.id) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={data.attribute_ids.includes(attr.id)}
                                                    onChange={() => toggleAttribute(attr.id)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium text-gray-900">{attr.name}</span>
                                                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                        {ATTR_TYPE_LABELS[attr.type] || attr.type}
                                                    </span>
                                                </div>
                                                {attr.options.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {attr.options.slice(0, 5).map((opt) => (
                                                            <span key={opt.id} className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                                                {opt.color && <span className="inline-block h-2.5 w-2.5 rounded-full border" style={{ backgroundColor: opt.color }} />}
                                                                {opt.name}
                                                            </span>
                                                        ))}
                                                        {attr.options.length > 5 && (
                                                            <span className="text-xs text-gray-400">+{attr.options.length - 5}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Belum ada atribut. <Link href={prefixedRoute('products.attributes.create')} className="text-indigo-600 hover:text-indigo-900">Buat atribut baru</Link></p>
                                )}
                            </div>
                        )}

                        {!isService && (
                            <div className="border-t pt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <InputLabel value="Kemasan (Packaging)" />
                                    <SecondaryButton type="button" onClick={addPackaging}>+ Tambah Kemasan</SecondaryButton>
                                </div>
                                {data.packagings.length > 0 && (
                                    <div className="space-y-3">
                                        {data.packagings.map((pkg, i) => (
                                            <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                <div className="flex-1">
                                                    <TextInput placeholder="Nama kemasan" className="w-full" value={pkg.name} onChange={(e) => updatePackaging(i, 'name', e.target.value)} required />
                                                </div>
                                                <div className="w-40">
                                                    <TextInput placeholder="Barcode" className="w-full" value={pkg.barcode} onChange={(e) => updatePackaging(i, 'barcode', e.target.value)} />
                                                </div>
                                                <div className="w-28">
                                                    <TextInput type="number" placeholder="Qty / pack" className="w-full" value={pkg.qty} onChange={(e) => updatePackaging(i, 'qty', e.target.value)} />
                                                </div>
                                                <button type="button" onClick={() => removePackaging(i)} className="mt-2 text-red-500 hover:text-red-700">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="border-t pt-6">
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">Deskripsi</h3>
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="description" value="Deskripsi Umum" />
                                    <textarea id="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="description_sale" value="Deskripsi Penjualan" />
                                    <textarea id="description_sale" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.description_sale} onChange={(e) => setData('description_sale', e.target.value)} />
                                    <InputError message={errors.description_sale} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="description_purchase" value="Deskripsi Pembelian" />
                                    <textarea id="description_purchase" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.description_purchase} onChange={(e) => setData('description_purchase', e.target.value)} />
                                    <InputError message={errors.description_purchase} className="mt-2" />
                                </div>
                            </div>
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
