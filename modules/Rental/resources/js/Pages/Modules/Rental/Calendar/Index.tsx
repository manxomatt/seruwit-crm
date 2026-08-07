import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, router } from '@inertiajs/react';
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

function StatChip({
    label,
    value,
    active,
    onClick,
}: {
    label: string;
    value: number;
    active: boolean;
    onClick: () => void;
}): JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-3 py-2 text-left transition ${
                active
                    ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-500/30 dark:border-indigo-700 dark:bg-indigo-950/40'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'
            }`}
        >
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{value}</p>
        </button>
    );
}

export default function Index({ board, calendarClickToBook = true }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CellStatus>('all');

    const navigate = (view: CalendarView, date: Date) => {
        router.get(
            prefixedRoute('rental.calendar.index'),
            { view, date: toDateKey(date) },
            { preserveState: true, replace: true },
        );
    };

    const filteredVehicles = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return board.vehicles.filter((vehicle) => {
            if (statusFilter !== 'all' && vehicle.availability !== statusFilter) {
                return false;
            }
            if (!needle) {
                return true;
            }

            return (
                vehicle.name.toLowerCase().includes(needle) ||
                vehicle.plate_number.toLowerCase().includes(needle) ||
                (vehicle.type ?? '').toLowerCase().includes(needle)
            );
        });
    }, [board.vehicles, search, statusFilter]);

    const title = periodLabel(board.view, board.from, board.to, localeTag);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('rental.pages.calendar.head')}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <SecondaryButton type="button" onClick={() => navigate(board.view, shiftAnchor(board.view, parseDateKey(board.date), -1))}>
                                {t('rental.calendar.prev')}
                            </SecondaryButton>
                            <SecondaryButton type="button" onClick={() => navigate(board.view, new Date())}>
                                {t('rental.calendar.today')}
                            </SecondaryButton>
                            <SecondaryButton type="button" onClick={() => navigate(board.view, shiftAnchor(board.view, parseDateKey(board.date), 1))}>
                                {t('rental.calendar.next')}
                            </SecondaryButton>
                        </div>
                    }
                />
            }
        >
            <Head title={t('rental.pages.calendar.title')} />
            <RentalNav />

            <div className="mb-6 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {t('rental.calendar.subtitle', {
                                vehicles: board.counts.total,
                                percent: board.utilisation_percent,
                            })}
                        </p>
                        {calendarClickToBook ? (
                            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">
                                {t('rental.calendar.click_day_hint')}
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-500">
                                {t('rental.calendar.click_disabled_hint')}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                        {VIEW_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => navigate(tab.key, parseDateKey(board.date))}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                    board.view === tab.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                {t(tab.labelKey)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <StatChip
                        label={t('rental.availability.total')}
                        value={board.counts.total}
                        active={statusFilter === 'all'}
                        onClick={() => setStatusFilter('all')}
                    />
                    <StatChip
                        label={t('rental.availability.free')}
                        value={board.counts.free}
                        active={statusFilter === 'free'}
                        onClick={() => setStatusFilter(statusFilter === 'free' ? 'all' : 'free')}
                    />
                    <StatChip
                        label={t('rental.availability.booked')}
                        value={board.counts.booked}
                        active={statusFilter === 'booked'}
                        onClick={() => setStatusFilter(statusFilter === 'booked' ? 'all' : 'booked')}
                    />
                    <StatChip
                        label={t('rental.availability.in_use')}
                        value={board.counts.in_use}
                        active={statusFilter === 'in_use'}
                        onClick={() => setStatusFilter(statusFilter === 'in_use' ? 'all' : 'in_use')}
                    />
                    <StatChip
                        label={t('rental.availability.unavailable')}
                        value={board.counts.unavailable}
                        active={statusFilter === 'unavailable'}
                        onClick={() => setStatusFilter(statusFilter === 'unavailable' ? 'all' : 'unavailable')}
                    />
                </div>

                {board.view !== 'year' && (
                    <div className="max-w-sm">
                        <TextInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('rental.availability.search_placeholder')}
                            className="w-full"
                        />
                    </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-800" />
                        {t('rental.availability.free')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-amber-300 dark:bg-amber-700" />
                        {t('rental.availability.booked')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-sky-300 dark:bg-sky-700" />
                        {t('rental.availability.in_use')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
                        {t('rental.availability.unavailable')}
                    </span>
                </div>
            </div>

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
        </DynamicLayout>
    );
}
