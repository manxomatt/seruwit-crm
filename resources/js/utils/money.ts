/**
 * Formats a money value the way every module displays it: "Rp 1.500.000".
 * Decimal columns arrive from Laravel as strings, so the value is coerced.
 *
 * Shared rather than per-module: Billing and Invoicing both format money, and
 * a Vertical reaching sideways into a Foundation module's helper — or keeping
 * its own copy of it — is worse than either owning it here.
 */
export function formatMoney(value: string | number | null | undefined, symbol = 'Rp'): string {
    return `${symbol} ${Number(value ?? 0).toLocaleString('id-ID')}`;
}

/**
 * Display helper for money inputs: "1500000" → "1.500.000" (id-ID thousand dots).
 * Empty / non-numeric input stays empty so the field can be cleared.
 * Accepts Laravel decimal strings ("1500000.00") and plain digit form values.
 */
export function formatMoneyInput(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const raw = String(value).trim();

    if (raw === '') {
        return '';
    }

    const asNumber = Number(raw);

    let digits: string;

    if (Number.isFinite(asNumber)) {
        digits = String(Math.trunc(Math.abs(asNumber)));
    } else {
        digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    }

    if (digits === '' || digits === '0') {
        return digits === '0' ? '0' : '';
    }

    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parse a dotted money display back to a plain digit string for form/API payloads.
 * "1.500.000" → "1500000"
 */
export function parseMoneyInput(display: string): string {
    return display.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}
