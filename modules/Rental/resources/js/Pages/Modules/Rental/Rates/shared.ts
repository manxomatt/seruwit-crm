export type TierType = 'period_volume' | 'loyalty_count';

interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginatedLink[];
}

export type PaginatedRate = Paginated<Rate>;

export interface RateTier {
    id?: number;
    tier_type: TierType;
    min_threshold: string;
    max_threshold: string;
    rate_per_period: string;
    discount_percent: string;
    discount_flat: string;
    priority: string;
    is_active: boolean;
}

export interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
}

export interface Rate {
    id: number;
    name: string;
    vehicle_id: number | null;
    vehicle: Vehicle | null;
    vehicle_type: string;
    rental_class: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: string;
    excess_km_rate: string;
    late_fee_per_day: string;
    deposit_amount: string;
    is_active: boolean;
    valid_from: string;
    valid_to: string;
    min_periods: string;
    priority: string;
    notes: string;
    tiers?: RateTier[];
}

export interface FormData {
    vehicle_id: string;
    vehicle_type: string;
    rental_class: string;
    name: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: string;
    excess_km_rate: string;
    late_fee_per_day: string;
    deposit_amount: string;
    is_active: boolean;
    valid_from: string;
    valid_to: string;
    min_periods: string;
    priority: string;
    notes: string;
    tiers: RateTier[];
    tiers_to_delete: number[];
}

export const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;

export const emptyTier = (type: TierType): RateTier => ({
    tier_type: type,
    min_threshold: '',
    max_threshold: '',
    rate_per_period: '',
    discount_percent: '',
    discount_flat: '',
    priority: '0',
    is_active: true,
});

export const emptyForm: FormData = {
    vehicle_id: '',
    vehicle_type: '',
    rental_class: '',
    name: '',
    period_type: 'daily',
    rate_per_period: '',
    km_limit_per_period: '',
    excess_km_rate: '',
    late_fee_per_day: '',
    deposit_amount: '',
    is_active: true,
    valid_from: '',
    valid_to: '',
    min_periods: '',
    priority: '0',
    notes: '',
    tiers: [],
    tiers_to_delete: [],
};

export function rateToFormData(rate: Rate): FormData {
    const tiers: RateTier[] = Array.isArray(rate.tiers)
        ? rate.tiers.map((rt) => ({
            id: rt.id,
            tier_type: rt.tier_type,
            min_threshold: String(rt.min_threshold ?? ''),
            max_threshold: rt.max_threshold !== null && rt.max_threshold !== undefined
                ? String(rt.max_threshold)
                : '',
            rate_per_period: rt.rate_per_period !== null && rt.rate_per_period !== undefined
                ? String(rt.rate_per_period)
                : '',
            discount_percent: rt.discount_percent !== null && rt.discount_percent !== undefined
                ? String(rt.discount_percent)
                : '',
            discount_flat: rt.discount_flat !== null && rt.discount_flat !== undefined
                ? String(rt.discount_flat)
                : '',
            priority: String(rt.priority ?? 0),
            is_active: Boolean(rt.is_active),
        }))
        : [];
    return {
        vehicle_id: String(rate.vehicle?.id ?? ''),
        vehicle_type: rate.vehicle_type ?? '',
        rental_class: rate.rental_class ?? '',
        name: rate.name,
        period_type: rate.period_type,
        rate_per_period: rate.rate_per_period,
        km_limit_per_period: String(rate.km_limit_per_period ?? ''),
        excess_km_rate: rate.excess_km_rate ?? '',
        late_fee_per_day: rate.late_fee_per_day ?? '',
        deposit_amount: rate.deposit_amount,
        is_active: rate.is_active,
        valid_from: rate.valid_from ?? '',
        valid_to: rate.valid_to ?? '',
        min_periods: String(rate.min_periods ?? ''),
        priority: String(rate.priority ?? 0),
        notes: rate.notes ?? '',
        tiers,
        tiers_to_delete: [],
    };
}

export function tierSummaryLabel(tier: RateTier): string {
    const prefix = tier.tier_type === 'period_volume' ? 'Period' : 'Loyalty';
    const max = tier.max_threshold && String(tier.max_threshold).trim() !== ''
        ? ` - ${tier.max_threshold}`
        : '+';
    const range = `${tier.min_threshold || '0'}${max}`;
    let modifier = '';
    if (String(tier.rate_per_period || '').trim() !== '') {
        modifier = `Fixed ${Number(tier.rate_per_period).toLocaleString('id-ID')}`;
    } else if (String(tier.discount_percent || '').trim() !== '') {
        modifier = `-${tier.discount_percent}%`;
    } else if (String(tier.discount_flat || '').trim() !== '') {
        modifier = `-Rp ${Number(tier.discount_flat).toLocaleString('id-ID')}`;
    }
    return `${prefix} ${range}${modifier ? ` · ${modifier}` : ''}`;
}

export type TierFormLabels = {
    rateName: string;
    periodType: string;
    ratePerPeriod: string;
    deposit: string;
    specificVehicle: string;
    anyVehicle: string;
    vehicleType: string;
    rentalClass: string;
    anyClass: string;
    kmLimit: string;
    excessKmRate: string;
    lateFeePerDay: string;
    validFrom: string;
    validTo: string;
    minPeriods: string;
    priority: string;
    rateActive: string;
    cancel: string;
    tiersHead: string;
    tierPeriodTab: string;
    tierLoyaltyTab: string;
    tierEmpty: string;
    tierAdd: string;
    tierThresholdMin: string;
    tierThresholdMax: string;
    tierUnlimited: string;
    modifierFixed: string;
    modifierPercent: string;
    modifierFlat: string;
    tierPriority: string;
    tierActive: string;
    tierDelete: string;
    tierPreview: string;
    tierLegend: string;
    tierLegendPeriod: string;
    tierLegendLoyalty: string;
    tierLegendPriority: string;
};
