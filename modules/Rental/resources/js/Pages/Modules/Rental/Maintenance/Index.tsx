import LanguageSwitcher from '@/Components/LanguageSwitcher';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import Select, { type SelectOption } from '@/Components/Select';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import RentalNav from '../../../../RentalNav';

interface VehicleOption {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
    rental_class: string | null;
    status: string;
    odometer_km: number | null;
    photo_url: string | null;
    compliance_summary?: {
        overall: string;
        stnk_annual?: { status: string; label: string; date: string | null; days: number };
        kir?: { status: string; label: string; date: string | null; days: number };
    };
}

interface WorkshopVendor {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
}

interface BlackoutItem {
    id: number;
    code: string;
    vehicle_id: number;
    work_order_id: number | null;
    vendor_partner_id: number | null;
    workshop_name: string | null;
    reason: string;
    start_date: string;
    end_date: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    estimated_cost: number;
    actual_cost: number;
    notes: string | null;
    created_at: string;
    vehicle?: VehicleOption;
    vendor_partner?: WorkshopVendor | null;
    work_order?: {
        id: number;
        reference_number: string;
        title: string;
        status: string;
    } | null;
    creator?: {
        id: number;
        name: string;
    } | null;
}

interface ComplianceAlert {
    vehicle_id: number;
    name: string;
    plate_number: string;
    status: string;
    label: string;
    date: string | null;
    days: number;
}

interface Props {
    blackouts: BlackoutItem[];
    kpis: {
        in_workshop_count: number;
        upcoming_count: number;
        completed_this_month_count: number;
        stnk_alerts_count: number;
        kir_alerts_count: number;
    };
    compliance_alerts: {
        stnk: ComplianceAlert[];
        kir: ComplianceAlert[];
    };
    vehicles: VehicleOption[];
    workshop_vendors: WorkshopVendor[];
    has_maintenance_module: boolean;
    filters: {
        status: string;
        vehicle_id: string;
        search: string;
    };
}

const formatIdr = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    } catch {
        return dateStr;
    }
};

const STATUS_BADGES: Record<BlackoutItem['status'], { label: string; bg: string; text: string; dot: string }> = {
    in_progress: {
        label: 'Sedang di Bengkel',
        bg: 'bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        dot: 'bg-purple-500 animate-pulse',
    },
    scheduled: {
        label: 'Terjadwal',
        bg: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500',
    },
    completed: {
        label: 'Selesai',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-300',
        dot: 'bg-emerald-500',
    },
    cancelled: {
        label: 'Dibatalkan',
        bg: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
        text: 'text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-400',
    },
};

