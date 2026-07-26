import DynamicLayout from '@/Layouts/DynamicLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    WorkOrder,
    WorkOrderItem,
    ItemType,
    getStatusBadge,
    getPriorityBadge,
    getTypeBadge,
    formatDate,
    formatDateTime,
    formatCurrency,
} from '../../../../maintenanceUtils';

interface Props {
    workOrder: WorkOrder & { actual_total_cost: number | null };
    can: { update: boolean; delete: boolean; approve: boolean };
}

type ProgressAction = {
    status: string;
    labelKey: string;
    needsApprove?: boolean;
};

const NEXT_PROGRESS: Record<string, ProgressAction | null> = {
    draft: { status: 'pending', labelKey: 'submit' },
    pending: { status: 'approved', labelKey: 'approve', needsApprove: true },
    approved: { status: 'in_progress', labelKey: 'start' },
    in_progress: { status: 'completed', labelKey: 'complete' },
    completed: null,
    cancelled: null,
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex gap-2 py-2">
        <dt className="w-40 flex-shrink-0 text-sm text-gray-500">{label}</dt>
        <dd className="text-sm font-medium text-gray-900">{value || '—'}</dd>
    </div>
);

export default function Show({ workOrder: wo, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const statusBadge = getStatusBadge(wo.status, t);
    const priorityBadge = getPriorityBadge(wo.priority, t);
    const typeBadge = getTypeBadge(wo.type, t);

    const nextProgress = NEXT_PROGRESS[wo.status] ?? null;
    const canAdvance =
        nextProgress !== null &&
        (nextProgress.needsApprove ? can.approve || can.update : can.update);
    const canCancel =
        can.update && !['completed', 'cancelled'].includes(wo.status);

    const confirmDelete = () => {
        setDeleting(true);
        router.delete(prefixedRoute('maintenance.work-orders.destroy', wo.id), {
            onSuccess: () => setShowDeleteDialog(false),
            onFinish: () => setDeleting(false),
        });
    };

    const updateStatus = (status: string) => {
        setUpdatingStatus(true);
        router.patch(
            prefixedRoute('maintenance.work-orders.update-status', wo.id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingStatus(false),
            },
        );
    };

    const partItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'part') ?? [];
    const laborItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'labor') ?? [];
    const otherItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'other') ?? [];

    const totalParts = partItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);
    const totalLabor = laborItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);
    const totalOther = otherItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);

    const itemGroups: { type: ItemType; items: WorkOrderItem[]; total: number }[] = [
        { type: 'part', items: partItems, total: totalParts },
        { type: 'labor', items: laborItems, total: totalLabor },
        { type: 'other', items: otherItems, total: totalOther },
    ];

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('maintenance.work_orders.show_title')}</h2>
                        <p className="mt-1 font-mono text-sm text-gray-500">{wo.reference_number}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {canAdvance && nextProgress && (
                            <PrimaryButton
                                type="button"
                                disabled={updatingStatus}
                                onClick={() => updateStatus(nextProgress.status)}
                            >
                                {updatingStatus
                                    ? t('maintenance.actions.saving')
                                    : t(`maintenance.work_orders.progress.${nextProgress.labelKey}`)}
                            </PrimaryButton>
                        )}
                        {canCancel && (
                            <button
                                type="button"
                                disabled={updatingStatus}
                                onClick={() => updateStatus('cancelled')}
                                className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            >
                                {t('maintenance.work_orders.progress.cancel')}
                            </button>
                        )}
                        <Link href={prefixedRoute('maintenance.work-orders.index')}>
                            <SecondaryButton>{t('maintenance.actions.back')}</SecondaryButton>
                        </Link>
                        {can.update && (
                            <Link href={prefixedRoute('maintenance.work-orders.edit', wo.id)}>
                                <SecondaryButton>{t('common.edit')}</SecondaryButton>
                            </Link>
                        )}
                        {can.delete && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                {t('common.delete')}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${t('maintenance.work_orders.show_title')} — ${wo.reference_number}`} />
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
                            <h3 className="mb-4 font-semibold text-gray-900">{t('maintenance.work_orders.details')}</h3>

                            {itemGroups
                                .filter((g) => g.items.length > 0)
                                .map((group) => (
                                    <div key={group.type} className="mb-4">
                                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            {t(`maintenance.item_type.${group.type}`)}
                                        </h4>
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="text-xs text-gray-500">
                                                    <th className="pb-1 text-left font-medium">{t('maintenance.work_orders.item_columns.name')}</th>
                                                    <th className="pb-1 text-right font-medium">{t('maintenance.work_orders.item_columns.qty')}</th>
                                                    <th className="pb-1 text-right font-medium">{t('maintenance.work_orders.item_columns.unit')}</th>
                                                    <th className="pb-1 text-right font-medium">{t('maintenance.work_orders.item_columns.price')}</th>
                                                    <th className="pb-1 text-right font-medium">{t('maintenance.work_orders.item_columns.total')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.items.map((item: WorkOrderItem) => (
                                                    <tr key={item.id}>
                                                        <td className="py-1.5 text-sm text-gray-900">{item.name}</td>
                                                        <td className="py-1.5 text-right text-sm text-gray-700">{item.quantity}</td>
                                                        <td className="py-1.5 text-right text-sm text-gray-500">{item.unit ?? '—'}</td>
                                                        <td className="py-1.5 text-right text-sm text-gray-700">{formatCurrency(item.unit_price, localeTag)}</td>
                                                        <td className="py-1.5 text-right text-sm font-medium text-gray-900">{formatCurrency(item.total_price, localeTag)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-gray-200">
                                                    <td colSpan={4} className="pt-2 text-right text-xs text-gray-500">
                                                        {t('maintenance.work_orders.subtotal', { label: t(`maintenance.item_type.${group.type}`) })}
                                                    </td>
                                                    <td className="pt-2 text-right text-sm font-semibold text-gray-900">{formatCurrency(group.total, localeTag)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ))}

                            <div className="mt-4 border-t-2 border-gray-300 pt-3 flex justify-end">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">{t('maintenance.work_orders.grand_total')}</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {formatCurrency(totalParts + totalLabor + totalOther, localeTag)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resolution notes */}
                    {wo.resolution_notes && (
                        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                            <h3 className="mb-2 font-semibold text-green-800">{t('maintenance.work_orders.resolution_notes')}</h3>
                            <p className="text-sm text-green-700 whitespace-pre-line">{wo.resolution_notes}</p>
                        </div>
                    )}
                </div>

                {/* Right: details */}
                <div className="space-y-6">
                    {/* Vehicle card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-3 font-semibold text-gray-900">{t('maintenance.work_orders.columns.vehicle')}</h3>
                        <p className="font-medium text-gray-900">{wo.vehicle?.name}</p>
                        <p className="text-sm text-gray-500">{wo.vehicle?.plate_number}</p>
                        {wo.odometer_at_service && (
                            <p className="mt-1 text-sm text-gray-500">
                                {t('maintenance.work_orders.odometer_hint', {
                                    value: new Intl.NumberFormat(localeTag).format(wo.odometer_at_service),
                                })}
                            </p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-3 font-semibold text-gray-900">{t('maintenance.work_orders.timeline')}</h3>
                        <dl>
                            <InfoRow label={t('maintenance.work_orders.schedule')} value={formatDate(wo.scheduled_date, localeTag)} />
                            <InfoRow label={t('maintenance.work_orders.started')} value={formatDateTime(wo.started_at, localeTag)} />
                            <InfoRow label={t('maintenance.work_orders.completed')} value={formatDateTime(wo.completed_at, localeTag)} />
                            <InfoRow label={t('maintenance.work_orders.approved_by')} value={wo.approver?.name} />
                            <InfoRow label={t('maintenance.work_orders.created_by')} value={wo.creator?.name} />
                        </dl>
                    </div>

                    {/* Cost */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-3 font-semibold text-gray-900">{t('maintenance.work_orders.costs')}</h3>
                        <dl>
                            <InfoRow label={t('maintenance.work_orders.estimate')} value={formatCurrency(wo.estimated_cost, localeTag)} />
                            <InfoRow label={t('maintenance.work_orders.labor_actual')} value={formatCurrency(wo.actual_labor_cost, localeTag)} />
                            <InfoRow label={t('maintenance.work_orders.parts')} value={formatCurrency(wo.actual_parts_cost, localeTag)} />
                            <InfoRow label={t('maintenance.work_orders.invoice_number')} value={wo.invoice_number} />
                        </dl>
                        {wo.actual_total_cost !== null && (
                            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-center">
                                <p className="text-xs text-gray-500">{t('maintenance.work_orders.actual_total')}</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(wo.actual_total_cost, localeTag)}</p>
                            </div>
                        )}
                    </div>

                    {/* Vendor */}
                    {(wo.vendor_name || wo.mechanic_name) && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-3 font-semibold text-gray-900">{t('maintenance.work_orders.workshop')}</h3>
                            <dl>
                                <InfoRow label={t('maintenance.work_orders.vendor_label')} value={wo.vendor_name} />
                                <InfoRow label={t('maintenance.work_orders.mechanic')} value={wo.mechanic_name} />
                            </dl>
                        </div>
                    )}

                    {/* Notes */}
                    {wo.notes && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-2 font-semibold text-gray-900">{t('maintenance.work_orders.notes')}</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{wo.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                title={t('maintenance.work_orders.delete_title')}
                message={t('maintenance.work_orders.delete_confirm', {
                    ref: wo.reference_number,
                    title: wo.title,
                })}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => setShowDeleteDialog(false)}
            />
        </DynamicLayout>
    );
}
