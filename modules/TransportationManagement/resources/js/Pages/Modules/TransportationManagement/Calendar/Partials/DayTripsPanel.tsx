import { Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';
import { Trip, formatTime, parseDateKey, statusConfig } from './shared';

interface Props {
    dateKey: string | null;
    trips: Trip[];
    prefixedRoute: (routeName: string, params?: any) => string;
}

export default function DayTripsPanel({ dateKey, trips, prefixedRoute }: Props): JSX.Element {
    const { t } = useTrans();

    if (!dateKey) {
        return (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
                {t('transportation.pages.calendar.select_date')}
            </div>
        );
    }

    const label = parseDateKey(dateKey).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
                <span className="text-xs text-gray-400">{t('transportation.pages.calendar.trip_count', { count: trips.length })}</span>
            </div>
            {trips.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">{t('transportation.pages.calendar.no_trips')}</p>
            ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {trips.map((trip) => {
                        const config = statusConfig(trip.status);
                        return (
                            <Link
                                key={trip.id}
                                href={prefixedRoute('transportation.trips.show', trip.id)}
                                className={`rounded-lg px-3 py-2 text-sm transition-colors ${config.chip}`}
                            >
                                <span className="flex items-center gap-2 font-medium">
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} />
                                    {formatTime(trip.scheduled_at)} · {trip.code}
                                </span>
                                <span className="mt-0.5 block truncate pl-4 text-xs opacity-80">
                                    {trip.vehicle.plate_number} · {trip.driver.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
