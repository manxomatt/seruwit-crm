import DynamicLayout from '@/Layouts/DynamicLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import MaintenanceNav from '../../MaintenanceNav';
import {
    WorkOrder,
    WorkOrderVehicle,
    getStatusBadge,
    getPriorityBadge,
    getTypeBadge,
    formatDate,
    formatCurrency,
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
} from '../../maintenanceUtils';

interface PaginatedWorkOrders {
    data: WorkOrder[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    priority: string | null;
    vehicle_id: string | null;
}

interface Props {
    workOrders: PaginatedWorkOrders;
    vehicles: WorkOrderVehicle[];
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean; approve: boolean };
}

export default function Index({ workOrders, vehicles, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deletingWo, setDeletingWo] = useState<WorkOrder | null>(null);
    const [processing, setProcessing] = useState(false);

    const applyFilters = (overrides: Partial<Filters> = {}) => {
        const merged = { ...filters, search: search || undefined, ...overrides };
        router.get(prefixedRoute('maintenance.work-orders.index'), merged as Record<string, string>, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const confirmDelete = () => {
        if (!deletingWo) return;
        setProcessing(true);
        router.delete(prefixedRoute('maintenance.work-orders.destroy', deletingWo.id), {
            onSuccess: () => setDeletingWo(null),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Maintenance</h2>
                    {can.create && (
                        <Link href={prefixedRoute('maintenance.work-orders.create')}>
                            <PrimaryButton>+ Work Order Baru</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Work Orders" />
            <MaintenanceNav />

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <TextInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari referensi, judul, kendaraan..."
                        className="w-72"
                    />
                    <PrimaryButton type="submit">Cari</PrimaryButton>
                </form>

                <select
                    value={filters.status ?? ''}
                    onChange={(e) => applyFilters({ status: e.target.value || undefined })}
                    className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Semua Status</option>
                    {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <select
                    value={filters.priority ?? ''}
                    onChange={(e) => applyFilters({ priority: e.target.value || undefined })}
                    className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Semua Prioritas</option>
                    {PRIORITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <select
                    value={filters.vehicle_id ?? ''}
                    onChange={(e) => applyFilters({ vehicle_id: e.target.value || undefined })}
                    className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Semua Kendaraan</option>
                    {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.name} — {v.plate_number}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-3 text-sm text-gray-500">
                    {workOrders.total} work order ditemukan
                </div>

                {workOrders.data.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        <p className="text-sm">Tidak ada work order</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Referensi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kendaraan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pekerjaan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Jadwal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estimasi</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {workOrders.data.map((wo) => {
                                    const statusBadge = getStatusBadge(wo.status);
                                    const priorityBadge = getPriorityBadge(wo.priority);
                                    return (
                                        <tr key={wo.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: wo.category?.color ?? '#6B7280' }}
                                                    />
                                                    <span className="font-mono text-xs text-gray-600">{wo.reference_number}</span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                <p className="font-medium">{wo.vehicle?.name}</p>
                                                <p className="text-gray-400">{wo.vehicle?.plate_number}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="max-w-xs truncate text-sm font-medium text-gray-900">{wo.title}</p>
                                                <div className="mt-1 flex gap-1">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge.classes}`}>{priorityBadge.label}</span>
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadge(wo.type).classes}`}>{getTypeBadge(wo.type).label}</span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.classes}`}>{statusBadge.label}</span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {formatDate(wo.scheduled_date)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {formatCurrency(wo.estimated_cost)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                                        className="rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50"
                                                    >
                                                        Detail
                                                    </Link>
                                                    {can.update && (
                                                        <Link
                                                            href={prefixedRoute('maintenance.work-orders.edit', wo.id)}
                                                            className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
                                                        >
                                                            Edit
                                                        </Link>
                                                    )}
                                                    {can.delete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingWo(wo)}
                                                            className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                                                        >
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {workOrders.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                        <p className="text-sm text-gray-500">
                            Hal {workOrders.current_page} dari {workOrders.last_page}
                        </p>
                        <div className="flex gap-1">
                            {workOrders.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveState
                                    className={`rounded px-3 py-1.5 text-sm ${link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                            ? 'text-gray-600 hover:bg-gray-100'
                                            : 'cursor-default text-gray-300'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={!!deletingWo}
                title="Hapus Work Order"
                description={`Yakin ingin menghapus work order "${deletingWo?.reference_number} — ${deletingWo?.title}"? Tindakan ini tidak dapat dibatalkan.`}
                processing={processing}
                onConfirm={confirmDelete}
                onCancel={() => setDeletingWo(null)}
            />
        </DynamicLayout>
    );
}
