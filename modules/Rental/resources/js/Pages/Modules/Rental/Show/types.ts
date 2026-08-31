import type { KycAssessmentData } from '../../../../Components/AiKycVerificationCard';

/**
 * Shared types for the rental Show page and its extracted modal + section
 * components. `Show.tsx` and everything under `Show/` import from here so a
 * single `Rental` shape is the source of truth.
 */

export interface Extension {
    id: number;
    original_end_date: string;
    new_end_date: string;
    extended_periods: number;
    additional_amount: string;
    notes: string | null;
}

export interface ExtensionRequest {
    id: number;
    requested_end_date: string;
    estimated_periods: number;
    estimated_amount: string;
    status: string;
    channel: string | null;
    notes: string | null;
}

export interface Damage {
    id: number;
    description: string;
    amount: string;
    photo_path: string | null;
    reported_at: string;
}

export interface AddonCharge {
    id: number;
    addon_code: string | null;
    description: string;
    amount: number;
    is_invoiced: boolean;
    can_delete: boolean;
}

export interface AddonCodeOption {
    value: string;
    label: string;
}

export interface PaymentInvoice {
    id: number;
    code: string;
    status: string;
    issue_date: string | null;
    due_date: string | null;
    total: number;
    amount_paid: number;
    balance: number;
}

export interface PaymentSummary {
    status: string;
    total_invoiced: number;
    total_paid: number;
    balance_due: number;
    invoices: PaymentInvoice[];
}

export interface HandoverEvidence {
    checkout_photos: string[];
    checkout_signature_url: string | null;
    checkout_staff_signature_url?: string | null;
    return_photos: string[];
    return_signature_url: string | null;
}

export interface VehicleSwapRow {
    id: number;
    from_vehicle: string | null;
    to_vehicle: string | null;
    odometer_km: number | null;
    notes: string | null;
    swapped_at: string | null;
    swapped_by: string | null;
}

export interface SwapVehicleOption {
    id: number;
    name: string;
    plate_number: string;
    type: string;
}

interface RentalRateTierSnapshot {
    id: number;
    tier_type: 'period_volume' | 'loyalty_count';
    min_threshold: string | null;
    max_threshold: string | null;
    rate_per_period: string | null;
    discount_percent: string | null;
    discount_flat: string | null;
    priority: number | string;
    is_active: boolean;
}

export interface Rental {
    id: number; code: string; status: string; is_overdue: boolean;
    start_date: string; end_date: string; actual_return_date: string | null;
    period_type: string; total_periods: number;
    rate_per_period: string; km_limit_per_period: number | null; excess_km_rate: string | null;
    deposit_amount: string; deposit_returned: boolean;
    deposit_status: string;
    deposit_applied_amount: string;
    deposit_refunded_amount: string;
    deposit_settled_at: string | null;
    deposit_received_at: string | null;
    deposit_payment_method: string | null;
    late_fee_per_day: string | null;
    overdue_days: number | null;
    late_fee_amount: string;
    pickup_location: string | { id: number; code: string; name: string; address: string | null; city: string | null } | null;
    return_location: string | { id: number; code: string; name: string; address: string | null; city: string | null } | null;
    one_way_fee_amount: string | null;
    insurance_package_id: number | null;
    insurance_package?: { id: number; code: string; name: string; deductible_amount: string | number } | null;
    fuel_policy_notes: string | null;
    base_amount: string; excess_km: number | null; excess_amount: string; total_amount: string;
    start_odometer: number | null; end_odometer: number | null;
    start_fuel_level: string | null;
    end_fuel_level: string | null;
    checkout_checklist: Record<string, boolean> | null;
    return_checklist: Record<string, boolean> | null;
    checkout_notes: string | null;
    return_notes: string | null;
    notes: string | null; cancelled_reason: string | null;
    confirmed_at: string | null; checked_out_at: string | null; returned_at: string | null; completed_at: string | null;
    deposit_proof_path?: string | null;
    deposit_proof_uploaded_at?: string | null;
    deposit_proof_status?: string | null;
    deposit_proof_approved_at?: string | null;
    deposit_proof_rejected_reason?: string | null;
    deposit_company_bank_account_id?: number | null;
    depositCompanyBankAccount?: { id: number; name: string; bank_name?: string | null; account_number?: string | null; account_holder?: string | null } | null;
    pickup_requested_at?: string | null;
    pickup_request_status?: string | null;
    pickup_customer_signature_path?: string | null;
    pickup_terms_agreed?: boolean;
    pickup_notes?: string | null;
    applied_period_tier_id?: number | null;
    applied_loyalty_tier_id?: number | null;
    applied_period_tier?: RentalRateTierSnapshot | null;
    applied_loyalty_tier?: RentalRateTierSnapshot | null;
    period_pricing_snapshot?: Array<{
        period: number; from_date: string; to_date: string;
        rate_applied: number; tier_label?: string | null;
    }> | null;
    tier_discount_amount?: string | null;
    vehicle: { id: number; name: string; plate_number: string; type: string; status: string; photo_url: string | null };
    partner: { id: number; name: string; code: string; phone: string | null };
    driver: { id: number; name: string; phone: string | null } | null;
    confirmed_by: { id: number; name: string } | null;
    extensions: Extension[];
    extension_requests?: ExtensionRequest[];
    damages: Damage[];
    passenger_ktp_path?: string | null;
    passenger_sim_path?: string | null;
    ai_kyc_assessment?: KycAssessmentData | null;
}

/**
 * Narrow slice of `Rental` that the lifecycle modals read. `Rental` is
 * structurally assignable to it, so callers pass their existing `rental` prop.
 */
export interface ModalRental {
    id: number;
    code: string;
    deposit_amount: string;
    total_amount: string;
    start_date: string;
    end_date: string;
    partner: { id: number; name: string; code: string; phone: string | null };
    vehicle: { id: number; name: string; plate_number: string; type: string; status: string; photo_url: string | null };
    depositCompanyBankAccount?: {
        id: number;
        name: string;
        bank_name?: string | null;
        account_number?: string | null;
        account_holder?: string | null;
    } | null;
}
