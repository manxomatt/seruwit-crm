import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import Select from '@/Components/Select';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useMemo, useEffect, useState } from 'react';
import RentalNav from '../../../../RentalNav';

interface Booking {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    partner: string | null;
}

interface VehicleRow {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
    rental_class?: string | null;
    status: string;
    photo_url: string | null;
    availability: 'free' | 'booked' | 'in_use' | 'unavailable';
    has_rate: boolean;
    bookings: Booking[];
}

interface Board {
    from: string;
    to: string;
    counts: { total: number; free: number; booked: number; in_use: number };
    vehicles: VehicleRow[];
}

interface Props {
    board: Board;
    filters: { from: string; to: string };
    rentalClasses?: Array<{ value: string; label: string }>;
}

type AvailabilityFilter = 'all' | 'free' | 'booked' | 'in_use' | 'unavailable';
type RateFilter = 'all' | 'with_rate' | 'without_rate';
type ViewMode = 'grid' | 'timeline' | 'table';

const AVAIL_CONFIG: Record<
    VehicleRow['availability'],
    { labelKey: string; fallback: string; badge: string; dot: string; bgSoft: string; border: string }
> = {
    free: {
        labelKey: 'rental.availability.free',
        fallback: 'Tersedia',
        badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-500/30',
        dot: 'bg-emerald-500',
        bgSoft: 'bg-emerald-50/50 dark:bg-emerald-950/20',
        border: 'border-emerald-500/30',
    },
    booked: {
        labelKey: 'rental.availability.booked',
        fallback: 'Dibooking',
        badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-500/30',
        dot: 'bg-amber-500',
        bgSoft: 'bg-amber-50/50 dark:bg-amber-950/20',
        border: 'border-amber-500/30',
    },
    in_use: {
        labelKey: 'rental.availability.in_use',
        fallback: 'Sedang Digunakan',
        badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-500/30',
        dot: 'bg-sky-500',
        bgSoft: 'bg-sky-50/50 dark:bg-sky-950/20',
        border: 'border-sky-500/30',
    },
    unavailable: {
        labelKey: 'rental.availability.unavailable',
        fallback: 'Tidak Tersedia',
        badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
        dot: 'bg-slate-400',
        bgSoft: 'bg-slate-50/50 dark:bg-slate-900/30',
        border: 'border-slate-400/30',
    },
};

/** Format date string YYYY-MM-DD into readable date */
function formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const [year, month, day] = dateStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const mIdx = parseInt(month, 10) - 1;
        return `${parseInt(day, 10)} ${months[mIdx] || month} ${year}`;
    } catch {
        return dateStr;
    }
}

/** Calculate day difference between two YYYY-MM-DD dates */
function getDaysCount(from: string, to: string): number {
    try {
        const d1 = new Date(from);
        const d2 = new Date(to);
        const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(1, diff);
    } catch {
        return 1;
    }
}

