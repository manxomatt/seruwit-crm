import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ProductNav from '../../../../ProductNav';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Principal {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
    status: string;
    products_count: number;
    principal: Principal | null;
}

interface PaginatedBrands {
    data: Brand[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    brands: PaginatedBrands;
    principals: Principal[];
    filters: { search: string | null; principal_id: string | null; status: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ brands, principals, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [toDelete, setToDelete] = useState<Brand | null>(null);
    const [processing, setProcessing] = useState(false);

    const applyFilters = (overrides: Record<string, string | undefined> = {}) => {
        router.get(prefixedRoute('products.brands.index'), {
            search: search || undefined,
            principal_id: filters.principal_id || undefined,
            status: filters.status || undefined,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('products.brands.destroy', toDelete.id), {
            onSuccess: () => { setShowDeleteDialog(false); setToDelete(null); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Brands</h2>
                    {can.create && (
                        <Link href={prefixedRoute('products.brands.create')}>
                            <PrimaryButton>Add Brand</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Brands" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput type="text" placeholder="Cari nama brand..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.principal_id || ''}
                            onChange={(v) => applyFilters({ principal_id: v || undefined })}
                            placeholder="Semua principal"
                            options={[
                                { value: '', label: 'Semua principal' },
                                ...principals.map((p) => ({ value: String(p.id), label: p.name })),
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

                    {brands.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">Belum ada brand</h3>
                            <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan brand baru.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Brand</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Principal</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Produk</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {brands.data.map((b) => (
                                            <tr key={b.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{b.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{b.principal?.name || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{b.products_count}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${b.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && <Link href={prefixedRoute('products.brands.edit', b.id)} className="text-indigo-600 hover:text-indigo-900">Edit</Link>}
                                                        {can.delete && <button onClick={() => { setToDelete(b); setShowDeleteDialog(true); }} className="text-red-600 hover:text-red-900">Hapus</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {brands.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Menampilkan {(brands.current_page - 1) * brands.per_page + 1} s/d{' '}
                                        {Math.min(brands.current_page * brands.per_page, brands.total)} dari {brands.total}
                                    </p>
                                    <div className="flex gap-1">
                                        {brands.links.map((link, i) => (
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
                title="Hapus Brand"
                message={toDelete ? `Yakin ingin menghapus brand "${toDelete.name}"?` : ''}
            />
        </DynamicLayout>
    );
}
