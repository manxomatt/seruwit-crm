import ColumnVisibilityMenu, {
    buildColumnVisibility,
    type ColumnDef,
} from '@/Components/ColumnVisibilityMenu';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import Select from '@/Components/Select';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import UpgradeSlotModal from '../../../../Components/UpgradeSlotModal';
import VehicleCheckoutModal, { type CheckoutVehicleItem } from '../../../../Components/VehicleCheckoutModal';
import VehicleQuotaGauge from '../../../../Components/VehicleQuotaGauge';
import FleetNav from '../../../../FleetNav';

interface HomeBase {
    id: number;
    code: string;
    name: string;
}

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    brand: string | null;
    model_year: number | null;
    color: string | null;
    photo_url: string | null;
    status: string;
    odometer_km: number;
    home_base_id?: number | null;
    home_base?: HomeBase | null;
    activated_at?: string | null;
    active_until?: string | null;
    auto_renew?: boolean;
    is_trial?: boolean;
    trial_ends_at?: string | null;
}

interface PaginatedVehicles {
    data: Vehicle[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    type?: string | null;
    home_base_id?: string | null;
}

interface Props {
    vehicles: PaginatedVehicles;
    filters: Filters;
    bases?: HomeBase[];
    can: { create: boolean; update: boolean; delete: boolean };
    quota?: { max: number | null; current: number; reached: boolean };
    available_credits?: number;
    business_model?: string;
    trial_duration_days?: number;
}

type VehicleColumn =
    | 'photo'
    | 'name'
    | 'plate_number'
    | 'type'
    | 'brand'
    | 'home_base'
    | 'model_year'
    | 'color'
    | 'odometer'
    | 'status';

const STORAGE_KEY = 'fleet.vehicles.list.visibleColumns.v2';

const VEHICLE_COLUMN_KEYS: Array<{ key: VehicleColumn; required?: boolean; defaultVisible?: boolean }> = [
    { key: 'photo', defaultVisible: true },
    { key: 'name', required: true },
    { key: 'plate_number', required: true },
    { key: 'type', defaultVisible: true },
    { key: 'home_base', defaultVisible: true },
    { key: 'brand', defaultVisible: true },
    { key: 'model_year', defaultVisible: false },
    { key: 'color', defaultVisible: false },
    { key: 'odometer', defaultVisible: true },
    { key: 'status', defaultVisible: true },
];

const STATUSES = ['active', 'maintenance', 'retired', 'out_of_service'] as const;

const VEHICLE_TYPES = [
    { key: 'car', label: 'Mobil', icon: '🚗' },
    { key: 'van', label: 'Van / Minibus', icon: '🚐' },
    { key: 'truck', label: 'Truk', icon: '🚚' },
    { key: 'bus', label: 'Bus', icon: '🚌' },
    { key: 'motorcycle', label: 'Motor', icon: '🏍️' },
] as const;

const getVehicleTypeInfo = (type: string) => {
    switch (type) {
        case 'car':
            return { label: 'Mobil', icon: '🚗' };
        case 'van':
            return { label: 'Van / Minibus', icon: '🚐' };
        case 'truck':
            return { label: 'Truk', icon: '🚚' };
        case 'bus':
            return { label: 'Bus', icon: '🚌' };
        case 'motorcycle':
            return { label: 'Motor', icon: '🏍️' };
        default:
            return { label: type, icon: '🚗' };
    }
};

const getStatusBadge = (status: string, isTrial?: boolean) => {
    if (status === 'active' && isTrial) {
        return {
            label: 'Trial (Uji Coba)',
            className: 'bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
            dot: 'bg-cyan-500',
        };
    }
    switch (status) {
        case 'active':
            return {
                label: 'Siap Operasi',
                className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                dot: 'bg-emerald-500',
            };
        case 'inactive':
            return {
                label: 'Non-Aktif',
                className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                dot: 'bg-rose-500',
            };
        case 'maintenance':
            return {
                label: 'Perawatan (Servis)',
                className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                dot: 'bg-amber-500',
            };
        case 'out_of_service':
            return {
                label: 'Rusak / Non-Aktif',
                className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                dot: 'bg-rose-500',
            };
        case 'retired':
            return {
                label: 'Purna Tugas / Dijual',
                className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                dot: 'bg-slate-400',
            };
        default:
            return {
                label: status,
                className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                dot: 'bg-slate-400',
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

const getExpiryInfo = (activeUntil: string | null | undefined) => {
    if (!activeUntil) return null;
    const expiryDate = new Date(activeUntil);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            label: `Kadaluarsa (${Math.abs(diffDays)}h lalu)`,
            isExpired: true,
            isNearExpiry: false,
            badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
    }
    if (diffDays <= 3) {
        return {
            label: `Sisa ${diffDays} hari`,
            isExpired: false,
            isNearExpiry: true,
            badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
    }
    return {
        label: `Sisa ${diffDays} hari`,
        isExpired: false,
        isNearExpiry: false,
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };
};

function readStoredColumns(): Partial<Record<VehicleColumn, boolean>> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<Record<VehicleColumn, boolean>>;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export default function Index({
    vehicles,
    filters,
    bases = [],
    can,
    quota,
    available_credits,
    business_model = 'per_vehicle_trial',
    trial_duration_days,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const isTrialMode = business_model === 'per_vehicle_trial';

    const [search, setSearch] = useState(filters.search || '');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
    const [checkoutVehicles, setCheckoutVehicles] = useState<CheckoutVehicleItem[]>([]);
    const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);

    const canBatch = can.update || can.delete;
    const pageIds = useMemo(() => vehicles.data.map((vehicle) => vehicle.id), [vehicles.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));
    const hasActiveFilters = Boolean(filters.search || filters.status || filters.type || filters.home_base_id);

    const expiredOrDueVehicles = useMemo(() => {
        return vehicles.data.filter((v) => {
            if (v.is_trial) return false;
            if (!v.active_until) return true;
            const diffDays = (new Date(v.active_until).getTime() - Date.now()) / (1000 * 3600 * 24);
            return diffDays <= 7;
        });
    }, [vehicles.data]);

    // KPI stats calculations
    const totalVehicles = vehicles.total;
    const activeVehiclesCount = vehicles.data.filter((v) => v.status === 'active').length;
    const maintenanceVehiclesCount = vehicles.data.filter((v) => v.status === 'maintenance' || v.status === 'out_of_service').length;

    const columnDefs = useMemo<Array<ColumnDef<VehicleColumn>>>(
        () =>
            VEHICLE_COLUMN_KEYS.map((column) => ({
                ...column,
                label: t(`fleet.vehicles.columns.${column.key}`, undefined, column.key.toUpperCase()),
            })),
        [t],
    );

    const [visibleColumns, setVisibleColumns] = useState<Record<VehicleColumn, boolean>>(() =>
        buildColumnVisibility(VEHICLE_COLUMN_KEYS, typeof window !== 'undefined' ? readStoredColumns() : null),
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

    const applyFilters = (next: {
        search?: string;
        status?: string | null;
        type?: string | null;
        home_base_id?: string | null;
    }) => {
        router.get(
            prefixedRoute('fleet.vehicles.index'),
            {
                search: (next.search ?? search) || undefined,
                status: (next.status !== undefined ? next.status : filters.status) || undefined,
                type: (next.type !== undefined ? next.type : filters.type) || undefined,
                home_base_id: (next.home_base_id !== undefined ? next.home_base_id : filters.home_base_id) || undefined,
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

    const handleTypeFilter = (type: string) => {
        applyFilters({ type: type || null });
    };

    const handleBaseFilter = (baseId: string) => {
        applyFilters({ home_base_id: baseId || null });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(prefixedRoute('fleet.vehicles.index'), {}, { preserveState: true, replace: true });
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

    const openDeleteDialog = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setVehicleToDelete(null);
    };

    const confirmDelete = () => {
        if (!vehicleToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.vehicles.destroy', vehicleToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const applyBatchStatus = (newStatus: string) => {
        if (!can.update || selected.length === 0) return;
        setProcessing(true);
        router.patch(
            prefixedRoute('fleet.vehicles.batch-status'),
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
            prefixedRoute('fleet.vehicles.batch-destroy'),
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
                    title={t('fleet.vehicles.index_title', undefined, 'Manajemen Unit Kendaraan & Armada')}
                    subtitle={t('fleet.vehicles.index_subtitle', undefined, 'Pantau ketersediaan armada, status pemeliharaan, nomor polisi, home base pool, dan riwayat operasional kendaraan.')}
                    actions={
                        <div className="flex items-center gap-2.5">
                            {!isTrialMode && quota?.reached ? (
                                <button
                                    type="button"
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-amber-600/20 transition hover:bg-amber-700 active:scale-95"
                                >
                                    <span>⚠️ {t('fleet.quota.full_btn', undefined, 'Kapasitas Penuh (Upgrade)')}</span>
                                </button>
                            ) : (
                                can.create && (
                                    <Link
                                        href={prefixedRoute('fleet.vehicles.create')}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                                    >
                                        <span>{t('fleet.vehicles.add_new', undefined, 'Tambah Kendaraan Baru')}</span>
                                    </Link>
                                )
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={t('fleet.vehicles.head_title', undefined, 'Armada Kendaraan (Vehicles)')} />
            <FleetNav />

            <div className="w-full space-y-6 pb-20">
                {/* Vehicle Quota Gauge */}
                {quota && (
                    <VehicleQuotaGauge
                        current={quota.current}
                        max={quota.max}
                        total={quota.total ?? totalVehicles}
                        reached={quota.reached}
                        onOpenUpgrade={() => setShowUpgradeModal(true)}
                        showUpgradeButton={!isTrialMode}
                    />
                )}

                {/* KPI Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-xs dark:border-emerald-800/60 dark:bg-emerald-950/20 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Saldo Kredit Unit</p>
                            <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">{available_credits ?? 0} Unit</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            ⚡
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Armada Terdaftar</p>
                            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalVehicles} Unit</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            🚗
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Siap Operasi (Aktif)</p>
                            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeVehiclesCount} Unit</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            ✓
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Perawatan & Bengkel</p>
                            <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{maintenanceVehiclesCount} Unit</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                            🛠️
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
                                    placeholder="Cari mobil, plat nomor, merk, warna..."
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

                            {/* Vehicle Type Tabs */}
                            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850 overflow-x-auto max-w-full">
                                <button
                                    type="button"
                                    onClick={() => handleTypeFilter('')}
                                    className={`rounded-xl px-3 py-1 text-xs font-bold transition whitespace-nowrap ${
                                        !filters.type
                                            ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-300'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    Semua Tipe
                                </button>
                                {VEHICLE_TYPES.map((t) => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => handleTypeFilter(t.key)}
                                        className={`rounded-xl px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                                            filters.type === t.key
                                                ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-300'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                    >
                                        <span className="mr-1">{t.icon}</span>
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850">
                                {[
                                    { key: '', label: 'Semua Status' },
                                    { key: 'active', label: 'Siap Operasi' },
                                    { key: 'maintenance', label: 'Perawatan' },
                                    { key: 'out_of_service', label: 'Non-Aktif' },
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

                            {/* Base Filter if available */}
                            {bases.length > 0 && (
                                <div className="w-72 min-w-[260px] sm:w-80">
                                    <Select
                                        value={filters.home_base_id || ''}
                                        onChange={(val) => handleBaseFilter(val)}
                                        placeholder="Semua Pool / Base"
                                        searchable
                                        options={[
                                            { value: '', label: 'Semua Pool / Base' },
                                            ...bases.map((base) => ({
                                                value: String(base.id),
                                                label: `🏢 ${base.name} (${base.code})`,
                                            })),
                                        ]}
                                    />
                                </div>
                            )}

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
                            {/* View Mode Switcher */}
                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    title={t('fleet.vehicles.view_modes.table', undefined, 'Tampilan Tabel')}
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
                                    title={t('fleet.vehicles.view_modes.grid', undefined, 'Tampilan Grid Kartu')}
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

                            <ColumnVisibilityMenu
                                columns={columnDefs}
                                visible={visibleColumns}
                                onChange={setVisibleColumns}
                                label="Kolom"
                                iconOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Expired / Due Soon Vehicles Banner */}
                {isTrialMode && expiredOrDueVehicles.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-base text-white shadow-xs">
                                ⚠️
                            </span>
                            <div>
                                <h4 className="text-xs font-black">
                                    {expiredOrDueVehicles.length} Armada Membutuhkan Perpanjangan Masa Aktif
                                </h4>
                                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                    Masa uji coba gratis telah selesai atau masa operasional akan segera kedaluwarsa.
                                </p>
                            </div>
                        </div>
                        {can.update && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCheckoutVehicles(expiredOrDueVehicles);
                                    setShowCheckoutModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-amber-600/20 transition hover:bg-amber-700 active:scale-95"
                            >
                                <span>⚡</span>
                                <span>Perpanjang Sekaligus ({expiredOrDueVehicles.length} Unit)</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Floating Batch Action Toolbar */}
                {canBatch && selected.length > 0 && (
                    <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-600/95 backdrop-blur-md px-5 py-3 text-white shadow-xl ring-1 ring-indigo-500/50">
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-xs font-black">
                                {selected.length}
                            </span>
                            <span>Unit Armada dipilih</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {can.update && isTrialMode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCheckoutVehicles(vehicles.data.filter((v) => selected.includes(v.id)));
                                        setShowCheckoutModal(true);
                                    }}
                                    disabled={processing}
                                    className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-white shadow-2xs transition hover:bg-amber-600 disabled:opacity-50 ring-1 ring-white/30"
                                >
                                    <span>⚡</span>
                                    <span>Perpanjang ({selected.length} Unit)</span>
                                </button>
                            )}
                            {can.update && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => applyBatchStatus('active')}
                                        disabled={processing}
                                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        ✓ Set Siap Operasi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyBatchStatus('maintenance')}
                                        disabled={processing}
                                        className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-amber-600 disabled:opacity-50"
                                    >
                                        🛠️ Masuk Perawatan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyBatchStatus('retired')}
                                        disabled={processing}
                                        className="inline-flex items-center gap-1 rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        ⏸ Non-Aktifkan
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
                {vehicles.data.length === 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-4xl mb-3 block">🚗</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {hasActiveFilters ? 'Tidak Ditemukan Kendaraan yang Sesuai' : 'Belum Ada Armada Terdaftar'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                            {hasActiveFilters
                                ? 'Coba ubah kata kunci pencarian atau sesuaikan filter jenis dan status di atas.'
                                : 'Tambahkan unit mobil, van, atau truk baru untuk mulai melacak operasional armada.'}
                        </p>
                        {can.create && !hasActiveFilters && (
                            <Link
                                href={prefixedRoute('fleet.vehicles.create')}
                                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                            >
                                Tambah Kendaraan Pertama
                            </Link>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Card View */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {vehicles.data.map((vehicle) => {
                            const isSelected = selected.includes(vehicle.id);
                            const typeInfo = getVehicleTypeInfo(vehicle.type);
                            const statusInfo = getStatusBadge(vehicle.status, vehicle.is_trial);

                            return (
                                <div
                                    key={vehicle.id}
                                    className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md dark:bg-slate-900 flex flex-col justify-between ${
                                        isSelected
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                            : 'border-slate-200/80 dark:border-slate-800'
                                    }`}
                                >
                                    <div>
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                {canBatch && (
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={isSelected}
                                                        onChange={() => toggleRow(vehicle.id)}
                                                        aria-label={vehicle.name}
                                                    />
                                                )}
                                                <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                                    {vehicle.plate_number}
                                                </span>
                                            </div>

                                            <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[11px] font-black ${statusInfo.className}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                                                <span>{statusInfo.label}</span>
                                            </span>
                                        </div>

                                        {/* Photo & Title */}
                                        <div className="mt-3 flex items-start gap-3">
                                            {vehicle.photo_url ? (
                                                <img
                                                    src={vehicle.photo_url}
                                                    alt={vehicle.name}
                                                    className="h-16 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 shadow-2xs dark:ring-slate-700"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-2xl dark:bg-indigo-950/60">
                                                    {typeInfo.icon}
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                    className="font-black text-sm text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 block truncate"
                                                >
                                                    {vehicle.name}
                                                </Link>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {vehicle.brand || '—'} {vehicle.model_year ? `(${vehicle.model_year})` : ''}
                                                </p>
                                                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                                    <span>{typeInfo.icon}</span>
                                                    <span>{typeInfo.label}</span>
                                                    {vehicle.color && <span>· {vehicle.color}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Specs */}
                                        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">🏢 Home Base:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                                                    {vehicle.home_base?.name || '—'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">📟 Odometer:</span>
                                                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                                                    {vehicle.odometer_km.toLocaleString()} KM
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <Link
                                            href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            Detail Unit →
                                        </Link>

                                        <div className="flex items-center gap-1">
                                            {can.update && (
                                                <Link
                                                    href={prefixedRoute('fleet.vehicles.edit', vehicle.id)}
                                                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                    title="Edit Kendaraan"
                                                >
                                                    <PencilIcon />
                                                </Link>
                                            )}
                                            {can.delete && (
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteDialog(vehicle)}
                                                    className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                                    title="Hapus Kendaraan"
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
                                                    aria-label="Pilih Semua"
                                                />
                                            </th>
                                        )}
                                        {visibleColumns.photo && (
                                            <th className="w-16 px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Foto
                                            </th>
                                        )}
                                        {visibleColumns.name && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Nama Kendaraan
                                            </th>
                                        )}
                                        {visibleColumns.plate_number && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Plat Nomor
                                            </th>
                                        )}
                                        {visibleColumns.type && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Tipe
                                            </th>
                                        )}
                                        {visibleColumns.home_base && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Home Base
                                            </th>
                                        )}
                                        {visibleColumns.brand && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Merk
                                            </th>
                                        )}
                                        {visibleColumns.model_year && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Tahun
                                            </th>
                                        )}
                                        {visibleColumns.color && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Warna
                                            </th>
                                        )}
                                        {visibleColumns.odometer && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Odometer
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Status
                                            </th>
                                        )}
                                        <th className="w-24 px-4 py-3.5 text-right font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                    {vehicles.data.map((vehicle) => {
                                        const isSelected = selected.includes(vehicle.id);
                                        const typeInfo = getVehicleTypeInfo(vehicle.type);
                                        const statusInfo = getStatusBadge(vehicle.status, vehicle.is_trial);

                                        return (
                                            <tr
                                                key={vehicle.id}
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
                                                            onChange={() => toggleRow(vehicle.id)}
                                                            aria-label={vehicle.name}
                                                        />
                                                    </td>
                                                )}

                                                {visibleColumns.photo && (
                                                    <td className="whitespace-nowrap px-4 py-3.5">
                                                        {vehicle.photo_url ? (
                                                            <img
                                                                src={vehicle.photo_url}
                                                                alt={vehicle.name}
                                                                className="h-10 w-14 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-14 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                                                                {typeInfo.icon}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}

                                                {visibleColumns.name && (
                                                    <td className="whitespace-nowrap px-4 py-3.5">
                                                        <Link
                                                            href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                            className="font-black text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                        >
                                                            {vehicle.name}
                                                        </Link>
                                                        {vehicle.brand && (
                                                            <div className="text-[11px] text-slate-400">
                                                                {vehicle.brand} {vehicle.model_year ? `(${vehicle.model_year})` : ''}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}

                                                {visibleColumns.plate_number && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                                            {vehicle.plate_number}
                                                        </span>
                                                    </td>
                                                )}

                                                {visibleColumns.type && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700 dark:text-slate-300">
                                                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold dark:bg-slate-800">
                                                            <span>{typeInfo.icon}</span>
                                                            <span>{typeInfo.label}</span>
                                                        </span>
                                                    </td>
                                                )}

                                                {visibleColumns.home_base && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                                        {vehicle.home_base ? (
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                🏢 {vehicle.home_base.name}
                                                            </span>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                )}

                                                {visibleColumns.brand && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                                        {vehicle.brand || '—'}
                                                    </td>
                                                )}

                                                {visibleColumns.model_year && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                                                        {vehicle.model_year ?? '—'}
                                                    </td>
                                                )}

                                                {visibleColumns.color && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                                        {vehicle.color || '—'}
                                                    </td>
                                                )}

                                                {visibleColumns.odometer && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                        {vehicle.odometer_km.toLocaleString()} KM
                                                    </td>
                                                )}

                                                {visibleColumns.status && (
                                                    <td className="whitespace-nowrap px-4 py-3.5 space-y-1">
                                                        <div>
                                                            <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black ${statusInfo.className}`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                                                                <span>{statusInfo.label}</span>
                                                            </span>
                                                        </div>
                                                        {vehicle.status === 'active' && (() => {
                                                            const expiry = getExpiryInfo(vehicle.active_until);
                                                            return expiry ? (
                                                                <div className="flex items-center gap-1 text-[10px]">
                                                                    <span className={`rounded-md px-1.5 py-0.5 font-bold border ${expiry.badgeClass}`}>
                                                                        {expiry.label}
                                                                    </span>
                                                                    {!vehicle.is_trial && vehicle.auto_renew && (
                                                                        <span title="Perpanjangan Otomatis Aktif" className="text-emerald-500 font-bold text-[11px]">
                                                                            🔄
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                    </td>
                                                )}

                                                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                            title="Buka Detail Unit"
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
                                                                className="z-30 w-48 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                                                            >
                                                                <MenuItem>
                                                                    <Link
                                                                        href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                                        className={menuItemClassName}
                                                                    >
                                                                        <EyeIcon />
                                                                        <span>Lihat Detail</span>
                                                                    </Link>
                                                                </MenuItem>
                                                                {can.update && isTrialMode && !vehicle.is_trial && (
                                                                    <MenuItem>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setCheckoutVehicles([vehicle]);
                                                                                setShowCheckoutModal(true);
                                                                            }}
                                                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                                                        >
                                                                            <span>⚡</span>
                                                                            <span>Perpanjang Masa Aktif</span>
                                                                        </button>
                                                                    </MenuItem>
                                                                )}
                                                                {can.update && !isTrialMode && !vehicle.is_trial && vehicle.status !== 'active' && (
                                                                    <MenuItem>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => router.post(prefixedRoute('fleet.vehicles.activate', vehicle.id), {}, { preserveScroll: true })}
                                                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                                                        >
                                                                            <span>⚡</span>
                                                                            <span>Aktifkan (1 Kredit)</span>
                                                                        </button>
                                                                    </MenuItem>
                                                                )}
                                                                {can.update && !isTrialMode && !vehicle.is_trial && vehicle.status === 'active' && (
                                                                    <MenuItem>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => router.post(prefixedRoute('fleet.vehicles.renew', vehicle.id), {}, { preserveScroll: true })}
                                                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                                                        >
                                                                            <span>🔄</span>
                                                                            <span>Perpanjang 1 Bulan</span>
                                                                        </button>
                                                                    </MenuItem>
                                                                )}
                                                                {can.update && (
                                                                    <MenuItem>
                                                                        <Link
                                                                            href={prefixedRoute('fleet.vehicles.edit', vehicle.id)}
                                                                            className={menuItemClassName}
                                                                        >
                                                                            <PencilIcon />
                                                                            <span>Edit Kendaraan</span>
                                                                        </Link>
                                                                    </MenuItem>
                                                                )}
                                                                {can.delete && (
                                                                    <>
                                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                        <MenuItem>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openDeleteDialog(vehicle)}
                                                                                className={menuItemDangerClassName}
                                                                            >
                                                                                <TrashIcon />
                                                                                <span>Hapus Unit</span>
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
                {vehicles.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Menampilkan {(vehicles.current_page - 1) * vehicles.per_page + 1} hingga{' '}
                            {Math.min(vehicles.current_page * vehicles.per_page, vehicles.total)} dari{' '}
                            {vehicles.total} kendaraan
                        </p>
                        <div className="flex gap-1.5">
                            {vehicles.links.map((link, index) => (
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
                        vehicleToDelete
                            ? `Apakah Anda yakin ingin menghapus unit kendaraan "${vehicleToDelete.name}" (${vehicleToDelete.plate_number})?`
                            : undefined
                    }
                />

                <ConfirmDeleteDialog
                    show={showBatchDeleteDialog}
                    onClose={() => !processing && setShowBatchDeleteDialog(false)}
                    onConfirm={confirmBatchDelete}
                    processing={processing}
                    message={`Anda akan menghapus ${selected.length} kendaraan sekaligus.`}
                />

                {/* Upgrade Slot Modal */}
                {quota && (
                    <UpgradeSlotModal
                        isOpen={showUpgradeModal}
                        onClose={() => setShowUpgradeModal(false)}
                        currentQuota={quota.max || quota.current || 0}
                        currentUsed={quota.current || 0}
                    />
                )}

                <VehicleCheckoutModal
                    isOpen={showCheckoutModal}
                    onClose={() => setShowCheckoutModal(false)}
                    vehicles={checkoutVehicles}
                />
            </div>
        </DynamicLayout>
    );
}
