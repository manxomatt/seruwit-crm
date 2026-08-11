import DynamicLayout from '@/Layouts/DynamicLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    WorkOrder,
    WorkOrderVehicle,
    getStatusBadge,
    getPriorityBadge,
    getTypeBadge,
    formatDate,
    formatCurrency,
    statusOptions,
    priorityOptions,
} from '../../../../maintenanceUtils';
import PageHeader from '@/Components/PageHeader';

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

const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';

const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-red-600 transition data-[focus]:bg-red-50 data-[focus]:text-red-700';

export default function Index({ workOrders, vehicles, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
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
                <PageHeader
                    title={t('maintenance.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('maintenance.work-orders.create')}>
                            <PrimaryButton>{t('maintenance.work_orders.new')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('maintenance.work_orders.head')} />
            <MaintenanceNav />

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <TextInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('maintenance.work_orders.search_placeholder')}
                        className="w-72"
                    />
                    <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                </form>

                <Select
                    className="w-44"
                    value={filters.status ?? ''}
                    onChange={(val) => applyFilters({ status: val || undefined })}
                    placeholder={t('maintenance.status.all')}
                    options={[
                        { value: '', label: t('maintenance.status.all') },
                        ...statusOptions(t),
                    ]}
                />

                <Select
                    className="w-44"
                    value={filters.priority ?? ''}
                    onChange={(val) => applyFilters({ priority: val || undefined })}
                    placeholder={t('maintenance.priority.all')}
                    options={[
                        { value: '', label: t('maintenance.priority.all') },
                        ...priorityOptions(t),
                    ]}
                />

                <Select
                    className="w-64"
                    value={filters.vehicle_id ?? ''}
                    onChange={(val) => applyFilters({ vehicle_id: val || undefined })}
                    searchable
                    placeholder={t('maintenance.work_orders.all_vehicles')}
                    options={[
                        { value: '', label: t('maintenance.work_orders.all_vehicles') },
                        ...vehicles.map((v) => ({
                            value: String(v.id),
                            label: `${v.name} — ${v.plate_number}`,
                        })),
                    ]}
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-3 text-sm text-gray-500">
                    {t('maintenance.work_orders.found', { count: workOrders.total })}
                </div>

                {workOrders.data.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        <p className="text-sm">{t('maintenance.work_orders.empty')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.work_orders.columns.reference')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.work_orders.columns.vehicle')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.work_orders.columns.job')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.work_orders.columns.status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.work_orders.columns.schedule')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.work_orders.columns.estimate')}</th>
                                    <th className="w-28 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        <span className="sr-only">{t('common.actions')}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {workOrders.data.map((wo) => {
                                    const statusBadge = getStatusBadge(wo.status, t);
                                    const priorityBadge = getPriorityBadge(wo.priority, t);
                                    const typeBadge = getTypeBadge(wo.type, t);
                                    return (
                                        <tr key={wo.id} className="group hover:bg-gray-50">
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
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge.classes}`}>{typeBadge.label}</span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.classes}`}>{statusBadge.label}</span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {formatDate(wo.scheduled_date, localeTag)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {formatCurrency(wo.estimated_cost, localeTag)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton
                                                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                                        title={t('common.actions')}
                                                        aria-label={t('common.actions')}
                                                    >
                                                        <EllipsisVerticalIcon />
                                                    </MenuButton>

                                                    <MenuItems
                                                        transition
                                                        anchor="bottom end"
                                                        className="z-50 w-52 origin-top-right rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                <span className="text-gray-500">
                                                                    <EyeIcon />
                                                                </span>
                                                                {t('common.view', undefined, 'View')}
                                                            </Link>
                                                        </MenuItem>
                                                        {can.update && (
                                                            <MenuItem>
                                                                <Link
                                                                    href={prefixedRoute('maintenance.work-orders.edit', wo.id)}
                                                                    className={menuItemClassName}
                                                                >
                                                                    <span className="text-indigo-600">
                                                                        <PencilIcon />
                                                                    </span>
                                                                    {t('common.edit')}
                                                                </Link>
                                                            </MenuItem>
                                                        )}
                                                        {(can.update || can.delete) && (
                                                            <div className="my-1 border-t border-gray-100" />
                                                        )}
                                                        {can.delete && (
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeletingWo(wo)}
                                                                    className={menuItemDangerClassName}
                                                                >
                                                                    <TrashIcon />
                                                                    {t('common.delete')}
                                                                </button>
                                                            </MenuItem>
                                                        )}
                                                    </MenuItems>
                                                </Menu>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {workOrders.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-200 px-6 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (workOrders.current_page - 1) * workOrders.per_page + 1,
                                to: Math.min(workOrders.current_page * workOrders.per_page, workOrders.total),
                                total: workOrders.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {workOrders.links.map((link, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded px-3 py-1 text-sm ${link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                            ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                            : 'cursor-not-allowed bg-gray-100 text-gray-400'
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
                title={t('maintenance.work_orders.delete_title')}
                message={t('maintenance.work_orders.delete_confirm', {
                    ref: deletingWo?.reference_number ?? '',
                    title: deletingWo?.title ?? '',
                })}
                processing={processing}
                onConfirm={confirmDelete}
                onClose={() => setDeletingWo(null)}
            />
        </DynamicLayout>
    );
}
