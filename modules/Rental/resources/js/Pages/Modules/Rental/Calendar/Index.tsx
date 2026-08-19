import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import RentalNav from '../../../../RentalNav';
import MonthGrid from './Partials/MonthGrid';
import TimelineView from './Partials/TimelineView';
import TodayBoard from './Partials/TodayBoard';
import YearGrid from './Partials/YearGrid';
import {
    CalendarBoard,
    CalendarView,
    CellStatus,
    VIEW_TABS,
    parseDateKey,
    shiftAnchor,
    toDateKey,
} from './Partials/shared';

interface Props {
    board: CalendarBoard;
    calendarClickToBook?: boolean;
    rentalClasses?: Array<{ value: string; label: string }>;
}

function periodLabel(view: CalendarView, from: string, to: string, localeTag: string): string {
    const start = parseDateKey(from);
    const end = parseDateKey(to);

    if (view === 'today') {
        return new Intl.DateTimeFormat(localeTag, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(start);
    }

    if (view === 'year') {
        return String(start.getFullYear());
    }

    if (view === 'month') {
        return new Intl.DateTimeFormat(localeTag, { month: 'long', year: 'numeric' }).format(start);
    }

    const sameYear = start.getFullYear() === end.getFullYear();
    const startLabel = new Intl.DateTimeFormat(localeTag, {
        day: 'numeric',
        month: 'short',
        ...(sameYear ? {} : { year: 'numeric' }),
    }).format(start);
    const endLabel = new Intl.DateTimeFormat(localeTag, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(end);

    return `${startLabel} – ${endLabel}`;
}

interface StatCardProps {
    title: string;
    count: number;
    total: number;
    icon: string;
    active: boolean;
    onClick: () => void;
    tone: 'all' | 'free' | 'booked' | 'in_use' | 'unavailable';
}

function StatCard({ title, count, total, icon, active, onClick, tone }: StatCardProps): JSX.Element {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

    const toneClasses = {
        all: {
            activeRing: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30',
            iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            countText: 'text-slate-900 dark:text-white',
        },
        free: {
            activeRing: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30',
            iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
            countText: 'text-emerald-600 dark:text-emerald-400',
        },
        booked: {
            activeRing: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500/30',
            iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
            countText: 'text-amber-600 dark:text-amber-400',
        },
        in_use: {
            activeRing: 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-500/30',
            iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
            countText: 'text-sky-600 dark:text-sky-400',
        },
        unavailable: {
            activeRing: 'border-slate-400 bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400/30',
            iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            countText: 'text-slate-600 dark:text-slate-400',
        },
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200 ${
                active
                    ? toneClasses.activeRing
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-base font-bold shadow-xs ${toneClasses.iconBg}`}>
                    {icon}
                </div>
                {tone !== 'all' && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {percent}%
                    </span>
                )}
            </div>

            <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </p>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className={`text-xl font-black tabular-nums tracking-tight ${toneClasses.countText}`}>
                        {count}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                        unit
                    </span>
                </div>
            </div>
        </button>
    );
}

export default function Index({ board, calendarClickToBook = true, rentalClasses = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CellStatus>('all');
    const [selectedClass, setSelectedClass] = useState<string>('all');

    const navigate = (view: CalendarView, date: Date) => {
        router.get(
            prefixedRoute('rental.calendar.index'),
            { view, date: toDateKey(date) },
            { preserveState: true, replace: true },
        );
    };

    const handleDateJump = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            navigate(board.view, parseDateKey(e.target.value));
        }
    };

    const filteredVehicles = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return board.vehicles.filter((vehicle) => {
            if (statusFilter !== 'all' && vehicle.availability !== statusFilter) {
                return false;
            }

            if (selectedClass !== 'all' && vehicle.rental_class !== selectedClass) {
                return false;
            }

            if (!needle) {
                return true;
            }

            const rentalClassLabel = vehicle.rental_class
                ? t(`fleet.rental_class.${vehicle.rental_class}`, undefined, vehicle.rental_class).toLowerCase()
                : '';

            return (
                vehicle.name.toLowerCase().includes(needle) ||
                vehicle.plate_number.toLowerCase().includes(needle) ||
                (vehicle.type ?? '').toLowerCase().includes(needle) ||
                rentalClassLabel.includes(needle)
            );
        });
    }, [board.vehicles, search, statusFilter, selectedClass, t]);

    const title = periodLabel(board.view, board.from, board.to, localeTag);

    const isFiltered = statusFilter !== 'all' || selectedClass !== 'all' || search.trim() !== '';

    const resetFilters = () => {
        setStatusFilter('all');
        setSelectedClass('all');
        setSearch('');
    };

    const classOptions = useMemo(() => {
        return [
            { value: 'all', label: t('rental.availability.all_classes', undefined, 'Semua Kelas') },
            ...rentalClasses.map((rc) => ({
                value: rc.value,
                label: rc.label,
            })),
        ];
    }, [rentalClasses, t]);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('rental.pages.calendar.head', undefined, 'Kalender Penjadwalan Rental')}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={prefixedRoute('rental.create')}>
                                <PrimaryButton className="gap-1.5 py-2 text-xs font-bold shadow-xs">
                                    <span>🚀</span>
                                    <span>{t('rental.actions.create_booking', undefined, 'Buat Booking')}</span>
                                </PrimaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('rental.pages.calendar.title', undefined, 'Kalender Rental')} />
            <RentalNav />

            <div className="space-y-6">
                {/* 1. Header Toolbar & View Selector */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* Title & Info */}
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-base font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    🗓️
                                </span>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                    {title}
                                </h2>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    🚗 {board.counts.total} Kendaraan
                                </span>
                                <span>·</span>
                                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    📈 {board.utilisation_percent}% Utilisasi Armada
                                </span>
                                {calendarClickToBook && (
                                    <>
                                        <span>·</span>
                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                            ✓ Klik kalender untuk booking langsung
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* View Tabs & Navigation Bar */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Fast Navigation Buttons */}
                            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800/60">
                                <button
                                    type="button"
                                    onClick={() => navigate(board.view, shiftAnchor(board.view, parseDateKey(board.date), -1))}
                                    className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs dark:text-slate-300 dark:hover:bg-slate-900 transition"
                                    title={t('rental.calendar.prev', undefined, 'Sebelumnya')}
                                >
                                    ← {t('rental.calendar.prev', undefined, 'Sebelumnya')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(board.view, new Date())}
                                    className="rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400 transition"
                                >
                                    {t('rental.calendar.today', undefined, 'Hari Ini')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(board.view, shiftAnchor(board.view, parseDateKey(board.date), 1))}
                                    className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs dark:text-slate-300 dark:hover:bg-slate-900 transition"
                                    title={t('rental.calendar.next', undefined, 'Berikutnya')}
                                >
                                    {t('rental.calendar.next', undefined, 'Berikutnya')} →
                                </button>
                            </div>

                            {/* View Tabs Pills */}
                            <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800/60">
                                {VIEW_TABS.map((tab) => {
                                    const active = board.view === tab.key;
                                    const icon = {
                                        today: '⚡',
                                        week: '📅',
                                        month: '🗓️',
                                        quarter: '📊',
                                        year: '📈',
                                    }[tab.key];

                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => navigate(tab.key, parseDateKey(board.date))}
                                            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                                active
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                            }`}
                                        >
                                            <span>{icon}</span>
                                            <span>{t(tab.labelKey, undefined, tab.key)}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Quick Jump Date Picker */}
                            <div className="relative">
                                <input
                                    type="date"
                                    value={board.date}
                                    onChange={handleDateJump}
                                    className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    title="Lompat ke tanggal"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Interactive KPI Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard
                        title={t('rental.availability.total', undefined, 'Total Armada')}
                        count={board.counts.total}
                        total={board.counts.total}
                        icon="🚗"
                        tone="all"
                        active={statusFilter === 'all'}
                        onClick={() => setStatusFilter('all')}
                    />
                    <StatCard
                        title={t('rental.availability.free', undefined, 'Tersedia')}
                        count={board.counts.free}
                        total={board.counts.total}
                        icon="🟢"
                        tone="free"
                        active={statusFilter === 'free'}
                        onClick={() => setStatusFilter(statusFilter === 'free' ? 'all' : 'free')}
                    />
                    <StatCard
                        title={t('rental.availability.booked', undefined, 'Dibooking')}
                        count={board.counts.booked}
                        total={board.counts.total}
                        icon="🟡"
                        tone="booked"
                        active={statusFilter === 'booked'}
                        onClick={() => setStatusFilter(statusFilter === 'booked' ? 'all' : 'booked')}
                    />
                    <StatCard
                        title={t('rental.availability.in_use', undefined, 'Digunakan')}
                        count={board.counts.in_use}
                        total={board.counts.total}
                        icon="🔵"
                        tone="in_use"
                        active={statusFilter === 'in_use'}
                        onClick={() => setStatusFilter(statusFilter === 'in_use' ? 'all' : 'in_use')}
                    />
                    <StatCard
                        title={t('rental.availability.unavailable', undefined, 'Tidak Aktif')}
                        count={board.counts.unavailable}
                        total={board.counts.total}
                        icon="⚪"
                        tone="unavailable"
                        active={statusFilter === 'unavailable'}
                        onClick={() => setStatusFilter(statusFilter === 'unavailable' ? 'all' : 'unavailable')}
                    />
                </div>

                {/* 3. Search & Class Filter Hub */}
                {board.view !== 'year' && (
                    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
                            {/* Search Input */}
                            <div className="relative min-w-[200px] flex-1 max-w-sm">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">
                                    🔍
                                </span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('rental.availability.search_placeholder', undefined, 'Cari nama armada, plat, kelas...')}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs font-semibold placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/80 dark:focus:bg-slate-900"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Rental Class Filter */}
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

                        {/* Legend Pills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                {t('rental.availability.free', undefined, 'Tersedia')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                {t('rental.availability.booked', undefined, 'Dibooking')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                                <span className="h-2 w-2 rounded-full bg-sky-500" />
                                {t('rental.availability.in_use', undefined, 'Digunakan')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                {t('rental.availability.unavailable', undefined, 'Tidak Aktif')}
                            </span>
                        </div>
                    </div>
                )}

                {/* 4. Active Calendar View Rendering */}
                <div>
                    {board.view === 'today' && (
                        <TodayBoard
                            vehicles={filteredVehicles}
                            date={board.from}
                            clickToBook={calendarClickToBook}
                            prefixedRoute={prefixedRoute}
                        />
                    )}

                    {(board.view === 'week' || board.view === 'quarter') && (
                        <TimelineView
                            vehicles={filteredVehicles}
                            dates={board.dates}
                            compact={board.view === 'quarter'}
                            clickToBook={calendarClickToBook}
                            prefixedRoute={prefixedRoute}
                        />
                    )}

                    {board.view === 'month' && (
                        <MonthGrid
                            date={board.date}
                            utilisationByDate={board.utilisation_by_date}
                            clickToBook={calendarClickToBook}
                            prefixedRoute={prefixedRoute}
                        />
                    )}

                    {board.view === 'year' && (
                        <YearGrid
                            date={board.date}
                            utilisationByDate={board.utilisation_by_date}
                            onSelectMonth={(dateKey) => navigate('month', parseDateKey(dateKey))}
                            clickToBook={calendarClickToBook}
                            prefixedRoute={prefixedRoute}
                        />
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
