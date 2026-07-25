export type DocumentStatus = 'permanent' | 'valid' | 'expiring_soon' | 'expired';

export interface DocumentType {
    id: number;
    entity_type: string;
    key: string;
    name: string;
    description: string | null;
    is_required: boolean;
    has_expiry: boolean;
    typical_validity_days: number | null;
    reminder_days: number[];
    sort_order: number;
}

export interface DocumentItem {
    id: number;
    document_type_id: number;
    document_type: DocumentType;
    documentable_type: string;
    documentable_id: number;
    document_number: string | null;
    issued_at: string | null;
    expires_at: string | null;
    notes: string | null;
    media_id: number | null;
    media: { id: number; url: string; original_name: string } | null;
    uploaded_by: number;
    uploader: { id: number; name: string } | null;
    verified_by: number | null;
    verifier: { id: number; name: string } | null;
    verified_at: string | null;
    status: DocumentStatus;
    deleted_at: string | null;
}

type Translate = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

export function getStatusBadgeClasses(status: DocumentStatus): string {
    switch (status) {
        case 'expired':
            return 'bg-red-100 text-red-800';
        case 'expiring_soon':
            return 'bg-yellow-100 text-yellow-800';
        case 'permanent':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-green-100 text-green-800';
    }
}

export function getStatusBadge(status: DocumentStatus, t: Translate): { label: string; classes: string } {
    return {
        label: t(`document.status.${status}`, undefined, status),
        classes: getStatusBadgeClasses(status),
    };
}

export function formatDate(value: string | null, localeTag = 'id-ID'): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString(localeTag, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function daysUntil(value: string | null): number | null {
    if (!value) {
        return null;
    }

    const diff = new Date(value).getTime() - Date.now();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDaysUntil(value: string | null, t: Translate): string {
    const days = daysUntil(value);

    if (days === null) {
        return '—';
    }

    if (days < 0) {
        return t('document.days.ago', { count: Math.abs(days) });
    }

    if (days === 0) {
        return t('document.days.today');
    }

    return t('document.days.left', { count: days });
}
