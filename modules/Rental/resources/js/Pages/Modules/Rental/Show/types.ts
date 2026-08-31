/**
 * Shared prop types for the Show page's extracted lifecycle modals.
 *
 * `ModalRental` is the narrow slice of the full Show `Rental` shape that the
 * modals actually read. The full `Rental` type from Show.tsx is structurally
 * assignable to it, so callers pass their existing `rental` prop unchanged.
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

export interface SwapVehicleOption {
    id: number;
    name: string;
    plate_number: string;
    type: string;
}

export interface AddonCodeOption {
    value: string;
    label: string;
}
