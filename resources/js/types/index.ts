export interface Plan {
    id: number
    name: string
    description?: string
    price: number
    currency: string
    pricing_model: 'fixed' | 'payg'
    subscription_tier_id?: number
    include_trial?: boolean
    trial_duration_days?: number
    allow_payg_upgrade?: boolean
    created_at: string
    updated_at: string
}

export interface SubscriptionTier {
    id: number
    name: string
    min_vehicles: number
    max_vehicles: number
    price_per_vehicle: number
    created_at: string
}

export interface Subscription {
    id: number
    tenant_id: string
    plan_id: number
    subscribed_vehicles: number
    subscription_type: string
    current_vehicle_count: number
    status: string
    starts_at: string
    ends_at: string
    renewal_date?: string
    auto_renew: boolean
    created_at: string
    updated_at: string
}

export interface Tenant {
    id: string
    name: string
    status: string
    subscription_type?: string
    max_vehicles_allowed?: number
    trial_ends_at?: string
    is_trial_expired: boolean
    created_at: string
    updated_at: string
}

export interface PaymentOrder {
    id: number
    tenant_id: string
    plan_id: number
    subscription_tier_id?: number
    subscribed_vehicles: number
    price_per_vehicle?: number
    total_vehicle_cost?: number
    upgrade_from_vehicles?: number
    prorated_amount?: number
    type: string
    billing_interval: string
    payment_method: string
    status: string
    amount: number
    total_amount: number
    currency: string
    created_at: string
    updated_at: string
}

export interface PricingBreakdown {
    vehicle_count: number
    tier_id?: number
    tier_name?: string
    price_per_vehicle?: number
    total_price: number
    discount_percent: number
}
