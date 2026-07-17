import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import TransportationNav from '../../../../TransportationNav';
import DayTripsPanel from './Partials/DayTripsPanel';
import MonthView from './Partials/MonthView';
import WeekView from './Partials/WeekView';
import YearView from './Partials/YearView';
import { CalendarView, ChevronLeftIcon, ChevronRightIcon, STATUS_CONFIG, Trip, isSameWeek, parseDateKey, startOfWeek, toDateKey } from './Partials/shared';

interface Props {
    view: CalendarView;
    date: string; // "YYYY-MM-DD"
    tripsByDate: Record<string, Trip[]>;
}

const VIEW_TABS: { key: CalendarView; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
];

const PERIOD_LABEL: Record<CalendarView, string> = {
    week: 'minggu ini',
    month: 'bulan ini',
    year: 'tahun ini',
};

function periodLabel(view: CalendarView, date: Date): string {
    if (view === 'year') {
        return `${date.getFullYear()}`;
    }
    if (view === 'month') {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const start = startOfWeek(date);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString('en-US', sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startLabel} – ${endLabel}`;
}

function shiftDate(view: CalendarView, date: Date, offset: number): Date {
    if (view === 'year') {
        return new Date(date.getFullYear() + offset, date.getMonth(), 1);
    }
    if (view === 'month') {
        return new Date(date.getFullYear(), date.getMonth() + offset, 1);
    }
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset * 7);
}

export default function Index({ view, date: dateKey, tripsByDate }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const date = parseDateKey(dateKey);
    const today = toDateKey(new Date());
    const totalTrips = Object.values(tripsByDate).reduce((sum, trips) => sum + trips.length, 0);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Auto-highlight today when it falls within the visible period; otherwise
    // wait for the user to tap a tile rather than guessing which date to show.
    useEffect(() => {
        const now = new Date();
        const todayVisible =
            view === 'month'
                ? now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth()
                : view === 'week'
                  ? isSameWeek(date, now)
                  : false;
        setSelectedDate(todayVisible ? today : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, dateKey]);

    const navigate = (nextView: CalendarView, nextDate: Date) => {
        router.get(prefixedRoute('transportation.calendar.index'), { view: nextView, date: toDateKey(nextDate) });
    };

    const goToPeriod = (offset: number) => navigate(view, shiftDate(view, date, offset));
    const goToToday = () => navigate(view, new Date());
    const switchView = (nextView: CalendarView) => navigate(nextView, date);

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{periodLabel(view, date)}</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {totalTrips} trip terjadwal {PERIOD_LABEL[view]}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                            {VIEW_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => switchView(tab.key)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        view === tab.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                            <button
                                onClick={() => goToPeriod(-1)}
                                aria-label="Previous"
                                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <button
                                onClick={goToToday}
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => goToPeriod(1)}
                                aria-label="Next"
                                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Trip Calendar" />

            <TransportationNav />

            {/* Legend */}
            <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                        {config.label}
                    </div>
                ))}
            </div>

            {view === 'week' && (
                <WeekView date={date} tripsByDate={tripsByDate} today={today} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            )}
            {view === 'month' && (
                <MonthView date={date} tripsByDate={tripsByDate} today={today} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            )}
            {view === 'year' && <YearView date={date} tripsByDate={tripsByDate} today={today} prefixedRoute={prefixedRoute} />}

            {view !== 'year' && <DayTripsPanel dateKey={selectedDate} trips={selectedDate ? tripsByDate[selectedDate] || [] : []} prefixedRoute={prefixedRoute} />}
        </DynamicLayout>
    );
}
