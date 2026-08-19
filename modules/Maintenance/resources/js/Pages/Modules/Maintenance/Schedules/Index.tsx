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
import { useMemo, useState } from 'react';
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

interface Props {
    schedules: PaginatedSchedules;
    vehicles: WorkOrderVehicle[];
    categories: MaintenanceCategory[];
    filters: { vehicle_id: string | null; is_active: string | null };
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

export default function Index({ schedules, vehicles, categories, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState<MaintenanceSchedule | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

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

    const applyFilter = (key: string, value: string): void => {
        router.get(prefixedRoute('maintenance.schedules.index'), { ...filters, [key]: value || undefined } as Record<string, string>, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = (): void => {
        router.get(prefixedRoute('maintenance.schedules.index'), {}, { preserveState: true, replace: true });
    };

    const formatInterval = (schedule: MaintenanceSchedule): string => {
        if (schedule.interval_type === 'mileage') {
            return `Setiap ${new Intl.NumberFormat(localeTag).format(schedule.interval_value)} km`;
        }

        return `Setiap ${schedule.interval_value} hari`;
    };

    const kpiCards = [
        { label: 'Total Jadwal Servis', value: kpiStats.total.toString(), icon: '📅', color: 'indigo' },
        { label: 'Waktunya Servis (Overdue)', value: kpiStats.due.toString(), icon: '⚠️', color: 'amber' },
        { label: 'Jadwal Aktif', value: kpiStats.active.toString(), icon: '✅', color: 'emerald' },
        { label: 'Berdasarkan Odometer (Km)', value: kpiStats.mileage.toString(), icon: '🚗', color: 'sky' },
    ];

    const hasActiveFilters = Boolean(filters.vehicle_id || filters.is_active);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Jadwal Maintenance Berkala"
                    subtitle="Atur jadwal servis rutin kendaraan berdasarkan jarak tempuh (odometer km) atau interval kalender."
                    actions={
                        can.create && (
                            <PrimaryButton onClick={openCreate} className="rounded-2xl text-xs font-black shadow-md">
                                Buat Jadwal Baru
                            </PrimaryButton>
                        )
                    }
                />
            }
        >
            <Head title="Jadwal Servis · Maintenance" />
            <MaintenanceNav />

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

                {/* Main Content Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Filter Inputs */}
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                                <Select
                                    className="w-64 !py-1.5 text-xs"
                                    value={filters.vehicle_id ?? ''}
                                    onChange={(val) => applyFilter('vehicle_id', val)}
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

                                <Select
                                    className="w-44 !py-1.5 text-xs"
                                    value={filters.is_active ?? ''}
                                    onChange={(val) => applyFilter('is_active', val)}
                                    placeholder="Semua Status"
                                    options={[
                                        { value: '', label: 'Semua Status' },
                                        { value: '1', label: 'Jadwal Aktif' },
                                        { value: '0', label: 'Jadwal Non-Aktif' },
                                    ]}
                                />

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-9 items-center gap-1 rounded-2xl px-3 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        ✕ Reset Filter
                                    </button>
                                )}
                            </div>

                            {/* View Switcher & Result Count */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs tabular-nums text-slate-400">
                                    {schedules.total} Jadwal
                                </span>
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
                        </div>
                    </div>

                    {/* Empty State */}
                    {schedules.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <span className="text-4xl">📅</span>
                            <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Tidak Ada Jadwal Maintenance</h3>
                            <p className="mt-1 text-xs text-slate-400">Coba ubah filter pencarian atau buat jadwal servis baru.</p>
                            {can.create && (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-indigo-700"
                                >
                                    Buat Jadwal Baru
                                </button>
                            )}
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* Grid View */
                        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {schedules.data.map((s) => {
                                const vehicleOdometer = vehicles.find((v) => v.id === s.vehicle_id)?.odometer_km;
                                const due = isDue(s, vehicleOdometer);

                                return (
                                    <div
                                        key={s.id}
                                        className={`group relative flex flex-col justify-between rounded-3xl border p-5 transition hover:shadow-md ${
                                            due
                                                ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                                                : s.is_active
                                                    ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                                                    : 'border-slate-200/60 bg-slate-50/60 opacity-60 dark:border-slate-800 dark:bg-slate-850'
                                        }`}
                                    >
                                        <div>
                                            {/* Due Alert Badge */}
                                            {due && (
                                                <div className="mb-3 rounded-2xl bg-amber-100 px-3 py-1 text-center dark:bg-amber-950/60">
                                                    <span className="text-[10px] font-black text-amber-800 dark:text-amber-300">
                                                        ⚠️ WAKTUNYA SERVIS (DUE)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Vehicle Pill */}
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

                                                <span className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[10px] font-black ${
                                                    s.is_active
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {s.is_active ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </div>

                                            {/* Name & Category */}
                                            <h4 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{s.name}</h4>
                                            {s.category && (
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.category.color }} />
                                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{s.category.name}</span>
                                                </div>
                                            )}

                                            {/* Interval Badge */}
                                            <div className="mt-3">
                                                <span className="inline-flex items-center rounded-xl bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                    🔄 {formatInterval(s)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Next Service Info & Actions */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400">Servis Berikutnya:</span>
                                                <span className={`font-mono font-black ${due ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                    {s.interval_type === 'mileage'
                                                        ? formatOdometer(s.next_service_odometer, localeTag)
                                                        : formatDate(s.next_service_date, localeTag)}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <span className="text-[10px] text-slate-400">
                                                    Terakhir: {s.interval_type === 'mileage' ? formatOdometer(s.last_service_odometer, localeTag) : formatDate(s.last_service_date, localeTag)}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {can.update && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(s)}
                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                                            title="Edit Jadwal"
                                                        >
                                                            <PencilIcon />
                                                        </button>
                                                    )}
                                                    {can.delete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingSchedule(s)}
                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400"
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
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-850/80 text-[10px] font-black uppercase text-slate-400">
                                        <th className="px-6 py-3 text-left">Kendaraan</th>
                                        <th className="px-6 py-3 text-left">Nama Jadwal & Kategori</th>
                                        <th className="px-6 py-3 text-left">Interval Servis</th>
                                        <th className="px-6 py-3 text-left">Servis Terakhir</th>
                                        <th className="px-6 py-3 text-left">Servis Berikutnya</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="w-24 px-6 py-3 text-right"><span className="sr-only">Aksi</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {schedules.data.map((s) => {
                                        const vehicleOdometer = vehicles.find((v) => v.id === s.vehicle_id)?.odometer_km;
                                        const due = isDue(s, vehicleOdometer);

                                        return (
                                            <tr key={s.id} className={`group transition-colors ${due ? 'bg-amber-50/60 dark:bg-amber-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/50'}`}>
                                                <td className="px-6 py-3.5">
                                                    {s.vehicle ? (
                                                        <Link
                                                            href={prefixedRoute('fleet.vehicles.show', s.vehicle_id)}
                                                            className="font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                        >
                                                            {s.vehicle.name}
                                                            <p className="font-mono text-[10px] text-slate-400">{s.vehicle.plate_number}</p>
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        {s.category && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.category.color }} />}
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                                                            <p className="text-[10px] text-slate-400">{s.category?.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                                                    {formatInterval(s)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3.5 font-mono text-slate-500">
                                                    {s.interval_type === 'mileage'
                                                        ? formatOdometer(s.last_service_odometer, localeTag)
                                                        : formatDate(s.last_service_date, localeTag)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3.5 font-mono">
                                                    <span className={`font-bold ${due ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {s.interval_type === 'mileage'
                                                            ? formatOdometer(s.next_service_odometer, localeTag)
                                                            : formatDate(s.next_service_date, localeTag)}
                                                    </span>
                                                    {due && (
                                                        <span className="ml-2 rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                            ⚠️ Due
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[10px] font-black ${
                                                        s.is_active
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {s.is_active ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {can.update && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(s)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon />
                                                            </button>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingSchedule(s)}
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
                    )}

                    {/* Pagination */}
                    {schedules.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                            <p className="text-xs text-slate-400">
                                Menampilkan {(schedules.current_page - 1) * schedules.per_page + 1}–{Math.min(schedules.current_page * schedules.per_page, schedules.total)} dari {schedules.total} jadwal
                            </p>
                            <div className="flex gap-1">
                                {schedules.links.map((link, i) => (
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
