import { Link } from '@inertiajs/react';
import { Trip, WEEKDAY_LABELS, formatTime, startOfWeek, statusConfig, toDateKey } from './shared';

interface Props {
    date: Date;
    tripsByDate: Record<string, Trip[]>;
    today: string;
    prefixedRoute: (routeName: string, params?: any) => string;
}

function buildWeekDays(date: Date): Date[] {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export default function WeekView({ date, tripsByDate, today, prefixedRoute }: Props): JSX.Element {
    const days = buildWeekDays(date);

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="grid min-w-[980px] grid-cols-7 divide-x divide-gray-100">
                {days.map((day, index) => {
                    const dateKey = toDateKey(day);
                    const trips = tripsByDate[dateKey] || [];
                    const isToday = dateKey === today;
                    const isWeekend = index === 0 || index === 6;

                    return (
                        <div key={dateKey} className={`flex min-h-[420px] flex-col ${isToday ? 'bg-indigo-50/60' : isWeekend ? 'bg-gray-50/40' : 'bg-white'}`}>
                            <div className="sticky top-0 flex flex-col items-center gap-1 border-b border-gray-100 bg-inherit px-2 py-2.5">
                                <span className={`text-xs font-semibold uppercase tracking-wider ${isWeekend ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {WEEKDAY_LABELS[index]}
                                </span>
                                <span
                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                                        isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                                    }`}
                                >
                                    {day.getDate()}
                                </span>
                            </div>
                            <div className="flex-1 space-y-1.5 p-2">
                                {trips.length === 0 && <p className="pt-4 text-center text-xs text-gray-300">Tidak ada trip</p>}
                                {trips.map((trip) => {
                                    const config = statusConfig(trip.status);
                                    return (
                                        <Link
                                            key={trip.id}
                                            href={prefixedRoute('transportation.trips.show', trip.id)}
                                            className={`block rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${config.chip}`}
                                            title={`${trip.code} — ${trip.vehicle.name} / ${trip.driver.name}`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} />
                                                <span>{formatTime(trip.scheduled_at)}</span>
                                            </span>
                                            <span className="mt-0.5 block truncate pl-3 text-[11px] font-normal opacity-80">
                                                {trip.vehicle.plate_number} · {trip.driver.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
