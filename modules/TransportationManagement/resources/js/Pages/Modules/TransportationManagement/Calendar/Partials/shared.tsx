export interface Trip {
    id: number;
    code: string;
    scheduled_at: string;
    status: string;
    vehicle: { id: number; name: string; plate_number: string };
    driver: { id: number; name: string };
}

export type CalendarView = 'week' | 'month' | 'year';

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MAX_VISIBLE_TRIPS = 3;

export const STATUS_CONFIG: Record<string, { label: string; dot: string; chip: string }> = {
    scheduled: { label: 'Scheduled', dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
    in_progress: { label: 'In Progress', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    completed: { label: 'Completed', dot: 'bg-green-500', chip: 'bg-green-50 text-green-700 hover:bg-green-100' },
    cancelled: { label: 'Cancelled', dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 hover:bg-red-100' },
};

export const statusConfig = (status: string) => STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled;

export const ChevronLeftIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

export function toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
}

export function startOfWeek(date: Date): Date {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() - result.getDay());
    return result;
}

export function formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
