// ── Status ─────────────────────────────────────────────────────────────────
export type WorkOrderStatus = 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type WorkOrderType = 'scheduled' | 'corrective' | 'preventive' | 'emergency';
export type ItemType = 'part' | 'labor' | 'other';

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
    name: string;
    description: string | null;
    quantity: number;
    unit: string | null;
    unit_price: number;
    total_price: number;
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

// ── Status helpers ──────────────────────────────────────────────────────────
export function getStatusBadge(status: WorkOrderStatus): { label: string; classes: string } {
    switch (status) {
        case 'draft': return { label: 'Draft', classes: 'bg-gray-100 text-gray-700' };
        case 'pending': return { label: 'Menunggu', classes: 'bg-yellow-100 text-yellow-800' };
        case 'approved': return { label: 'Disetujui', classes: 'bg-blue-100 text-blue-800' };
        case 'in_progress': return { label: 'Sedang Dikerjakan', classes: 'bg-indigo-100 text-indigo-800' };
        case 'completed': return { label: 'Selesai', classes: 'bg-green-100 text-green-800' };
        case 'cancelled': return { label: 'Dibatalkan', classes: 'bg-red-100 text-red-800' };
    }
}

export function getPriorityBadge(priority: WorkOrderPriority): { label: string; classes: string } {
    switch (priority) {
        case 'low': return { label: 'Rendah', classes: 'bg-gray-100 text-gray-600' };
        case 'normal': return { label: 'Normal', classes: 'bg-blue-100 text-blue-700' };
        case 'high': return { label: 'Tinggi', classes: 'bg-orange-100 text-orange-800' };
        case 'urgent': return { label: 'Urgent', classes: 'bg-red-100 text-red-800 font-semibold' };
    }
}

export function getTypeBadge(type: WorkOrderType): { label: string; classes: string } {
    switch (type) {
        case 'scheduled': return { label: 'Terjadwal', classes: 'bg-teal-100 text-teal-800' };
        case 'corrective': return { label: 'Korektif', classes: 'bg-orange-100 text-orange-800' };
        case 'preventive': return { label: 'Preventif', classes: 'bg-blue-100 text-blue-800' };
        case 'emergency': return { label: 'Darurat', classes: 'bg-red-100 text-red-800' };
    }
}

// ── Date / currency helpers ─────────────────────────────────────────────────
export function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDateTime(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatCurrency(value: string | number | null): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
}

export function formatOdometer(value: number | null): string {
    if (value === null) return '—';
    return new Intl.NumberFormat('id-ID').format(value) + ' km';
}

export const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Menunggu Persetujuan' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'in_progress', label: 'Sedang Dikerjakan' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

export const PRIORITY_OPTIONS: { value: WorkOrderPriority; label: string }[] = [
    { value: 'low', label: 'Rendah' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Tinggi' },
    { value: 'urgent', label: 'Urgent' },
];

export const TYPE_OPTIONS: { value: WorkOrderType; label: string }[] = [
    { value: 'scheduled', label: 'Terjadwal' },
    { value: 'corrective', label: 'Korektif' },
    { value: 'preventive', label: 'Preventif' },
    { value: 'emergency', label: 'Darurat' },
];

export const ITEM_TYPE_OPTIONS: { value: ItemType; label: string }[] = [
    { value: 'part', label: 'Suku Cadang' },
    { value: 'labor', label: 'Jasa' },
    { value: 'other', label: 'Lainnya' },
];
