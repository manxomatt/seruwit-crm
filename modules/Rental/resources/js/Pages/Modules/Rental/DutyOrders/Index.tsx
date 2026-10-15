import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import Modal from '@/Components/Modal';
import Select, { type SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo, FormEventHandler } from 'react';
import RentalNav from '../../../../RentalNav';

interface DriverItem {
    id: number;
    name: string;
    phone: string | null;
}

interface VehicleItem {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
}

interface DutyOrderItem {
    id: number;
    duty_order_number: string;
    rental_id: number | null;
    driver_id: number;
    vehicle_id: number;
    origin: string;
    destination: string;
    departure_date: string;
    return_date: string;
    departure_time: string | null;
    return_time: string | null;
    passenger_name: string | null;
    passenger_phone: string | null;
    status: 'draft' | 'dispatched' | 'completed' | 'settled' | 'cancelled';
    cash_advance_amount: number;
    actual_expense_total: number;
    net_balance: number;
    settlement_status: 'pending' | 'submitted' | 'settled';
    driver?: DriverItem;
    vehicle?: VehicleItem;
    rental?: {
        id: number;
        code: string;
        status: string;
    };
    creator?: {
        id: number;
        name: string;
    };
}

interface Props {
    orders: {
        data: DutyOrderItem[];
        current_page: number;
        last_page: number;
        per_page?: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    metrics: {
        total_orders: number;
        active_orders: number;
        pending_settlement: number;
        total_advance_disbursed: number;
        total_actual_expenses: number;
        total_net_balance: number;
    };
    drivers: DriverItem[];
    vehicles: VehicleItem[];
    filters: {
        search: string;
        status: string;
        settlement_status: string;
        driver_id: number | null;
        vehicle_id: number | null;
        date: string;
    };
}

const SearchIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export default function DutyOrdersIndex({ orders, metrics, drivers, vehicles, filters }: Props) {
    const { t } = useTrans();
    const { routePrefix, prefixedRoute } = useRoutePrefix();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [settlementStatus, setSettlementStatus] = useState(filters.settlement_status || 'all');
    const [driverId, setDriverId] = useState<number | ''>(filters.driver_id || '');
    const [vehicleId, setVehicleId] = useState<number | ''>(filters.vehicle_id || '');
    const [date, setDate] = useState(filters.date || '');
    const [previewOrder, setPreviewOrder] = useState<DutyOrderItem | null>(null);

    const hasActiveFilters = Boolean(
        (filters.search && filters.search.trim() !== '') ||
        (filters.status && filters.status !== 'all') ||
        (filters.settlement_status && filters.settlement_status !== 'all') ||
        filters.driver_id ||
        filters.vehicle_id ||
        filters.date
    );

    const applyFilter = (newFilters: Record<string, any>) => {
        const merged = {
            search: newFilters.search !== undefined ? newFilters.search : search || undefined,
            status: newFilters.status !== undefined ? (newFilters.status === 'all' ? undefined : newFilters.status) : (status === 'all' ? undefined : status),
            settlement_status: newFilters.settlement_status !== undefined ? (newFilters.settlement_status === 'all' ? undefined : newFilters.settlement_status) : (settlementStatus === 'all' ? undefined : settlementStatus),
            driver_id: newFilters.driver_id !== undefined ? (newFilters.driver_id || undefined) : (driverId || undefined),
            vehicle_id: newFilters.vehicle_id !== undefined ? (newFilters.vehicle_id || undefined) : (vehicleId || undefined),
            date: newFilters.date !== undefined ? (newFilters.date || undefined) : (date || undefined),
        };

        router.get(prefixedRoute('rental.duty_orders.index'), merged, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilter({ search });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setSettlementStatus('all');
        setDriverId('');
        setVehicleId('');
        setDate('');
        router.get(prefixedRoute('rental.duty_orders.index'), {}, { preserveState: true, replace: true });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const statusBadgeClass = (s: string) => {
        switch (s) {
            case 'dispatched':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 dark:bg-emerald-950/60 dark:text-emerald-300';
            case 'settled':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
            default:
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
        }
    };

    const statusLabel = (s: string) => {
        switch (s) {
            case 'dispatched':
                return 'Berangkat (On Duty)';
            case 'completed':
                return 'Selesai Tugas';
            case 'settled':
                return 'Settled (Selesai Kas)';
            case 'cancelled':
                return 'Dibatalkan';
            default:
                return 'Draft';
        }
    };

    const settlementBadge = (st: string) => {
        switch (st) {
            case 'settled':
                return (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        ✓ Lunas / Settled
                    </span>
                );
            case 'submitted':
                return (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        Menunggu Verifikasi
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        Pending Kas
                    </span>
                );
        }
    };

    const quickFilters = useMemo(
        () => [
            { label: 'Semua Status', value: 'all' },
            { label: 'Draft', value: 'draft' },
            { label: 'Berangkat (On Duty)', value: 'dispatched' },
            { label: 'Selesai Tugas', value: 'completed' },
            { label: 'Settled (Lunas Kas)', value: 'settled' },
        ],
        [],
    );

    const statusOptions: SelectOption[] = [
        { value: 'all', label: 'Semua Status Tugas' },
        { value: 'draft', label: 'Draft' },
        { value: 'dispatched', label: 'Berangkat (On Duty)' },
        { value: 'completed', label: 'Selesai Tugas' },
        { value: 'settled', label: 'Settled (Selesai Kas)' },
        { value: 'cancelled', label: 'Dibatalkan' },
    ];

    const settlementOptions: SelectOption[] = [
        { value: 'all', label: 'Semua Status Kas' },
        { value: 'pending', label: 'Belum Selesai (Pending)' },
        { value: 'settled', label: 'Lunas / Settled' },
    ];

    const driverOptions: SelectOption[] = useMemo(() => [
        { value: '', label: 'Semua Pengemudi' },
        ...drivers.map((d) => ({ value: String(d.id), label: d.name })),
    ], [drivers]);

    const vehicleOptions: SelectOption[] = useMemo(() => [
        { value: '', label: 'Semua Kendaraan' },
        ...vehicles.map((v) => ({ value: String(v.id), label: `${v.plate_number} - ${v.name}` })),
    ], [vehicles]);

    const perPage = orders.per_page || 15;

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Surat Perintah Perjalanan Dinas (SPPD) & Uang Jalan"
                    subtitle="Kelola surat tugas supir, pencairan uang muka perjalanan, pencatatan nota riil, dan rekonsiliasi kas lembur."
                    actions={
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher compact />
                            <Link href={prefixedRoute('rental.duty_orders.create')}>
                                <PrimaryButton className="rounded-xl shadow-sm inline-flex items-center gap-1.5">
                                    <span className="text-base leading-none">＋</span> Buat SPPD Baru
                                </PrimaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title="SPPD & Uang Jalan Pengemudi - Rental" />

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
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total SPPD</div>
                        <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{metrics.total_orders}</div>
                    </div>
                    <div className="rounded-3xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/20">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Sedang Bertugas</div>
                        <div className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-400">{metrics.active_orders}</div>
                    </div>
                    <div className="rounded-3xl border border-rose-200/80 bg-rose-50/50 p-4 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/20">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Kas Belum Selesai</div>
                        <div className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-400">{metrics.pending_settlement}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Uang Muka Keluar</div>
                        <div className="mt-1 text-base font-black text-slate-900 dark:text-white truncate">{formatCurrency(metrics.total_advance_disbursed)}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Realisasi Nota Riil</div>
                        <div className="mt-1 text-base font-black text-slate-900 dark:text-white truncate">{formatCurrency(metrics.total_actual_expenses)}</div>
                    </div>
                    <div className={`rounded-3xl border p-4 shadow-sm ${
                        metrics.total_net_balance >= 0
                            ? 'border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                            : 'border-rose-200/80 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20'
                    }`}>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Netto Saldo Kas</div>
                        <div className={`mt-1 text-base font-black truncate ${metrics.total_net_balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {formatCurrency(metrics.total_net_balance)}
                        </div>
                    </div>
                </div>

                {/* Search & Filter Header Bar */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
                            <div className="relative min-w-[240px] flex-1">
                                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                    <SearchIcon />
                                </span>
                                <TextInput
                                    type="search"
                                    placeholder="Cari No SPPD, rute, supir, tamu, nopol..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full !rounded-2xl !py-2.5 pl-10 text-xs shadow-2xs"
                                />
                            </div>

                            <div className="w-44 shrink-0 sm:w-48">
                                <Select
                                    className="!rounded-2xl !py-2 text-xs shadow-2xs"
                                    value={status}
                                    options={statusOptions}
                                    onChange={(val) => {
                                        setStatus(val);
                                        applyFilter({ status: val });
                                    }}
                                />
                            </div>

                            <div className="w-44 shrink-0 sm:w-48">
                                <Select
                                    className="!rounded-2xl !py-2 text-xs shadow-2xs"
                                    value={settlementStatus}
                                    options={settlementOptions}
                                    onChange={(val) => {
                                        setSettlementStatus(val);
                                        applyFilter({ settlement_status: val });
                                    }}
                                />
                            </div>

                            <div className="w-40 shrink-0 sm:w-44">
                                <Select
                                    className="!rounded-2xl !py-2 text-xs shadow-2xs"
                                    value={String(driverId)}
                                    options={driverOptions}
                                    onChange={(val) => {
                                        const id = val ? Number(val) : '';
                                        setDriverId(id);
                                        applyFilter({ driver_id: id });
                                    }}
                                />
                            </div>

                            <div className="w-40 shrink-0 sm:w-44">
                                <Select
                                    className="!rounded-2xl !py-2 text-xs shadow-2xs"
                                    value={String(vehicleId)}
                                    options={vehicleOptions}
                                    onChange={(val) => {
                                        const id = val ? Number(val) : '';
                                        setVehicleId(id);
                                        applyFilter({ vehicle_id: id });
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

                        {/* Quick filter chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold text-slate-400 mr-1">Filter Cepat:</span>
                            {quickFilters.map((chip) => {
                                const isActive = (status || 'all') === chip.value;
                                return (
                                    <button
                                        key={chip.value}
                                        type="button"
                                        onClick={() => {
                                            setStatus(chip.value);
                                            applyFilter({ status: chip.value });
                                        }}
                                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-2xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {chip.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {orders.data.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 dark:bg-slate-800">
                                👨‍✈️
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Belum ada Surat Perintah Perjalanan Dinas (SPPD)
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Coba sesuaikan kata kunci pencarian atau buat surat tugas perjalanan baru.
                            </p>
                            {hasActiveFilters ? (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-3 inline-flex items-center rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
                                >
                                    ✕ Reset Filter
                                </button>
                            ) : (
                                <Link href={prefixedRoute('rental.duty_orders.create')}>
                                    <SecondaryButton className="mt-3 text-xs rounded-xl">
                                        ＋ Buat SPPD Pertama
                                    </SecondaryButton>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                    <thead className="bg-slate-50/80 dark:bg-slate-850">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                No. SPPD & Tanggal
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Pengemudi & Unit
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Rute & Penumpang
                                            </th>
                                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Uang Muka
                                            </th>
                                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Nota Riil
                                            </th>
                                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Saldo Kas
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Status
                                            </th>
                                            <th className="w-28 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {orders.data.map((order) => {
                                            const isSurplus = order.net_balance >= 0;

                                            return (
                                                <tr
                                                    key={order.id}
                                                    className="group transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <Link
                                                                href={prefixedRoute('rental.duty_orders.show', order.id)}
                                                                className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                                                            >
                                                                {order.duty_order_number}
                                                            </Link>
                                                            <div className="text-[11px] text-slate-400">
                                                                {order.departure_date} → {order.return_date}
                                                            </div>
                                                            {order.rental && (
                                                                <span className="inline-flex w-fit rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    #{order.rental.code}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <div className="min-w-0">
                                                            <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                                {order.driver?.name || '-'}
                                                            </div>
                                                            <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                {order.vehicle?.plate_number} • {order.vehicle?.name}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                                                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {order.origin} → {order.destination}
                                                        </div>
                                                        {order.passenger_name && (
                                                            <div className="text-[11px] text-slate-400">
                                                                Tamu: {order.passenger_name}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        {formatCurrency(order.cash_advance_amount)}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                                                        {formatCurrency(order.actual_expense_total)}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                                        <div className={`font-mono text-xs font-black ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                            {formatCurrency(order.net_balance)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {isSurplus ? 'Sisa Kembali' : 'Kurang / Talangan'}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`inline-flex w-fit items-center rounded-xl px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass(order.status)}`}>
                                                                {statusLabel(order.status)}
                                                            </span>
                                                            {settlementBadge(order.settlement_status)}
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPreviewOrder(order)}
                                                                className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                                                                title="Quick Preview"
                                                            >
                                                                <EyeIcon />
                                                            </button>
                                                            <Link
                                                                href={prefixedRoute('rental.duty_orders.show', order.id)}
                                                                className="rounded-xl bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition"
                                                            >
                                                                Buka
                                                            </Link>
                                                            <a
                                                                href={prefixedRoute('rental.duty_orders.print', order.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                                                                title="Cetak SPPD"
                                                            >
                                                                🖨️
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:px-5 dark:border-slate-800">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Menampilkan {(orders.current_page - 1) * perPage + 1} - {Math.min(orders.current_page * perPage, orders.total)} dari {orders.total} data
                                </p>
                                {orders.last_page > 1 && (
                                    <div className="flex gap-1">
                                        {orders.links.map((link, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                                        : link.url
                                                            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            : 'cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-600'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Preview Modal */}
            {previewOrder && (
                <Modal show onClose={() => setPreviewOrder(null)} maxWidth="md">
                    <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-2xs">
                                    👨‍✈️
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-mono text-base font-black text-slate-900 dark:text-white">
                                            {previewOrder.duty_order_number}
                                        </h3>
                                        <span className={`rounded-xl px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(previewOrder.status)}`}>
                                            {statusLabel(previewOrder.status)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {previewOrder.departure_date} s/d {previewOrder.return_date}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewOrder(null)}
                                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Pengemudi:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{previewOrder.driver?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Kendaraan:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {previewOrder.vehicle?.plate_number} ({previewOrder.vehicle?.name})
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Rute Perjalanan:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{previewOrder.origin} → {previewOrder.destination}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Tamu / Penumpang:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{previewOrder.passenger_name || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Uang Muka Diberikan:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(previewOrder.cash_advance_amount)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Realisasi Pengeluaran Riil:</span>
                                <span className="font-mono font-bold text-rose-600">{formatCurrency(previewOrder.actual_expense_total)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Saldo Netto Kasir:</span>
                                <span className={`font-mono font-bold ${previewOrder.net_balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(previewOrder.net_balance)} ({previewOrder.net_balance >= 0 ? 'Sisa Kembali' : 'Talangan Supir'})
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3">
                            <a
                                href={prefixedRoute('rental.duty_orders.print', previewOrder.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <SecondaryButton className="text-xs rounded-xl">
                                    🖨️ Cetak Lembar SPPD
                                </SecondaryButton>
                            </a>
                            <Link href={prefixedRoute('rental.duty_orders.show', previewOrder.id)}>
                                <PrimaryButton className="text-xs rounded-xl">
                                    Buka Rincian Kas
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>
                </Modal>
            )}
        </DynamicLayout>
    );
}
