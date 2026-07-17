import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link, router } from '@inertiajs/react';
import TransportationNav from '../../../../TransportationNav';

interface Trip {
    id: number;
    code: string;
    scheduled_at: string;
    status: string;
    vehicle: { id: number; name: string; plate_number: string };
    driver: { id: number; name: string };
}

interface Props {
    month: string; // "YYYY-MM"
    tripsByDate: Record<string, Trip[]>;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'scheduled':
            return 'bg-gray-100 text-gray-800';
        case 'in_progress':
            return 'bg-blue-100 text-blue-800';
        case 'completed':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-red-100 text-red-800';
    }
};

function buildMonthGrid(month: string): (Date | null)[] {
    const [year, monthNum] = month.split('-').map(Number);
    const firstOfMonth = new Date(year, monthNum - 1, 1);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstOfMonth.getDay(); i++) {
        cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, monthNum - 1, day));
    }
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }
    return cells;
}

function toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function Index({ month, tripsByDate }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const cells = buildMonthGrid(month);
    const [year, monthNum] = month.split('-').map(Number);
    const monthLabel = new Date(year, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const goToMonth = (offset: number) => {
        const next = new Date(year, monthNum - 1 + offset, 1);
        const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
        router.get(prefixedRoute('transportation.calendar.index'), { month: nextMonth });
    };

    const today = toDateKey(new Date());

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{monthLabel}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => goToMonth(-1)} className="rounded-md border bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                            ← Prev
                        </button>
                        <button onClick={() => goToMonth(1)} className="rounded-md border bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                            Next →
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Trip Calendar" />

            <TransportationNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {WEEKDAY_LABELS.map((label) => (
                        <div key={label} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                            {label}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {cells.map((date, index) => {
                        if (!date) {
                            return <div key={index} className="min-h-[110px] border-b border-r border-gray-100 bg-gray-50" />;
                        }

                        const dateKey = toDateKey(date);
                        const trips = tripsByDate[dateKey] || [];
                        const isToday = dateKey === today;

                        return (
                            <div key={index} className="min-h-[110px] border-b border-r border-gray-100 p-1.5">
                                <div className={`mb-1 text-xs font-medium ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white' : 'text-gray-500'}`}>
                                    {date.getDate()}
                                </div>
                                <div className="space-y-1">
                                    {trips.map((trip) => (
                                        <Link
                                            key={trip.id}
                                            href={prefixedRoute('transportation.trips.show', trip.id)}
                                            className={`block truncate rounded px-1.5 py-0.5 text-xs ${getStatusBadgeColor(trip.status)}`}
                                            title={`${trip.code} — ${trip.vehicle.name} / ${trip.driver.name}`}
                                        >
                                            {new Date(trip.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} {trip.vehicle.plate_number}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DynamicLayout>
    );
}
