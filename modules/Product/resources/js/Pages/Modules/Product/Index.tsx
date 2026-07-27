import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ProductNav from '../../../ProductNav';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Brand {
    id: number;
    name: string;
    principal: { id: number; name: string } | null;
}

interface ProductTypeOption {
    id: number;
    name: string;
    parent_id: number | null;
}

interface Product {
    id: number;
    code: string;
    sku: string | null;
    barcode: string | null;
    name: string;
    unit: string;
    price: string | null;
    status: string;
    images: string[] | null;
    brand: Brand | null;
    product_type: { id: number; name: string } | null;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    brand_id: string | null;
    product_type_id: string | null;
    category: string | null;
}

interface Props {
    products: PaginatedProducts;
    brands: Brand[];
    productTypes: ProductTypeOption[];
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

const CATEGORIES = ['merchandise', 'fleet_sparepart', 'service'] as const;

const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default function Index({ products, brands, productTypes, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [processing, setProcessing] = useState(false);

    const applyFilters = (overrides: Record<string, string | undefined> = {}) => {
        router.get(prefixedRoute('products.index'), {
            search: search || undefined,
            status: filters.status || undefined,
            brand_id: filters.brand_id || undefined,
            product_type_id: filters.product_type_id || undefined,
            category: filters.category || undefined,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const confirmDelete = () => {
        if (!productToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('products.destroy', productToDelete.id), {
            onSuccess: () => { setShowDeleteDialog(false); setProductToDelete(null); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('products.products.index.head')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('products.create')}>
                            <PrimaryButton>{t('products.products.index.new')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('products.products.index.head')} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('products.placeholders.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.brand_id || ''}
                            onChange={(v) => applyFilters({ brand_id: v || undefined })}
                            placeholder={t('products.placeholders.select_brand')}
                            options={[
                                { value: '', label: t('products.placeholders.select_brand') },
                                ...brands.map((b) => ({ value: String(b.id), label: b.name })),
                            ]}
                        />
                        <Select
                            className="w-48"
                            value={filters.product_type_id || ''}
                            onChange={(v) => applyFilters({ product_type_id: v || undefined })}
                            placeholder={t('products.placeholders.select_type')}
                            options={[
                                { value: '', label: t('products.placeholders.select_type') },
                                ...productTypes.map((pt) => ({ value: String(pt.id), label: pt.name })),
                            ]}
                        />
                        <Select
                            className="w-40"
                            value={filters.category || ''}
                            onChange={(v) => applyFilters({ category: v || undefined })}
                            placeholder={t('products.categories.all')}
                            options={[
                                { value: '', label: t('products.categories.all') },
                                ...CATEGORIES.map((cat) => ({ value: cat, label: t(`products.categories.${cat}`) })),
                            ]}
                        />
                        <Select
                            className="w-40"
                            value={filters.status || ''}
                            onChange={(v) => applyFilters({ status: v || undefined })}
                            placeholder={t('products.status.all')}
                            options={[
                                { value: '', label: t('products.status.all') },
                                { value: 'active', label: t('products.status.active') },
                                { value: 'inactive', label: t('products.status.inactive') },
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {products.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('products.products.index.empty')}</h3>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.image')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.products.index.columns.code')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.products.index.columns.name')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.products.index.columns.brand')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.product_type')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.sku')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.fields.unit')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('products.products.index.columns.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {products.data.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {product.images?.[0] ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="h-10 w-10 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{product.code}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                    <Link href={prefixedRoute('products.show', product.id)} className="text-indigo-600 hover:text-indigo-900">
                                                        {product.name}
                                                    </Link>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.brand?.name || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.product_type?.name || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.sku || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.unit}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(product.status)}`}>
                                                        {t(`products.status.${product.status}`, undefined, product.status)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can.update && (
                                                            <Link
                                                                href={prefixedRoute('products.edit', product.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title={t('common.edit')}
                                                            >
                                                                <PencilIcon />
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { setProductToDelete(product); setShowDeleteDialog(true); }}
                                                                className="text-red-600 hover:text-red-900"
                                                                title={t('common.delete')}
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {products.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (products.current_page - 1) * products.per_page + 1,
                                            to: Math.min(products.current_page * products.per_page, products.total),
                                            total: products.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {products.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setProductToDelete(null); }}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('products.products.index.delete_title')}
                message={productToDelete ? t('products.products.index.delete_confirm', { name: productToDelete.name, code: productToDelete.code }) : ''}
            />
        </DynamicLayout>
    );
}
