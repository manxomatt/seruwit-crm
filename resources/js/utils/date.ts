/**
 * Date helpers for Inertia props (Carbon date casts / ISO strings).
 */

/** Normalize any date-ish value to YYYY-MM-DD for <input type="date">. */
export function toDateInputValue(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    return value.slice(0, 10);
}

/** Display a date without time / timezone noise. */
export function formatDate(value: string | null | undefined, localeTag = 'id-ID'): string {
    if (!value) {
        return '—';
    }

    const dateOnly = toDateInputValue(value);
    const [year, month, day] = dateOnly.split('-').map(Number);

    if (!year || !month || !day) {
        return dateOnly;
    }

    return new Date(year, month - 1, day).toLocaleDateString(localeTag, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Display a datetime without raw ISO / timezone noise (e.g. T08:00:00.000000Z). */
export function formatDateTime(value: string | null | undefined, localeTag = 'id-ID'): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(localeTag, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
