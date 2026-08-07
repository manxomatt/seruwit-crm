import { Link } from '@inertiajs/react';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { CELL_BG, CalendarVehicle, createReservationParams, isBookableDate, toDateKey } from './shared';

interface Props {
    vehicles: CalendarVehicle[];
    dates: string[];
    compact?: boolean;
    clickToBook?: boolean;
    prefixedRoute: (name: string, params?: number | string | Record<string, unknown>) => string;
}

export default function TimelineView({
    vehicles,
    dates,
    compact = false,
    clickToBook = true,
    prefixedRoute,
}: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const today = toDateKey(new Date());

    const formatDay = (date: string): string => {
        const d = new Date(`${date}T00:00:00`);

        return new Intl.DateTimeFormat(localeTag, {
            weekday: compact ? 'narrow' : 'short',
            day: 'numeric',
            ...(compact ? {} : { month: 'short' }),
        }).format(d);
    };

    if (vehicles.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                {t('rental.calendar.empty_fleet')}
            </div>
        );
    }

    const minCol = compact ? 'min-w-[44px]' : 'min-w-[88px]';

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                        <th className="sticky left-0 z-20 bg-gray-50 px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                            {t('rental.fields.vehicle')}
                        </th>
                        {dates.map((date) => {
                            const bookable = clickToBook && isBookableDate(date, today);

                            return (
                                <th
                                    key={date}
                                    className={`${minCol} px-1 py-3 text-center text-[11px] font-medium uppercase ${
                                        date === today
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    {bookable ? (
                                        <Link
                                            href={prefixedRoute('rental.create', createReservationParams(date))}
                                            className="block rounded px-0.5 py-0.5 hover:bg-indigo-100 hover:text-indigo-800 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-200"
                                            title={t('rental.calendar.book_on_date')}
                                        >
                                            {formatDay(date)}
                                        </Link>
                                    ) : (
                                        <span title={!isBookableDate(date, today) ? t('rental.calendar.past_date') : undefined}>
                                            {formatDay(date)}
                                        </span>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {vehicles.map((vehicle) => (
                        <tr key={vehicle.id}>
                            <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 align-middle dark:bg-gray-800">
                                <div className="flex items-center gap-2">
                                    <div className="h-9 w-12 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-900">
                                        {vehicle.photo_url ? (
                                            <img
                                                src={vehicle.photo_url}
                                                alt={vehicle.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                            {vehicle.name}
                                        </div>
                                        <div className="font-mono text-[11px] text-gray-500">{vehicle.plate_number}</div>
                                    </div>
                                </div>
                            </td>
                            {dates.map((date) => {
                                const cell = vehicle.cells[date];
                                const status = cell?.status ?? 'free';
                                const booking = cell?.bookings[0] ?? null;
                                const canBook = clickToBook && status === 'free' && isBookableDate(date, today);
                                const title = booking
                                    ? `${booking.code}${booking.partner ? ` · ${booking.partner}` : ''}`
                                    : canBook
                                      ? t('rental.calendar.book_vehicle_on_date')
                                      : !isBookableDate(date, today)
                                        ? t('rental.calendar.past_date')
                                        : t(`rental.availability.${status}`, undefined, status);

                                const inner = (
                                    <div
                                        className={`mx-auto h-7 w-full max-w-[72px] rounded ${CELL_BG[status]} ${
                                            booking || canBook ? 'ring-1 ring-black/5' : ''
                                        } ${canBook ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400' : ''}`}
                                        title={title}
                                    />
                                );

                                return (
                                    <td
                                        key={`${vehicle.id}-${date}`}
                                        className={`px-1 py-2 align-middle ${
                                            date === today ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                        }`}
                                    >
                                        {booking ? (
                                            <Link href={prefixedRoute('rental.show', booking.id)} className="block">
                                                {inner}
                                            </Link>
                                        ) : canBook ? (
                                            <Link
                                                href={prefixedRoute(
                                                    'rental.create',
                                                    createReservationParams(date, vehicle.id),
                                                )}
                                                className="block"
                                            >
                                                {inner}
                                            </Link>
                                        ) : (
                                            inner
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
