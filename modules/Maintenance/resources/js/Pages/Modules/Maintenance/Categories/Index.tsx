import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';
import { MaintenanceCategory } from '../../../../maintenanceUtils';

interface CategoryWithCount extends MaintenanceCategory {
    work_orders_count: number;
}

interface PaginatedCategories {
    data: CategoryWithCount[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    categories: PaginatedCategories;
}

const COLOR_PRESETS = [
    '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#3B82F6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#64748B',
    '#84CC16', '#A78BFA',
];

const PencilIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const GridIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const TableIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z" />
    </svg>
);

export default function Index({ categories }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        key: '',
        name: '',
        description: '',
        color: '#3B82F6',
        sort_order: '0',
    });

    const kpiStats = useMemo(() => {
        const data = categories.data;
        const totalWOs = data.reduce((sum, c) => sum + (c.work_orders_count ?? 0), 0);
        const topCat = [...data].sort((a, b) => b.work_orders_count - a.work_orders_count)[0];

        return {
            total: categories.total,
            totalWorkOrders: totalWOs,
            topCategory: topCat ? `${topCat.name} (${topCat.work_orders_count} SPK)` : '—',
        };
    }, [categories]);

    const openCreate = (): void => {
        setEditingCategory(null);
        reset();
        setData({ key: '', name: '', description: '', color: '#3B82F6', sort_order: '0' });
        setShowModal(true);
    };

    const openEdit = (cat: CategoryWithCount): void => {
        setEditingCategory(cat);
        setData({
            key: cat.key,
            name: cat.name,
            description: cat.description ?? '',
            color: cat.color,
            sort_order: String(cat.sort_order),
        });
        setShowModal(true);
    };

    const closeModal = (): void => {
        setShowModal(false);
        setEditingCategory(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (editingCategory) {
            patch(prefixedRoute('maintenance.categories.update', editingCategory.id), {
                onSuccess: closeModal,
            });
        } else {
            post(prefixedRoute('maintenance.categories.store'), {
                onSuccess: closeModal,
            });
        }
    };

    const confirmDelete = (): void => {
        if (!deletingCategory) return;
        setDeleting(true);
        router.delete(prefixedRoute('maintenance.categories.destroy', deletingCategory.id), {
            onSuccess: () => setDeletingCategory(null),
            onFinish: () => setDeleting(false),
        });
    };

    const kpiCards = [
        { label: 'Total Kategori Servis', value: kpiStats.total.toString(), icon: '🏷️', color: 'indigo' },
        { label: 'Akumulasi SPK Terkait', value: kpiStats.totalWorkOrders.toString(), icon: '🔧', color: 'emerald' },
        { label: 'Kategori Paling Banyak', value: kpiStats.topCategory, icon: '🏆', color: 'sky' },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Kategori Maintenance & Servis"
                    subtitle="Kelola pengelompokan jenis perbaikan armada (Mesin, Rem, AC, Ban, Listrik, Dll) beserta warna penanda visual."
                    actions={
                        <PrimaryButton onClick={openCreate} className="rounded-2xl text-xs font-black shadow-md">
                            Tambah Kategori Baru
                        </PrimaryButton>
                    }
                />
            }
        >
            <Head title="Kategori Maintenance · Fleet" />
            <MaintenanceNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-10">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {kpiCards.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{kpi.label}</p>
                                <span className="text-base">{kpi.icon}</span>
                            </div>
                            <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 dark:text-white truncate">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Header & View Switcher */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Daftar Kategori Perbaikan</h3>
                            <p className="text-xs text-slate-400">Pengelompokan jenis pekerjaan pada Surat Perintah Kerja (SPK).</p>
                        </div>

                        {/* View Mode Switcher */}
                        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-xl transition ${viewMode === 'grid' ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                title="Tampilan Grid"
                            >
                                <GridIcon />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-xl transition ${viewMode === 'table' ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                title="Tampilan Tabel"
                            >
                                <TableIcon />
                            </button>
                        </div>
                    </div>

                    {categories.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <span className="text-4xl">🏷️</span>
                            <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Belum Ada Kategori Perbaikan</h3>
                            <p className="mt-1 text-xs text-slate-400">Buat kategori pertama untuk mulai mengelompokkan jenis pekerjaan SPK.</p>
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-indigo-700"
                            >
                                Tambah Kategori Pertama
                            </button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* Grid View */
                        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {categories.data.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white"
                                                style={{ backgroundColor: `${cat.color}25` }}
                                            >
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                                <span className="font-mono font-black text-[11px]">{cat.key}</span>
                                            </span>

                                            <span className="text-[10px] font-mono text-slate-400">
                                                #{cat.sort_order}
                                            </span>
                                        </div>

                                        <h4 className="mt-3 text-base font-black text-slate-900 dark:text-white">{cat.name}</h4>
                                        {cat.description && (
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                {cat.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            <span>🔧</span>
                                            <span>{cat.work_orders_count} SPK</span>
                                        </span>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(cat)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                                title="Edit Kategori"
                                            >
                                                <PencilIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingCategory(cat)}
                                                disabled={cat.work_orders_count > 0}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-rose-950/50 dark:text-rose-400"
                                                title={cat.work_orders_count > 0 ? 'Tidak dapat dihapus karena digunakan pada SPK' : 'Hapus Kategori'}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Table View */
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-850/80 text-[10px] font-black uppercase text-slate-400">
                                        <th className="px-6 py-3 text-left">Kategori & Warna</th>
                                        <th className="px-6 py-3 text-left">Kode Key (Unik)</th>
                                        <th className="px-6 py-3 text-left">Deskripsi</th>
                                        <th className="px-6 py-3 text-left">Total SPK Terkait</th>
                                        <th className="px-6 py-3 text-left">Urutan</th>
                                        <th className="w-24 px-6 py-3 text-right"><span className="sr-only">Aksi</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {categories.data.map((cat) => (
                                        <tr key={cat.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                                            <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                                    <span>{cat.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-slate-800">
                                                    {cat.key}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
                                            <td className="px-6 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {cat.work_orders_count} SPK
                                            </td>
                                            <td className="px-6 py-3.5 font-mono text-slate-400">#{cat.sort_order}</td>
                                            <td className="whitespace-nowrap px-6 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(cat)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingCategory(cat)}
                                                        disabled={cat.work_orders_count > 0}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-rose-950/50 dark:text-rose-400"
                                                        title={cat.work_orders_count > 0 ? 'Tidak dapat dihapus karena digunakan pada SPK' : 'Hapus'}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {categories.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                            <p className="text-xs text-slate-400">
                                Menampilkan {(categories.current_page - 1) * categories.per_page + 1}–{Math.min(categories.current_page * categories.per_page, categories.total)} dari {categories.total} kategori
                            </p>
                            <div className="flex gap-1">
                                {categories.links.map((link, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${link.active ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : link.url ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200' : 'cursor-not-allowed text-slate-300 dark:text-slate-600'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            <Modal show={showModal} onClose={closeModal} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {editingCategory ? `Edit Kategori: ${editingCategory.name}` : 'Tambah Kategori Maintenance Baru'}
                        </h3>
                        <p className="text-xs text-slate-400">Tentukan nama, kode identifier unik, dan warna label kategori.</p>
                    </div>

                    <div className="space-y-4">
                        {!editingCategory && (
                            <div>
                                <InputLabel htmlFor="key" value="Kode Key Unik (Sistem) *" />
                                <TextInput
                                    id="key"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono text-xs shadow-2xs"
                                    value={data.key}
                                    onChange={(e) => setData('key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                    placeholder="contoh: engine_repair, brake_service..."
                                    required
                                />
                                <p className="mt-1 text-[10px] text-slate-400">Hanya huruf kecil, angka, dan garis bawah (_).</p>
                                <InputError message={errors.key} className="mt-1" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="name" value="Nama Kategori Perbaikan *" />
                            <TextInput
                                id="name"
                                className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="contoh: Perbaikan Mesin, Servis Rem, Kelistrikan..."
                                required
                                autoFocus
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value="Deskripsi Kategori" />
                            <textarea
                                id="description"
                                rows={2}
                                className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Jelaskan cakupan pekerjaan kategori perbaikan ini..."
                            />
                            <InputError message={errors.description} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Warna Label Kategori *" />
                            <div className="mt-2 flex flex-wrap gap-2.5">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setData('color', color)}
                                        className={`h-7 w-7 rounded-full border-2 transition-transform ${data.color === color ? 'scale-125 border-slate-900 ring-2 ring-indigo-500/50 dark:border-white' : 'border-transparent hover:scale-110'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <InputError message={errors.color} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="sort_order" value="Urutan Tampilan" />
                            <TextInput
                                id="sort_order"
                                type="number"
                                className="mt-1.5 block w-28 !rounded-2xl font-mono shadow-2xs"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', e.target.value)}
                            />
                            <InputError message={errors.sort_order} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={closeModal} className="rounded-2xl">
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing} className="rounded-2xl">
                            {processing ? 'Menyimpan...' : editingCategory ? '💾 Simpan Perubahan' : 'Tambah Kategori'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={!!deletingCategory}
                title="Hapus Kategori Maintenance"
                message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name ?? ''}"?`}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => setDeletingCategory(null)}
            />
        </DynamicLayout>
    );
}
