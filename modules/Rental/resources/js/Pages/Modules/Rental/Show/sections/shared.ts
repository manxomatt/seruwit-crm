/** Text snapshot column can be overwritten by the Location relation in JSON — normalize for display. */
export function locationDisplay(value: unknown): string {
    if (value == null || value === '') {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object') {
        const loc = value as { name?: string; address?: string | null; city?: string | null };
        return [loc.address, loc.city].filter(Boolean).join(', ') || loc.name || '';
    }
    return String(value);
}
