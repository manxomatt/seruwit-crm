import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { MAX_VISIBLE_TRIPS, Trip, WEEKDAY_LABELS, formatTime, statusConfig, toDateKey } from './shared';

interface Props {
    date: Date;
    tripsByDate: Record<string, Trip[]>;
    today: string;
    prefixedRoute: (routeName: string, params?: any) => string;
}

function buildMonthGrid(date: Date): (Date | null)[] {
    const year = date.getFullYear();
    const monthNum = date.getMonth();
    const firstOfMonth = new Date(year, monthNum, 1);
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstOfMonth.getDay(); i++) {
        cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, monthNum, day));
    }
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }
    return cells;
}

export default function MonthView({ date, tripsByDate, today, prefixedRoute }: Props): JSX.Element {
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
    const cells = buildMonthGrid(date);

    const toggleExpanded = (dateKey: string) => {
        setExpandedDates((prev) => {
            const next = new Set(prev);
            next.has(dateKey) ? next.delete(dateKey) : next.add(dateKey);
            return next;
        });
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="min-w-[840px]">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
                    {WEEKDAY_LABELS.map((label, index) => (
                        <div
                            key={label}
                            className={`px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${
                                index === 0 || index === 6 ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        >
                            {label}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {cells.map((cellDate, index) => {
                        if (!cellDate) {
                            return <div key={index} className="min-h-[128px] border-b border-r border-gray-100 bg-gray-50/40 last:border-r-0" />;
                        }

                        const dateKey = toDateKey(cellDate);
                        const trips = tripsByDate[dateKey] || [];
                        const isToday = dateKey === today;
                        const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
                        const isExpanded = expandedDates.has(dateKey);
                        const visibleTrips = isExpanded ? trips : trips.slice(0, MAX_VISIBLE_TRIPS);
                        const hiddenCount = trips.length - visibleTrips.length;

                        return (
                            <div
                                key={index}
                                className={`min-h-[128px] border-b border-r border-gray-100 p-2 transition-colors last:border-r-0 ${
                                    isToday ? 'bg-indigo-50/60' : isWeekend ? 'bg-gray-50/40' : 'bg-white'
                                }`}
                            >
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span
                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                            isToday ? 'bg-indigo-600 text-white' : 'text-gray-600'
                                        }`}
                                    >
                                        {cellDate.getDate()}
                                    </span>
                                    {trips.length > 0 && (
                                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                                            {trips.length}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {visibleTrips.map((trip) => {
                                        const config = statusConfig(trip.status);
                                        return (
                                            <Link
                                                key={trip.id}
                                                href={prefixedRoute('transportation.trips.show', trip.id)}
                                                className={`flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-xs font-medium transition-colors ${config.chip}`}
                                                title={`${trip.code} — ${trip.vehicle.name} / ${trip.driver.name}`}
                                            >
                                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} />
                                                <span className="truncate">
                                                    {formatTime(trip.scheduled_at)} {trip.vehicle.plate_number}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                    {hiddenCount > 0 && (
                                        <button
                                            onClick={() => toggleExpanded(dateKey)}
                                            className="w-full rounded-md px-1.5 py-1 text-left text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                                        >
                                            +{hiddenCount} lainnya
                                        </button>
                                    )}
                                    {isExpanded && trips.length > MAX_VISIBLE_TRIPS && (
                                        <button
                                            onClick={() => toggleExpanded(dateKey)}
                                            className="w-full rounded-md px-1.5 py-1 text-left text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                        >
                                            Tampilkan lebih sedikit
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
