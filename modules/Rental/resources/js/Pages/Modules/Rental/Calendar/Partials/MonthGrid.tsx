import { Link } from '@inertiajs/react';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { DayUtilisation, createReservationParams, isBookableDate, parseDateKey, toDateKey, utilTone } from './shared';

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
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {clickToBook && <p className="mb-3 text-xs text-gray-500">{t('rental.calendar.click_day_hint')}</p>}
            <div className="mb-3 grid grid-cols-7 gap-1">
                {weekdayLabels.map((label) => (
                    <div key={label} className="py-1 text-center text-[11px] font-medium uppercase text-gray-400">
                        {label}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((dateKey, index) => {
                    if (!dateKey) {
                        return <div key={`pad-${index}`} className="min-h-[72px] rounded-md bg-transparent" />;
                    }

                    const util = utilisationByDate[dateKey];
                    const percent = util?.utilisation_percent ?? 0;
                    const dayNum = Number(dateKey.slice(-2));
                    const isToday = dateKey === today;
                    const bookable = clickToBook && isBookableDate(dateKey, today);
                    const cellClass = `min-h-[72px] rounded-md border p-2 text-left transition ${utilTone(percent)} ${
                        isToday ? 'border-indigo-300' : 'border-transparent'
                    }`;
                    const body = (
                        <>
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-sm font-semibold tabular-nums">{dayNum}</span>
                                <span className="text-[10px] font-medium tabular-nums">{Math.round(percent)}%</span>
                            </div>
                            {util && (
                                <p className="mt-2 text-[10px] leading-tight opacity-80">
                                    {t('rental.calendar.day_mix', {
                                        in_use: util.in_use,
                                        booked: util.booked,
                                        free: util.free,
                                    })}
                                </p>
                            )}
                        </>
                    );

                    if (!bookable) {
                        return (
                            <div
                                key={dateKey}
                                className={`${cellClass} ${!isBookableDate(dateKey, today) ? 'opacity-60' : ''}`}
                                title={!isBookableDate(dateKey, today) ? t('rental.calendar.past_date') : undefined}
                            >
                                {body}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={dateKey}
                            href={prefixedRoute('rental.create', createReservationParams(dateKey))}
                            title={t('rental.calendar.book_on_date')}
                            className={`${cellClass} hover:border-indigo-400 hover:ring-2 hover:ring-indigo-500/30`}
                        >
                            {body}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
