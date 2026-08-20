import ColumnVisibilityMenu, {
    buildColumnVisibility,
    type ColumnDef,
} from '@/Components/ColumnVisibilityMenu';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import FleetNav from '../../../../FleetNav';

interface Manager {
    id: number;
    name: string;
    email: string;
}

interface FleetBaseRow {
    id: number;
    code: string;
    name: string;
    kind: string;
    status: string;
    city: string | null;
    phone: string | null;
    vehicles_count: number;
    manager: Manager | null;
}

interface PaginatedBases {
    data: FleetBaseRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    kind: string | null;
}

interface Props {
    bases: PaginatedBases;
    filters: Filters;
    kinds: string[];
    can: { create: boolean; update: boolean; delete: boolean };
    quota?: { max: number | null; current: number; reached: boolean };
}

type BaseColumn = 'code' | 'name' | 'kind' | 'city' | 'phone' | 'manager' | 'vehicles' | 'status';

const STORAGE_KEY = 'fleet.bases.list.visibleColumns.v1';

const BASE_COLUMN_KEYS: Array<{ key: BaseColumn; required?: boolean; defaultVisible?: boolean }> = [
    { key: 'code', required: true },
    { key: 'name', required: true },
    { key: 'kind', defaultVisible: true },
    { key: 'city', defaultVisible: true },
    { key: 'phone', defaultVisible: false },
    { key: 'manager', defaultVisible: true },
    { key: 'vehicles', defaultVisible: true },
    { key: 'status', defaultVisible: true },
];

const STATUSES = ['active', 'inactive'];

const getKindBadge = (kind: string) => {
    switch (kind) {
        case 'depot':
            return {
                icon: '🏢',
                label: 'Depot Utama',
                className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800',
            };
        case 'yard':
            return {
                icon: '🅿️',
                label: 'Yard / Pool Parkir',
                className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
            };
        case 'satellite':
            return {
                icon: '📍',
                label: 'Cabang Satelit',
                className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800',
            };
        case 'workshop_base':
            return {
                icon: '🛠️',
                label: 'Workshop Base',
                className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
            };
        default:
            return {
                icon: '🏢',
                label: kind,
                className: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300',
            };
    }
};

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

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

