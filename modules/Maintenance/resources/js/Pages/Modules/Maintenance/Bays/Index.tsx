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
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';

interface Bay {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    sort_order: number;
    active_work_orders_count: number;
}

interface PaginatedBays {
    data: Bay[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search?: string | null;
    status?: string | null;
}

interface Props {
    bays: PaginatedBays;
    filters?: Filters;
    can: { manage: boolean };
}

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

export default function Index({ bays, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [search, setSearch] = useState(filters?.search || '');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Bay | null>(null);
    const [deleting, setDeleting] = useState<Bay | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        code: '',
        name: '',
        is_active: true as boolean,
        sort_order: '0',
    });

    useEffect(() => {
        setSearch(filters?.search || '');
    }, [filters?.search]);

    const hasActiveFilters = Boolean(filters?.search || filters?.status);

    const totalBays = bays.total ?? bays.data.length;
    const activeBaysCount = bays.data.filter((b) => b.is_active).length;
    const occupiedBaysCount = bays.data.filter((b) => b.active_work_orders_count > 0).length;
    const inactiveBaysCount = bays.data.filter((b) => !b.is_active).length;

    const applyFilters = (next: { search?: string; status?: string | null }) => {
        router.get(
            prefixedRoute('maintenance.bays.index'),
            {
                search: (next.search ?? search) || undefined,
                status: (next.status !== undefined ? next.status : filters?.status) || undefined,
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

    const clearFilters = () => {
        setSearch('');
        router.get(prefixedRoute('maintenance.bays.index'), {}, { preserveState: true, replace: true });
    };

    const openCreate = (): void => {
        setEditing(null);
        reset();
        setData({ code: '', name: '', is_active: true, sort_order: '0' });
        setShowModal(true);
    };

    const openEdit = (bay: Bay): void => {
        setEditing(bay);
        setData({
            code: bay.code,
            name: bay.name,
            is_active: bay.is_active,
            sort_order: String(bay.sort_order),
        });
        setShowModal(true);
    };

    const closeModal = (): void => {
        setShowModal(false);
        setEditing(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (editing) {
            patch(prefixedRoute('maintenance.bays.update', editing.id), { onSuccess: closeModal });
        } else {
            post(prefixedRoute('maintenance.bays.store'), { onSuccess: closeModal });
        }
    };

    const confirmDelete = (): void => {
        if (!deleting) return;
        setProcessingDelete(true);
        router.delete(prefixedRoute('maintenance.bays.destroy', deleting.id), {
            onSuccess: () => setDeleting(null),
            onFinish: () => setProcessingDelete(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Lokasi & Bay Servis Bengkel"
                    subtitle="Kelola lokasi stall/bay servis bengkel internal untuk alokasi pengerjaan Surat Perintah Kerja (SPK)."
                    actions={
                        can.manage ? (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                            >
                                <span>+ Tambah Bay Baru</span>
                            </button>
                        ) : undefined
                    }
                />
            }
        >
            <Head title="Bay Servis · Maintenance" />
            <MaintenanceNav />

            <div className="w-full space-y-6 pb-20">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Stall & Bay</p>
                            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalBays}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            🏭
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Aktif & Siap Pakai</p>
                            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeBaysCount}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            ✓
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sedang Terisi SPK</p>
                            <p className="mt-1 text-2xl font-black text-sky-600 dark:text-sky-400">{occupiedBaysCount}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl font-bold text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                            🔧
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Non-Aktif / Maintenance</p>
                            <p className="mt-1 text-2xl font-black text-slate-600 dark:text-slate-400">{inactiveBaysCount}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            ⛔
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
                                    placeholder="Cari kode atau nama stall bay..."
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
                                            (filters?.status || '') === tab.key
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
                {bays.data.length === 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-4xl mb-3 block">🏭</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {hasActiveFilters ? 'Tidak Ditemukan Stall / Bay yang Sesuai' : 'Belum Ada Lokasi & Bay Servis Bengkel'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                            {hasActiveFilters
                                ? 'Coba ubah kata kunci pencarian atau sesuaikan filter status di atas.'
                                : 'Tambahkan lokasi bay bengkel internal untuk mulai mengalokasikan pengerjaan SPK perbaikan unit.'}
                        </p>
                        {can.manage && !hasActiveFilters && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                            >
                                + Tambah Bay Pertama
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Card View */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {bays.data.map((bay) => {
                            const isOccupied = bay.active_work_orders_count > 0;

                            return (
                                <div
                                    key={bay.id}
                                    className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md dark:bg-slate-900 flex flex-col justify-between ${
                                        isOccupied
                                            ? 'border-sky-300 ring-2 ring-sky-500/10 dark:border-sky-800'
                                            : bay.is_active
                                                ? 'border-slate-200/80 dark:border-slate-800'
                                                : 'border-slate-200/60 bg-slate-50/50 opacity-75 dark:border-slate-800 dark:bg-slate-850'
                                    }`}
                                >
                                    <div>
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="rounded-xl bg-slate-900 px-2.5 py-1 font-mono text-xs font-black text-white dark:bg-slate-200 dark:text-slate-900">
                                                {bay.code}
                                            </span>

                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-0.5 text-xs font-black ${
                                                    bay.is_active
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${bay.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                <span>{bay.is_active ? 'Aktif' : 'Non Aktif'}</span>
                                            </span>
                                        </div>

                                        {/* Name */}
                                        <div className="mt-3 space-y-1.5">
                                            <h4 className="text-base font-black text-slate-900 dark:text-white block truncate" title={bay.name}>
                                                {bay.name}
                                            </h4>

                                            {isOccupied ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800">
                                                    <span>🔧</span>
                                                    <span>{bay.active_work_orders_count} SPK Sedang Dikerjakan</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800">
                                                    <span>✨</span>
                                                    <span>Standby / Kosong</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Urutan Tampilan:</span>
                                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{bay.sort_order}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Status Pengerjaan:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {isOccupied ? 'Terisi Unit' : 'Tersedia'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    {can.manage && (
                                        <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(bay)}
                                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                title="Edit Bay"
                                            >
                                                <PencilIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(bay)}
                                                disabled={isOccupied}
                                                className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-rose-950/40"
                                                title={isOccupied ? 'Tidak dapat dihapus karena sedang digunakan SPK' : 'Hapus Bay'}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    )}
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
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Kode Bay
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Nama Stall / Bay
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            SPK Aktif
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
                                    {bays.data.map((bay) => {
                                        const isOccupied = bay.active_work_orders_count > 0;

                                        return (
                                            <tr
                                                key={bay.id}
                                                className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-850/50"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    {bay.code}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5 font-black text-slate-900 dark:text-white">
                                                    {bay.name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black ${
                                                            bay.is_active
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${bay.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                        <span>{bay.is_active ? 'Aktif' : 'Non Aktif'}</span>
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5">
                                                    {isOccupied ? (
                                                        <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-mono font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                                            {bay.active_work_orders_count} SPK
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">0</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-slate-500">
                                                    #{bay.sort_order}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                    {can.manage && (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(bay)}
                                                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                                title="Edit Bay"
                                                            >
                                                                <PencilIcon />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleting(bay)}
                                                                disabled={isOccupied}
                                                                className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-rose-950/40"
                                                                title={isOccupied ? 'Tidak dapat dihapus karena digunakan SPK' : 'Hapus Bay'}
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        </div>
                                                    )}
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
                {bays.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('common.showing_results', {
                                from: bays.total === 0 ? 0 : (bays.current_page - 1) * bays.per_page + 1,
                                to: Math.min(bays.current_page * bays.per_page, bays.total),
                                total: bays.total,
                            })}
                        </p>
                        <div className="flex gap-1.5">
                            {bays.links.map((link, index) => (
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
            <Modal show={showModal} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            {editing ? `Edit Bay: ${editing.code}` : 'Tambah Bay Bengkel Baru'}
                        </h2>
                        <p className="text-xs text-slate-400">Isi informasi kode unik dan nama stall bay pengerjaan.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="code" value="Kode Bay *" />
                            <TextInput
                                id="code"
                                className="mt-1.5 block w-full !rounded-2xl font-mono uppercase font-black shadow-2xs"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                placeholder="BAY-01, STALL-A..."
                                required
                            />
                            <InputError message={errors.code} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Nama Bay / Stall *" />
                            <TextInput
                                id="name"
                                className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Bay Servis Ringan #1, Stall Hydrolic..."
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="sort_order" value="Urutan Tampilan" />
                            <TextInput
                                id="sort_order"
                                type="number"
                                className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', e.target.value)}
                            />
                            <InputError message={errors.sort_order} className="mt-1" />
                        </div>

                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer pt-2">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Bay Aktif & Siap Digunakan</span>
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={closeModal} className="rounded-2xl">
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing} className="rounded-2xl">
                            {processing ? 'Menyimpan...' : editing ? '💾 Simpan Perubahan' : 'Tambah Bay'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={deleting !== null}
                title="Hapus Bay Servis"
                message={`Apakah Anda yakin ingin menghapus bay "${deleting?.name ?? ''}" (${deleting?.code ?? ''})?`}
                processing={processingDelete}
                onConfirm={confirmDelete}
                onClose={() => setDeleting(null)}
            />
        </DynamicLayout>
    );
}
