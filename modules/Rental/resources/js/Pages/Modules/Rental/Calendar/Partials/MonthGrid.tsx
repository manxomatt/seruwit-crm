import { Link } from '@inertiajs/react';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { DayUtilisation, createReservationParams, isBookableDate, parseDateKey, toDateKey } from './shared';

interface Props {
    date: string;
    utilisationByDate: Record<string, DayUtilisation>;
    clickToBook?: boolean;
    prefixedRoute: (name: string, params?: number | string | Record<string, unknown>) => string;
}

export default function MonthGrid({
    date,
    utilisationByDate,
    clickToBook = true,
    prefixedRoute,
}: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const anchor = parseDateKey(date);
    const today = toDateKey(new Date());

    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(2023, 0, 2 + i);

        return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(d);
    });

    const cells: Array<string | null> = [
        ...Array.from({ length: startPad }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(year, month, i + 1))),
    ];

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {clickToBook && (
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('rental.calendar.click_day_hint', undefined, 'Klik hari ini atau tanggal mendatang untuk mulai reservasi.')}
                    </p>
                </div>
            )}

            {/* Weekday Labels */}
            <div className="mb-2 grid grid-cols-7 gap-2">
                {weekdayLabels.map((label) => (
                    <div
                        key={label}
                        className="py-1.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Month Day Cards */}
            <div className="grid grid-cols-7 gap-2">
                {cells.map((dateKey, index) => {
                    if (!dateKey) {
                        return (
                            <div
                                key={`pad-${index}`}
                                className="min-h-[90px] rounded-2xl bg-slate-50/40 dark:bg-slate-900/30 border border-dashed border-slate-100 dark:border-slate-800/60"
                            />
                        );
                    }

                    const util = utilisationByDate[dateKey];
                    const percent = util?.utilisation_percent ?? 0;
                    const dayNum = Number(dateKey.slice(-2));
                    const isToday = dateKey === today;
                    const isPast = !isBookableDate(dateKey, today);
                    const bookable = clickToBook && !isPast;

                    // Progress bar color
                    const progressColor =
                        percent >= 70
                            ? 'bg-sky-500'
                            : percent >= 40
                              ? 'bg-amber-500'
                              : percent > 0
                                ? 'bg-emerald-500'
                                : 'bg-slate-200 dark:bg-slate-700';

                    const cardBase = `relative flex flex-col justify-between min-h-[96px] rounded-2xl border p-2.5 text-left transition-all duration-150 ${
                        isToday
                            ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/30 shadow-xs dark:bg-indigo-950/30 dark:border-indigo-500'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    } ${isPast ? 'opacity-60 bg-slate-50/50 dark:bg-slate-950/40' : ''}`;

                    const content = (
                        <>
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-sm font-black tabular-nums ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                            {dayNum}
                                        </span>
                                        {isToday && (
                                            <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[8px] font-bold text-white uppercase">
                                                Hari Ini
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {Math.round(percent)}%
                                    </span>
                                </div>

                                {/* Mini Utilization Progress Bar */}
                                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className={`h-full rounded-full ${progressColor}`}
                                        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                                    />
                                </div>
                            </div>

                            {/* Breakdown Badges */}
                            {util && (
                                <div className="mt-2 flex flex-wrap gap-1 text-[9px] font-semibold">
                                    {util.in_use > 0 && (
                                        <span className="rounded bg-sky-50 px-1 py-0.2 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                                            {util.in_use} jalan
                                        </span>
                                    )}
                                    {util.booked > 0 && (
                                        <span className="rounded bg-amber-50 px-1 py-0.2 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                            {util.booked} booking
                                        </span>
                                    )}
                                    {util.free > 0 && (
                                        <span className="rounded bg-emerald-50 px-1 py-0.2 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            {util.free} kosong
                                        </span>
                                    )}
                                </div>
                            )}
                        </>
                    );

                    if (!bookable) {
                        return (
                            <div
                                key={dateKey}
                                className={cardBase}
                                title={isPast ? t('rental.calendar.past_date', undefined, 'Tanggal lampau') : undefined}
                            >
                                {content}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={dateKey}
                            href={prefixedRoute('rental.create', createReservationParams(dateKey))}
                            title={t('rental.calendar.book_on_date', undefined, 'Buat reservasi pada tanggal ini')}
                            className={`${cardBase} hover:shadow-md hover:scale-[1.02] cursor-pointer`}
                        >
                            {content}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
