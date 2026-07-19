import DynamicLayout from '@/Layouts/DynamicLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    WorkOrder,
    WorkOrderItem,
    getStatusBadge,
    getPriorityBadge,
    getTypeBadge,
    formatDate,
    formatDateTime,
    formatCurrency,
    formatOdometer,
} from '../../../../maintenanceUtils';

interface Props {
    workOrder: WorkOrder & { actual_total_cost: number | null };
    can: { update: boolean; delete: boolean; approve: boolean };
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex gap-2 py-2">
        <dt className="w-40 flex-shrink-0 text-sm text-gray-500">{label}</dt>
        <dd className="text-sm font-medium text-gray-900">{value || '—'}</dd>
    </div>
);

export default function Show({ workOrder: wo, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const statusBadge = getStatusBadge(wo.status);
    const priorityBadge = getPriorityBadge(wo.priority);
    const typeBadge = getTypeBadge(wo.type);

    const confirmDelete = () => {
        setDeleting(true);
        router.delete(prefixedRoute('maintenance.work-orders.destroy', wo.id), {
            onSuccess: () => setShowDeleteDialog(false),
            onFinish: () => setDeleting(false),
        });
    };

    const partItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'part') ?? [];
    const laborItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'labor') ?? [];
    const otherItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'other') ?? [];

    const totalParts = partItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);
    const totalLabor = laborItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);
    const totalOther = otherItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">Work Order</h2>
                        <p className="mt-1 font-mono text-sm text-gray-500">{wo.reference_number}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('maintenance.work-orders.index')}>
                            <SecondaryButton>← Kembali</SecondaryButton>
                        </Link>
                        {can.update && (
                            <Link href={prefixedRoute('maintenance.work-orders.edit', wo.id)}>
                                <PrimaryButton>Edit</PrimaryButton>
                            </Link>
                        )}
                        {can.delete && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                Hapus
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`WO — ${wo.reference_number}`} />
            <MaintenanceNav />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: main info */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Header card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: wo.category?.color ?? '#6B7280' }}
                            />
                            <span className="text-sm font-medium text-gray-700">{wo.category?.name}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.classes}`}>{statusBadge.label}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityBadge.classes}`}>{priorityBadge.label}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${typeBadge.classes}`}>{typeBadge.label}</span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">{wo.title}</h3>

                        {wo.description && (
                            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{wo.description}</p>
                        )}
                    </div>

                    {/* Items table */}
                    {wo.items && wo.items.length > 0 && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-semibold text-gray-900">Rincian Pekerjaan</h3>

                            {[
                                { label: 'Suku Cadang', items: partItems, total: totalParts },
                                { label: 'Jasa', items: laborItems, total: totalLabor },
                                { label: 'Lainnya', items: otherItems, total: totalOther },
                            ]
                                .filter((g) => g.items.length > 0)
                                .map((group) => (
                                    <div key={group.label} className="mb-4">
                                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.label}</h4>
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="text-xs text-gray-500">
                                                    <th className="pb-1 text-left font-medium">Nama</th>
                                                    <th className="pb-1 text-right font-medium">Qty</th>
                                                    <th className="pb-1 text-right font-medium">Satuan</th>
                                                    <th className="pb-1 text-right font-medium">Harga</th>
                                                    <th className="pb-1 text-right font-medium">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.items.map((item: WorkOrderItem) => (
                                                    <tr key={item.id}>
                                                        <td className="py-1.5 text-sm text-gray-900">{item.name}</td>
                                                        <td className="py-1.5 text-right text-sm text-gray-700">{item.quantity}</td>
                                                        <td className="py-1.5 text-right text-sm text-gray-500">{item.unit ?? '—'}</td>
                                                        <td className="py-1.5 text-right text-sm text-gray-700">{formatCurrency(item.unit_price)}</td>
                                                        <td className="py-1.5 text-right text-sm font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-gray-200">
                                                    <td colSpan={4} className="pt-2 text-right text-xs text-gray-500">Subtotal {group.label}</td>
                                                    <td className="pt-2 text-right text-sm font-semibold text-gray-900">{formatCurrency(group.total)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ))}

                            <div className="mt-4 border-t-2 border-gray-300 pt-3 flex justify-end">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Grand Total</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {formatCurrency(totalParts + totalLabor + totalOther)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resolution notes */}
                    {wo.resolution_notes && (
                        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                            <h3 className="mb-2 font-semibold text-green-800">Catatan Penyelesaian</h3>
                            <p className="text-sm text-green-700 whitespace-pre-line">{wo.resolution_notes}</p>
                        </div>
                    )}
                </div>

                {/* Right: details */}
                <div className="space-y-6">
                    {/* Vehicle card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-3 font-semibold text-gray-900">Kendaraan</h3>
                        <p className="font-medium text-gray-900">{wo.vehicle?.name}</p>
                        <p className="text-sm text-gray-500">{wo.vehicle?.plate_number}</p>
                        {wo.odometer_at_service && (
                            <p className="mt-1 text-sm text-gray-500">Odometer: {formatOdometer(wo.odometer_at_service)}</p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-3 font-semibold text-gray-900">Timeline</h3>
                        <dl>
                            <InfoRow label="Jadwal" value={formatDate(wo.scheduled_date)} />
                            <InfoRow label="Mulai Dikerjakan" value={formatDateTime(wo.started_at)} />
                            <InfoRow label="Selesai" value={formatDateTime(wo.completed_at)} />
                            <InfoRow label="Disetujui oleh" value={wo.approver?.name} />
                            <InfoRow label="Dibuat oleh" value={wo.creator?.name} />
                        </dl>
                    </div>

                    {/* Cost */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-3 font-semibold text-gray-900">Biaya</h3>
                        <dl>
                            <InfoRow label="Estimasi" value={formatCurrency(wo.estimated_cost)} />
                            <InfoRow label="Jasa (aktual)" value={formatCurrency(wo.actual_labor_cost)} />
                            <InfoRow label="Suku Cadang" value={formatCurrency(wo.actual_parts_cost)} />
                            <InfoRow label="No. Invoice" value={wo.invoice_number} />
                        </dl>
                        {wo.actual_total_cost !== null && (
                            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-center">
                                <p className="text-xs text-gray-500">Total Aktual</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(wo.actual_total_cost)}</p>
                            </div>
                        )}
                    </div>

                    {/* Vendor */}
                    {(wo.vendor_name || wo.mechanic_name) && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-3 font-semibold text-gray-900">Bengkel</h3>
                            <dl>
                                <InfoRow label="Vendor / Bengkel" value={wo.vendor_name} />
                                <InfoRow label="Mekanik" value={wo.mechanic_name} />
                            </dl>
                        </div>
                    )}

                    {/* Notes */}
                    {wo.notes && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-2 font-semibold text-gray-900">Catatan</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{wo.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                title="Hapus Work Order"
                description={`Yakin ingin menghapus work order "${wo.reference_number} — ${wo.title}"?`}
                processing={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </DynamicLayout>
    );
}