function readStoredColumns(): Partial<Record<BaseColumn, boolean>> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<Record<BaseColumn, boolean>>;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export default function Index({ bases, filters, kinds, can, quota }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [search, setSearch] = useState(filters.search || '');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [baseToDelete, setBaseToDelete] = useState<FleetBaseRow | null>(null);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);

    const canBatch = can.update || can.delete;
    const pageIds = useMemo(() => bases.data.map((base) => base.id), [bases.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));
    const hasActiveFilters = Boolean(filters.search || filters.status || filters.kind);

    // KPI stats calculations
    const totalBases = bases.total;
    const activeBasesCount = bases.data.filter((b) => b.status === 'active').length;
    const totalVehiclesParked = bases.data.reduce((sum, b) => sum + (b.vehicles_count || 0), 0);

    const columnDefs = useMemo<Array<ColumnDef<BaseColumn>>>(
        () =>
            BASE_COLUMN_KEYS.map((column) => ({
                ...column,
                label: t(`fleet.bases.columns.${column.key}`, undefined, column.key.toUpperCase()),
            })),
        [t],
    );

    const [visibleColumns, setVisibleColumns] = useState<Record<BaseColumn, boolean>>(() =>
        buildColumnVisibility(BASE_COLUMN_KEYS, typeof window !== 'undefined' ? readStoredColumns() : null),
    );

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        setSelected((prev) => prev.filter((id) => pageIds.includes(id)));
    }, [pageIds]);

    useEffect(() => {
        setSearch(filters.search || '');
    }, [filters.search]);

    const applyFilters = (next: { search?: string; status?: string | null; kind?: string | null }) => {
        router.get(
            prefixedRoute('fleet.bases.index'),
            {
                search: (next.search ?? search) || undefined,
                status: (next.status !== undefined ? next.status : filters.status) || undefined,
                kind: (next.kind !== undefined ? next.kind : filters.kind) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleStatusFilter = (status: string) => {
        applyFilters({ status: status || null });
    };

    const handleKindFilter = (kind: string) => {
        applyFilters({ kind: kind || null });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(prefixedRoute('fleet.bases.index'), {}, { preserveState: true, replace: true });
    };

    const toggleRow = (id: number) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
    };

    const toggleAllOnPage = () => {
        setSelected((prev) => {
            if (allPageSelected) {
                return prev.filter((id) => !pageIds.includes(id));
            }
            return Array.from(new Set([...prev, ...pageIds]));
        });
    };

    const clearSelection = () => {
        setSelected([]);
    };

    const openDeleteDialog = (base: FleetBaseRow) => {
        setBaseToDelete(base);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setBaseToDelete(null);
    };

    const confirmDelete = () => {
        if (!baseToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.bases.destroy', baseToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const applyBatchStatus = (newStatus: 'active' | 'inactive') => {
        if (!can.update || selected.length === 0) return;
        setProcessing(true);
        router.patch(
            prefixedRoute('fleet.bases.batch-status'),
            { ids: selected, status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmBatchDelete = () => {
        if (!can.delete || selected.length === 0) return;
        setProcessing(true);
        router.post(
            prefixedRoute('fleet.bases.batch-destroy'),
            { ids: selected },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowBatchDeleteDialog(false);
                    clearSelection();
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('fleet.bases.title', undefined, 'Manajemen Pool & Base Armada')}
                    subtitle="Kelola titik pool kendaraan, depot pusat, cabang satelit, penanggung jawab, dan distribusi unit armada."
                    actions={
                        can.create && (
                            <Link
                                href={prefixedRoute('fleet.bases.create')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                            >
                                <span>{t('fleet.bases.add', undefined, 'Tambah Base Baru')}</span>
                            </Link>
                        )
                    }
                />
            }
        >
            <Head title={t('fleet.bases.title', undefined, 'Pool Armada (Bases)')} />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-20">
                {/* Quota Limit Warning Alert */}
                {quota?.reached && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs font-semibold text-amber-800 dark:text-amber-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm">⚠️</span>
                            <span>
                                <strong>Batas Kuota Paket Tercapai:</strong> Anda telah menggunakan {quota.current} dari maksimal {quota.max} base armada yang diizinkan pada paket langganan saat ini. Hubungi admin atau upgrade paket untuk menambah base.
                            </span>
                        </div>
                    </div>
                )}

                {/* KPI Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pool & Base</p>
                            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalBases}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            🏢
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Beroperasi (Aktif)</p>
                            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeBasesCount}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            ✓
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Kendaraan Terdaftar</p>
                            <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalVehiclesParked} Unit</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            🚗
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar & Actions */}
                <div className="relative z-20 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Search & Filters */}
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                            {/* Search Input */}
                            <form onSubmit={handleSearch} className="relative min-w-[240px] flex-1 sm:max-w-xs">
                                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('fleet.bases.search', undefined, 'Cari kode, nama, kota, telepon...')}
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

                            {/* Kind Filters */}
                            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850 overflow-x-auto max-w-full">
                                <button
                                    type="button"
                                    onClick={() => handleKindFilter('')}
                                    className={`rounded-xl px-3 py-1 text-xs font-bold transition whitespace-nowrap ${
                                        !filters.kind
                                            ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-300'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    Semua Jenis
                                </button>
                                {kinds.map((k) => {
                                    const kindInfo = getKindBadge(k);
                                    return (
                                        <button
                                            key={k}
                                            type="button"
                                            onClick={() => handleKindFilter(k)}
                                            className={`rounded-xl px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                                                filters.kind === k
                                                    ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-300'
                                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                            }`}
                                        >
                                            <span className="mr-1">{kindInfo.icon}</span>
                                            <span>{kindInfo.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850">
                                {[
                                    { key: '', label: 'Semua Status' },
                                    { key: 'active', label: 'Aktif' },
                                    { key: 'inactive', label: 'Non Aktif' },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleStatusFilter(tab.key)}
                                        className={`rounded-xl px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                                            (filters.status || '') === tab.key
                                                ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

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

                        {/* View Switcher & Column Menu */}
                        <div className="flex items-center gap-2">
                            {/* View Switcher */}
                            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`rounded-xl p-1.5 text-xs font-bold transition ${
                                        viewMode === 'table'
                                            ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-300'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                    title="Tampilan Tabel"
                                >
                                    📋
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`rounded-xl p-1.5 text-xs font-bold transition ${
                                        viewMode === 'grid'
                                            ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-300'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                    title="Tampilan Grid Kartu"
                                >
                                    🗂️
                                </button>
                            </div>

                            <ColumnVisibilityMenu
                                columns={columnDefs}
                                visible={visibleColumns}
                                onChange={setVisibleColumns}
                                label={t('fleet.bases.columns_menu', undefined, 'Kolom')}
                                requiredHint={t('fleet.bases.columns_required_hint', undefined, 'Kolom wajib tidak dapat disembunyikan')}
                                iconOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Floating Batch Action Toolbar */}
                {canBatch && selected.length > 0 && (
                    <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-600/95 backdrop-blur-md px-5 py-3 text-white shadow-xl ring-1 ring-indigo-500/50">
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-xs font-black">
                                {selected.length}
                            </span>
                            <span>Base / Pool dipilih</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {can.update && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => applyBatchStatus('active')}
                                        disabled={processing}
                                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        ✓ Aktifkan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyBatchStatus('inactive')}
                                        disabled={processing}
                                        className="inline-flex items-center gap-1 rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        ⏸ Nonaktifkan
                                    </button>
                                </>
                            )}
                            {can.delete && (
                                <button
                                    type="button"
                                    onClick={() => setShowBatchDeleteDialog(true)}
                                    disabled={processing}
                                    className="inline-flex items-center gap-1 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-rose-600 disabled:opacity-50"
                                >
                                    <TrashIcon />
                                    <span>Hapus ({selected.length})</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={clearSelection}
                                disabled={processing}
                                className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
                            >
                                ✕ Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {bases.data.length === 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-4xl mb-3 block">🏢</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {hasActiveFilters ? 'Tidak Ditemukan Base yang Sesuai' : 'Belum Ada Base / Pool Armada'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                            {hasActiveFilters
                                ? 'Coba ubah kata kunci pencarian atau sesuaikan filter jenis dan status di atas.'
                                : 'Tambahkan titik pool utama, depot armada, atau cabang satelit untuk mengelola persebaran unit.'}
                        </p>
                        {can.create && !hasActiveFilters && (
                            <Link
                                href={prefixedRoute('fleet.bases.create')}
                                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                            >
                                Tambah Base Pertama
                            </Link>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Card View */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bases.data.map((base) => {
                            const kindInfo = getKindBadge(base.kind);
                            const isSelected = selected.includes(base.id);

                            return (
                                <div
                                    key={base.id}
                                    className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md dark:bg-slate-900 ${
                                        isSelected
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                            : 'border-slate-200/80 dark:border-slate-800'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            {canBatch && (
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={isSelected}
                                                    onChange={() => toggleRow(base.id)}
                                                    aria-label={base.name}
                                                />
                                            )}
                                            <span className="font-mono text-xs font-bold text-slate-400">
                                                {base.code}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-xs font-black ${
                                                    base.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${base.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                <span>{base.status === 'active' ? 'Aktif' : 'Non Aktif'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Name & Kind */}
                                    <div className="mt-3 space-y-1.5">
                                        <Link
                                            href={prefixedRoute('fleet.bases.show', base.id)}
                                            className="text-base font-black text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 block truncate"
                                        >
                                            {base.name}
                                        </Link>

                                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold ${kindInfo.className}`}>
                                            <span>{kindInfo.icon}</span>
                                            <span>{kindInfo.label}</span>
                                        </span>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">📍 Kota / Lokasi:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{base.city || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">👤 Penanggung Jawab:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{base.manager?.name || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">🚗 Armada Terparkir:</span>
                                            <span className="rounded-lg bg-indigo-50 px-2 py-0.5 font-mono font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                {base.vehicles_count} Unit
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <Link
                                            href={prefixedRoute('fleet.bases.show', base.id)}
                                            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            Buka Detail Base →
                                        </Link>

                                        <div className="flex items-center gap-1">
                                            {can.update && (
                                                <Link
                                                    href={prefixedRoute('fleet.bases.edit', base.id)}
                                                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                    title="Edit Base"
                                                >
                                                    <PencilIcon />
                                                </Link>
                                            )}
                                            {can.delete && (
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteDialog(base)}
                                                    className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                                    title="Hapus Base"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-850/80">
                                        {canBatch && (
                                            <th className="w-10 px-4 py-3.5">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={allPageSelected}
                                                    ref={(input) => {
                                                        if (input) {
                                                            input.indeterminate = somePageSelected && !allPageSelected;
                                                        }
                                                    }}
                                                    onChange={toggleAllOnPage}
                                                    aria-label={t('common.select_all')}
                                                />
                                            </th>
                                        )}
                                        {visibleColumns.code && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('fleet.bases.columns.code', undefined, 'Kode')}
                                            </th>
                                        )}
                                        {visibleColumns.name && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('fleet.bases.columns.name', undefined, 'Nama Base')}
                                            </th>
                                        )}
                                        {visibleColumns.kind && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('fleet.bases.columns.kind', undefined, 'Jenis Base')}
                                            </th>
                                        )}
                                        {visibleColumns.city && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('fleet.bases.columns.city', undefined, 'Kota / Lokasi')}
                                            </th>
                                        )}
                                        {visibleColumns.phone && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('fleet.bases.columns.phone', undefined, 'Telepon')}
                                            </th>
                                        )}
                                        {visibleColumns.manager && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('fleet.bases.columns.manager', undefined, 'Penanggung Jawab')}
                                            </th>
                                        )}
                                        {visibleColumns.vehicles && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('fleet.bases.columns.vehicles', undefined, 'Armada')}
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('fleet.bases.columns.status', undefined, 'Status')}
                                            </th>
                                        )}
                                        <th className="w-24 px-4 py-3.5 text-right font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                    {bases.data.map((base) => {
                                        const kindInfo = getKindBadge(base.kind);
                                        const isSelected = selected.includes(base.id);

                                        return (
                                            <tr
                                                key={base.id}
                                                className={`group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-850/50 ${
                                                    isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                                }`}
                                            >
                                                {canBatch && (
                                                    <td className="w-10 px-4 py-3.5">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={isSelected}
                                                            onChange={() => toggleRow(base.id)}
                                                            aria-label={base.name}
                                                        />
                                                    </td>
                                                )}

                                                {visibleColumns.code && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                        {base.code}
                                                    </td>
                                                )}

                                                {visibleColumns.name && (
                                                    <td className="whitespace-nowrap px-4 py-3.5">
                                                        <Link
                                                            href={prefixedRoute('fleet.bases.show', base.id)}
                                                            className="font-black text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                        >
                                                            {base.name}
                                                        </Link>
                                                    </td>
                                                )}

                                                {visibleColumns.kind && (
                                                    <td className="whitespace-nowrap px-4 py-3.5">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold ${kindInfo.className}`}>
                                                            <span>{kindInfo.icon}</span>
                                                            <span>{kindInfo.label}</span>
                                                        </span>
                                                    </td>
                                                )}

                                                {visibleColumns.city && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                                        {base.city || '—'}
                                                    </td>
                                                )}

                                                {visibleColumns.phone && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-slate-500">
                                                        {base.phone || '—'}
                                                    </td>
                                                )}

                                                {visibleColumns.manager && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700 dark:text-slate-300 font-bold">
                                                        {base.manager?.name || '—'}
                                                    </td>
                                                )}

                                                {visibleColumns.vehicles && (
                                                    <td className="whitespace-nowrap px-4 py-3.5">
                                                        <span className="rounded-lg bg-indigo-50 px-2 py-0.5 font-mono font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                            {base.vehicles_count} Unit
                                                        </span>
                                                    </td>
                                                )}

                                                {visibleColumns.status && (
                                                    <td className="whitespace-nowrap px-4 py-3.5">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black ${
                                                                base.status === 'active'
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            <span className={`h-1.5 w-1.5 rounded-full ${base.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                            <span>{base.status === 'active' ? 'Aktif' : 'Non Aktif'}</span>
                                                        </span>
                                                    </td>
                                                )}

                                                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={prefixedRoute('fleet.bases.show', base.id)}
                                                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                            title="Buka Detail"
                                                        >
                                                            <EyeIcon />
                                                            <span>Detail</span>
                                                        </Link>

                                                        <Menu as="div" className="relative inline-block text-left">
                                                            <MenuButton
                                                                className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                                title="Menu Aksi Lainnya"
                                                            >
                                                                <EllipsisVerticalIcon />
                                                            </MenuButton>

                                                            <MenuItems
                                                                anchor="bottom end"
                                                                className="z-30 w-44 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                                                            >
                                                                <MenuItem>
                                                                    <Link
                                                                        href={prefixedRoute('fleet.bases.show', base.id)}
                                                                        className={menuItemClassName}
                                                                    >
                                                                        <EyeIcon />
                                                                        <span>{t('common.view', undefined, 'Lihat Detail')}</span>
                                                                    </Link>
                                                                </MenuItem>
                                                                {can.update && (
                                                                    <MenuItem>
                                                                        <Link
                                                                            href={prefixedRoute('fleet.bases.edit', base.id)}
                                                                            className={menuItemClassName}
                                                                        >
                                                                            <PencilIcon />
                                                                            <span>{t('common.edit', undefined, 'Edit Base')}</span>
                                                                        </Link>
                                                                    </MenuItem>
                                                                )}
                                                                {can.delete && (
                                                                    <>
                                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                        <MenuItem>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openDeleteDialog(base)}
                                                                                className={menuItemDangerClassName}
                                                                            >
                                                                                <TrashIcon />
                                                                                <span>{t('common.delete', undefined, 'Hapus Base')}</span>
                                                                            </button>
                                                                        </MenuItem>
                                                                    </>
                                                                )}
                                                            </MenuItems>
                                                        </Menu>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {bases.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('common.showing_results', {
                                from: bases.total === 0 ? 0 : (bases.current_page - 1) * bases.per_page + 1,
                                to: Math.min(bases.current_page * bases.per_page, bases.total),
                                total: bases.total,
                            })}
                        </p>
                        <div className="flex gap-1.5">
                            {bases.links.map((link, index) => (
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

                {/* Confirmation Dialogs */}
                <ConfirmDeleteDialog
                    show={showDeleteDialog}
                    onClose={closeDeleteDialog}
                    onConfirm={confirmDelete}
                    processing={processing}
                    message={
                        baseToDelete
                            ? t('fleet.bases.delete_confirm', { name: baseToDelete.name }, `Apakah Anda yakin ingin menghapus base "${baseToDelete.name}"?`)
                            : undefined
                    }
                />

                <ConfirmDeleteDialog
                    show={showBatchDeleteDialog}
                    onClose={() => !processing && setShowBatchDeleteDialog(false)}
                    onConfirm={confirmBatchDelete}
                    processing={processing}
                    message={t('fleet.bases.batch_delete_confirm', { count: selected.length }, `Anda akan menghapus ${selected.length} base sekaligus.`)}
                />
            </div>
        </DynamicLayout>
    );
}
