// ── Status ─────────────────────────────────────────────────────────────────
export type WorkOrderStatus = 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type WorkOrderType = 'scheduled' | 'corrective' | 'preventive' | 'emergency';
export type ItemType = 'part' | 'labor' | 'other';

type Translate = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

// ── Interfaces ──────────────────────────────────────────────────────────────
export interface MaintenanceCategory {
    id: number;
    key: string;
    name: string;
    description: string | null;
    color: string;
    sort_order: number;
}

export interface WorkOrderItem {
    id?: number;
    work_order_id?: number;
    item_type: ItemType;
    product_id?: number | null;
    warehouse_id?: number | null;
    name: string;
    description: string | null;
    quantity: number;
    unit: string | null;
    unit_price: number;
    total_price: number;
}

export interface SparePartOption {
    id: number;
    name: string;
    unit: string | null;
    price: number | null;
    warehouse_id: number | null;
}

export interface WorkOrderVehicle {
    id: number;
    name: string;
    plate_number: string;
    odometer_km: number;
}

export interface WorkOrder {
    id: number;
    vehicle_id: number;
    category_id: number;
    vehicle: WorkOrderVehicle | null;
    category: MaintenanceCategory | null;
    reference_number: string;
    title: string;
    description: string | null;
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    type: WorkOrderType;
    odometer_at_service: number | null;
    scheduled_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    vendor_name: string | null;
    mechanic_name: string | null;
    invoice_number: string | null;
    estimated_cost: string | null;
    actual_labor_cost: string | null;
    actual_parts_cost: string | null;
    actual_total_cost: number | null;
    notes: string | null;
    resolution_notes: string | null;
    created_by: number | null;
    approved_by: number | null;
    approved_at: string | null;
    creator: { id: number; name: string } | null;
    approver: { id: number; name: string } | null;
    items: WorkOrderItem[];
    created_at: string;
    updated_at: string;
}

export interface MaintenanceSchedule {
    id: number;
    vehicle_id: number;
    category_id: number;
    vehicle: WorkOrderVehicle | null;
    category: MaintenanceCategory | null;
    name: string;
    interval_type: 'mileage' | 'calendar';
    interval_value: number;
    last_service_odometer: number | null;
    last_service_date: string | null;
    next_service_odometer: number | null;
    next_service_date: string | null;
    is_active: boolean;
    notes: string | null;
}

const STATUS_CLASSES: Record<WorkOrderStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const PRIORITY_CLASSES: Record<WorkOrderPriority, string> = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800 font-semibold',
};

const TYPE_CLASSES: Record<WorkOrderType, string> = {
    scheduled: 'bg-teal-100 text-teal-800',
    corrective: 'bg-orange-100 text-orange-800',
    preventive: 'bg-blue-100 text-blue-800',
    emergency: 'bg-red-100 text-red-800',
};

export const STATUS_VALUES: WorkOrderStatus[] = ['draft', 'pending', 'approved', 'in_progress', 'completed', 'cancelled'];
export const PRIORITY_VALUES: WorkOrderPriority[] = ['low', 'normal', 'high', 'urgent'];
export const TYPE_VALUES: WorkOrderType[] = ['scheduled', 'corrective', 'preventive', 'emergency'];
export const ITEM_TYPE_VALUES: ItemType[] = ['part', 'labor', 'other'];

// ── Status helpers ──────────────────────────────────────────────────────────
export function getStatusBadge(status: WorkOrderStatus, t: Translate): { label: string; classes: string } {
    return {
        label: t(`maintenance.status.${status}`, undefined, status),
        classes: STATUS_CLASSES[status],
    };
}

export function getPriorityBadge(priority: WorkOrderPriority, t: Translate): { label: string; classes: string } {
    return {
        label: t(`maintenance.priority.${priority}`, undefined, priority),
        classes: PRIORITY_CLASSES[priority],
    };
}

export function getTypeBadge(type: WorkOrderType, t: Translate): { label: string; classes: string } {
    return {
        label: t(`maintenance.type.${type}`, undefined, type),
        classes: TYPE_CLASSES[type],
    };
}

export function statusOptions(t: Translate): { value: WorkOrderStatus; label: string }[] {
    return STATUS_VALUES.map((value) => ({ value, label: t(`maintenance.status.${value}`) }));
}

export function priorityOptions(t: Translate): { value: WorkOrderPriority; label: string }[] {
    return PRIORITY_VALUES.map((value) => ({ value, label: t(`maintenance.priority.${value}`) }));
}

export function typeOptions(t: Translate): { value: WorkOrderType; label: string }[] {
    return TYPE_VALUES.map((value) => ({ value, label: t(`maintenance.type.${value}`) }));
}

export function itemTypeOptions(t: Translate): { value: ItemType; label: string }[] {
    return ITEM_TYPE_VALUES.map((value) => ({ value, label: t(`maintenance.item_type.${value}`) }));
}

// ── Date / currency helpers ─────────────────────────────────────────────────
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

export function formatDateTime(value: string | null, localeTag = 'id-ID'): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString(localeTag, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatCurrency(value: string | number | null, localeTag = 'id-ID'): string {
    if (value === null || value === undefined) {
        return '—';
    }

    return new Intl.NumberFormat(localeTag, {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

export function formatOdometer(value: number | null, localeTag = 'id-ID'): string {
    if (value === null) {
        return '—';
    }

    return new Intl.NumberFormat(localeTag).format(value) + ' km';
}

/** @deprecated Use statusOptions(t) */
export const STATUS_OPTIONS = STATUS_VALUES.map((value) => ({ value, label: value }));
/** @deprecated Use priorityOptions(t) */
export const PRIORITY_OPTIONS = PRIORITY_VALUES.map((value) => ({ value, label: value }));
/** @deprecated Use typeOptions(t) */
export const TYPE_OPTIONS = TYPE_VALUES.map((value) => ({ value, label: value }));
/** @deprecated Use itemTypeOptions(t) */
export const ITEM_TYPE_OPTIONS = ITEM_TYPE_VALUES.map((value) => ({ value, label: value }));
