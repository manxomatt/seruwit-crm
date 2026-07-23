import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ProductNav from '../../../../ProductNav';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface ProductAttribute {
    id: number;
    name: string;
    type: string;
    sort: number | null;
    options_count: number;
}

interface PaginatedAttributes {
    data: ProductAttribute[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    attributes: PaginatedAttributes;
    filters: { search: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

const TYPE_LABELS: Record<string, string> = {
    select: 'Select',
    color: 'Color',
    radio: 'Radio',
    checkbox: 'Checkbox',
};

export default function Index({ attributes, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [toDelete, setToDelete] = useState<ProductAttribute | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('products.attributes.index'), {
            search: search || undefined,
        }, { preserveState: true, replace: true });
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('products.attributes.destroy', toDelete.id), {
            onSuccess: () => { setShowDeleteDialog(false); setToDelete(null); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Atribut Produk</h2>
                    {can.create && (
                        <Link href={prefixedRoute('products.attributes.create')}>
                            <PrimaryButton>Tambah Atribut</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Atribut Produk" />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput type="text" placeholder="Cari nama atribut..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
                        </div>
                        <PrimaryButton type="submit">Cari</PrimaryButton>
                    </form>

                    {attributes.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">Belum ada atribut</h3>
                            <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan atribut produk baru.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nama</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipe</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Opsi</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Urutan</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {attributes.data.map((attr) => (
                                            <tr key={attr.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{attr.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                        {TYPE_LABELS[attr.type] || attr.type}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{attr.options_count}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">{attr.sort ?? '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && (
                                                            <Link href={prefixedRoute('products.attributes.edit', attr.id)} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => { setToDelete(attr); setShowDeleteDialog(true); }} className="text-red-600 hover:text-red-900">Hapus</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {attributes.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Menampilkan {(attributes.current_page - 1) * attributes.per_page + 1} s/d{' '}
                                        {Math.min(attributes.current_page * attributes.per_page, attributes.total)} dari {attributes.total}
                                    </p>
                                    <div className="flex gap-1">
                                        {attributes.links.map((link, i) => (
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
                title="Hapus Atribut"
                message={toDelete ? `Yakin ingin menghapus atribut "${toDelete.name}"? Semua opsi akan ikut terhapus.` : ''}
            />
        </DynamicLayout>
    );
}
