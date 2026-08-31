import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    MaintenanceCategory,
    MaintenanceSchedule,
    WorkOrderVehicle,
    formatDate,
    formatOdometer,
} from '../../../../maintenanceUtils';

interface PaginatedSchedules {
    data: MaintenanceSchedule[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search?: string | null;
    vehicle_id?: string | null;
    is_active?: string | null;
}

interface Props {
    schedules: PaginatedSchedules;
    vehicles: WorkOrderVehicle[];
    categories: MaintenanceCategory[];
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

function isDue(schedule: MaintenanceSchedule, currentOdometer?: number): boolean {
    if (schedule.interval_type === 'calendar' && schedule.next_service_date) {
        return new Date(schedule.next_service_date) <= new Date();
    }

    if (schedule.interval_type === 'mileage' && schedule.next_service_odometer && currentOdometer !== undefined) {
        return currentOdometer >= schedule.next_service_odometer;
    }

    return false;
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

export default function Index({ schedules, vehicles, categories, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const [search, setSearch] = useState(filters?.search || '');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState<MaintenanceSchedule | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        vehicle_id: '',
        category_id: '',
        name: '',
        interval_type: 'mileage',
        interval_value: '5000',
        last_service_odometer: '',
        last_service_date: '',
        is_active: true,
        notes: '',
    });

    useEffect(() => {
        setSearch(filters?.search || '');
    }, [filters?.search]);

    const hasActiveFilters = Boolean(filters?.search || filters?.vehicle_id || filters?.is_active);

    const kpiStats = useMemo(() => {
        const data = schedules.data;
        let dueCount = 0;
        let activeCount = 0;
        let mileageCount = 0;

        data.forEach((s) => {
            const vOdo = vehicles.find((v) => v.id === s.vehicle_id)?.odometer_km;
            if (isDue(s, vOdo)) dueCount++;
            if (s.is_active) activeCount++;
            if (s.interval_type === 'mileage') mileageCount++;
        });

        return {
            total: schedules.total,
            due: dueCount,
            active: activeCount,
            mileage: mileageCount,
        };
    }, [schedules, vehicles]);

    const applyFilters = (next: { search?: string; vehicle_id?: string | null; is_active?: string | null }) => {
        router.get(
            prefixedRoute('maintenance.schedules.index'),
            {
                search: (next.search ?? search) || undefined,
                vehicle_id: (next.vehicle_id !== undefined ? next.vehicle_id : filters?.vehicle_id) || undefined,
                is_active: (next.is_active !== undefined ? next.is_active : filters?.is_active) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleVehicleFilter = (vehicleId: string) => {
        applyFilters({ vehicle_id: vehicleId || null });
    };

    const handleStatusFilter = (status: string) => {
        applyFilters({ is_active: status || null });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(prefixedRoute('maintenance.schedules.index'), {}, { preserveState: true, replace: true });
    };

    const openCreate = (): void => {
        setEditingSchedule(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (s: MaintenanceSchedule): void => {
        setEditingSchedule(s);
        setData({
            vehicle_id: String(s.vehicle_id),
            category_id: String(s.category_id),
            name: s.name,
            interval_type: s.interval_type,
            interval_value: String(s.interval_value),
            last_service_odometer: s.last_service_odometer ? String(s.last_service_odometer) : '',
            last_service_date: s.last_service_date ?? '',
            is_active: s.is_active,
            notes: s.notes ?? '',
        });
        setShowModal(true);
    };

    const closeModal = (): void => {
        setShowModal(false);
        setEditingSchedule(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (editingSchedule) {
            patch(prefixedRoute('maintenance.schedules.update', editingSchedule.id), { onSuccess: closeModal });
        } else {
            post(prefixedRoute('maintenance.schedules.store'), { onSuccess: closeModal });
        }
    };

    const confirmDelete = (): void => {
        if (!deletingSchedule) return;
        setDeleting(true);
        router.delete(prefixedRoute('maintenance.schedules.destroy', deletingSchedule.id), {
            onSuccess: () => setDeletingSchedule(null),
            onFinish: () => setDeleting(false),
        });
    };

    const formatInterval = (schedule: MaintenanceSchedule): string => {
        if (schedule.interval_type === 'mileage') {
            return `Setiap ${new Intl.NumberFormat(localeTag).format(schedule.interval_value)} km`;
        }

        return `Setiap ${schedule.interval_value} hari`;
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Jadwal Maintenance Berkala"
                    subtitle="Atur jadwal servis rutin kendaraan berdasarkan jarak tempuh (odometer km) atau interval kalender."
                    actions={
                        can.create && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                            >
                                <span>+ Buat Jadwal Baru</span>
                            </button>
                        )
                    }
                />
            }
        >
            <Head title="Jadwal Servis · Maintenance" />
            <MaintenanceNav />

            <div className="w-full space-y-6 pb-20">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Jadwal</p>
                            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{kpiStats.total}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            📅
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Waktunya Servis (Due)</p>
                            <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{kpiStats.due}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                            ⚠️
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Jadwal Aktif</p>
                            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpiStats.active}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            ✓
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Interval Jarak (Km)</p>
                            <p className="mt-1 text-2xl font-black text-sky-600 dark:text-sky-400">{kpiStats.mileage}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl font-bold text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                            🚗
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar & Actions */}
                <div className="relative z-20 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Search & Filter Inputs */}
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                            {/* Search Input */}
                            <form onSubmit={handleSearch} className="relative min-w-[220px] flex-1 sm:max-w-xs">
                                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari jadwal, unit, catatan..."
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

                            {/* Vehicle Filter Select */}
                            <div className="min-w-[200px]">
                                <Select
                                    className="w-full !py-1.5 text-xs"
                                    value={filters?.vehicle_id ?? ''}
                                    onChange={handleVehicleFilter}
                                    searchable
                                    placeholder="Semua Kendaraan"
                                    options={[
                                        { value: '', label: 'Semua Kendaraan' },
                                        ...vehicles.map((v) => ({
                                            value: String(v.id),
                                            label: `${v.name} — ${v.plate_number}`,
                                        })),
                                    ]}
                                />
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850">
                                {[
                                    { key: '', label: 'Semua Status' },
                                    { key: '1', label: 'Aktif' },
                                    { key: '0', label: 'Non Aktif' },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleStatusFilter(tab.key)}
                                        className={`rounded-xl px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                                            (filters?.is_active || '') === tab.key
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
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM14 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM4 16a2.25 2.25 0 012.25-2.25H6a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2zM14 16a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Rendering */}
                {schedules.data.length === 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-4xl mb-3 block">📅</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {hasActiveFilters ? 'Tidak Ditemukan Jadwal yang Sesuai' : 'Belum Ada Jadwal Servis Berkala'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                            {hasActiveFilters
                                ? 'Coba ubah kata kunci pencarian atau sesuaikan filter kendaraan / status di atas.'
                                : 'Buat jadwal servis rutin pertama berdasarkan odometer km atau tanggal interval kalender.'}
                        </p>
                        {can.create && !hasActiveFilters && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                            >
                                + Buat Jadwal Pertama
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Card View */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {schedules.data.map((s) => {
                            const vehicleOdometer = vehicles.find((v) => v.id === s.vehicle_id)?.odometer_km;
                            const due = isDue(s, vehicleOdometer);

                            return (
                                <div
                                    key={s.id}
                                    className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md dark:bg-slate-900 flex flex-col justify-between ${
                                        due
                                            ? 'border-amber-300 ring-2 ring-amber-500/20 dark:border-amber-700'
                                            : s.is_active
                                                ? 'border-slate-200/80 dark:border-slate-800'
                                                : 'border-slate-200/60 bg-slate-50/50 opacity-75 dark:border-slate-800 dark:bg-slate-850'
                                    }`}
                                >
                                    <div>
                                        {/* Due Alert Badge */}
                                        {due && (
                                            <div className="mb-3 rounded-2xl bg-amber-100 dark:bg-amber-950/70 p-2 text-center">
                                                <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                                                    ⚠️ WAKTUNYA SERVIS (DUE)
                                                </span>
                                            </div>
                                        )}

                                        {/* Vehicle & Status Header */}
                                        <div className="flex items-center justify-between gap-2">
                                            {s.vehicle ? (
                                                <Link
                                                    href={prefixedRoute('fleet.vehicles.show', s.vehicle_id)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                                                >
                                                    <span>🚘</span>
                                                    <span>{s.vehicle.plate_number}</span>
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}

                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-0.5 text-xs font-black ${
                                                    s.is_active
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                <span>{s.is_active ? 'Aktif' : 'Non Aktif'}</span>
                                            </span>
                                        </div>

                                        {/* Name & Category */}
                                        <div className="mt-3 space-y-1">
                                            <h4 className="text-base font-black text-slate-900 dark:text-white block truncate" title={s.name}>
                                                {s.name}
                                            </h4>
                                            {s.category && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.category.color }} />
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{s.category.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Interval Pill */}
                                        <div className="mt-3">
                                            <span className="inline-flex items-center rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                🔄 {formatInterval(s)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Next Service Info & Actions */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">Servis Berikutnya:</span>
                                            <span className={`font-mono font-black ${due ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                {s.interval_type === 'mileage'
                                                    ? formatOdometer(s.next_service_odometer, localeTag)
                                                    : formatDate(s.next_service_date, localeTag)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <span className="text-[11px] text-slate-400">
                                                Terakhir: {s.interval_type === 'mileage' ? formatOdometer(s.last_service_odometer, localeTag) : formatDate(s.last_service_date, localeTag)}
                                            </span>

                                            <div className="flex items-center gap-1">
                                                {can.update && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(s)}
                                                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                        title="Edit Jadwal"
                                                    >
                                                        <PencilIcon />
                                                    </button>
                                                )}
                                                {can.delete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingSchedule(s)}
                                                        className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                                        title="Hapus Jadwal"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                )}
                                            </div>
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
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Kendaraan
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Nama Jadwal & Kategori
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Interval Servis
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Servis Terakhir
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Servis Berikutnya
                                        </th>
                                        <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Status
                                        </th>
                                        <th className="w-24 px-4 py-3.5 text-right font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                    {schedules.data.map((s) => {
                                        const vehicleOdometer = vehicles.find((v) => v.id === s.vehicle_id)?.odometer_km;
                                        const due = isDue(s, vehicleOdometer);

                                        return (
                                            <tr
                                                key={s.id}
                                                className={`group transition-colors ${due ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/50'}`}
                                            >
                                                <td className="whitespace-nowrap px-4 py-3.5">
                                                    {s.vehicle ? (
                                                        <Link
                                                            href={prefixedRoute('fleet.vehicles.show', s.vehicle_id)}
                                                            className="font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                        >
                                                            {s.vehicle.name}
                                                            <p className="font-mono text-xs text-slate-400">{s.vehicle.plate_number}</p>
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        {s.category && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.category.color }} />}
                                                        <div>
                                                            <p className="font-black text-slate-900 dark:text-white">{s.name}</p>
                                                            <p className="text-xs text-slate-400">{s.category?.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                                                    {formatInterval(s)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-slate-500">
                                                    {s.interval_type === 'mileage'
                                                        ? formatOdometer(s.last_service_odometer, localeTag)
                                                        : formatDate(s.last_service_date, localeTag)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5 font-mono">
                                                    <span className={`font-black ${due ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {s.interval_type === 'mileage'
                                                            ? formatOdometer(s.next_service_odometer, localeTag)
                                                            : formatDate(s.next_service_date, localeTag)}
                                                    </span>
                                                    {due && (
                                                        <span className="ml-2 rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                            ⚠️ Due
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black ${
                                                            s.is_active
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                        <span>{s.is_active ? 'Aktif' : 'Non Aktif'}</span>
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {can.update && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(s)}
                                                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon />
                                                            </button>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingSchedule(s)}
                                                                className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
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
                    </div>
                )}

                {/* Pagination */}
                {schedules.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('common.showing_results', {
                                from: schedules.total === 0 ? 0 : (schedules.current_page - 1) * schedules.per_page + 1,
                                to: Math.min(schedules.current_page * schedules.per_page, schedules.total),
                                total: schedules.total,
                            })}
                        </p>
                        <div className="flex gap-1.5">
                            {schedules.links.map((link, index) => (
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

            {/* Create/Edit Modal */}
            <Modal show={showModal} onClose={closeModal} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {editingSchedule ? `Edit Jadwal: ${editingSchedule.name}` : 'Buat Jadwal Maintenance Baru'}
                        </h3>
                        <p className="text-xs text-slate-400">Atur interval servis periodik berdasarkan jarak tempuh atau waktu.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="vehicle_id" value="Kendaraan Target *" />
                            <Select
                                id="vehicle_id"
                                className="mt-1.5 w-full"
                                value={data.vehicle_id}
                                onChange={(val) => setData('vehicle_id', val)}
                                searchable
                                options={vehicles.map((v) => ({ value: String(v.id), label: `${v.name} — ${v.plate_number}` }))}
                                placeholder="Pilih Kendaraan..."
                            />
                            <InputError message={errors.vehicle_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="category_id" value="Kategori Maintenance *" />
                            <Select
                                id="category_id"
                                className="mt-1.5 w-full"
                                value={data.category_id}
                                onChange={(val) => setData('category_id', val)}
                                searchable
                                options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                                placeholder="Pilih Kategori..."
                            />
                            <InputError message={errors.category_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Nama Jadwal Servis *" />
                            <TextInput
                                id="name"
                                className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="contoh: Ganti Oli Rutin, Tune Up..."
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="interval_type" value="Tipe Interval *" />
                                <Select
                                    id="interval_type"
                                    className="mt-1.5 w-full"
                                    value={data.interval_type}
                                    onChange={(val) => setData('interval_type', val as 'mileage' | 'calendar')}
                                    options={[
                                        { value: 'mileage', label: 'Jarak Tempuh (Odometer Km)' },
                                        { value: 'calendar', label: 'Waktu (Hari)' },
                                    ]}
                                />
                                <InputError message={errors.interval_type} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="interval_value"
                                    value={data.interval_type === 'mileage' ? 'Nilai Interval (Km) *' : 'Nilai Interval (Hari) *'}
                                />
                                <TextInput
                                    id="interval_value"
                                    type="number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.interval_value}
                                    onChange={(e) => setData('interval_value', e.target.value)}
                                    required
                                />
                                <InputError message={errors.interval_value} className="mt-1" />
                            </div>
                        </div>

                        {data.interval_type === 'mileage' ? (
                            <div>
                                <InputLabel htmlFor="last_service_odometer" value="Servis Terakhir di Odometer (km)" />
                                <TextInput
                                    id="last_service_odometer"
                                    type="number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.last_service_odometer}
                                    onChange={(e) => setData('last_service_odometer', e.target.value)}
                                    placeholder="contoh: 120000"
                                />
                                <InputError message={errors.last_service_odometer} className="mt-1" />
                            </div>
                        ) : (
                            <div>
                                <InputLabel htmlFor="last_service_date" value="Tanggal Servis Terakhir" />
                                <TextInput
                                    id="last_service_date"
                                    type="date"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.last_service_date}
                                    onChange={(e) => setData('last_service_date', e.target.value)}
                                />
                                <InputError message={errors.last_service_date} className="mt-1" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="notes" value="Catatan Tambahan" />
                            <textarea
                                id="notes"
                                rows={2}
                                className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Catatan atau syarat servis khusus..."
                            />
                            <InputError message={errors.notes} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={closeModal} className="rounded-2xl">
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing} className="rounded-2xl">
                            {processing ? 'Menyimpan...' : editingSchedule ? '💾 Simpan Perubahan' : 'Simpan Jadwal'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={!!deletingSchedule}
                title="Hapus Jadwal Maintenance"
                message={`Apakah Anda yakin ingin menghapus jadwal "${deletingSchedule?.name ?? ''}"?`}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => setDeletingSchedule(null)}
            />
        </DynamicLayout>
    );
}
