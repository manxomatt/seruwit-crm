import { Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';
import { CalendarVehicle, createReservationParams, isBookableDate } from './shared';

interface Props {
    vehicles: CalendarVehicle[];
    date: string;
    clickToBook?: boolean;
    prefixedRoute: (name: string, params?: number | string | Record<string, unknown>) => string;
}

const STATUS_CONFIG: Record<
    string,
    { labelKey: string; fallback: string; badge: string; dot: string; cardBorder: string }
> = {
    free: {
        labelKey: 'rental.availability.free',
        fallback: 'Tersedia',
        badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-500/30',
        dot: 'bg-emerald-500',
        cardBorder: 'hover:border-emerald-300 dark:hover:border-emerald-800',
    },
    booked: {
        labelKey: 'rental.availability.booked',
        fallback: 'Dibooking',
        badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-500/30',
        dot: 'bg-amber-500',
        cardBorder: 'hover:border-amber-300 dark:hover:border-amber-800',
    },
    in_use: {
        labelKey: 'rental.availability.in_use',
        fallback: 'Sedang Digunakan',
        badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-500/30',
        dot: 'bg-sky-500',
        cardBorder: 'hover:border-sky-300 dark:hover:border-sky-800',
    },
    unavailable: {
        labelKey: 'rental.availability.unavailable',
        fallback: 'Tidak Tersedia',
        badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
        dot: 'bg-slate-400',
        cardBorder: 'hover:border-slate-300 dark:hover:border-slate-700',
    },
};

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

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ordered.map((vehicle) => {
                const cell = vehicle.cells[date];
                const status = cell?.status ?? vehicle.availability;
                const booking = cell?.bookings[0] ?? null;
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.free;

                return (
                    <article
                        key={vehicle.id}
                        className={`group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${cfg.cardBorder}`}
                    >
                        <div>
                            {/* Card Header: Photo & Vehicle Info */}
                            <div className="flex gap-4">
                                <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
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
                                    <span
                                        className={`absolute top-1.5 left-1.5 h-2.5 w-2.5 rounded-full ${cfg.dot} ring-2 ring-white dark:ring-slate-900 shadow-xs`}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-1.5">
                                        <h3 className="truncate font-bold text-slate-900 dark:text-white">
                                            {vehicle.name}
                                        </h3>
                                    </div>

                                    {/* Plate & Rental Class */}
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <span className="inline-block rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-slate-700">
                                            {vehicle.plate_number}
                                        </span>
                                        {vehicle.rental_class && (
                                            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                {t(`fleet.rental_class.${vehicle.rental_class}`, undefined, vehicle.rental_class)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                            <span>{t(cfg.labelKey, undefined, cfg.fallback)}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Booking info container */}
                            <div className="mt-4">
                                {booking ? (
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {booking.code}
                                            </span>
                                            <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                {t(`rental.status.${booking.status}`, undefined, booking.status)}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                                            {booking.start_date} → {booking.end_date}
                                            {booking.partner ? ` · ${booking.partner}` : ''}
                                        </p>
                                    </div>
                                ) : status === 'free' ? (
                                    <div className="flex items-center gap-2 rounded-2xl bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                        <span>✨</span>
                                        <span>{t('rental.availability.no_active_bookings', undefined, 'Siap jalan hari ini')}</span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">
                                        {!isBookableDate(date)
                                            ? t('rental.calendar.past_date', undefined, 'Tanggal lampau')
                                            : t('rental.calendar.no_booking', undefined, 'Tidak ada booking')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                            {booking ? (
                                <Link
                                    href={prefixedRoute('rental.show', booking.id)}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    <span>📋</span>
                                    <span>Lihat Detail Sewa</span>
                                </Link>
                            ) : status === 'free' && canBookDate ? (
                                <Link
                                    href={prefixedRoute(
                                        'rental.create',
                                        createReservationParams(date, vehicle.id),
                                    )}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
                                >
                                    <span>🚀</span>
                                    <span>{t('rental.availability.book_vehicle', undefined, 'Buat Reservasi')}</span>
                                </Link>
                            ) : null}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
