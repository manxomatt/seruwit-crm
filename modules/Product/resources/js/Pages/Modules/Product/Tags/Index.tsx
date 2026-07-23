import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ProductNav from '../../../../ProductNav';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface ProductTag {
    id: number;
    name: string;
    color: string | null;
    products_count: number;
}

interface PaginatedTags {
    data: ProductTag[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    tags: PaginatedTags;
    filters: { search: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

const TAG_COLORS: Record<string, string> = {
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    pink: 'bg-pink-100 text-pink-800',
    gray: 'bg-gray-100 text-gray-800',
};

export default function Index({ tags, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [toDelete, setToDelete] = useState<ProductTag | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('products.tags.index'), {
            search: search || undefined,
        }, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('products.tags.destroy', toDelete.id), {
            onSuccess: () => { setShowDeleteDialog(false); setToDelete(null); },
            onFinish: () => setProcessing(false),
        });
    };

    const getTagClasses = (color: string | null): string => {
        return TAG_COLORS[color || ''] || 'bg-gray-100 text-gray-800';
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Tags Produk</h2>
                    {can.create && (
                        <Link href={prefixedRoute('products.tags.create')}>
                            <PrimaryButton>Tambah Tag</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Tags Produk" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput type="text" placeholder="Cari nama tag..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
                        </div>
                        <PrimaryButton type="submit">Cari</PrimaryButton>
                    </form>

                    {tags.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">Belum ada tag</h3>
                            <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan tag produk baru.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Warna</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Produk</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {tags.data.map((tag) => (
                                            <tr key={tag.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagClasses(tag.color)}`}>
                                                        {tag.name}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{tag.color || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{tag.products_count}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && (
                                                            <Link href={prefixedRoute('products.tags.edit', tag.id)} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => { setToDelete(tag); setShowDeleteDialog(true); }} className="text-red-600 hover:text-red-900">Hapus</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {tags.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Menampilkan {(tags.current_page - 1) * tags.per_page + 1} s/d{' '}
                                        {Math.min(tags.current_page * tags.per_page, tags.total)} dari {tags.total}
                                    </p>
                                    <div className="flex gap-1">
                                        {tags.links.map((link, i) => (
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
                title="Hapus Tag"
                message={toDelete ? `Yakin ingin menghapus tag "${toDelete.name}"?` : ''}
            />
        </DynamicLayout>
    );
}
