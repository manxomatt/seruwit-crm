import type { ReservationFormData, WizardStep } from './types';

export type WizardDraft = {
    step: WizardStep;
    data: ReservationFormData;
};

const FORM_KEYS: (keyof ReservationFormData)[] = [
    'vehicle_id',
    'driver_id',
    'partner_id',
    'start_date',
    'end_date',
    'period_type',
    'rate_per_period',
    'km_limit_per_period',
    'excess_km_rate',
    'late_fee_per_day',
    'deposit_amount',
    'pickup_location_id',
    'return_location_id',
    'pickup_location',
    'return_location',
    'one_way_fee_amount',
    'insurance_package_id',
    'fuel_policy_notes',
    'notes',
];

export function wizardStorageKey(mode: 'create' | 'edit', rentalId?: number | null): string {
    if (mode === 'edit' && rentalId) {
        return `rental.reservation.wizard.edit.${rentalId}`;
    }

    return 'rental.reservation.wizard.create';
}

function isWizardStep(value: unknown): value is WizardStep {
    return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function normalizeFormData(raw: unknown, fallback: ReservationFormData): ReservationFormData | null {
    if (! raw || typeof raw !== 'object') {
        return null;
    }

    const source = raw as Record<string, unknown>;
    const data = { ...fallback };

    for (const key of FORM_KEYS) {
        const value = source[key];
        if (typeof value === 'string') {
            data[key] = value;
        } else if (value === null || value === undefined) {
            data[key] = '';
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            data[key] = String(value);
        }
    }

    if (! data.period_type) {
        data.period_type = fallback.period_type || 'daily';
    }

    return data;
}

export function readWizardDraft(
    storageKey: string,
    fallback: ReservationFormData,
    storage: Storage | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
): WizardDraft | null {
    if (! storage) {
        return null;
    }

    try {
        const raw = storage.getItem(storageKey);
        if (! raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as { step?: unknown; data?: unknown };
        if (! isWizardStep(parsed.step)) {
            return null;
        }

        const data = normalizeFormData(parsed.data, fallback);
        if (! data) {
            return null;
        }

        return { step: parsed.step, data };
    } catch {
        return null;
    }
}

export function writeWizardDraft(
    storageKey: string,
    draft: WizardDraft,
    storage: Storage | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
): void {
    if (! storage) {
        return;
    }

    try {
        storage.setItem(storageKey, JSON.stringify(draft));
    } catch {
        // Quota / private mode — ignore; wizard still works in-memory.
    }
}

export function clearWizardDraft(
    storageKey: string,
    storage: Storage | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
): void {
    if (! storage) {
        return;
    }

    try {
        storage.removeItem(storageKey);
    } catch {
        // ignore
    }
}
