export type CalendarView = 'today' | 'week' | 'month' | 'quarter' | 'year';

export type CellStatus = 'free' | 'booked' | 'in_use' | 'unavailable';

export type Booking = {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    partner: string | null;
};

export type CalendarCell = {
    status: CellStatus;
    bookings: Booking[];
};

export type CalendarVehicle = {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
    rental_class?: string | null;
    status: string;
    photo_url: string | null;
    availability: CellStatus;
    cells: Record<string, CalendarCell>;
};

export type DayUtilisation = {
    free: number;
    booked: number;
    in_use: number;
    unavailable: number;
    utilisation_percent: number;
};

export type CalendarBoard = {
    view: CalendarView;
    date: string;
    from: string;
    to: string;
    dates: string[];
    counts: {
        total: number;
        free: number;
        booked: number;
        in_use: number;
        unavailable: number;
    };
    utilisation_percent: number;
    utilisation_by_date: Record<string, DayUtilisation>;
    vehicles: CalendarVehicle[];
};

export const CELL_BG: Record<CellStatus, string> = {
    free: 'bg-emerald-100 dark:bg-emerald-950/60',
    booked: 'bg-amber-200 dark:bg-amber-900/70',
    in_use: 'bg-sky-200 dark:bg-sky-900/70',
    unavailable: 'bg-slate-200 dark:bg-slate-700',
};

export const CELL_BADGE: Record<CellStatus, string> = {
    free: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-200',
    booked: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950 dark:text-amber-200',
    in_use: 'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-950 dark:text-sky-200',
    unavailable: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300',
};

export const VIEW_TABS: { key: CalendarView; labelKey: string }[] = [
    { key: 'today', labelKey: 'rental.calendar.views.today' },
    { key: 'week', labelKey: 'rental.calendar.views.week' },
    { key: 'month', labelKey: 'rental.calendar.views.month' },
    { key: 'quarter', labelKey: 'rental.calendar.views.quarter' },
    { key: 'year', labelKey: 'rental.calendar.views.year' },
];

export function parseDateKey(dateKey: string): Date {
    const [y, m, d] = dateKey.split('-').map(Number);

    return new Date(y, m - 1, d);
}

export function toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

export function shiftAnchor(view: CalendarView, date: Date, offset: number): Date {
    if (view === 'today') {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
    }
    if (view === 'week') {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset * 7);
    }
    if (view === 'month') {
        return new Date(date.getFullYear(), date.getMonth() + offset, 1);
    }
    if (view === 'quarter') {
        return new Date(date.getFullYear(), date.getMonth() + offset * 3, 1);
    }

    return new Date(date.getFullYear() + offset, 0, 1);
}

export function utilTone(percent: number): string {
    if (percent >= 70) {
        return 'bg-sky-200 text-sky-900 dark:bg-sky-900/70 dark:text-sky-100';
    }
    if (percent >= 40) {
        return 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100';
    }
    if (percent > 0) {
        return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
    }

    return 'bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400';
}

export type CreateReservationParams = {
    start_date: string;
    end_date?: string;
    vehicle_id?: number;
};

export function createReservationParams(dateKey: string, vehicleId?: number): CreateReservationParams {
    const params: CreateReservationParams = {
        start_date: dateKey,
        end_date: dateKey,
    };

    if (vehicleId) {
        params.vehicle_id = vehicleId;
    }

    return params;
}

/** True when the calendar day is today or in the future (bookable). */
export function isBookableDate(dateKey: string, todayKey: string = toDateKey(new Date())): boolean {
    return dateKey >= todayKey;
}
