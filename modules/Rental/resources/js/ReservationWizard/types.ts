export type ReservationFormData = {
    vehicle_id: string;
    driver_id: string;
    partner_id: string;
    start_date: string;
    end_date: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: string;
    excess_km_rate: string;
    late_fee_per_day: string;
    deposit_amount: string;
    pickup_location_id: string;
    return_location_id: string;
    pickup_location: string;
    return_location: string;
    one_way_fee_amount: string;
    insurance_package_id: string;
    fuel_policy_notes: string;
    notes: string;
};

export type VehicleOption = {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    rental_class: string | null;
};

export type DriverOption = {
    id: number;
    name: string;
    phone: string | null;
};

export type PartnerOption = {
    id: number;
    name: string;
    code: string;
    phone?: string | null;
    mobile?: string | null;
    email?: string | null;
    id_number?: string | null;
    license_number?: string | null;
    license_expires_at?: string | null;
    address?: string | null;
    account_type?: string | null;
    status?: string | null;
};

export type LocationOption = {
    id: number;
    code: string;
    name: string;
    address: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
};

export type InsurancePackage = {
    id: number;
    code: string;
    name: string;
    amount: string | number;
    deductible_amount: string | number;
    description: string | null;
};

export type AvailableVehicle = {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
    rental_class: string | null;
    photo_url: string | null;
    rate: {
        id: number;
        name: string;
        period_type: string;
        rate_per_period: number;
        km_limit_per_period: number | null;
        excess_km_rate: number | null;
        late_fee_per_day: number | null;
        deposit_amount: number;
        min_periods: number | null;
    } | null;
    total_periods: number;
    base_amount: number | null;
};

export type AvailableVehiclesMeta = {
    count: number;
    total_periods: number;
    skipped_no_rate?: number;
    skipped_unavailable?: number;
    has_active_rates?: boolean;
};

export type ServerQuote = {
    available: boolean;
    reasons: string[];
    total_periods: number;
    rate_per_period: number | null;
    deposit_amount: number | null;
    base_amount: number | null;
    one_way_fee_amount: number | null;
    insurance_amount: number | null;
    total_amount: number | null;
    min_periods: number | null;
    rate: {
        id: number;
        name: string;
        period_type: string;
        km_limit_per_period: number | null;
        excess_km_rate: number | null;
        late_fee_per_day: number | null;
    } | null;
};

export const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;

export const WIZARD_STEPS = [1, 2, 3, 4, 5, 6] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

export function formatDateDisplay(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const [y, m, d] = value.split('-');

    return y && m && d ? `${d}-${m}-${y}` : value;
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);

    return result;
}

export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);

    return result;
}

export function todayKey(): string {
    return formatDate(new Date());
}

export function locationLabel(location: LocationOption): string {
    const address = [location.address, location.city, location.province, location.zip]
        .filter(Boolean)
        .join(', ');
    return address ? `${location.name} — ${address}` : `${location.name} (${location.code})`;
}

export function formatMoney(value: string | number | null | undefined): string {
    return 'Rp ' + Number(value ?? 0).toLocaleString('id-ID');
}

export function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}
