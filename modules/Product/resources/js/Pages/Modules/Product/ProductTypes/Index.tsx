import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ProductNav from '../../../../ProductNav';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface ProductTypeItem {
    id: number;
    name: string;
    parent_id: number | null;
    parent: { id: number; name: string } | null;
    sort_order: number;
    products_count: number;
    children_count: number;
}

interface PaginatedProductTypes {
    data: ProductTypeItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    productTypes: PaginatedProductTypes;
    filters: { search: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ productTypes, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [toDelete, setToDelete] = useState<ProductTypeItem | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('products.product-types.index'), { search: search || undefined }, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('products.product-types.destroy', toDelete.id), {
            onSuccess: () => { setShowDeleteDialog(false); setToDelete(null); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Tipe Produk</h2>
                    {can.create && (
                        <Link href={prefixedRoute('products.product-types.create')}>
                            <PrimaryButton>Add Tipe</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Tipe Produk" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput type="text" placeholder="Cari tipe produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
                        </div>
                        <PrimaryButton type="submit">Cari</PrimaryButton>
                    </form>

                    {productTypes.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">Belum ada tipe produk</h3>
                            <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan tipe produk baru.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Parent</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Sub-Tipe</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Produk</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Urutan</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {productTypes.data.map((pt) => (
                                            <tr key={pt.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {pt.parent_id && <span className="mr-1 text-gray-400">└</span>}
                                                    {pt.name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{pt.parent?.name || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{pt.children_count}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{pt.products_count}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{pt.sort_order}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && <Link href={prefixedRoute('products.product-types.edit', pt.id)} className="text-indigo-600 hover:text-indigo-900">Edit</Link>}
                                                        {can.delete && <button onClick={() => { setToDelete(pt); setShowDeleteDialog(true); }} className="text-red-600 hover:text-red-900">Hapus</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {productTypes.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Menampilkan {(productTypes.current_page - 1) * productTypes.per_page + 1} s/d{' '}
                                        {Math.min(productTypes.current_page * productTypes.per_page, productTypes.total)} dari {productTypes.total}
                                    </p>
                                    <div className="flex gap-1">
                                        {productTypes.links.map((link, i) => (
                                            <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : link.url ? 'border bg-white text-gray-700 hover:bg-gray-50' : 'cursor-not-allowed bg-gray-100 text-gray-400'}`}
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
                onClose={() => { setShowDeleteDialog(false); setToDelete(null); }}
                onConfirm={confirmDelete}
                processing={processing}
                title="Hapus Tipe Produk"
                message={toDelete ? `Yakin ingin menghapus tipe "${toDelete.name}"?` : ''}
            />
        </DynamicLayout>
    );
}
