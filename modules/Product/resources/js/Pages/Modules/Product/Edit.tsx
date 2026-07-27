import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ProductNav from '../../../ProductNav';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import ImageUploader from '@/Components/ImageUploader';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';

interface Packaging {
    id: number;
    name: string;
    barcode: string | null;
    qty: string | null;
    sort: number | null;
}

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface ProductAttribute {
    id: number;
    attribute_id: number;
}

interface Product {
    id: number;
    code: string;
    brand_id: number | null;
    product_type_id: number | null;
    sku: string | null;
    barcode: string | null;
    name: string;
    unit: string;
    description: string | null;
    description_sale: string | null;
    description_purchase: string | null;
    price: string | null;
    cost: string | null;
    weight: string | null;
    volume: string | null;
    status: string;
    category: string;
    tracking: string;
    is_storable: boolean;
    reorder_threshold: number;
    reorder_quantity: number;
    images: string[] | null;
    tags: Tag[];
    packagings: Packaging[];
    product_attributes: ProductAttribute[];
}

interface UnitOption { value: string; label: string; }
interface BrandOption { id: number; name: string; principal: { id: number; name: string } | null; }
interface ProductTypeOption { id: number; name: string; parent_id: number | null; }
interface TagOption { id: number; name: string; color: string | null; }

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
    id: number | null;
    name: string;
    barcode: string;
    qty: string;
    sort: string;
}