export default function Index({
    blackouts,
    kpis,
    compliance_alerts,
    vehicles,
    workshop_vendors,
    has_maintenance_module,
    filters,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [vehicleFilter, setVehicleFilter] = useState(filters.vehicle_id || 'all');
    const [search, setSearch] = useState(filters.search || '');

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalItem, setEditModalItem] = useState<BlackoutItem | null>(null);
    const [completeModalItem, setCompleteModalItem] = useState<BlackoutItem | null>(null);

    // Form for Create Blackout
    const createForm = useForm({
        vehicle_id: '',
        vendor_partner_id: '',
        workshop_name: '',
        reason: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        status: 'scheduled',
        estimated_cost: '',
        actual_cost: '',
        notes: '',
        create_work_order: false,
        set_vehicle_maintenance_status: true,
    });

    // Form for Edit Blackout
    const editForm = useForm({
        vendor_partner_id: '',
        workshop_name: '',
        reason: '',
        start_date: '',
        end_date: '',
        status: 'scheduled',
        estimated_cost: '',
        actual_cost: '',
        notes: '',
    });

    // Form for Complete Blackout
    const completeForm = useForm({
        actual_cost: '',
    });

    const handleFilterSubmit = (e?: FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            prefixedRoute('rental.maintenance.index'),
            {
                status: statusFilter,
                vehicle_id: vehicleFilter,
                search: search.trim(),
            },
            { preserveState: true, replace: true }
        );
    };

    const handleResetFilters = () => {
        setStatusFilter('all');
        setVehicleFilter('all');
        setSearch('');
        router.get(prefixedRoute('rental.maintenance.index'), {}, { preserveState: true, replace: true });
    };

    // Open create modal with pre-selected vehicle if needed
    const openCreateModalForVehicle = (vehicleId: number, defaultReason: string = '') => {
        createForm.reset();
        createForm.setData({
            ...createForm.data,
            vehicle_id: String(vehicleId),
            reason: defaultReason,
        });
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(prefixedRoute('rental.maintenance.store'), {
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const openEditModal = (item: BlackoutItem) => {
        setEditModalItem(item);
        editForm.setData({
            vendor_partner_id: item.vendor_partner_id ? String(item.vendor_partner_id) : '',
            workshop_name: item.workshop_name || '',
            reason: item.reason,
            start_date: item.start_date,
            end_date: item.end_date,
            status: item.status,
            estimated_cost: item.estimated_cost ? String(item.estimated_cost) : '',
            actual_cost: item.actual_cost ? String(item.actual_cost) : '',
            notes: item.notes || '',
        });
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editModalItem) return;

        editForm.put(prefixedRoute('rental.maintenance.update', editModalItem.id), {
            onSuccess: () => {
                setEditModalItem(null);
            },
        });
    };

    const openCompleteModal = (item: BlackoutItem) => {
        setCompleteModalItem(item);
        completeForm.setData({
            actual_cost: item.actual_cost ? String(item.actual_cost) : item.estimated_cost ? String(item.estimated_cost) : '',
        });
    };

    const handleCompleteSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!completeModalItem) return;

        completeForm.post(prefixedRoute('rental.maintenance.complete', completeModalItem.id), {
            onSuccess: () => {
                setCompleteModalItem(null);
            },
        });
    };

    const handleDelete = (item: BlackoutItem) => {
        if (!confirm(`Hapus jadwal pemeliharaan ${item.code} untuk armada ${item.vehicle?.name || ''}?`)) {
            return;
        }

        router.delete(prefixedRoute('rental.maintenance.destroy', item.id));
    };

    // Options for Comboboxes
    const vehicleOptions: SelectOption[] = useMemo(() => {
        return [
            { value: 'all', label: 'Semua Armada' },
            ...vehicles.map((v) => ({
                value: String(v.id),
                label: `${v.plate_number} — ${v.name} (${v.rental_class || v.type || 'Unit'})`,
            })),
        ];
    }, [vehicles]);

    const vehicleSelectOptions: SelectOption[] = useMemo(() => {
        return [
            { value: '', label: 'Pilih Kendaraan...' },
            ...vehicles.map((v) => ({
                value: String(v.id),
                label: `${v.plate_number} — ${v.name}`,
            })),
        ];
    }, [vehicles]);

    const vendorOptions: SelectOption[] = useMemo(() => {
        return [
            { value: '', label: 'Pilih Bengkel Rekanan / Internal...' },
            ...workshop_vendors.map((w) => ({
                value: String(w.id),
                label: `${w.name}${w.phone ? ` (${w.phone})` : ''}`,
            })),
        ];
    }, [workshop_vendors]);

    const statusFilterOptions: SelectOption[] = [
        { value: 'all', label: 'Semua Status' },
        { value: 'scheduled', label: 'Terjadwal' },
        { value: 'in_progress', label: 'Sedang di Bengkel' },
        { value: 'completed', label: 'Selesai' },
        { value: 'cancelled', label: 'Dibatalkan' },
    ];

    const isFiltered = statusFilter !== 'all' || vehicleFilter !== 'all' || search.trim() !== '';

    return (
        <ModuleLayout>
            <Head title="Pemeliharaan Armada & Auto-Blackout" />

            <PageHeader
                title="Pemeliharaan Armada & Auto-Blackout"
                subtitle="Manajemen servis bengkel, monitoring STNK/KIR, dan proteksi jadwal kalender rental agar unit servis tidak dapat dibooking."
                actions={
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <Link
                            href={prefixedRoute('rental.calendar.index')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            <span>🗓️</span>
                            <span>Kalender Armada</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                createForm.reset();
                                setCreateModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition"
                        >
                            <span>🛠️</span>
                            <span>Catat Servis / Blackout</span>
                        </button>
                    </div>
                }
            />

            <RentalNav />

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-3xl border border-purple-200/80 bg-purple-50/50 p-4 shadow-xs dark:border-purple-900/40 dark:bg-purple-950/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                            Di Bengkel
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                            🛠️
                        </span>
                    </div>
                    <div className="mt-2 text-2xl font-black text-purple-900 dark:text-purple-100">
                        {kpis.in_workshop_count}
                    </div>
                    <p className="mt-1 text-[11px] text-purple-600 dark:text-purple-400">Sedang proses perbaikan/servis</p>
                </div>

                <div className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                            Jadwal Servis
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                            📅
                        </span>
                    </div>
                    <div className="mt-2 text-2xl font-black text-amber-900 dark:text-amber-100">
                        {kpis.upcoming_count}
                    </div>
                    <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">Blackout mendatang di kalender</p>
                </div>

                <div className="rounded-3xl border border-rose-200/80 bg-rose-50/50 p-4 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                            STNK / Pajak
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-sm font-bold text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                            ⚠️
                        </span>
                    </div>
                    <div className="mt-2 text-2xl font-black text-rose-900 dark:text-rose-100">
                        {kpis.stnk_alerts_count}
                    </div>
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">Kadaluarsa / sisa ≤ 30 hari</p>
                </div>

                <div className="rounded-3xl border border-sky-200/80 bg-sky-50/50 p-4 shadow-xs dark:border-sky-900/40 dark:bg-sky-950/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                            Uji KIR
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
                            📋
                        </span>
                    </div>
                    <div className="mt-2 text-2xl font-black text-sky-900 dark:text-sky-100">
                        {kpis.kir_alerts_count}
                    </div>
                    <p className="mt-1 text-[11px] text-sky-600 dark:text-sky-400">Perlu perpanjangan uji berkala</p>
                </div>

                <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            Selesai Bulan Ini
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            ✅
                        </span>
                    </div>
                    <div className="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-100">
                        {kpis.completed_this_month_count}
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">Unit kembali siap beroperasi</p>
                </div>
            </div>

            {/* Compliance Alerts Drawer / Banner */}
            {(compliance_alerts.stnk.length > 0 || compliance_alerts.kir.length > 0) && (
                <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50/70 p-5 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/20">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🚨</span>
                        <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                            Peringatan Kepatuhan Dokumen Legal Armada
                        </h3>
                    </div>
                    <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                        Unit dengan dokumen kadaluarsa otomatis diblokir dari sistem sewa jika masa aktif terlampaui. Segera lakukan pengurusan atau jadwalkan blackout servis.
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {compliance_alerts.stnk.map((alert) => (
                            <div
                                key={`stnk-${alert.vehicle_id}`}
                                className="flex items-center justify-between rounded-2xl border border-rose-200 bg-white p-3 shadow-2xs dark:border-rose-900/40 dark:bg-slate-900"
                            >
                                <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                                        <span>{alert.name}</span>
                                        <span className="font-mono text-[10px] text-slate-500">[{alert.plate_number}]</span>
                                    </div>
                                    <div className="mt-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                        STNK: {alert.label} ({formatDate(alert.date)})
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openCreateModalForVehicle(alert.vehicle_id, `Perpanjangan STNK / Pajak (${alert.plate_number})`)}
                                    className="shrink-0 rounded-xl bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-200 transition"
                                >
                                    + Servis
                                </button>
                            </div>
                        ))}

                        {compliance_alerts.kir.map((alert) => (
                            <div
                                key={`kir-${alert.vehicle_id}`}
                                className="flex items-center justify-between rounded-2xl border border-sky-200 bg-white p-3 shadow-2xs dark:border-sky-900/40 dark:bg-slate-900"
                            >
                                <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                                        <span>{alert.name}</span>
                                        <span className="font-mono text-[10px] text-slate-500">[{alert.plate_number}]</span>
                                    </div>
                                    <div className="mt-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                                        Uji KIR: {alert.label} ({formatDate(alert.date)})
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openCreateModalForVehicle(alert.vehicle_id, `Uji Berkala KIR (${alert.plate_number})`)}
                                    className="shrink-0 rounded-xl bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-800 hover:bg-sky-200 dark:bg-sky-900/60 dark:text-sky-200 transition"
                                >
                                    + Servis
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Toolbar */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <form onSubmit={handleFilterSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                        {/* Search Input */}
                        <div className="relative min-w-[220px] flex-1 max-w-sm">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">
                                🔍
                            </span>
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode, armada, bengkel, alasan..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs font-semibold placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800/80 dark:focus:bg-slate-900"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="w-44">
                            <Select
                                id="status_filter"
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                options={statusFilterOptions}
                                searchable={false}
                                className="text-xs"
                            />
                        </div>

                        {/* Vehicle Filter */}
                        <div className="w-56">
                            <Select
                                id="vehicle_filter"
                                value={vehicleFilter}
                                onChange={(val) => setVehicleFilter(val)}
                                options={vehicleOptions}
                                searchable={true}
                                className="text-xs"
                            />
                        </div>

                        <button
                            type="submit"
                            className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
                        >
                            Filter
                        </button>

                        {isFiltered && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                            >
                                <span>↺</span>
                                <span>Reset</span>
                            </button>
                        )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Menampilkan {blackouts.length} jadwal servis & blackout
                    </div>
                </form>
            </div>

            {/* Blackouts Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                <th className="px-4 py-3.5">Kode & Tanggal</th>
                                <th className="px-4 py-3.5">Armada</th>
                                <th className="px-4 py-3.5">Periode Blackout</th>
                                <th className="px-4 py-3.5">Bengkel / Vendor</th>
                                <th className="px-4 py-3.5">Alasan & Perbaikan</th>
                                <th className="px-4 py-3.5">Biaya (Rp)</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {blackouts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-3xl mb-2">🛠️</span>
                                            <p className="font-semibold text-slate-600 dark:text-slate-400">
                                                Belum ada jadwal servis atau blackout yang tercatat.
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Klik tombol di atas untuk mendaftarkan armada yang sedang atau akan masuk bengkel.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                blackouts.map((item) => {
                                    const badge = STATUS_BADGES[item.status] || STATUS_BADGES.scheduled;
                                    const vehicle = item.vehicle;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                            {/* Code & Created */}
                                            <td className="px-4 py-3.5 align-top">
                                                <div className="font-mono font-bold text-purple-700 dark:text-purple-400">
                                                    {item.code}
                                                </div>
                                                <div className="mt-0.5 text-[10px] text-slate-400">
                                                    Dicatat: {formatDate(item.created_at)}
                                                </div>
                                                {item.work_order && (
                                                    <span className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        WO: {item.work_order.reference_number}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Vehicle */}
                                            <td className="px-4 py-3.5 align-top">
                                                {vehicle ? (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-9 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                                            {vehicle.photo_url ? (
                                                                <img
                                                                    src={vehicle.photo_url}
                                                                    alt={vehicle.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                                                    🚗
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 dark:text-white truncate">
                                                                {vehicle.name}
                                                            </div>
                                                            <div className="mt-0.5 flex items-center gap-1">
                                                                <span className="rounded bg-slate-900 px-1.5 py-0.2 font-mono text-[10px] font-bold text-white dark:bg-slate-700">
                                                                    {vehicle.plate_number}
                                                                </span>
                                                                {vehicle.odometer_km !== null && (
                                                                    <span className="text-[10px] text-slate-500">
                                                                        {vehicle.odometer_km.toLocaleString('id-ID')} KM
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            {/* Date Range */}
                                            <td className="px-4 py-3.5 align-top">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {formatDate(item.start_date)}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    s/d {formatDate(item.end_date)}
                                                </div>
                                            </td>

                                            {/* Workshop Vendor */}
                                            <td className="px-4 py-3.5 align-top">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {item.vendor_partner?.name || item.workshop_name || 'Bengkel Rekanan'}
                                                </div>
                                                {item.vendor_partner?.phone && (
                                                    <div className="mt-0.5 text-[11px] text-slate-500">
                                                        📞 {item.vendor_partner.phone}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Reason & Notes */}
                                            <td className="px-4 py-3.5 align-top max-w-xs">
                                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                                    {item.reason}
                                                </div>
                                                {item.notes && (
                                                    <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                                                        {item.notes}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Cost */}
                                            <td className="px-4 py-3.5 align-top whitespace-nowrap">
                                                {item.actual_cost > 0 ? (
                                                    <div>
                                                        <div className="font-bold text-emerald-700 dark:text-emerald-400">
                                                            {formatIdr(item.actual_cost)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            Est: {formatIdr(item.estimated_cost)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                                                            Est: {formatIdr(item.estimated_cost)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">Belum selesai</div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-3.5 align-top whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.bg} ${badge.text}`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                                    {badge.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {item.status !== 'completed' && item.status !== 'cancelled' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCompleteModal(item)}
                                                            className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/80 transition"
                                                            title="Tandai Selesai Servis & Pulihkan Ketersediaan Mobil"
                                                        >
                                                            ✓ Selesai
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(item)}
                                                        className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                                                        title="Edit Jadwal"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:hover:bg-rose-900/80 transition"
                                                        title="Hapus"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Create Blackout */}
            <Modal show={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="2xl">
                <form onSubmit={handleCreateSubmit} className="p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 font-bold">
                                🛠️
                            </span>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Catat Jadwal Servis / Blackout Armada
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mt-4 space-y-4">
                        {/* Vehicle */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Pilih Armada Kendaraan <span className="text-rose-500">*</span>
                            </label>
                            <Select
                                id="create_vehicle_id"
                                value={createForm.data.vehicle_id}
                                onChange={(val) => createForm.setData('vehicle_id', val)}
                                options={vehicleSelectOptions}
                                searchable={true}
                                className="text-xs"
                            />
                            {createForm.errors.vehicle_id && (
                                <p className="mt-1 text-xs text-rose-600">{createForm.errors.vehicle_id}</p>
                            )}
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Alasan Servis / Blackout <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={createForm.data.reason}
                                onChange={(e) => createForm.setData('reason', e.target.value)}
                                placeholder="Contoh: Servis Berkala 20.000 KM, Ganti Kanvas Rem, Uji KIR, Body Repair..."
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            {createForm.errors.reason && (
                                <p className="mt-1 text-xs text-rose-600">{createForm.errors.reason}</p>
                            )}
                        </div>

                        {/* Dates & Status */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Mulai Tanggal <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={createForm.data.start_date}
                                    onChange={(e) => createForm.setData('start_date', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                                {createForm.errors.start_date && (
                                    <p className="mt-1 text-xs text-rose-600">{createForm.errors.start_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Selesai Tanggal <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={createForm.data.end_date}
                                    onChange={(e) => createForm.setData('end_date', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                                {createForm.errors.end_date && (
                                    <p className="mt-1 text-xs text-rose-600">{createForm.errors.end_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Status Awal
                                </label>
                                <select
                                    value={createForm.data.status}
                                    onChange={(e) => createForm.setData('status', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="scheduled">Terjadwal (Akan Datang)</option>
                                    <option value="in_progress">Sedang di Bengkel Sekarang</option>
                                </select>
                            </div>
                        </div>

                        {/* Workshop Vendor */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Bengkel Rekanan (Partner)
                                </label>
                                <Select
                                    id="create_vendor_id"
                                    value={createForm.data.vendor_partner_id}
                                    onChange={(val) => createForm.setData('vendor_partner_id', val)}
                                    options={vendorOptions}
                                    searchable={true}
                                    className="text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Atau Nama Bengkel Manual
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.workshop_name}
                                    onChange={(e) => createForm.setData('workshop_name', e.target.value)}
                                    placeholder="Contoh: Auto2000, Bengkel Berkah Jaya..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Estimated Cost & Notes */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Estimasi Biaya (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={createForm.data.estimated_cost}
                                    onChange={(e) => createForm.setData('estimated_cost', e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Catatan / Detail Keluhan
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.notes}
                                    onChange={(e) => createForm.setData('notes', e.target.value)}
                                    placeholder="Keluhan rem, oli, suku cadang..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={createForm.data.set_vehicle_maintenance_status}
                                    onChange={(e) => createForm.setData('set_vehicle_maintenance_status', e.target.checked)}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                    Tandai status armada sebagai <strong>Maintenance</strong> sekarang
                                </span>
                            </label>

                            {has_maintenance_module && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={createForm.data.create_work_order}
                                        onChange={(e) => createForm.setData('create_work_order', e.target.checked)}
                                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                        Buat Surat Perintah Kerja (Work Order) otomatis di Modul Maintenance
                                    </span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(false)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50 transition"
                        >
                            {createForm.processing ? 'Menyimpan...' : 'Simpan Jadwal Servis'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Edit Blackout */}
            <Modal show={editModalItem !== null} onClose={() => setEditModalItem(null)} maxWidth="xl">
                <form onSubmit={handleEditSubmit} className="p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 font-bold">
                                ✏️
                            </span>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Edit Jadwal Servis {editModalItem?.code}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditModalItem(null)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Alasan Servis <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={editForm.data.reason}
                                onChange={(e) => editForm.setData('reason', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Mulai Tanggal <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={editForm.data.start_date}
                                    onChange={(e) => editForm.setData('start_date', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Selesai Tanggal <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={editForm.data.end_date}
                                    onChange={(e) => editForm.setData('end_date', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={editForm.data.status}
                                    onChange={(e) => editForm.setData('status', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="scheduled">Terjadwal</option>
                                    <option value="in_progress">Sedang di Bengkel</option>
                                    <option value="completed">Selesai</option>
                                    <option value="cancelled">Dibatalkan</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Estimasi Biaya (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editForm.data.estimated_cost}
                                    onChange={(e) => editForm.setData('estimated_cost', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Biaya Riil / Aktual (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editForm.data.actual_cost}
                                    onChange={(e) => editForm.setData('actual_cost', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Catatan
                            </label>
                            <textarea
                                rows={2}
                                value={editForm.data.notes}
                                onChange={(e) => editForm.setData('notes', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setEditModalItem(null)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50 transition"
                        >
                            {editForm.processing ? 'Menyimpan...' : 'Perbarui Jadwal'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Complete Blackout */}
            <Modal show={completeModalItem !== null} onClose={() => setCompleteModalItem(null)} maxWidth="md">
                <form onSubmit={handleCompleteSubmit} className="p-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold">
                            ✓
                        </span>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Selesaikan Servis Bengkel
                            </h3>
                            <p className="text-xs text-slate-500">
                                {completeModalItem?.code} · {completeModalItem?.vehicle?.name} [{completeModalItem?.vehicle?.plate_number}]
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Menandai servis selesai akan memulihkan status armada menjadi <strong>Aktif (Siap Sewa)</strong> dan menghapus blokir ketersediaan kalender rental.
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Masukkan Biaya Aktual / Riil Bengkel (Rp)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={completeForm.data.actual_cost}
                                onChange={(e) => completeForm.setData('actual_cost', e.target.value)}
                                placeholder="0"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setCompleteModalItem(null)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={completeForm.processing}
                            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                            {completeForm.processing ? 'Menyelesaikan...' : 'Konfirmasi Servis Selesai'}
                        </button>
                    </div>
                </form>
            </Modal>
        </ModuleLayout>
    );
}
