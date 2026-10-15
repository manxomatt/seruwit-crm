import DynamicLayout from '@/Layouts/DynamicLayout';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import Select, { type SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState, useMemo, FormEventHandler } from 'react';
import RentalNav from '../../../../RentalNav';

interface DriverItem {
    id: number;
    name: string;
    phone: string | null;
    status: string;
}

interface FleetBaseItem {
    id: number;
    code: string;
    name: string;
}

interface DispatchItem {
    id: number;
    rental_id: number;
    type: 'delivery' | 'pickup';
    driver_id: number | null;
    user_id: number | null;
    status: 'scheduled' | 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
    scheduled_at: string;
    location_name: string;
    location_address: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    fee: number;
    fee_payer: 'customer' | 'free' | 'included';
    dispatched_at: string | null;
    arrived_at: string | null;
    completed_at: string | null;
    start_odometer: number | null;
    start_fuel_level: string | null;
    notes: string | null;
    driver?: DriverItem | null;
    user?: { id: number; name: string } | null;
    rental?: {
        id: number;
        code: string;
        status: string;
        start_date: string;
        pickup_time: string | null;
        end_date: string;
        return_time: string | null;
        vehicle?: {
            id: number;
            name: string;
            plate_number: string;
            type: string;
            home_base?: {
                id: number;
                code: string;
                name: string;
            } | null;
        } | null;
        partner?: {
            id: number;
            code: string;
            name: string;
            phone: string | null;
        } | null;
    } | null;
}

interface Props {
    dispatches: DispatchItem[];
    metrics: {
        today_total: number;
        unassigned_count: number;
        en_route_count: number;
        completed_today: number;
    };
    drivers: DriverItem[];
    fleetBases: FleetBaseItem[];
    filters: {
        search: string;
        date: 'today' | 'tomorrow' | 'upcoming' | 'all';
        type: 'all' | 'delivery' | 'pickup';
        status: string;
        driver_id: number | null;
        fleet_base_id: number | null;
    };
}

const SearchIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

