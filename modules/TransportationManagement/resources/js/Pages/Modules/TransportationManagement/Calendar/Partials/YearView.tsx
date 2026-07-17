import { router } from '@inertiajs/react';
import { Trip, toDateKey } from './shared';

interface Props {
    date: Date;
    tripsByDate: Record<string, Trip[]>;
    today: string;
    prefixedRoute: (routeName: string, params?: any) => string;
}

const MINI_WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildMonthGrid(year: number, monthNum: number): (Date | null)[] {
    const firstOfMonth = new Date(year, monthNum, 1);
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstOfMonth.getDay(); i++) {
        cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, monthNum, day));
    }
    return cells;
}

export default function YearView({ date, tripsByDate, today, prefixedRoute }: Props): JSX.Element {
    const year = date.getFullYear();

    const goToMonth = (monthNum: number) => {
        const target = new Date(year, monthNum, 1);
        router.get(prefixedRoute('transportation.calendar.index'), { view: 'month', date: toDateKey(target) });
    };

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, monthNum) => {
                const monthLabel = new Date(year, monthNum, 1).toLocaleDateString('en-US', { month: 'long' });
                const cells = buildMonthGrid(year, monthNum);
                const tripCount = cells.reduce((sum, cellDate) => sum + (cellDate ? (tripsByDate[toDateKey(cellDate)]?.length ?? 0) : 0), 0);

                return (
                    <div key={monthNum} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                        <button
                            onClick={() => goToMonth(monthNum)}
                            className="mb-2 flex w-full items-center justify-between rounded-md px-1 py-0.5 text-left hover:bg-gray-50"
                        >
                            <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
                            {tripCount > 0 && (
                                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{tripCount}</span>
                            )}
                        </button>
                        <div className="grid grid-cols-7 gap-y-1 text-center">
                            {MINI_WEEKDAY_LABELS.map((label, index) => (
                                <span key={index} className="text-[10px] font-medium text-gray-300">
                                    {label}
                                </span>
                            ))}
                            {cells.map((cellDate, index) => {
                                if (!cellDate) {
                                    return <span key={index} />;
                                }

                                const dateKey = toDateKey(cellDate);
                                const hasTrips = (tripsByDate[dateKey]?.length ?? 0) > 0;
                                const isToday = dateKey === today;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => goToMonth(monthNum)}
                                        title={hasTrips ? `${tripsByDate[dateKey].length} trip` : undefined}
                                        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] transition-colors ${
                                            isToday
                                                ? 'bg-indigo-600 font-semibold text-white'
                                                : hasTrips
                                                  ? 'font-medium text-indigo-700 hover:bg-indigo-50'
                                                  : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {cellDate.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
