import { Trip, TripDots, WEEKDAY_LABELS, startOfWeek, toDateKey } from './shared';

interface Props {
    date: Date;
    tripsByDate: Record<string, Trip[]>;
    today: string;
    selectedDate: string | null;
    onSelectDate: (dateKey: string) => void;
}

function buildWeekDays(date: Date): Date[] {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export default function WeekView({ date, tripsByDate, today, selectedDate, onSelectDate }: Props): JSX.Element {
    const days = buildWeekDays(date);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-7">
                {days.map((day, index) => {
                    const dateKey = toDateKey(day);
                    const trips = tripsByDate[dateKey] || [];
                    const isToday = dateKey === today;
                    const isSelected = dateKey === selectedDate;
                    const isWeekend = index === 0 || index === 6;

                    return (
                        <button
                            key={dateKey}
                            onClick={() => onSelectDate(dateKey)}
                            className={`flex min-h-[160px] flex-col items-center justify-center gap-2 border-b border-r border-gray-100 p-3 transition-colors last:border-r-0 ${
                                isSelected ? 'bg-indigo-100/70 ring-1 ring-inset ring-indigo-400' : isToday ? 'bg-indigo-50/60' : isWeekend ? 'bg-gray-50/40' : 'bg-white hover:bg-gray-50'
                            }`}
                        >
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isWeekend ? 'text-gray-400' : 'text-gray-500'}`}>
                                {WEEKDAY_LABELS[index]}
                            </span>
                            <span
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold ${
                                    isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                                }`}
                            >
                                {day.getDate()}
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
