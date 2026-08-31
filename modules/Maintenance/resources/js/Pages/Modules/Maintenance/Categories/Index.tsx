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
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
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

interface Filters {
    search?: string | null;
}

interface Props {
    categories: PaginatedCategories;
    filters?: Filters;
}

const COLOR_PRESETS = [
    '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#3B82F6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#64748B',
    '#84CC16', '#A78BFA',
];

const PencilIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';

const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50';

export default function Index({ categories, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [search, setSearch] = useState(filters?.search || '');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        key: '',
        name: '',
        description: '',
        color: '#3B82F6',
        sort_order: '0',
    });

    useEffect(() => {
        setSearch(filters?.search || '');
    }, [filters?.search]);

    const hasActiveFilters = Boolean(filters?.search);

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

    const applyFilters = (next: { search?: string }) => {
        router.get(
            prefixedRoute('maintenance.categories.index'),
            {
                search: (next.search ?? search) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(prefixedRoute('maintenance.categories.index'), {}, { preserveState: true, replace: true });
    };

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

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Kategori Maintenance & Servis"
                    subtitle="Kelola pengelompokan jenis perbaikan armada (Mesin, Rem, AC, Ban, Listrik, Dll) beserta warna penanda visual."
                    actions={
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                        >
                            <span>+ Tambah Kategori Baru</span>
                        </button>
                    }
                />
            }
        >
            <Head title="Kategori Maintenance · Fleet" />
            <MaintenanceNav />

            <div className="w-full space-y-6 pb-20">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Kategori</p>
                            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{kpiStats.total}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            🏷️
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Akumulasi SPK Terkait</p>
                            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpiStats.totalWorkOrders}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            🔧
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kategori Paling Banyak</p>
                            <p className="mt-1 text-lg font-black text-slate-900 dark:text-white truncate">{kpiStats.topCategory}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl font-bold text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                            🏆
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar & Actions */}
                <div className="relative z-20 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Search Input */}
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                            <form onSubmit={handleSearch} className="relative min-w-[240px] flex-1 sm:max-w-xs">
                                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama, kode key, deskripsi..."
                                    className="w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-10 pr-8 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white shadow-2xs"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            applyFilters({ search: '' });
                                        }}
                                        className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </form>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    ✕ Reset Filter
                                </button>
                            )}
                        </div>

                        {/* View Switcher */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    title="Tampilan Tabel"
                                    className={`rounded-lg p-1.5 transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5m-16.5-7.5h16.5" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    title="Tampilan Grid Kartu"
                                    className={`rounded-lg p-1.5 transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Rendering */}
                {categories.data.length === 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-4xl mb-3 block">🏷️</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {hasActiveFilters ? 'Tidak Ditemukan Kategori yang Sesuai' : 'Belum Ada Kategori Perbaikan'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                            {hasActiveFilters
                                ? 'Coba ubah kata kunci pencarian pada kotak pencarian di atas.'
                                : 'Buat kategori pertama untuk mulai mengelompokkan jenis pekerjaan SPK perbaikan armada.'}
                        </p>
                        {!hasActiveFilters && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                            >
                                + Tambah Kategori Pertama
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Card View */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {categories.data.map((cat) => (
                            <div
                                key={cat.id}
                                className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
                            >
                                <div>
                                    {/* Header */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white"
                                            style={{ backgroundColor: `${cat.color}25` }}
                                        >
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="font-mono font-black text-[11px]">{cat.key}</span>
                                        </span>

                                        <span className="font-mono text-xs font-bold text-slate-400">
                                            #{cat.sort_order}
                                        </span>
                                    </div>

                                    {/* Name & Description */}
                                    <div className="mt-3 space-y-1">
                                        <h4 className="text-base font-black text-slate-900 dark:text-white block truncate" title={cat.name}>
                                            {cat.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[2rem]">
                                            {cat.description || 'Tidak ada deskripsi tambahan.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <span>🔧</span>
                                        <span>{cat.work_orders_count} SPK</span>
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(cat)}
                                            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                            title="Edit Kategori"
                                        >
                                            <PencilIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingCategory(cat)}
                                            disabled={cat.work_orders_count > 0}
                                            className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-rose-950/40"
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
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-850/80">
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Kategori & Warna
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Kode Key (Unik)
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Deskripsi
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Total SPK Terkait
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Urutan
                                        </th>
                                        <th className="w-24 px-4 py-3.5 text-right font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                    {categories.data.map((cat) => (
                                        <tr key={cat.id} className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                                            <td className="whitespace-nowrap px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                                    <span>{cat.name}</span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                                                    {cat.key}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
                                            <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 font-mono font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                    {cat.work_orders_count} SPK
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 font-mono text-slate-500">
                                                #{cat.sort_order}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(cat)}
                                                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                        title="Edit Kategori"
                                                    >
                                                        <PencilIcon />
                                                        <span>Edit</span>
                                                    </button>

                                                    <Menu as="div" className="relative inline-block text-left">
                                                        <MenuButton
                                                            className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                            title="Menu Aksi Lainnya"
                                                        >
                                                            <EllipsisVerticalIcon />
                                                        </MenuButton>

                                                        <MenuItems
                                                            anchor="bottom end"
                                                            className="z-30 w-48 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                                                        >
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEdit(cat)}
                                                                    className={menuItemClassName}
                                                                >
                                                                    <PencilIcon />
                                                                    <span>Edit Kategori</span>
                                                                </button>
                                                            </MenuItem>
                                                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeletingCategory(cat)}
                                                                    disabled={cat.work_orders_count > 0}
                                                                    className={`${menuItemDangerClassName} disabled:opacity-40 disabled:cursor-not-allowed`}
                                                                >
                                                                    <TrashIcon />
                                                                    <span>Hapus Kategori</span>
                                                                </button>
                                                            </MenuItem>
                                                        </MenuItems>
                                                    </Menu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {categories.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('common.showing_results', {
                                from: categories.total === 0 ? 0 : (categories.current_page - 1) * categories.per_page + 1,
                                to: Math.min(categories.current_page * categories.per_page, categories.total),
                                total: categories.total,
                            })}
                        </p>
                        <div className="flex gap-1.5">
                            {categories.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        link.active
                                            ? 'bg-indigo-600 text-white shadow-2xs'
                                            : link.url
                                                ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
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
