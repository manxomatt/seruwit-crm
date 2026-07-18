/**
 * Formats a money value the way Billing displays it everywhere: "Rp 1.500.000".
 * Decimal columns arrive from Laravel as strings, so the value is coerced.
 */
export function formatMoney(value: string | number | null | undefined, symbol = 'Rp'): string {
    return `${symbol} ${Number(value ?? 0).toLocaleString('id-ID')}`;
}
