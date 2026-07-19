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
