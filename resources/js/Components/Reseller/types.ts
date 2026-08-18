export interface CommissionRow {
    id: number;
    tenant_id: string;
    tenant_name: string | null;
    plan_name: string | null;
    event: 'first' | 'renewal';
    occurrence: number;
    base_amount: number;
    rate_type: 'percent' | 'flat';
    rate_value: number;
    commission_amount: number;
    net_amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'paid' | 'void';
    hold_until: string | null;
    paid_at: string | null;
    void_reason: string | null;
    created_at: string | null;
    reseller_name?: string | null;
    reseller_global_id?: string | null;
}

export interface EarningsSummary {
    this_month: number;
    pending: number;
    approved: number;
    paid: number;
    lifetime: number;
    tenants: number;
    active_tenants: number;
    paying_tenants: number;
}

export interface MonthlyPoint {
    month: string;
    label: string;
    total: number;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface PayoutRow {
    id: number;
    reference: string;
    reseller_global_id: string;
    reseller_name: string | null;
    period_start: string | null;
    period_end: string | null;
    gross_amount: number;
    tax_withheld_amount: number;
    net_amount: number;
    currency: string;
    status: 'draft' | 'approved' | 'paid' | 'cancelled';
    bank_name: string | null;
    account_number: string | null;
    account_name: string | null;
    proof_url: string | null;
    approved_at: string | null;
    paid_at: string | null;
    notes: string | null;
    created_at: string | null;
}

export interface PayoutCandidate {
    reseller_global_id: string;
    reseller_name: string | null;
    total: number;
    entries: number;
    earliest: string | null;
}
