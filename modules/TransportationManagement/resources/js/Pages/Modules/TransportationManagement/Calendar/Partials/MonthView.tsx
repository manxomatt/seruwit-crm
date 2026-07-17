import { Trip, TripDots, WEEKDAY_LABELS, toDateKey } from './shared';

interface Props {
    date: Date;
    tripsByDate: Record<string, Trip[]>;
    today: string;
    selectedDate: string | null;
    onSelectDate: (dateKey: string) => void;
}

function buildMonthGrid(date: Date): (Date | null)[] {
    const year = date.getFullYear();
    const monthNum = date.getMonth();
    const firstOfMonth = new Date(year, monthNum, 1);
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstOfMonth.getDay(); i++) {
        cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, monthNum, day));
    }
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }
    return cells;
}

export default function MonthView({ date, tripsByDate, today, selectedDate, onSelectDate }: Props): JSX.Element {
    const cells = buildMonthGrid(date);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
                {WEEKDAY_LABELS.map((label, index) => (
                    <div
                        key={label}
                        className={`px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${
                            index === 0 || index === 6 ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                        {label}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {cells.map((cellDate, index) => {
                    if (!cellDate) {
                        return <div key={index} className="aspect-square border-b border-r border-gray-100 bg-gray-50/40 last:border-r-0" />;
                    }

                    const dateKey = toDateKey(cellDate);
                    const trips = tripsByDate[dateKey] || [];
                    const isToday = dateKey === today;
                    const isSelected = dateKey === selectedDate;
                    const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;

                    return (
                        <button
                            key={index}
                            onClick={() => onSelectDate(dateKey)}
                            className={`flex aspect-square flex-col items-center justify-center gap-1.5 border-b border-r border-gray-100 p-2 transition-colors last:border-r-0 ${
                                isSelected ? 'bg-indigo-100/70 ring-1 ring-inset ring-indigo-400' : isToday ? 'bg-indigo-50/60' : isWeekend ? 'bg-gray-50/40' : 'bg-white hover:bg-gray-50'
                            }`}
                        >
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                                    isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                                }`}
                            >
                                {cellDate.getDate()}
                            </span>
                            <TripDots trips={trips} />
                            {trips.length > 0 && <span className="text-[10px] font-medium text-gray-400">{trips.length} trip</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
