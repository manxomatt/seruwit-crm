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
        <div className="space-y-3">
            {clickToBook && <p className="text-xs text-gray-500">{t('rental.calendar.click_day_hint')}</p>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                            className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                        >
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => onSelectMonth(toDateKey(first))}
                                    className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                                    title={t('rental.calendar.open_month')}
                                >
                                    {label}
                                </button>
                                <span className="text-[11px] tabular-nums text-gray-500">
                                    {t('rental.calendar.avg_util', { percent: Math.round(avg) })}
                                </span>
                            </div>
                            <div className="mb-1 grid grid-cols-7 gap-0.5">
                                {weekdayLabels.map((wd, i) => (
                                    <div key={`${month}-${i}`} className="text-center text-[9px] text-gray-400">
                                        {wd}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5">
                                {cells.map((dateKey, index) => {
                                    if (!dateKey) {
                                        return <div key={`pad-${month}-${index}`} className="h-3 rounded-sm" />;
                                    }

                                    const percent = utilisationByDate[dateKey]?.utilisation_percent ?? 0;
                                    const bookable = clickToBook && isBookableDate(dateKey, today);
                                    const cellClass = `h-3 rounded-sm ${utilTone(percent)} ${
                                        dateKey === today ? 'ring-1 ring-indigo-500' : ''
                                    } ${!isBookableDate(dateKey, today) ? 'opacity-50' : ''}`;

                                    if (!bookable) {
                                        return (
                                            <div
                                                key={dateKey}
                                                className={cellClass}
                                                title={
                                                    !isBookableDate(dateKey, today)
                                                        ? t('rental.calendar.past_date')
                                                        : `${dateKey}: ${Math.round(percent)}%`
                                                }
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={dateKey}
                                            href={prefixedRoute('rental.create', createReservationParams(dateKey))}
                                            title={t('rental.calendar.book_on_date')}
                                            className={`${cellClass} hover:ring-1 hover:ring-indigo-500`}
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
