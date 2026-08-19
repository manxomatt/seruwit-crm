import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { formatDate } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import FleetNav from '../../../../FleetNav';

interface Driver {
    id: number;
    name: string;
    license_number: string;
    license_type: string | null;
    license_expires_at: string | null;
    phone: string | null;
    email: string | null;
    photo_url: string | null;
    user_id: number | null;
    status: string;
}

interface PaginatedDrivers {
    data: Driver[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
}

interface Props {
    drivers: PaginatedDrivers;
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

type ExpiryTone = 'ok' | 'soon' | 'expired' | 'empty';

const STATUSES = ['available', 'on_trip', 'off_duty', 'inactive'];

const STATUS_CONFIG: Record<string, { label: string; dot: string; className: string }> = {
    available: { label: 'Tersedia', dot: 'bg-emerald-500', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
    on_trip: { label: 'Dalam Perjalanan', dot: 'bg-sky-500', className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' },
    off_duty: { label: 'Istirahat', dot: 'bg-amber-500', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
    inactive: { label: 'Non-Aktif', dot: 'bg-slate-400', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

function expiryTone(date: string | null): ExpiryTone {
    if (!date) return 'empty';
    const target = new Date(`${date}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 'empty';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'soon';
    return 'ok';
}

function expiryBadgeClass(tone: ExpiryTone): string {
    switch (tone) {
        case 'expired': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
        case 'soon': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
        case 'ok': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
        default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
}

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

export default function Index({ drivers, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [search, setSearch] = useState(filters.search || '');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [batchStatus, setBatchStatus] = useState('');

    const canBatch = can.update || can.delete;
    const pageIds = useMemo(() => drivers.data.map((d) => d.id), [drivers.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));
    const hasActiveFilters = Boolean(filters.search || filters.status);
    const selectionMode = canBatch && selected.length > 0;

    // KPI stats
    const kpiStats = useMemo(() => {
        const data = drivers.data;
        return {
            total: drivers.total,
            available: data.filter((d) => d.status === 'available').length,
            on_trip: data.filter((d) => d.status === 'on_trip').length,
            inactive: data.filter((d) => d.status === 'inactive').length,
        };
    }, [drivers]);

    useEffect(() => {
        setSelected((prev) => prev.filter((id) => pageIds.includes(id)));
    }, [pageIds]);

    useEffect(() => {
        setSearch(filters.search || '');
    }, [filters.search]);

    const applyFilters = (next: { search?: string; status?: string | null }): void => {
        router.get(
            prefixedRoute('fleet.drivers.index'),
            {
                search: (next.search ?? search) || undefined,
                status: (next.status !== undefined ? next.status : filters.status) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const clearFilters = (): void => {
        setSearch('');
        router.get(prefixedRoute('fleet.drivers.index'), {}, { preserveState: true, replace: true });
    };

    const toggleRow = (id: number): void => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const toggleAllOnPage = (): void => {
        setSelected((prev) => {
            if (allPageSelected) {
                return prev.filter((id) => !pageIds.includes(id));
            }

            return Array.from(new Set([...prev, ...pageIds]));
        });
    };

    const clearSelection = (): void => {
        setSelected([]);
        setBatchStatus('');
    };

    const openDeleteDialog = (driver: Driver): void => {
        setDriverToDelete(driver);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = (): void => {
        setShowDeleteDialog(false);
        setDriverToDelete(null);
    };

    const confirmDelete = (): void => {
        if (!driverToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.drivers.destroy', driverToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const applyBatchStatus = (): void => {
        if (!can.update || selected.length === 0 || !batchStatus) return;
        setProcessing(true);
        router.patch(
            prefixedRoute('fleet.drivers.batch-status'),
            { ids: selected, status: batchStatus },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmBatchDelete = (): void => {
        if (!can.delete || selected.length === 0) return;
        setProcessing(true);
        router.post(
            prefixedRoute('fleet.drivers.batch-destroy'),
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

    const kpiCards = [
        { label: 'Total Pengemudi', value: kpiStats.total.toString(), icon: '👥', color: 'indigo' },
        { label: 'Tersedia / Standby', value: kpiStats.available.toString(), icon: '✅', color: 'emerald' },
        { label: 'Dalam Perjalanan', value: kpiStats.on_trip.toString(), icon: '🚗', color: 'sky' },
        { label: 'Non-Aktif', value: kpiStats.inactive.toString(), icon: '⛔', color: 'slate' },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Daftar Pengemudi Fleet"
                    subtitle="Kelola semua pengemudi operasional, pantau status ketersediaan, dan kelola SIM beserta akun portal pengemudi."
                    actions={
                        can.create && (
                            <Link href={prefixedRoute('fleet.drivers.create')}>
                                <PrimaryButton className="rounded-2xl text-xs font-black shadow-md">
                                    Tambah Pengemudi
                                </PrimaryButton>
                            </Link>
                        )
                    }
                />
            }
        >
            <Head title="Pengemudi · Fleet" />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-10">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {kpiCards.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{kpi.label}</p>
                                <span className="text-base">{kpi.icon}</span>
                            </div>
                            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Table/Grid Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Toolbar */}
                    <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        {selectionMode ? (
                            /* Batch Action Bar */
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-2xl bg-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-md">
                                    {selected.length} Pengemudi Terpilih
                                </span>

                                {can.update && (
                                    <div className="flex items-center gap-1.5">
                                        <select
                                            value={batchStatus}
                                            onChange={(e) => setBatchStatus(e.target.value)}
                                            className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        >
                                            <option value="">Ubah Status...</option>
                                            {STATUSES.map((s) => (
                                                <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={applyBatchStatus}
                                            disabled={!batchStatus || processing}
                                            className="inline-flex h-9 items-center rounded-2xl bg-slate-900 px-4 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-700"
                                        >
                                            Terapkan
                                        </button>
                                    </div>
                                )}

                                <div className="ml-auto flex items-center gap-2">
                                    {can.delete && (
                                        <button
                                            type="button"
                                            onClick={() => setShowBatchDeleteDialog(true)}
                                            disabled={processing}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-40 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                                        >
                                            <TrashIcon />
                                            Hapus Terpilih
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="inline-flex h-9 items-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        ✕ Batal Pilih
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {/* Search + View Toggle */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 min-w-[220px]">
                                        <div className="relative flex-1">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                                </svg>
                                            </span>
                                            <TextInput
                                                type="search"
                                                placeholder="Cari pengemudi, nomor SIM..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="w-full !rounded-2xl !py-2 pl-8 text-xs"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="inline-flex h-9 items-center rounded-2xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        >
                                            Cari
                                        </button>
                                    </form>

                                    {/* View mode toggle */}
                                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('table')}
                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-xl transition ${viewMode === 'table' ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                            title="Tampilan tabel"
                                        >
                                            <TableIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('grid')}
                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-xl transition ${viewMode === 'grid' ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                            title="Tampilan grid"
                                        >
                                            <GridIcon />
                                        </button>
                                    </div>

                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="inline-flex h-9 items-center gap-1 rounded-2xl px-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                        >
                                            ✕ Reset Filter
                                        </button>
                                    )}
                                </div>

                                {/* Status Pills */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {[{ value: '', label: 'Semua Status' }, ...STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s]?.label ?? s }))].map((pill) => {
                                        const active = (filters.status || '') === pill.value;
                                        return (
                                            <button
                                                key={pill.value || 'all'}
                                                type="button"
                                                onClick={() => applyFilters({ status: pill.value || null })}
                                                className={`rounded-full px-3 py-1 text-xs font-bold transition ${active ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                                            >
                                                {pill.label}
                                            </button>
                                        );
                                    })}
                                    <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                                        {drivers.total === 0 ? '0 pengemudi' : `${drivers.total} pengemudi`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Empty State */}
                    {drivers.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <span className="text-5xl">👤</span>
                            <h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">Tidak Ada Pengemudi Ditemukan</h3>
                            <p className="mt-1 text-xs text-slate-400">Coba ubah filter pencarian atau tambah pengemudi baru.</p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    Reset semua filter
                                </button>
                            )}
                        </div>
                    ) : viewMode === 'table' ? (
                        /* Table View */
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                    <thead>
                                        <tr className="bg-slate-50/80 dark:bg-slate-850/80">
                                            {canBatch && (
                                                <th className="w-10 px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={allPageSelected}
                                                        ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                                                        onChange={toggleAllOnPage}
                                                    />
                                                </th>
                                            )}
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Pengemudi</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">No. SIM / Golongan</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Masa Berlaku SIM</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Kontak</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Login</th>
                                            <th className="w-24 px-4 py-3"><span className="sr-only">Aksi</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {drivers.data.map((driver) => {
                                            const isSelected = selected.includes(driver.id);
                                            const tone = expiryTone(driver.license_expires_at);
                                            const statusConf = STATUS_CONFIG[driver.status];

                                            return (
                                                <tr
                                                    key={driver.id}
                                                    className={`group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-850/50 ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                                                >
                                                    {canBatch && (
                                                        <td className="whitespace-nowrap px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                                checked={isSelected}
                                                                onChange={() => toggleRow(driver.id)}
                                                                aria-label={driver.name}
                                                            />
                                                        </td>
                                                    )}

                                                    {/* Pengemudi */}
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {driver.photo_url ? (
                                                                <img
                                                                    src={driver.photo_url}
                                                                    alt={driver.name}
                                                                    className="h-9 w-9 flex-shrink-0 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                                                />
                                                            ) : (
                                                                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-slate-100 text-xs font-black text-indigo-600 dark:from-indigo-950/50 dark:to-slate-850 dark:text-indigo-400">
                                                                    {initials(driver.name) || '👤'}
                                                                </span>
                                                            )}
                                                            <div>
                                                                <Link
                                                                    href={prefixedRoute('fleet.drivers.show', driver.id)}
                                                                    className="text-xs font-black text-slate-900 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-400"
                                                                >
                                                                    {driver.name}
                                                                </Link>
                                                                {driver.email && <p className="text-[10px] text-slate-400">{driver.email}</p>}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* SIM */}
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <p className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">{driver.license_number}</p>
                                                        {driver.license_type && (
                                                            <span className="mt-0.5 inline-flex items-center rounded-lg bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                                                                SIM {driver.license_type}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Expiry */}
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                                                            {driver.license_expires_at ? formatDate(driver.license_expires_at, localeTag) : '—'}
                                                        </p>
                                                        <span className={`mt-0.5 inline-flex items-center rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${expiryBadgeClass(tone)}`}>
                                                            {tone === 'expired' ? '⚠ Kadaluarsa' : tone === 'soon' ? '⡒ Segera Habis' : tone === 'ok' ? '✓ Berlaku' : '—'}
                                                        </span>
                                                    </td>

                                                    {/* Kontak */}
                                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                                        {driver.phone || '—'}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {statusConf && (
                                                            <span className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-black ${statusConf.className}`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
                                                                {statusConf.label}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Login */}
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <span className={`inline-flex items-center rounded-xl px-2 py-1 text-[10px] font-bold ${driver.user_id ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                            {driver.user_id ? '✓ Ada Login' : '○ Belum Ada'}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                                                            <Link
                                                                href={prefixedRoute('fleet.drivers.show', driver.id)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                                                title="Lihat Detail"
                                                            >
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            </Link>
                                                            {can.update && (
                                                                <Link
                                                                    href={prefixedRoute('fleet.drivers.edit', driver.id)}
                                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                                                    title="Edit"
                                                                >
                                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                </Link>
                                                            )}
                                                            {can.delete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteDialog(driver)}
                                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400"
                                                                    title="Hapus"
                                                                >
                                                                    <TrashIcon />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        /* Grid View */
                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {drivers.data.map((driver) => {
                                const isSelected = selected.includes(driver.id);
                                const tone = expiryTone(driver.license_expires_at);
                                const statusConf = STATUS_CONFIG[driver.status];

                                return (
                                    <div
                                        key={driver.id}
                                        className={`group relative flex flex-col rounded-2xl border p-4 transition hover:shadow-md ${isSelected ? 'border-indigo-300 bg-indigo-50/40 dark:border-indigo-700 dark:bg-indigo-950/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
                                    >
                                        {canBatch && (
                                            <input
                                                type="checkbox"
                                                className="absolute right-3 top-3 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={isSelected}
                                                onChange={() => toggleRow(driver.id)}
                                                aria-label={driver.name}
                                            />
                                        )}

                                        <div className="flex items-center gap-3">
                                            {driver.photo_url ? (
                                                <img
                                                    src={driver.photo_url}
                                                    alt={driver.name}
                                                    className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                                />
                                            ) : (
                                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 text-sm font-black text-indigo-600 dark:from-indigo-950/50 dark:to-slate-850 dark:text-indigo-400">
                                                    {initials(driver.name) || '👤'}
                                                </span>
                                            )}
                                            <div className="min-w-0">
                                                <Link
                                                    href={prefixedRoute('fleet.drivers.show', driver.id)}
                                                    className="block truncate text-xs font-black text-slate-900 hover:text-indigo-700 dark:text-white"
                                                >
                                                    {driver.name}
                                                </Link>
                                                <p className="font-mono text-[10px] text-slate-400">{driver.license_number}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-1.5">
                                            {statusConf && (
                                                <span className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[10px] font-black ${statusConf.className}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
                                                    {statusConf.label}
                                                </span>
                                            )}
                                            {driver.license_type && (
                                                <span className="ml-1 inline-flex items-center rounded-lg bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                                                    SIM {driver.license_type}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2.5 text-[10px] text-slate-400">
                                            <span className={`${expiryBadgeClass(tone)} rounded-lg px-1.5 py-0.5 font-bold`}>
                                                {tone === 'expired' ? '⚠ SIM Kadaluarsa' : tone === 'soon' ? '⡒ Segera Habis' : tone === 'ok' ? '✓ SIM Berlaku' : '— SIM Tidak Ada'}
                                            </span>
                                        </div>

                                        {driver.phone && (
                                            <p className="mt-2 text-[10px] text-slate-400">{driver.phone}</p>
                                        )}

                                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                            <Link
                                                href={prefixedRoute('fleet.drivers.show', driver.id)}
                                                className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                Lihat Detail →
                                            </Link>
                                            {can.update && (
                                                <Link
                                                    href={prefixedRoute('fleet.drivers.edit', driver.id)}
                                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {drivers.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                            <p className="text-xs text-slate-400">
                                Menampilkan {(drivers.current_page - 1) * drivers.per_page + 1}–{Math.min(drivers.current_page * drivers.per_page, drivers.total)} dari {drivers.total} pengemudi
                            </p>
                            <div className="flex gap-1">
                                {drivers.links.map((link, index) => (
                                    <button
                                        key={index}
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

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                message={driverToDelete ? `Hapus pengemudi "${driverToDelete.name}"? Tindakan ini tidak dapat dibatalkan.` : undefined}
            />

            <ConfirmDeleteDialog
                show={showBatchDeleteDialog}
                onClose={() => !processing && setShowBatchDeleteDialog(false)}
                onConfirm={confirmBatchDelete}
                processing={processing}
                message={`Hapus ${selected.length} pengemudi yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
            />
        </DynamicLayout>
    );
}
