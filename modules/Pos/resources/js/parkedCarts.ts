export interface ParkedCartLine {
    product_id: number;
    name: string;
    unit: string | null;
    unit_price: number;
    quantity: number;
    available: number | null;
    is_service: boolean;
    image: string | null;
}

export interface ParkedCart {
    id: string;
    shift_id: number;
    cart: ParkedCartLine[];
    partner_id: string;
    parked_at: string;
}

export const PARKED_CARTS_KEY = 'pos_parked_carts';
export const LEGACY_PARK_KEY = 'pos_parked_cart';
export const MAX_PARKED_CARTS = 10;

function newId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `park-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function cartMerchandise(cart: ParkedCartLine[]): number {
    return cart.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
}

export function cartItemCount(cart: ParkedCartLine[]): number {
    return cart.reduce((sum, line) => sum + line.quantity, 0);
}

/**
 * Normalize raw sessionStorage payload (multi-list or legacy single cart).
 */
export function normalizeParkedList(raw: unknown, shiftId: number): ParkedCart[] {
    if (!raw) {
        return [];
    }

    if (Array.isArray(raw)) {
        return raw.filter(
            (item): item is ParkedCart =>
                !!item
                && typeof item === 'object'
                && typeof (item as ParkedCart).id === 'string'
                && Number((item as ParkedCart).shift_id) === shiftId
                && Array.isArray((item as ParkedCart).cart)
                && (item as ParkedCart).cart.length > 0,
        );
    }

    // Legacy single-cart shape: { shift_id, cart }
    if (typeof raw === 'object' && raw !== null) {
        const legacy = raw as { shift_id?: number; cart?: ParkedCartLine[]; partner_id?: string };
        if (Number(legacy.shift_id) === shiftId && Array.isArray(legacy.cart) && legacy.cart.length > 0) {
            return [
                {
                    id: newId(),
                    shift_id: shiftId,
                    cart: legacy.cart,
                    partner_id: typeof legacy.partner_id === 'string' ? legacy.partner_id : '',
                    parked_at: new Date().toISOString(),
                },
            ];
        }
    }

    return [];
}

export function readParkedCarts(storage: Storage, shiftId: number): ParkedCart[] {
    try {
        const multi = storage.getItem(PARKED_CARTS_KEY);
        if (multi) {
            return normalizeParkedList(JSON.parse(multi), shiftId);
        }

        const legacy = storage.getItem(LEGACY_PARK_KEY);
        if (legacy) {
            const migrated = normalizeParkedList(JSON.parse(legacy), shiftId);
            if (migrated.length > 0) {
                writeParkedCarts(storage, shiftId, migrated);
            }
            storage.removeItem(LEGACY_PARK_KEY);

            return migrated;
        }
    } catch {
        // Corrupt payload — clear and start fresh.
        storage.removeItem(PARKED_CARTS_KEY);
        storage.removeItem(LEGACY_PARK_KEY);
    }

    return [];
}

export function writeParkedCarts(storage: Storage, shiftId: number, carts: ParkedCart[]): void {
    const scoped = carts.filter((cart) => cart.shift_id === shiftId);
    storage.setItem(PARKED_CARTS_KEY, JSON.stringify(scoped));
    storage.removeItem(LEGACY_PARK_KEY);
}

export function parkCurrentCart(
    storage: Storage,
    shiftId: number,
    cart: ParkedCartLine[],
    partnerId: string,
): { ok: true; list: ParkedCart[] } | { ok: false; reason: 'empty' | 'full' } {
    if (cart.length === 0) {
        return { ok: false, reason: 'empty' };
    }

    const list = readParkedCarts(storage, shiftId);
    if (list.length >= MAX_PARKED_CARTS) {
        return { ok: false, reason: 'full' };
    }

    const next: ParkedCart[] = [
        ...list,
        {
            id: newId(),
            shift_id: shiftId,
            cart,
            partner_id: partnerId,
            parked_at: new Date().toISOString(),
        },
    ];
    writeParkedCarts(storage, shiftId, next);

    return { ok: true, list: next };
}

export function removeParkedCart(storage: Storage, shiftId: number, id: string): ParkedCart[] {
    const next = readParkedCarts(storage, shiftId).filter((cart) => cart.id !== id);
    writeParkedCarts(storage, shiftId, next);

    return next;
}

export function takeParkedCart(
    storage: Storage,
    shiftId: number,
    id: string,
): { ticket: ParkedCart; list: ParkedCart[] } | null {
    const list = readParkedCarts(storage, shiftId);
    const ticket = list.find((cart) => cart.id === id);
    if (!ticket) {
        return null;
    }

    const next = list.filter((cart) => cart.id !== id);
    writeParkedCarts(storage, shiftId, next);

    return { ticket, list: next };
}
