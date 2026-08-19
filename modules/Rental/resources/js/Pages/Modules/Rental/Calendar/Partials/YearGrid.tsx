import { Link } from '@inertiajs/react';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { DayUtilisation, createReservationParams, isBookableDate, parseDateKey, toDateKey, utilTone } from './shared';

interface Props {
    date: string;
    utilisationByDate: Record<string, DayUtilisation>;
    onSelectMonth: (dateKey: string) => void;
    clickToBook?: boolean;
    prefixedRoute: (name: string, params?: number | string | Record<string, unknown>) => string;
}

export default function YearGrid({
    date,
    utilisationByDate,
    onSelectMonth,
    clickToBook = true,
    prefixedRoute,
}: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const year = parseDateKey(date).getFullYear();
    const today = toDateKey(new Date());

    const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(2023, 0, 2 + i);

        return new Intl.DateTimeFormat(localeTag, { weekday: 'narrow' }).format(d);
    });

    return (
        <div className="space-y-4">
            {clickToBook && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('rental.calendar.click_day_hint', undefined, 'Klik hari ini atau tanggal mendatang untuk mulai reservasi.')}
                </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }, (_, month) => {
                    const first = new Date(year, month, 1);
                    const label = new Intl.DateTimeFormat(localeTag, { month: 'long' }).format(first);
                    const startPad = (first.getDay() + 6) % 7;
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const cells: Array<string | null> = [
                        ...Array.from({ length: startPad }, () => null),
                        ...Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(year, month, i + 1))),
                    ];

                    const monthUtilValues = cells
                        .filter((key): key is string => Boolean(key))
                        .map((key) => utilisationByDate[key]?.utilisation_percent ?? 0);
                    const avg =
                        monthUtilValues.length > 0
                            ? monthUtilValues.reduce((sum, value) => sum + value, 0) / monthUtilValues.length
                            : 0;

                    return (
                        <div
                            key={month}
                            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => onSelectMonth(toDateKey(first))}
                                    className="font-bold text-sm text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition"
                                    title={t('rental.calendar.open_month', undefined, 'Buka tampilan bulan')}
                                >
                                    {label}
                                </button>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {Math.round(avg)}%
                                </span>
                            </div>

                            <div className="mb-1.5 grid grid-cols-7 gap-1">
                                {weekdayLabels.map((wd, i) => (
                                    <div key={`${month}-${i}`} className="text-center text-[10px] font-bold uppercase text-slate-400">
                                        {wd}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {cells.map((dateKey, index) => {
                                    if (!dateKey) {
                                        return <div key={`pad-${month}-${index}`} className="h-4 rounded-md" />;
                                    }

                                    const percent = utilisationByDate[dateKey]?.utilisation_percent ?? 0;
                                    const isPast = !isBookableDate(dateKey, today);
                                    const bookable = clickToBook && !isPast;
                                    const isToday = dateKey === today;

                                    const cellColor =
                                        percent >= 70
                                            ? 'bg-sky-500'
                                            : percent >= 40
                                              ? 'bg-amber-500'
                                              : percent > 0
                                                ? 'bg-emerald-500'
                                                : 'bg-slate-100 dark:bg-slate-800';

                                    const cellClass = `h-4 rounded-md transition ${cellColor} ${
                                        isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                                    } ${isPast ? 'opacity-40' : ''}`;

                                    if (!bookable) {
                                        return (
                                            <div
                                                key={dateKey}
                                                className={cellClass}
                                                title={
                                                    isPast
                                                        ? t('rental.calendar.past_date', undefined, 'Tanggal lampau')
                                                        : `${dateKey}: ${Math.round(percent)}%`
                                                }
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={dateKey}
                                            href={prefixedRoute('rental.create', createReservationParams(dateKey))}
                                            title={t('rental.calendar.book_on_date', undefined, 'Buat reservasi pada tanggal ini')}
                                            className={`${cellClass} hover:scale-125 hover:shadow-xs`}
                                        />
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