/** Generate array of consecutive date strings between from and to */
function getDateRangeArray(from: string, to: string, maxDays = 31): string[] {
    const dates: string[] = [];
    try {
        const cur = new Date(from);
        const end = new Date(to);
        let count = 0;

        while (cur <= end && count < maxDays) {
            const y = cur.getFullYear();
            const m = String(cur.getMonth() + 1).padStart(2, '0');
            const d = String(cur.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            cur.setDate(cur.getDate() + 1);
            count++;
        }
    } catch {
        return [from];
    }
    return dates;
}

/** Day availability resolution for mini timeline */
function resolveDayStatus(vehicle: VehicleRow, dayStr: string): { status: 'free' | 'booked' | 'in_use' | 'unavailable'; booking?: Booking } {
    if (vehicle.status !== 'active') {
        return { status: 'unavailable' };
    }

    const activeBooking = vehicle.bookings.find(
        (b) => b.status === 'active' && b.start_date <= dayStr && b.end_date >= dayStr
    );
    if (activeBooking) {
        return { status: 'in_use', booking: activeBooking };
    }

    const reservedBooking = vehicle.bookings.find(
        (b) =>
            (b.status === 'confirmed' || b.status === 'pending_reserved') &&
            b.start_date <= dayStr &&
            b.end_date >= dayStr
    );
    if (reservedBooking) {
        return { status: 'booked', booking: reservedBooking };
    }

    return { status: 'free' };
}

interface StatCardProps {
    title: string;
    count: number;
    total: number;
    icon: string;
    active: boolean;
    onClick: () => void;
    tone: 'all' | 'free' | 'booked' | 'in_use';
    subtext?: string;
}

function StatCard({ title, count, total, icon, active, onClick, tone, subtext }: StatCardProps): JSX.Element {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

    const toneClasses = {
        all: {
            bg: 'from-slate-500/10 via-slate-500/5 to-transparent',
            activeRing: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30',
            iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            countText: 'text-slate-900 dark:text-white',
        },
        free: {
            bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
            activeRing: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30',
            iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
            countText: 'text-emerald-600 dark:text-emerald-400',
        },
        booked: {
            bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
            activeRing: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500/30',
            iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
            countText: 'text-amber-600 dark:text-amber-400',
        },
        in_use: {
            bg: 'from-sky-500/10 via-sky-500/5 to-transparent',
            activeRing: 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-500/30',
            iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
            countText: 'text-sky-600 dark:text-sky-400',
        },
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 text-left transition-all duration-200 ${
                active
                    ? toneClasses.activeRing
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-bold shadow-xs ${toneClasses.iconBg}`}>
                    {icon}
                </div>
                {tone !== 'all' && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {percent}%
                    </span>
                )}
            </div>

            <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-2xl font-black tabular-nums tracking-tight ${toneClasses.countText}`}>
                        {count}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                        unit
                    </span>
                </div>
                {subtext && (
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {subtext}
                    </p>
                )}
            </div>
        </button>
    );
}

export default function Index({ board, filters, rentalClasses = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [filter, setFilter] = useState<AvailabilityFilter>('all');
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [rateFilter, setRateFilter] = useState<RateFilter>('all');
    const [query, setQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(12);

    // Sync from prop changes
    useEffect(() => {
        setFrom(filters.from);
        setTo(filters.to);
    }, [filters.from, filters.to]);

    const daysCount = useMemo(() => getDaysCount(filters.from, filters.to), [filters.from, filters.to]);
    const timelineDates = useMemo(() => getDateRangeArray(filters.from, filters.to, 14), [filters.from, filters.to]);

    const submitDateRange = (newFrom: string, newTo: string): void => {
        router.get(
            prefixedRoute('rental.availability.index'),
            { from: newFrom, to: newTo },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFormSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        submitDateRange(from, to);
    };

    // Quick Date Presets
    const applyPreset = (type: 'today' | 'tomorrow' | 'weekend' | '7days' | '14days' | '30days'): void => {
        const now = new Date();
        const formatDate = (d: Date): string => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        let startD = new Date();
        let endD = new Date();

        if (type === 'today') {
            startD = new Date(now);
            endD = new Date(now);
        } else if (type === 'tomorrow') {
            startD = new Date(now);
            startD.setDate(startD.getDate() + 1);
            endD = new Date(startD);
        } else if (type === 'weekend') {
            // Next Saturday
            const dayOfWeek = now.getDay();
            const daysUntilSat = (6 - dayOfWeek + 7) % 7;
            startD = new Date(now);
            startD.setDate(startD.getDate() + (daysUntilSat === 0 ? 7 : daysUntilSat));
            endD = new Date(startD);
            endD.setDate(endD.getDate() + 1); // Sunday
        } else if (type === '7days') {
            startD = new Date(now);
            endD = new Date(now);
            endD.setDate(endD.getDate() + 6);
        } else if (type === '14days') {
            startD = new Date(now);
            endD = new Date(now);
            endD.setDate(endD.getDate() + 13);
        } else if (type === '30days') {
            startD = new Date(now);
            endD = new Date(now);
            endD.setDate(endD.getDate() + 29);
        }

        const newFrom = formatDate(startD);
        const newTo = formatDate(endD);
        setFrom(newFrom);
        setTo(newTo);
        submitDateRange(newFrom, newTo);
    };

    // Filter vehicles
    const filteredVehicles = useMemo(() => {
        const q = query.trim().toLowerCase();

        return board.vehicles.filter((vehicle) => {
            // Availability filter
            if (filter !== 'all' && vehicle.availability !== filter) {
                return false;
            }

            // Rental Class filter
            if (selectedClass !== 'all' && vehicle.rental_class !== selectedClass) {
                return false;
            }

            // Rate Scheme filter
            if (rateFilter === 'with_rate' && !vehicle.has_rate) {
                return false;
            }
            if (rateFilter === 'without_rate' && vehicle.has_rate) {
                return false;
            }

            // Query text
            if (!q) {
                return true;
            }

            const rentalClassLabel = vehicle.rental_class
                ? t(`fleet.rental_class.${vehicle.rental_class}`, undefined, vehicle.rental_class).toLowerCase()
                : '';

            return (
                vehicle.name.toLowerCase().includes(q) ||
                vehicle.plate_number.toLowerCase().includes(q) ||
                (vehicle.type ?? '').toLowerCase().includes(q) ||
                rentalClassLabel.includes(q)
            );
        });
    }, [board.vehicles, filter, selectedClass, rateFilter, query, t]);

    useEffect(() => {
        setPage(1);
    }, [filteredVehicles.length, filter, selectedClass, rateFilter, query]);

    const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / perPage));
    const paginatedVehicles = useMemo(() => {
        return filteredVehicles.slice((page - 1) * perPage, page * perPage);
    }, [filteredVehicles, page, perPage]);

    const bookUrl = (vehicleId: number): string =>
        prefixedRoute('rental.create', {
            vehicle_id: vehicleId,
            start_date: from,
            end_date: to,
            period_type: 'daily',
            start_step: 3,
        });

    const isFiltered = filter !== 'all' || selectedClass !== 'all' || rateFilter !== 'all' || query.trim() !== '';

    const resetFilters = (): void => {
        setFilter('all');
        setSelectedClass('all');
        setRateFilter('all');
        setQuery('');
    };

    // Class options for select
    const classOptions = useMemo(() => {
        return [
            { value: 'all', label: t('rental.availability.all_classes', undefined, 'Semua Kelas Rental') },
            ...rentalClasses.map((rc) => ({
                value: rc.value,
                label: rc.label,
            })),
        ];
    }, [rentalClasses, t]);

    return (
        <DynamicLayout header={<PageHeader title={t('rental.pages.availability.head', undefined, 'Ketersediaan Armada Rental')} />}>
            <Head title={t('rental.pages.availability.title', undefined, 'Ketersediaan Rental')} />
            <RentalNav />

            <div className="space-y-6">
                {/* 1. Glassmorphism Hero Date Controller & Presets */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-base font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    📅
                                </span>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    {t('rental.pages.availability.head', undefined, 'Papan Ketersediaan & Jadwal Sewa')}
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {t('rental.availability.date_range_summary', { days: daysCount }, `Periode Pantau: ${formatShortDate(filters.from)} – ${formatShortDate(filters.to)} (${daysCount} Hari)`)}
                            </p>
                        </div>

                        {/* Quick Presets Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-400 mr-1">
                                {t('rental.availability.quick_presets', undefined, 'Preset:')}
                            </span>
                            <button
                                type="button"
                                onClick={() => applyPreset('today')}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50"
                            >
                                {t('rental.availability.today', undefined, 'Hari Ini')}
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('tomorrow')}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50"
                            >
                                {t('rental.availability.tomorrow', undefined, 'Besok')}
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('weekend')}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50"
                            >
                                {t('rental.availability.weekend', undefined, 'Akhir Pekan')}
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('7days')}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50"
                            >
                                7 {t('rental.period_type.daily', undefined, 'Hari')}
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('14days')}
                                className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                            >
                                14 {t('rental.period_type.daily', undefined, 'Hari')}
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('30days')}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50"
                            >
                                30 {t('rental.period_type.daily', undefined, 'Hari')}
                            </button>
                        </div>
                    </div>

                    {/* Date Picker Form Bar */}
                    <form onSubmit={handleFormSubmit} className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                        <div className="w-full sm:w-44">
                            <InputLabel htmlFor="avail_from" value={t('rental.fields.start_date', undefined, 'Mulai Sewa')} />
                            <TextInput
                                id="avail_from"
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="mt-1 w-full text-xs font-bold"
                            />
                        </div>
                        <div className="w-full sm:w-44">
                            <InputLabel htmlFor="avail_to" value={t('rental.fields.end_date', undefined, 'Selesai Sewa')} />
                            <TextInput
                                id="avail_to"
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="mt-1 w-full text-xs font-bold"
                            />
                        </div>
                        <div className="flex gap-2">
                            <PrimaryButton type="submit" className="gap-2 py-2.5 text-xs font-bold">
                                <span>🔍</span>
                                <span>{t('rental.actions.search', undefined, 'Terapkan Periode')}</span>
                            </PrimaryButton>
                        </div>
                    </form>
                </section>

                {/* 2. Interactive KPI Stats Bar (Click to filter) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={t('rental.availability.total', undefined, 'Total Armada')}
                        count={board.counts.total}
                        total={board.counts.total}
                        icon="🚗"
                        tone="all"
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                        subtext="Semua unit dalam katalog"
                    />
                    <StatCard
                        title={t('rental.availability.free', undefined, 'Tersedia Siap Sewa')}
                        count={board.counts.free}
                        total={board.counts.total}
                        icon="🟢"
                        tone="free"
                        active={filter === 'free'}
                        onClick={() => setFilter('free')}
                        subtext={t('rental.availability.ready_to_deploy', undefined, 'Bebas jadwal bentrok')}
                    />
                    <StatCard
                        title={t('rental.availability.booked', undefined, 'Terjadwal Booking')}
                        count={board.counts.booked}
                        total={board.counts.total}
                        icon="🟡"
                        tone="booked"
                        active={filter === 'booked'}
                        onClick={() => setFilter('booked')}
                        subtext="Booking / Reserved"
                    />
                    <StatCard
                        title={t('rental.availability.in_use', undefined, 'Sedang Berjalan')}
                        count={board.counts.in_use}
                        total={board.counts.total}
                        icon="🔵"
                        tone="in_use"
                        active={filter === 'in_use'}
                        onClick={() => setFilter('in_use')}
                        subtext="Unit aktif di jalan"
                    />
                </div>

                {/* 3. Filter Hub & View Switcher Bar */}
                <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search & Select Filters */}
                    <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
                        {/* Search Input */}
                        <div className="relative min-w-[200px] flex-1 max-w-sm">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">
                                🔍
                            </span>
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('rental.availability.search_placeholder', undefined, 'Cari nama armada, plat, kelas...')}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs font-semibold placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/80 dark:focus:bg-slate-900"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Rental Class Dropdown */}
                        {rentalClasses.length > 0 && (
                            <div className="w-40">
                                <Select
                                    id="class_filter"
                                    value={selectedClass}
                                    onChange={(val) => setSelectedClass(val)}
                                    options={classOptions}
                                    searchable={false}
                                    className="text-xs"
                                />
                            </div>
                        )}

                        {/* Rate Status Dropdown */}
                        <div className="w-44">
                            <Select
                                id="rate_filter"
                                value={rateFilter}
                                onChange={(val) => setRateFilter(val as RateFilter)}
                                options={[
                                    { value: 'all', label: t('rental.availability.all_rates', undefined, 'Semua Status Tarif') },
                                    { value: 'with_rate', label: t('rental.availability.with_rate', undefined, 'Siap Sewa (Ada Tarif)') },
                                    { value: 'without_rate', label: t('rental.availability.without_rate', undefined, 'Belum Ada Tarif') },
                                ]}
                                searchable={false}
                                className="text-xs"
                            />
                        </div>

                        {/* Reset Filter Button */}
                        {isFiltered && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                            >
                                <span>↺</span>
                                <span>Reset Filter</span>
                            </button>
                        )}
                    </div>

                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800/80 shrink-0">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                viewMode === 'grid'
                                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                            }`}
                        >
                            <span>🗂️</span>
                            <span>{t('rental.availability.grid_view', undefined, 'Kartu')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('timeline')}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                viewMode === 'timeline'
                                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                            }`}
                        >
                            <span>📊</span>
                            <span>{t('rental.availability.timeline_view', undefined, 'Timeline')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                viewMode === 'table'
                                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                            }`}
                        >
                            <span>📋</span>
                            <span>{t('rental.availability.table_view', undefined, 'Tabel')}</span>
                        </button>
                    </div>
                </div>

                {/* 4. Vehicle Cards / Timeline List / Table */}
                {filteredVehicles.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                            🔍
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                            {t('rental.pages.availability.empty', undefined, 'Tidak ada kendaraan ditemukan')}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('rental.availability.empty_hint', undefined, 'Coba ubah rentang tanggal atau reset filter pencarian.')}
                        </p>
                        {isFiltered && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
                            >
                                <span>↺</span>
                                <span>Reset Filter</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* VIEW MODE: GRID CARDS */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {paginatedVehicles.map((vehicle) => {
                                    const cfg = AVAIL_CONFIG[vehicle.availability];

                                    return (
                                        <article
                                            key={vehicle.id}
                                            className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                                        >
                                            {/* Card Top: Photo & Info */}
                                            <div>
                                                <div className="relative flex gap-4">
                                                    {/* Vehicle Photo / Fallback Avatar */}
                                                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                                        {vehicle.photo_url ? (
                                                            <img
                                                                src={vehicle.photo_url}
                                                                alt={vehicle.name}
                                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                                                🚗 {vehicle.type || 'Mobil'}
                                                            </div>
                                                        )}
                                                        {/* Status Dot */}
                                                        <span
                                                            className={`absolute top-2 left-2 h-2.5 w-2.5 rounded-full ${cfg.dot} ring-2 ring-white dark:ring-slate-900 shadow-xs`}
                                                        />
                                                    </div>

                                                    {/* Header Info */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                                                                {vehicle.name}
                                                            </h3>
                                                        </div>

                                                        {/* Plate Badge */}
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <span className="inline-block rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-slate-700">
                                                                {vehicle.plate_number}
                                                            </span>
                                                            {vehicle.rental_class && (
                                                                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                                    {t(`fleet.rental_class.${vehicle.rental_class}`, undefined, vehicle.rental_class)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Availability Status Badge */}
                                                        <div className="mt-2">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.badge}`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                                <span>{t(cfg.labelKey, undefined, cfg.fallback)}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mini Timeline Strip */}
                                                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                                                    <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                                                        <span>Timeline ({timelineDates.length} Hari)</span>
                                                        <span className="font-mono">{formatShortDate(filters.from).slice(0, 6)} → {formatShortDate(filters.to).slice(0, 6)}</span>
                                                    </div>
                                                    <div className="flex gap-1 overflow-x-auto pb-0.5">
                                                        {timelineDates.map((dayStr) => {
                                                            const res = resolveDayStatus(vehicle, dayStr);
                                                            const dayNum = parseInt(dayStr.split('-')[2], 10);
                                                            const dayColor = {
                                                                free: 'bg-emerald-500 hover:bg-emerald-600',
                                                                booked: 'bg-amber-500 hover:bg-amber-600',
                                                                in_use: 'bg-sky-500 hover:bg-sky-600',
                                                                unavailable: 'bg-slate-300 dark:bg-slate-700',
                                                            }[res.status];

                                                            return (
                                                                <div
                                                                    key={dayStr}
                                                                    title={`${dayStr}: ${res.status === 'free' ? 'Tersedia' : res.booking?.code || res.status}${res.booking?.partner ? ` (${res.booking.partner})` : ''}`}
                                                                    className={`flex h-6 min-w-[20px] flex-1 items-center justify-center rounded-md text-[9px] font-bold text-white transition ${dayColor}`}
                                                                >
                                                                    {dayNum}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Booking List / Schedule Details */}
                                                <div className="mt-3">
                                                    {vehicle.bookings.length > 0 ? (
                                                        <div className="space-y-1.5">
                                                            {vehicle.bookings.slice(0, 2).map((b) => (
                                                                <div
                                                                    key={b.id}
                                                                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                                                                >
                                                                    <div className="min-w-0 flex-1">
                                                                        <Link
                                                                            href={prefixedRoute('rental.show', b.id)}
                                                                            className="font-mono font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                                        >
                                                                            {b.code}
                                                                        </Link>
                                                                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                                                            {b.start_date} → {b.end_date}
                                                                            {b.partner ? ` · ${b.partner}` : ''}
                                                                        </p>
                                                                    </div>
                                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                        {t(`rental.status.${b.status}`, undefined, b.status)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {vehicle.bookings.length > 2 && (
                                                                <p className="text-center text-[10px] font-semibold text-slate-400">
                                                                    +{vehicle.bookings.length - 2} booking lainnya
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                            <span>✨</span>
                                                            <span>{t('rental.availability.no_active_bookings', undefined, 'Siap jalan tanpa jadwal bentrok')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Bottom: Actions */}
                                            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                                                {vehicle.availability === 'free' && vehicle.has_rate ? (
                                                    <Link href={bookUrl(vehicle.id)} className="block">
                                                        <PrimaryButton className="w-full justify-center py-2 text-xs font-bold shadow-xs">
                                                            <span>🚀</span>
                                                            <span>{t('rental.availability.quick_book', undefined, 'Booking Cepat')}</span>
                                                        </PrimaryButton>
                                                    </Link>
                                                ) : vehicle.availability === 'free' && !vehicle.has_rate ? (
                                                    <Link href={prefixedRoute('rental.rates.create', { vehicle_id: vehicle.id })} className="block">
                                                        <SecondaryButton className="w-full justify-center border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 py-2 text-xs font-bold dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                                            <span>⚠️</span>
                                                            <span>{t('rental.availability.setup_rate', undefined, 'Atur Tarif')}</span>
                                                        </SecondaryButton>
                                                    </Link>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        {vehicle.bookings.length > 0 && (
                                                            <Link href={prefixedRoute('rental.show', vehicle.bookings[0].id)} className="flex-1">
                                                                <SecondaryButton className="w-full justify-center py-2 text-xs font-bold">
                                                                    <span>📋</span>
                                                                    <span>Detail Sewa</span>
                                                                </SecondaryButton>
                                                            </Link>
                                                        )}
                                                        <Link href={prefixedRoute('rental.calendar.index', { from: filters.from })} className="flex-1">
                                                            <SecondaryButton className="w-full justify-center py-2 text-xs font-bold">
                                                                <span>📅</span>
                                                                <span>Kalender</span>
                                                            </SecondaryButton>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {/* VIEW MODE: TIMELINE MATRIX */}
                        {viewMode === 'timeline' && (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-800/80">
                                            <tr>
                                                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3.5 text-left font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 min-w-[220px]">
                                                    Armada Kendaraan
                                                </th>
                                                <th className="px-3 py-3.5 text-center font-bold text-slate-700 dark:text-slate-200 min-w-[100px]">
                                                    Status
                                                </th>
                                                {timelineDates.map((dayStr) => {
                                                    const dayNum = parseInt(dayStr.split('-')[2], 10);
                                                    return (
                                                        <th
                                                            key={dayStr}
                                                            className="px-1.5 py-3.5 text-center font-bold text-slate-600 dark:text-slate-300 min-w-[34px]"
                                                        >
                                                            <span className="block text-[11px] font-black">{dayNum}</span>
                                                            <span className="block text-[9px] font-medium text-slate-400">{formatShortDate(dayStr).slice(3, 6)}</span>
                                                        </th>
                                                    );
                                                })}
                                                <th className="px-4 py-3.5 text-right font-bold text-slate-700 dark:text-slate-200 min-w-[120px]">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {paginatedVehicles.map((vehicle) => {
                                                const cfg = AVAIL_CONFIG[vehicle.availability];

                                                return (
                                                    <tr key={vehicle.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                                        {/* Sticky Vehicle column */}
                                                        <td className="sticky left-0 z-10 bg-white px-4 py-3 dark:bg-slate-900">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200/70 dark:border-slate-700 dark:bg-slate-800">
                                                                    {vehicle.photo_url ? (
                                                                        <img src={vehicle.photo_url} alt="" className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                                                                            🚗
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-bold text-slate-900 dark:text-white">
                                                                        {vehicle.name}
                                                                    </p>
                                                                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                                                        {vehicle.plate_number}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Status Badge */}
                                                        <td className="px-3 py-3 text-center">
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                                <span>{t(cfg.labelKey, undefined, cfg.fallback)}</span>
                                                            </span>
                                                        </td>

                                                        {/* Day Blocks */}
                                                        {timelineDates.map((dayStr) => {
                                                            const res = resolveDayStatus(vehicle, dayStr);
                                                            const colorClass = {
                                                                free: 'bg-emerald-500',
                                                                booked: 'bg-amber-500',
                                                                in_use: 'bg-sky-500',
                                                                unavailable: 'bg-slate-300 dark:bg-slate-700',
                                                            }[res.status];

                                                            return (
                                                                <td key={dayStr} className="p-1 text-center">
                                                                    <div
                                                                        title={`${vehicle.name} · ${dayStr}: ${res.status === 'free' ? 'Tersedia' : res.booking?.code || res.status}`}
                                                                        className={`mx-auto h-7 w-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center text-[9px] font-bold text-white ${colorClass}`}
                                                                    >
                                                                        {res.status === 'free' ? '✓' : '•'}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}

                                                        {/* Quick Action */}
                                                        <td className="px-4 py-3 text-right">
                                                            {vehicle.availability === 'free' && vehicle.has_rate ? (
                                                                <Link href={bookUrl(vehicle.id)}>
                                                                    <PrimaryButton className="py-1 px-2.5 text-[11px] font-bold">
                                                                        Booking
                                                                    </PrimaryButton>
                                                                </Link>
                                                            ) : vehicle.availability === 'free' && !vehicle.has_rate ? (
                                                                <Link href={prefixedRoute('rental.rates.create', { vehicle_id: vehicle.id })}>
                                                                    <span className="text-[11px] font-bold text-amber-600 hover:underline">
                                                                        + Tarif
                                                                    </span>
                                                                </Link>
                                                            ) : (
                                                                <Link href={prefixedRoute('rental.calendar.index', { from: filters.from })}>
                                                                    <span className="text-[11px] font-bold text-indigo-600 hover:underline">
                                                                        Kalender
                                                                    </span>
                                                                </Link>
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

                        {/* VIEW MODE: DETAILED TABLE */}
                        {viewMode === 'table' && (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                                        <tr>
                                            <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                                                Armada Kendaraan
                                            </th>
                                            <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                                                Kelas & Tipe
                                            </th>
                                            <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                                                Status Ketersediaan
                                            </th>
                                            <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                                                Booking Terkait
                                            </th>
                                            <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-700 dark:text-slate-200">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {paginatedVehicles.map((vehicle) => {
                                            const cfg = AVAIL_CONFIG[vehicle.availability];

                                            return (
                                                <tr key={vehicle.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/70 dark:border-slate-700 dark:bg-slate-800">
                                                                {vehicle.photo_url ? (
                                                                    <img src={vehicle.photo_url} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                                                        🚗
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white">
                                                                    {vehicle.name}
                                                                </p>
                                                                <span className="inline-block rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-slate-700">
                                                                    {vehicle.plate_number}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                                                        <div>
                                                            {vehicle.rental_class ? (
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {t(`fleet.rental_class.${vehicle.rental_class}`, undefined, vehicle.rental_class)}
                                                                </span>
                                                            ) : '—'}
                                                            <p className="text-[11px] text-slate-400 capitalize">
                                                                {vehicle.type || 'car'}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                            <span>{t(cfg.labelKey, undefined, cfg.fallback)}</span>
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3.5 text-xs">
                                                        {vehicle.bookings.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {vehicle.bookings.map((b) => (
                                                                    <div key={b.id} className="flex items-center gap-2">
                                                                        <Link
                                                                            href={prefixedRoute('rental.show', b.id)}
                                                                            className="font-mono font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                                        >
                                                                            {b.code}
                                                                        </Link>
                                                                        <span className="text-slate-400">·</span>
                                                                        <span className="text-slate-500">{b.start_date} → {b.end_date}</span>
                                                                        {b.partner && <span className="font-semibold text-slate-700 dark:text-slate-300">({b.partner})</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-right">
                                                        {vehicle.availability === 'free' && vehicle.has_rate ? (
                                                            <Link href={bookUrl(vehicle.id)}>
                                                                <PrimaryButton className="py-1.5 px-3 text-xs font-bold">
                                                                    <span>🚀 Booking</span>
                                                                </PrimaryButton>
                                                            </Link>
                                                        ) : vehicle.availability === 'free' && !vehicle.has_rate ? (
                                                            <Link href={prefixedRoute('rental.rates.create', { vehicle_id: vehicle.id })}>
                                                                <SecondaryButton className="py-1.5 px-3 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40">
                                                                    <span>Atur Tarif</span>
                                                                </SecondaryButton>
                                                            </Link>
                                                        ) : (
                                                            <Link href={prefixedRoute('rental.calendar.index', { from: filters.from })}>
                                                                <SecondaryButton className="py-1.5 px-3 text-xs font-bold">
                                                                    <span>Kalender</span>
                                                                </SecondaryButton>
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {t('rental.availability.showing', {
                                        from: (page - 1) * perPage + 1,
                                        to: Math.min(page * perPage, filteredVehicles.length),
                                        total: filteredVehicles.length,
                                    }, `Menampilkan ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filteredVehicles.length)} dari ${filteredVehicles.length} armada`)}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        ← {t('rental.availability.previous', undefined, 'Sebelumnya')}
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                            .map((p, idx, arr) => {
                                                const prev = arr[idx - 1];
                                                return (
                                                    <span key={p} className="flex items-center">
                                                        {prev && p - prev > 1 && <span className="px-1 text-slate-400">…</span>}
                                                        <button
                                                            type="button"
                                                            onClick={() => setPage(p)}
                                                            className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                                                                page === p
                                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                                            }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        {t('rental.availability.next', undefined, 'Berikutnya')} →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DynamicLayout>
    );
}