interface Props {
    product: Product;
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

const CATEGORIES = ['merchandise', 'fleet_sparepart', 'service'] as const;
const TRACKING_KEYS = ['qty', 'serial', 'lot', 'none'] as const;

export default function Edit({ product, units, brands, productTypes, tags, attributes }: Props): JSX.Element {
    const unitOptions = units.some((u) => u.value === product.unit) ? units : [...units, { value: product.unit, label: product.unit }];

    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm<{
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
        image: string;
        tag_ids: number[];
        attribute_ids: number[];
        packagings: PackagingRow[];
    }>({
        brand_id: product.brand_id ? String(product.brand_id) : '',
        product_type_id: product.product_type_id ? String(product.product_type_id) : '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        name: product.name,
        unit: product.unit,
        description: product.description || '',
        description_sale: product.description_sale || '',
        description_purchase: product.description_purchase || '',
        price: product.price || '',
        cost: product.cost || '',
        weight: product.weight || '',
        volume: product.volume || '',
        status: product.status,
        category: product.category ?? 'merchandise',
        tracking: product.tracking ?? 'qty',
        is_storable: product.is_storable ?? true,
        reorder_threshold: String(product.reorder_threshold ?? 10),
        reorder_quantity: String(product.reorder_quantity ?? 50),
        image: product.images?.[0] || '',
        tag_ids: product.tags.map((tg) => tg.id),
        attribute_ids: (product.product_attributes || []).map((pa) => pa.attribute_id),
        packagings: product.packagings.map((p) => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode || '',
            qty: p.qty !== null ? String(p.qty) : '',
            sort: p.sort !== null ? String(p.sort) : '',
        })),
    });

    const categoryOptions = useMemo(
        () => CATEGORIES.map((cat) => ({ value: cat, label: t(`products.categories.${cat}`) })),
        [t],
    );

    const trackingOptions = useMemo(
        () => TRACKING_KEYS.map((key) => ({ value: key, label: t(`products.tracking.${key}`) })),
        [t],
    );

    const statusOptions = useMemo(
        () => [
            { value: 'active', label: t('products.status.active') },
            { value: 'inactive', label: t('products.status.inactive') },
        ],
        [t],
    );

    const isService = data.category === 'service';

    const toggleTag = (tagId: number) => {
        setData('tag_ids', data.tag_ids.includes(tagId) ? data.tag_ids.filter((id) => id !== tagId) : [...data.tag_ids, tagId]);
    };

    const toggleAttribute = (attrId: number) => {
        setData('attribute_ids', data.attribute_ids.includes(attrId) ? data.attribute_ids.filter((id) => id !== attrId) : [...data.attribute_ids, attrId]);
    };

    const addPackaging = () => {
        setData('packagings', [...data.packagings, { id: null, name: '', barcode: '', qty: '', sort: String(data.packagings.length) }]);
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
        patch(prefixedRoute('products.update', product.id));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('products.products.edit.title', { name: product.name })}</h2>}>
            <Head title={t('products.products.edit.title', { name: product.name })} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div>
                            <InputLabel htmlFor="category" value={t('products.fields.category')} />
                            <Select id="category" className="mt-1 w-64" value={data.category} onChange={(value) => setData('category', value)} options={categoryOptions} />
                            <InputError message={errors.category} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 border-t pt-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="name" value={t('products.fields.name')} />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel value={t('products.fields.image')} />
                                <ImageUploader value={data.image} onChange={(value) => setData('image', value)} className="mt-1" />
                                <InputError message={errors.image} className="mt-2" />
                            </div>
                            {!isService && (
                                <>
                                    <div>
                                        <InputLabel htmlFor="brand_id" value={t('products.fields.brand')} />
                                        <Select
                                            id="brand_id"
                                            className="mt-1"
                                            value={data.brand_id}
                                            onChange={(value) => setData('brand_id', value)}
                                            placeholder={t('products.placeholders.select_brand')}
                                            searchable
                                            maxVisibleOptions={10}
                                            options={brands.map((b) => ({
                                                value: String(b.id),
                                                label: `${b.name}${b.principal ? ` (${b.principal.name})` : ''}`,
                                            }))}
                                        />
                                        <InputError message={errors.brand_id} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="product_type_id" value={t('products.fields.product_type')} />
                                        <Select
                                            id="product_type_id"
                                            className="mt-1"
                                            value={data.product_type_id}
                                            onChange={(value) => setData('product_type_id', value)}
                                            placeholder={t('products.placeholders.select_type')}
                                            searchable
                                            maxVisibleOptions={10}
                                            options={productTypes.map((pt) => ({ value: String(pt.id), label: pt.name }))}
                                        />
                                        <InputError message={errors.product_type_id} className="mt-2" />
                                    </div>
                                </>
                            )}
                            <div>
                                <InputLabel htmlFor="sku" value={t('products.fields.sku')} />
                                <TextInput id="sku" className="mt-1 block w-full" value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder={t('products.placeholders.optional')} />
                                <InputError message={errors.sku} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="barcode" value={t('products.fields.barcode')} />
                                <TextInput id="barcode" className="mt-1 block w-full" value={data.barcode} onChange={(e) => setData('barcode', e.target.value)} placeholder={t('products.placeholders.optional')} />
                                <InputError message={errors.barcode} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="unit" value={t('products.fields.unit')} />
                                <Select id="unit" className="mt-1" value={data.unit} onChange={(value) => setData('unit', value)}
                                    options={unitOptions.map((u) => ({ value: u.value, label: `${u.label} (${u.value})` }))} />
                                <InputError message={errors.unit} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value={t('products.fields.status')} />
                                <Select id="status" className="mt-1" value={data.status} onChange={(value) => setData('status', value)} options={statusOptions} />
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('products.products.show.pricing')}</h3>
                            <div className={`grid grid-cols-1 gap-6 ${isService ? 'sm:grid-cols-1 max-w-xs' : 'sm:grid-cols-4'}`}>
                                <div>
                                    <InputLabel htmlFor="price" value={t('products.fields.price')} />
                                    <TextInput id="price" type="number" step="0.01" min="0" className="mt-1 block w-full" value={data.price} onChange={(e) => setData('price', e.target.value)} />
                                    <InputError message={errors.price} className="mt-2" />
                                </div>
                                {!isService && (
                                    <>
                                        <div>
                                            <InputLabel htmlFor="cost" value={t('products.fields.cost')} />
                                            <TextInput id="cost" type="number" step="0.01" min="0" className="mt-1 block w-full" value={data.cost} onChange={(e) => setData('cost', e.target.value)} />
                                            <InputError message={errors.cost} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="weight" value={t('products.fields.weight')} />
                                            <TextInput id="weight" type="number" step="0.0001" min="0" className="mt-1 block w-full" value={data.weight} onChange={(e) => setData('weight', e.target.value)} />
                                            <InputError message={errors.weight} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="volume" value={t('products.fields.volume')} />
                                            <TextInput id="volume" type="number" step="0.0001" min="0" className="mt-1 block w-full" value={data.volume} onChange={(e) => setData('volume', e.target.value)} />
                                            <InputError message={errors.volume} className="mt-2" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {!isService && (
                            <div className="border-t pt-6">
                                <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('products.products.show.inventory')}</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div>
                                        <InputLabel htmlFor="tracking" value={t('products.fields.tracking')} />
                                        <Select id="tracking" className="mt-1" value={data.tracking} onChange={(value) => setData('tracking', value)} options={trackingOptions} />
                                        <InputError message={errors.tracking} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="reorder_threshold" value={t('products.fields.min_stock')} />
                                        <TextInput id="reorder_threshold" type="number" min="0" className="mt-1 block w-full" value={data.reorder_threshold} onChange={(e) => setData('reorder_threshold', e.target.value)} />
                                        <InputError message={errors.reorder_threshold} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="reorder_quantity" value={t('products.fields.max_stock')} />
                                        <TextInput id="reorder_quantity" type="number" min="0" className="mt-1 block w-full" value={data.reorder_quantity} onChange={(e) => setData('reorder_quantity', e.target.value)} />
                                        <InputError message={errors.reorder_quantity} className="mt-2" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={data.is_storable} onChange={(e) => setData('is_storable', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm text-gray-700">{t('products.fields.is_inventoried')}</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-6">
                            <InputLabel value={t('products.fields.tags')} />
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
                                <p className="mt-2 text-sm text-gray-500">{t('products.tags.index.empty')} <Link href={prefixedRoute('products.tags.create')} className="text-indigo-600 hover:text-indigo-900">{t('products.tags.index.new')}</Link></p>
                            )}
                        </div>

                        {!isService && (
                            <div className="border-t pt-6">
                                <InputLabel value={t('products.fields.attributes')} />
                                {attributes.length > 0 ? (
                                    <div className="mt-2 space-y-2">
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
                                                        {t(`products.attribute_types.${attr.type}`, undefined, attr.type)}
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
                                    <p className="mt-2 text-sm text-gray-500">{t('products.attributes.index.empty')} <Link href={prefixedRoute('products.attributes.create')} className="text-indigo-600 hover:text-indigo-900">{t('products.attributes.index.new')}</Link></p>
                                )}
                            </div>
                        )}

                        {!isService && (
                            <div className="border-t pt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <InputLabel value={t('products.fields.packagings')} />
                                    <SecondaryButton type="button" onClick={addPackaging}>+ {t('products.fields.packagings')}</SecondaryButton>
                                </div>
                                {data.packagings.length > 0 && (
                                    <div className="space-y-3">
                                        {data.packagings.map((pkg, i) => (
                                            <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                <div className="flex-1">
                                                    <TextInput placeholder={t('products.fields.name')} className="w-full" value={pkg.name} onChange={(e) => updatePackaging(i, 'name', e.target.value)} required />
                                                </div>
                                                <div className="w-40">
                                                    <TextInput placeholder={t('products.fields.barcode')} className="w-full" value={pkg.barcode} onChange={(e) => updatePackaging(i, 'barcode', e.target.value)} />
                                                </div>
                                                <div className="w-28">
                                                    <TextInput type="number" placeholder={t('products.fields.unit')} className="w-full" value={pkg.qty} onChange={(e) => updatePackaging(i, 'qty', e.target.value)} />
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
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('products.fields.description')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="description" value={t('products.fields.description')} />
                                    <textarea id="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="description_sale" value={t('products.fields.description')} />
                                    <textarea id="description_sale" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.description_sale} onChange={(e) => setData('description_sale', e.target.value)} />
                                    <InputError message={errors.description_sale} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="description_purchase" value={t('products.fields.notes')} />
                                    <textarea id="description_purchase" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.description_purchase} onChange={(e) => setData('description_purchase', e.target.value)} />
                                    <InputError message={errors.description_purchase} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('products.products.edit.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('products.show', product.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
