import { Link } from '@inertiajs/react';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { CalendarVehicle, createReservationParams, isBookableDate, toDateKey } from './shared';

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

    const formatDay = (date: string): { weekday: string; dayNum: string; month: string } => {
        const d = new Date(`${date}T00:00:00`);
        const weekday = new Intl.DateTimeFormat(localeTag, {
            weekday: compact ? 'narrow' : 'short',
        }).format(d);
        const dayNum = String(d.getDate());
        const month = new Intl.DateTimeFormat(localeTag, {
            month: 'short',
        }).format(d);

        return { weekday, dayNum, month };
    };

    if (vehicles.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                    🚗
                </div>
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                    {t('rental.calendar.empty_fleet', undefined, 'Belum ada kendaraan dalam armada.')}
                </p>
            </div>
        );
    }

    const minCol = compact ? 'min-w-[42px]' : 'min-w-[96px]';

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                        <tr>
                            <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3.5 text-left font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 min-w-[240px] shadow-xs">
                                {t('rental.fields.vehicle', undefined, 'Armada Kendaraan')}
                            </th>
                            {dates.map((date) => {
                                const { weekday, dayNum, month } = formatDay(date);
                                const isToday = date === today;
                                const bookable = clickToBook && isBookableDate(date, today);

                                return (
                                    <th
                                        key={date}
                                        className={`${minCol} px-1.5 py-3 text-center transition ${
                                            isToday
                                                ? 'bg-indigo-50/90 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-inset ring-indigo-500/20'
                                                : 'text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        {bookable ? (
                                            <Link
                                                href={prefixedRoute('rental.create', createReservationParams(date))}
                                                className="group block rounded-xl py-1 px-0.5 transition hover:bg-white hover:shadow-xs dark:hover:bg-slate-900"
                                                title={t('rental.calendar.book_on_date', undefined, 'Buat reservasi pada tanggal ini')}
                                            >
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600">
                                                    {weekday}
                                                </span>
                                                <span className={`block text-xs font-black tabular-nums ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
                                                    {dayNum} {!compact && <span className="text-[10px] font-normal text-slate-400">{month}</span>}
                                                </span>
                                                {isToday && (
                                                    <span className="mt-0.5 inline-block rounded-full bg-indigo-600 px-1.5 py-0.2 text-[8px] font-bold text-white uppercase">
                                                        Hari Ini
                                                    </span>
                                                )}
                                            </Link>
                                        ) : (
                                            <div title={!isBookableDate(date, today) ? t('rental.calendar.past_date', undefined, 'Tanggal lampau') : undefined} className="py-1">
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {weekday}
                                                </span>
                                                <span className="block text-xs font-bold tabular-nums text-slate-400">
                                                    {dayNum} {!compact && <span className="text-[10px] font-normal text-slate-400">{month}</span>}
                                                </span>
                                            </div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {vehicles.map((vehicle) => (
                            <tr key={vehicle.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                {/* Sticky Vehicle Header */}
                                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 align-middle shadow-xs dark:bg-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                            {vehicle.photo_url ? (
                                                <img
                                                    src={vehicle.photo_url}
                                                    alt={vehicle.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                                                    🚗
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate font-bold text-slate-900 dark:text-white">
                                                {vehicle.name}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-1.5">
                                                <span className="rounded bg-slate-900 px-1.5 py-0.2 font-mono text-[10px] font-bold text-white dark:bg-slate-700">
                                                    {vehicle.plate_number}
                                                </span>
                                                {vehicle.rental_class && (
                                                    <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                        {t(`fleet.rental_class.${vehicle.rental_class}`, undefined, vehicle.rental_class)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Day Cells */}
                                {dates.map((date) => {
                                    const cell = vehicle.cells[date];
                                    const status = cell?.status ?? 'free';
                                    const booking = cell?.bookings[0] ?? null;
                                    const canBook = clickToBook && status === 'free' && isBookableDate(date, today);

                                    const isToday = date === today;

                                    if (status === 'unavailable') {
                                        return (
                                            <td key={`${vehicle.id}-${date}`} className={`p-1.5 text-center align-middle ${isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}>
                                                <div
                                                    title={t('rental.availability.unavailable', undefined, 'Tidak tersedia')}
                                                    className="mx-auto flex h-8 w-full items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-400 dark:bg-slate-800"
                                                >
                                                    —
                                                </div>
                                            </td>
                                        );
                                    }

                                    if (status === 'in_use' || status === 'booked') {
                                        const isUse = status === 'in_use';
                                        const bgClass = isUse
                                            ? 'bg-sky-500 text-white hover:bg-sky-600'
                                            : 'bg-amber-500 text-white hover:bg-amber-600';

                                        const tooltip = booking
                                            ? `${booking.code} (${t(`rental.status.${booking.status}`, undefined, booking.status)})${booking.partner ? ` · ${booking.partner}` : ''} [${booking.start_date} → ${booking.end_date}]`
                                            : t(`rental.availability.${status}`, undefined, status);

                                        return (
                                            <td key={`${vehicle.id}-${date}`} className={`p-1.5 text-center align-middle ${isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}>
                                                {booking ? (
                                                    <Link
                                                        href={prefixedRoute('rental.show', booking.id)}
                                                        title={tooltip}
                                                        className={`mx-auto flex h-8 w-full items-center justify-center rounded-xl px-1 text-[10px] font-bold shadow-xs transition transform hover:scale-[1.03] ${bgClass}`}
                                                    >
                                                        <span className="truncate">
                                                            {compact ? '•' : booking.code.replace(/^REN-0*/, '#')}
                                                        </span>
                                                    </Link>
                                                ) : (
                                                    <div
                                                        title={tooltip}
                                                        className={`mx-auto flex h-8 w-full items-center justify-center rounded-xl px-1 text-[10px] font-bold shadow-xs ${bgClass}`}
                                                    >
                                                        {compact ? '•' : status}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    }

                                    // Free day
                                    return (
                                        <td key={`${vehicle.id}-${date}`} className={`p-1.5 text-center align-middle ${isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}>
                                            {canBook ? (
                                                <Link
                                                    href={prefixedRoute(
                                                        'rental.create',
                                                        createReservationParams(date, vehicle.id),
                                                    )}
                                                    title={t('rental.calendar.book_vehicle_on_date', undefined, 'Buat reservasi kendaraan ini pada tanggal ini')}
                                                    className="group mx-auto flex h-8 w-full items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50/70 text-[10px] font-bold text-emerald-700 shadow-xs transition hover:border-emerald-500 hover:bg-emerald-500 hover:text-white dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white"
                                                >
                                                    <span className="group-hover:hidden">✓</span>
                                                    <span className="hidden group-hover:inline text-xs font-black">+</span>
                                                </Link>
                                            ) : (
                                                <div
                                                    title={!isBookableDate(date, today) ? t('rental.calendar.past_date', undefined, 'Tanggal lampau') : t('rental.availability.free', undefined, 'Tersedia')}
                                                    className="mx-auto flex h-8 w-full items-center justify-center rounded-xl bg-slate-50 text-[10px] font-bold text-slate-400 dark:bg-slate-800/50"
                                                >
                                                    ·
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
