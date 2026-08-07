import { Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';
import { CELL_BADGE, CalendarVehicle, createReservationParams, isBookableDate } from './shared';

interface Props {
    vehicles: CalendarVehicle[];
    date: string;
    clickToBook?: boolean;
    prefixedRoute: (name: string, params?: number | string | Record<string, unknown>) => string;
}

export default function TodayBoard({
    vehicles,
    date,
    clickToBook = true,
    prefixedRoute,
}: Props): JSX.Element {
    const { t } = useTrans();
    const canBookDate = clickToBook && isBookableDate(date);

    const ordered = [...vehicles].sort((a, b) => {
        const rank: Record<string, number> = { in_use: 0, booked: 1, free: 2, unavailable: 3 };

        return (rank[a.availability] ?? 9) - (rank[b.availability] ?? 9) || a.name.localeCompare(b.name);
    });

    if (ordered.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                {t('rental.calendar.empty_fleet')}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ordered.map((vehicle) => {
                const cell = vehicle.cells[date];
                const status = cell?.status ?? vehicle.availability;
                const booking = cell?.bookings[0] ?? null;

                return (
                    <article
                        key={vehicle.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="flex gap-3 p-4">
                            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                                {vehicle.photo_url ? (
                                    <img src={vehicle.photo_url} alt={vehicle.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                                        {t('rental.availability.no_photo')}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="truncate font-semibold text-gray-900 dark:text-white">{vehicle.name}</h3>
                                        <p className="font-mono text-xs text-gray-500">{vehicle.plate_number}</p>
                                    </div>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${CELL_BADGE[status]}`}>
                                        {t(`rental.availability.${status}`, undefined, status)}
                                    </span>
                                </div>
                                {booking ? (
                                    <Link
                                        href={prefixedRoute('rental.show', booking.id)}
                                        className="mt-2 block truncate text-sm text-indigo-600 hover:underline"
                                    >
                                        {booking.code}
                                        {booking.partner ? ` · ${booking.partner}` : ''}
                                    </Link>
                                ) : status === 'free' && canBookDate ? (
                                    <Link
                                        href={prefixedRoute(
                                            'rental.create',
                                            createReservationParams(date, vehicle.id),
                                        )}
                                        className="mt-2 inline-flex text-sm font-medium text-indigo-600 hover:underline"
                                    >
                                        {t('rental.availability.book_vehicle')}
                                    </Link>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-400">
                                        {!isBookableDate(date)
                                            ? t('rental.calendar.past_date')
                                            : t('rental.calendar.no_booking')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