export default function DispatchIndex({ dispatches, metrics, drivers, fleetBases, filters }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow' | 'upcoming' | 'all'>(filters.date || 'today');
    const [selectedType, setSelectedType] = useState<'all' | 'delivery' | 'pickup'>(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'all');
    const [selectedDriverId, setSelectedDriverId] = useState<string>(filters.driver_id ? String(filters.driver_id) : '');
    const [selectedBaseId, setSelectedBaseId] = useState<string>(filters.fleet_base_id ? String(filters.fleet_base_id) : '');
    const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

    // Modals
    const [assignTarget, setAssignTarget] = useState<DispatchItem | null>(null);
    const [statusTarget, setStatusTarget] = useState<{
        dispatch: DispatchItem;
        nextStatus: 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
    } | null>(null);

    const assignForm = useForm({
        driver_id: '',
        notes: '',
    });

    const statusForm = useForm({
        status: '',
        start_odometer: '',
        start_fuel_level: 'full',
        notes: '',
    });

    const hasActiveFilters = Boolean(
        (filters.search && filters.search.trim() !== '') ||
        filters.date !== 'today' ||
        filters.type !== 'all' ||
        (filters.status && filters.status !== 'all') ||
        filters.driver_id ||
        filters.fleet_base_id
    );

    const applyFilters = (overrides?: Partial<typeof filters>) => {
        const query: Record<string, any> = {
            search: overrides?.search !== undefined ? overrides.search : (search || undefined),
            date: overrides?.date !== undefined ? overrides.date : (selectedDate || undefined),
            type: overrides?.type !== undefined ? overrides.type : (selectedType || undefined),
            status: overrides?.status !== undefined ? (overrides.status === 'all' ? undefined : overrides.status) : (selectedStatus === 'all' ? undefined : selectedStatus),
            driver_id: overrides?.driver_id !== undefined ? (overrides.driver_id || undefined) : (selectedDriverId || undefined),
            fleet_base_id: overrides?.fleet_base_id !== undefined ? (overrides.fleet_base_id || undefined) : (selectedBaseId || undefined),
        };

        router.get(prefixedRoute('rental.dispatch.index'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedDate('today');
        setSelectedType('all');
        setSelectedStatus('all');
        setSelectedDriverId('');
        setSelectedBaseId('');
        router.get(prefixedRoute('rental.dispatch.index'), {}, { preserveState: true, replace: true });
    };

    const openAssignModal = (dispatch: DispatchItem) => {
        setAssignTarget(dispatch);
        assignForm.setData({
            driver_id: dispatch.driver_id ? String(dispatch.driver_id) : '',
            notes: '',
        });
    };

    const submitAssign: FormEventHandler = (e) => {
        e.preventDefault();
        if (!assignTarget) return;

        assignForm.patch(prefixedRoute('rental.dispatch.assign', assignTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                setAssignTarget(null);
                assignForm.reset();
            },
        });
    };

    const openStatusModal = (
        dispatch: DispatchItem,
        nextStatus: 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled'
    ) => {
        setStatusTarget({ dispatch, nextStatus });
        statusForm.setData({
            status: nextStatus,
            start_odometer: dispatch.start_odometer ? String(dispatch.start_odometer) : '',
            start_fuel_level: dispatch.start_fuel_level || 'full',
            notes: '',
        });
    };

    const submitStatusUpdate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!statusTarget) return;

        statusForm.patch(prefixedRoute('rental.dispatch.status', statusTarget.dispatch.id), {
            preserveScroll: true,
            onSuccess: () => {
                setStatusTarget(null);
                statusForm.reset();
            },
        });
    };

    const driverOptions: SelectOption[] = useMemo(() => [
        { value: '', label: 'Semua Runner / Driver' },
        ...drivers.map((d) => ({
            value: String(d.id),
            label: `${d.name} (${d.phone || 'Tanpa HP'}) - ${d.status === 'available' ? 'Standby' : d.status}`,
        })),
    ], [drivers]);

    const baseOptions: SelectOption[] = useMemo(() => [
        { value: '', label: 'Semua Cabang / Base' },
        ...fleetBases.map((b) => ({
            value: String(b.id),
            label: `${b.name} (${b.code})`,
        })),
    ], [fleetBases]);

    const statusOptions: SelectOption[] = [
        { value: 'all', label: 'Semua Status Dispatch' },
        { value: 'scheduled', label: 'Terjadwal (Belum Ada Runner)' },
        { value: 'assigned', label: 'Runner Ditugaskan' },
        { value: 'en_route', label: 'Sedang OTW ke Lokasi' },
        { value: 'arrived', label: 'Tiba di Lokasi Pelanggan' },
        { value: 'completed', label: 'Selesai Serah Terima' },
        { value: 'cancelled', label: 'Dibatalkan' },
    ];

    const fuelLevelOptions: SelectOption[] = [
        { value: 'full', label: 'Full (Penuh 100%)' },
        { value: 'three_quarters', label: '3/4 Tangki (75%)' },
        { value: 'half', label: '1/2 Tangki (50%)' },
        { value: 'quarter', label: '1/4 Tangki (25%)' },
    ];

    const formatCurrency = (val: number): string => {
        return new Intl.NumberFormat(localeTag, {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const formatDateTime = (dateStr: string): string => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(localeTag, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const formatTimeOnly = (dateStr: string): string => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString(localeTag, {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const getStatusBadge = (status: DispatchItem['status']) => {
        switch (status) {
            case 'assigned':
                return {
                    label: 'Runner Ditugaskan',
                    cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
                    dot: 'bg-amber-500',
                };
            case 'en_route':
                return {
                    label: 'Sedang OTW 🛵',
                    cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse',
                    dot: 'bg-blue-500',
                };
            case 'arrived':
                return {
                    label: 'Tiba di Lokasi 📍',
                    cls: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
                    dot: 'bg-cyan-500',
                };
            case 'completed':
                return {
                    label: 'Selesai Serah Terima',
                    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 dark:bg-emerald-950/60 dark:text-emerald-300',
                    dot: 'bg-emerald-500',
                };
            case 'cancelled':
                return {
                    label: 'Dibatalkan',
                    cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
                    dot: 'bg-rose-500',
                };
            default:
                return {
                    label: 'Menunggu Penugasan',
                    cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                    dot: 'bg-slate-400',
                };
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Papan Antar-Jemput Armada (Runner Dispatch)"
                    subtitle="Monitor penugasan runner, waktu keberangkatan, dan status serah terima unit di bandara, hotel, maupun lokasi pelanggan."
                    actions={
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher compact />
                            <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('board')}
                                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                                        viewMode === 'board'
                                            ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-900 dark:text-indigo-400'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    Kartu (Board)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                                        viewMode === 'table'
                                            ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-900 dark:text-indigo-400'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    Tabel (List)
                                </button>
                            </div>
                        </div>
                    }
                />
            }
        >
            <Head title="Papan Dispatch Antar-Jemput Unit - Rental" />

            <RentalNav />

            {flash?.success && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs">
                    ✓ {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300 shadow-2xs">
                    ⚠️ {flash.error}
                </div>
            )}

            <div className="space-y-4">
                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Total Today */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">🚚</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Hari Ini
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                {metrics.today_total}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total Tugas Antar / Jemput Hari Ini
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Unassigned */}
                    <div className="overflow-hidden rounded-3xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">⏳</span>
                            <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                Perlu Petugas
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-black tracking-tight text-amber-700 dark:text-amber-400">
                                {metrics.unassigned_count}
                            </p>
                            <p className="mt-1 text-xs font-medium text-amber-600/90 dark:text-amber-400/80">
                                Belum Ada Runner / Staf Ditugaskan
                            </p>
                        </div>
                    </div>

                    {/* Card 3: En Route */}
                    <div className="overflow-hidden rounded-3xl border border-blue-200/80 bg-blue-50/50 p-5 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">🛵</span>
                            <span className="rounded-full bg-blue-200/70 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                OTW
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-black tracking-tight text-blue-700 dark:text-blue-400">
                                {metrics.en_route_count}
                            </p>
                            <p className="mt-1 text-xs font-medium text-blue-600/90 dark:text-blue-400/80">
                                Runner Sedang di Perjalanan ke Lokasi
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Completed Today */}
                    <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">✅</span>
                            <span className="rounded-full bg-emerald-200/70 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                Tuntas
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                                {metrics.completed_today}
                            </p>
                            <p className="mt-1 text-xs font-medium text-emerald-600/90 dark:text-emerald-400/80">
                                Serah Terima Berhasil Tuntas Hari Ini
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Header Bar */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
                        <div className="relative min-w-[240px] flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                <SearchIcon />
                            </span>
                            <TextInput
                                type="search"
                                placeholder="Cari kode booking, nopol, pelanggan, lokasi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full !rounded-2xl !py-2.5 pl-10 text-xs shadow-2xs"
                            />
                        </div>

                        <div className="w-44 shrink-0 sm:w-48">
                            <Select
                                className="!rounded-2xl !py-2 text-xs shadow-2xs"
                                value={selectedStatus}
                                options={statusOptions}
                                onChange={(val) => {
                                    setSelectedStatus(val);
                                    applyFilters({ status: val });
                                }}
                            />
                        </div>

                        <div className="w-44 shrink-0 sm:w-48">
                            <Select
                                className="!rounded-2xl !py-2 text-xs shadow-2xs"
                                value={selectedDriverId}
                                options={driverOptions}
                                onChange={(val) => {
                                    setSelectedDriverId(val);
                                    applyFilters({ driver_id: val ? Number(val) : null });
                                }}
                            />
                        </div>

                        <div className="w-40 shrink-0 sm:w-44">
                            <Select
                                className="!rounded-2xl !py-2 text-xs shadow-2xs"
                                value={selectedBaseId}
                                options={baseOptions}
                                onChange={(val) => {
                                    setSelectedBaseId(val);
                                    applyFilters({ fleet_base_id: val ? Number(val) : null });
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                        >
                            Cari
                        </button>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition"
                            >
                                ✕ Reset
                            </button>
                        )}
                    </form>

                    {/* Quick filter chips (Date & Type) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Date Chips */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 mr-1">Jadwal:</span>
                            {[
                                { key: 'today', label: 'Hari Ini' },
                                { key: 'tomorrow', label: 'Besok' },
                                { key: 'upcoming', label: '7 Hari Ke Depan' },
                                { key: 'all', label: 'Semua Waktu' },
                            ].map((tab) => {
                                const active = selectedDate === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDate(tab.key as any);
                                            applyFilters({ date: tab.key as any });
                                        }}
                                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                                            active
                                                ? 'bg-indigo-600 text-white shadow-2xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Type Chips */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 mr-1">Tipe:</span>
                            {[
                                { key: 'all', label: 'Semua Tipe' },
                                { key: 'delivery', label: '🛫 Antar (Delivery)' },
                                { key: 'pickup', label: '🛬 Jemput (Pickup)' },
                            ].map((tab) => {
                                const active = selectedType === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => {
                                            setSelectedType(tab.key as any);
                                            applyFilters({ type: tab.key as any });
                                        }}
                                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                                            active
                                                ? 'bg-indigo-600 text-white shadow-2xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Content: Board Cards OR Table */}
                {dispatches.length === 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 px-6 py-20 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 dark:bg-slate-800">
                            🛵
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Tidak Ada Tugas Antar / Jemput
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Tidak ada jadwal dispatch yang cocok dengan kriteria filter saat ini.
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-3 inline-flex items-center rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
                            >
                                ✕ Reset Filter
                            </button>
                        )}
                    </div>
                ) : viewMode === 'board' ? (
                    /* Card Board Grid */
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {dispatches.map((item) => {
                            const isDelivery = item.type === 'delivery';
                            const badge = getStatusBadge(item.status);
                            const vehicle = item.rental?.vehicle;
                            const partner = item.rental?.partner;
                            const phoneSanitized = (item.contact_phone || partner?.phone || '').replace(/[^0-9]/g, '');
                            const waUrl = phoneSanitized
                                ? `https://wa.me/${phoneSanitized.startsWith('0') ? '62' + phoneSanitized.slice(1) : phoneSanitized}`
                                : null;

                            return (
                                <div
                                    key={item.id}
                                    className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div>
                                        {/* Top Header: Type Tag, Scheduled Time, Status Badge */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                                                        isDelivery
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                                                    }`}
                                                >
                                                    <span>{isDelivery ? '🛫 ANTAR' : '🛬 JEMPUT'}</span>
                                                </span>

                                                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    ⏰ {formatDateTime(item.scheduled_at)}
                                                </span>
                                            </div>

                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold ${badge.cls}`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                                <span>{badge.label}</span>
                                            </span>
                                        </div>

                                        {/* Vehicle & Customer Information */}
                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {/* Left: Vehicle Details */}
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-slate-400">Armada</span>
                                                    {vehicle?.home_base && (
                                                        <span className="text-[10px] font-semibold text-slate-500">
                                                            📍 {vehicle.home_base.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 font-mono text-sm font-black text-slate-900 dark:text-white">
                                                    {vehicle?.plate_number || 'Tanpa Nopol'}
                                                </p>
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                    {vehicle?.name || 'Unit Belum Ditugaskan'}
                                                </p>
                                                {item.rental && (
                                                    <Link
                                                        href={prefixedRoute('rental.show', item.rental.id)}
                                                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                    >
                                                        <span>Booking: #{item.rental.code} →</span>
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Right: Customer & Contact */}
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-slate-400">Pelanggan</span>
                                                    {waUrl && (
                                                        <a
                                                            href={waUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                                                        >
                                                            <span>💬 WhatsApp</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white truncate">
                                                    {item.contact_name || partner?.name || 'Anonim'}
                                                </p>
                                                <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                                    {item.contact_phone || partner?.phone || '—'}
                                                </p>
                                                {item.fee > 0 && (
                                                    <p className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                                        Ongkir: {formatCurrency(item.fee)} ({item.fee_payer === 'customer' ? 'Ditagihkan' : 'Free'})
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Location & Address */}
                                        <div className="mt-3 rounded-2xl bg-slate-50/50 p-3 border border-slate-100 dark:border-slate-800/80 dark:bg-slate-850/50">
                                            <div className="flex items-start gap-2">
                                                <span className="text-base text-rose-500">📍</span>
                                                <div className="text-xs">
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        {item.location_name}
                                                    </p>
                                                    {item.location_address && (
                                                        <p className="mt-0.5 text-slate-500 dark:text-slate-400 leading-relaxed">
                                                            {item.location_address}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {item.notes && (
                                                <div className="mt-2 border-t border-slate-200/60 pt-2 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                                    <span className="font-bold text-slate-400">Catatan: </span>
                                                    <span>{item.notes}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Runner Assignment Info */}
                                        <div className="mt-3 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">👨‍✈️</span>
                                                <div>
                                                    <span className="font-bold text-slate-400">Runner: </span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {item.driver ? item.driver.name : (item.user ? item.user.name : 'Belum Ditugaskan')}
                                                    </span>
                                                    {item.driver?.phone && (
                                                        <span className="ml-1 text-[11px] text-slate-400">({item.driver.phone})</span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => openAssignModal(item)}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400"
                                            >
                                                {item.driver_id ? 'Ganti Runner' : '+ Tugaskan Runner'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bottom Action Footer */}
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                            {item.dispatched_at && (
                                                <span>Berangkat: {formatTimeOnly(item.dispatched_at)}</span>
                                            )}
                                            {item.arrived_at && (
                                                <span>Tiba: {formatTimeOnly(item.arrived_at)}</span>
                                            )}
                                            {item.completed_at && (
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    Tuntas: {formatTimeOnly(item.completed_at)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status Action Buttons */}
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            {item.status === 'scheduled' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openAssignModal(item)}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-white shadow-xs transition hover:bg-amber-600"
                                                >
                                                    <span>Tugaskan Runner</span>
                                                </button>
                                            )}

                                            {item.status === 'assigned' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openStatusModal(item, 'en_route')}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-black text-white shadow-xs transition hover:bg-blue-700"
                                                >
                                                    <span>Mulai Berangkat 🛵</span>
                                                </button>
                                            )}

                                            {item.status === 'en_route' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openStatusModal(item, 'arrived')}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-black text-white shadow-xs transition hover:bg-cyan-700"
                                                >
                                                    <span>Sudah Tiba di Lokasi 📍</span>
                                                </button>
                                            )}

                                            {item.status === 'arrived' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openStatusModal(item, 'completed')}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xs transition hover:bg-emerald-700"
                                                >
                                                    <span>Selesaikan Serah Terima ✓</span>
                                                </button>
                                            )}

                                            {item.status === 'completed' && item.rental && (
                                                <Link
                                                    href={prefixedRoute('rental.show', item.rental.id)}
                                                    className="rounded-xl bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition"
                                                >
                                                    Buka Booking #{item.rental.code}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Tabular List View */
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                <thead className="bg-slate-50/80 dark:bg-slate-850">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Jadwal & Tipe
                                        </th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Armada Kendaraan
                                        </th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Pelanggan & Booking
                                        </th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Lokasi Penyerahan
                                        </th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Runner Bertugas
                                        </th>
                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Status
                                        </th>
                                        <th className="w-32 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {dispatches.map((item) => {
                                        const isDelivery = item.type === 'delivery';
                                        const badge = getStatusBadge(item.status);
                                        const vehicle = item.rental?.vehicle;
                                        const partner = item.rental?.partner;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="group transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-xs">
                                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {formatDateTime(item.scheduled_at)}
                                                    </div>
                                                    <span className={`mt-0.5 inline-flex w-fit rounded-lg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                        isDelivery
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                                                    }`}>
                                                        {isDelivery ? '🛫 Antar' : '🛬 Jemput'}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                            {vehicle?.name || 'Belum Ditugaskan'}
                                                        </div>
                                                        <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {vehicle?.plate_number || 'Tanpa Nopol'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                            {item.contact_name || partner?.name || 'Anonim'}
                                                        </div>
                                                        {item.rental && (
                                                            <Link
                                                                href={prefixedRoute('rental.show', item.rental.id)}
                                                                className="font-mono text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                            >
                                                                #{item.rental.code}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-xs">
                                                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                                                        📍 {item.location_name}
                                                    </div>
                                                    {item.fee > 0 && (
                                                        <div className="text-[11px] font-semibold text-amber-600">
                                                            Ongkir: {formatCurrency(item.fee)}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-xs">
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                                        {item.driver ? item.driver.name : (item.user ? item.user.name : <span className="text-slate-400">Belum Ditugaskan</span>)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignModal(item)}
                                                        className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                    >
                                                        {item.driver_id ? 'Ubah Runner' : '+ Tugaskan'}
                                                    </button>
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold ${badge.cls}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                                        <span>{badge.label}</span>
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {item.status === 'scheduled' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openAssignModal(item)}
                                                                className="rounded-xl bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 transition"
                                                            >
                                                                Tugaskan
                                                            </button>
                                                        )}
                                                        {item.status === 'assigned' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openStatusModal(item, 'en_route')}
                                                                className="rounded-xl bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition"
                                                            >
                                                                Mulai OTW
                                                            </button>
                                                        )}
                                                        {item.status === 'en_route' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openStatusModal(item, 'arrived')}
                                                                className="rounded-xl bg-cyan-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-cyan-700 transition"
                                                            >
                                                                Tiba Lokasi
                                                            </button>
                                                        )}
                                                        {item.status === 'arrived' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openStatusModal(item, 'completed')}
                                                                className="rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                                                            >
                                                                Selesaikan
                                                            </button>
                                                        )}
                                                        {item.status === 'completed' && item.rental && (
                                                            <Link
                                                                href={prefixedRoute('rental.show', item.rental.id)}
                                                                className="rounded-xl bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition"
                                                            >
                                                                Buka
                                                            </Link>
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
            </div>

            {/* Assign Runner Modal */}
            <Modal show={assignTarget !== null} onClose={() => setAssignTarget(null)} maxWidth="md">
                <form onSubmit={submitAssign} className="p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-xl">👨‍✈️</span>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                Tugaskan Runner / Driver
                            </h3>
                            <p className="text-xs text-slate-400">
                                {assignTarget?.type === 'delivery' ? 'Pengantaran Unit ke Pelanggan' : 'Penjemputan Unit dari Pelanggan'}
                            </p>
                        </div>
                    </div>

                    {assignTarget && (
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-850">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                                {assignTarget.rental?.vehicle?.plate_number} • {assignTarget.location_name}
                            </p>
                            <p className="text-slate-500">
                                Jadwal: {formatDateTime(assignTarget.scheduled_at)}
                            </p>
                        </div>
                    )}

                    <div>
                        <InputLabel value="Pilih Runner / Driver" />
                        <Select
                            options={driverOptions}
                            value={assignForm.data.driver_id}
                            onChange={(val) => assignForm.setData('driver_id', val)}
                            className="mt-1"
                        />
                        <InputError message={assignForm.errors.driver_id} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel value="Catatan Tambahan untuk Runner (Opsional)" />
                        <TextInput
                            type="text"
                            value={assignForm.data.notes}
                            onChange={(e) => assignForm.setData('notes', e.target.value)}
                            placeholder="Contoh: Temui di pintu keluar kedatangan, bawa kunci ganda..."
                            className="mt-1 w-full text-xs"
                        />
                        <InputError message={assignForm.errors.notes} className="mt-1" />
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setAssignTarget(null)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={assignForm.processing}>
                            {assignForm.processing ? 'Menyimpan...' : 'Simpan Penugasan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Advance Status Modal */}
            <Modal show={statusTarget !== null} onClose={() => setStatusTarget(null)} maxWidth="md">
                <form onSubmit={submitStatusUpdate} className="p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-xl">🚀</span>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                Update Status Perjalanan Runner
                            </h3>
                            <p className="text-xs text-slate-400">
                                {statusTarget?.nextStatus === 'en_route' && 'Mulai keberangkatan runner menuju lokasi.'}
                                {statusTarget?.nextStatus === 'arrived' && 'Konfirmasi runner telah tiba di lokasi pelanggan.'}
                                {statusTarget?.nextStatus === 'completed' && 'Konfirmasi serah terima kendaraan telah selesai.'}
                            </p>
                        </div>
                    </div>

                    {statusTarget?.nextStatus === 'en_route' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <InputLabel value="Odometer Berangkat (KM)" />
                                <TextInput
                                    type="number"
                                    value={statusForm.data.start_odometer}
                                    onChange={(e) => statusForm.setData('start_odometer', e.target.value)}
                                    placeholder="Contoh: 45200"
                                    className="mt-1 w-full text-xs"
                                />
                            </div>

                            <div>
                                <InputLabel value="Level BBM Berangkat" />
                                <Select
                                    value={statusForm.data.start_fuel_level}
                                    options={fuelLevelOptions}
                                    onChange={(val) => statusForm.setData('start_fuel_level', val)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <InputLabel value="Catatan Lapangan (Opsional)" />
                        <TextInput
                            type="text"
                            value={statusForm.data.notes}
                            onChange={(e) => statusForm.setData('notes', e.target.value)}
                            placeholder="Catatan kondisi lalu lintas, posisi parkir, dsb."
                            className="mt-1 w-full text-xs"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setStatusTarget(null)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={statusForm.processing}>
                            {statusForm.processing ? 'Memproses...' : 'Konfirmasi Update Status'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
