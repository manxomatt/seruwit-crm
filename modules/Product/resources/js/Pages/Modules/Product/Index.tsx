import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
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
    brand: (Brand) | null;
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

const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
};

export default function Index({ products, brands, productTypes, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
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
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Products</h2>
                    {can.create && (
                        <Link href={prefixedRoute('products.create')}>
                            <PrimaryButton>Add Product</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Products" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder="Cari nama, kode, SKU, barcode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.brand_id || ''}
                            onChange={(v) => applyFilters({ brand_id: v || undefined })}
                            placeholder="Semua brand"
                            options={[
                                { value: '', label: 'Semua brand' },
                                ...brands.map((b) => ({ value: String(b.id), label: b.name })),
                            ]}
                        />
                        <Select
                            className="w-48"
                            value={filters.product_type_id || ''}
                            onChange={(v) => applyFilters({ product_type_id: v || undefined })}
                            placeholder="Semua tipe"
                            options={[
                                { value: '', label: 'Semua tipe' },
                                ...productTypes.map((pt) => ({ value: String(pt.id), label: pt.name })),
                            ]}
                        />
                        <Select
                            className="w-40"
                            value={filters.category || ''}
                            onChange={(v) => applyFilters({ category: v || undefined })}
                            placeholder="Semua kategori"
                            options={[
                                { value: '', label: 'Semua kategori' },
                                { value: 'merchandise', label: 'Barang' },
                                { value: 'fleet_sparepart', label: 'Sparepart' },
                                { value: 'service', label: 'Jasa' },
                            ]}
                        />
                        <Select
                            className="w-40"
                            value={filters.status || ''}
                            onChange={(v) => applyFilters({ status: v || undefined })}
                            placeholder="Semua status"
                            options={[
                                { value: '', label: 'Semua status' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                        />
                        <PrimaryButton type="submit">Cari</PrimaryButton>
                    </form>

                    {products.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">Belum ada produk</h3>
                            <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan produk baru.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kode</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Brand</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipe</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKU</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Satuan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {products.data.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
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
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && (
                                                            <Link href={prefixedRoute('products.edit', product.id)} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => { setProductToDelete(product); setShowDeleteDialog(true); }} className="text-red-600 hover:text-red-900">Hapus</button>
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
                                        Menampilkan {(products.current_page - 1) * products.per_page + 1} s/d{' '}
                                        {Math.min(products.current_page * products.per_page, products.total)} dari {products.total}
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
                title="Hapus Product"
                message={productToDelete ? `Yakin ingin menghapus "${productToDelete.name}" (${productToDelete.code})?` : ''}
            />
        </DynamicLayout>
    );
}
