import DynamicLayout from '@/Layouts/DynamicLayout';
import ColumnVisibilityMenu, {
    buildColumnVisibility,
    type ColumnDef,
} from '@/Components/ColumnVisibilityMenu';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState, FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';
import PageHeader from '@/Components/PageHeader';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    brand: string | null;
    model_year: number | null;
    color: string | null;
    photo_url: string | null;
    status: string;
    odometer_km: number;
}

interface PaginatedVehicles {
    data: Vehicle[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
}

interface Props {
    vehicles: PaginatedVehicles;
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

type VehicleColumn = 'photo' | 'name' | 'plate_number' | 'model_year' | 'color' | 'type' | 'odometer' | 'status';

const STORAGE_KEY = 'fleet.vehicles.list.visibleColumns';

const VEHICLE_COLUMN_KEYS: Array<{ key: VehicleColumn; required?: boolean; defaultVisible?: boolean }> = [
    { key: 'photo', defaultVisible: true },
    { key: 'name', required: true },
    { key: 'plate_number', required: true },
    { key: 'model_year', defaultVisible: false },
    { key: 'color', defaultVisible: false },
    { key: 'type', defaultVisible: true },
    { key: 'odometer', defaultVisible: true },
    { key: 'status', defaultVisible: true },
];

const STATUSES = ['active', 'maintenance', 'retired', 'out_of_service'];

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'maintenance':
            return 'bg-yellow-100 text-yellow-800';
        case 'out_of_service':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

function readStoredColumns(): Partial<Record<VehicleColumn, boolean>> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<Record<VehicleColumn, boolean>>;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export default function Index({ vehicles, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [batchStatus, setBatchStatus] = useState('');

    const canBatch = can.update || can.delete;
    const pageIds = useMemo(() => vehicles.data.map((vehicle) => vehicle.id), [vehicles.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));

    const columnDefs = useMemo<Array<ColumnDef<VehicleColumn>>>(
        () =>
            VEHICLE_COLUMN_KEYS.map((column) => ({
                ...column,
                label: t(`fleet.vehicles.columns.${column.key}`),
            })),
        [t],
    );

    const [visibleColumns, setVisibleColumns] = useState<Record<VehicleColumn, boolean>>(() =>
        buildColumnVisibility(VEHICLE_COLUMN_KEYS, typeof window !== 'undefined' ? readStoredColumns() : null),
    );

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        setSelected((prev) => prev.filter((id) => pageIds.includes(id)));
    }, [pageIds]);

    const visibleDataColumnCount = columnDefs.filter((column) => visibleColumns[column.key]).length;

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('fleet.vehicles.index'), {
            search: search || undefined,
            status: filters.status || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(prefixedRoute('fleet.vehicles.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    const toggleRow = (id: number) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
    };

    const toggleAllOnPage = () => {
        setSelected((prev) => {
            if (allPageSelected) {
                return prev.filter((id) => !pageIds.includes(id));
            }

            return Array.from(new Set([...prev, ...pageIds]));
        });
    };

    const clearSelection = () => {
        setSelected([]);
        setBatchStatus('');
    };

    const openDeleteDialog = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setVehicleToDelete(null);
    };

    const confirmDelete = () => {
        if (!vehicleToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.vehicles.destroy', vehicleToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const applyBatchStatus = () => {
        if (!can.update || selected.length === 0 || !batchStatus) {
            return;
        }

        setProcessing(true);
        router.patch(
            prefixedRoute('fleet.vehicles.batch-status'),
            { ids: selected, status: batchStatus },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmBatchDelete = () => {
        if (!can.delete || selected.length === 0) {
            return;
        }

        setProcessing(true);
        router.post(
            prefixedRoute('fleet.vehicles.batch-destroy'),
            { ids: selected },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowBatchDeleteDialog(false);
                    clearSelection();
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('fleet.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('fleet.vehicles.create')}>
                            <PrimaryButton>{t('fleet.vehicles.add')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('fleet.vehicles.title')} />

            <FleetNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap items-end gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('fleet.vehicles.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.status || ''}
                            onChange={handleStatusFilter}
                            placeholder={t('fleet.vehicles.all_statuses')}
                            options={[
                                { value: '', label: t('fleet.vehicles.all_statuses') },
                                ...STATUSES.map((status) => ({
                                    value: status,
                                    label: t(`fleet.status.${status}`),
                                })),
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                        <ColumnVisibilityMenu
                            columns={columnDefs}
                            visible={visibleColumns}
                            onChange={setVisibleColumns}
                            label={t('fleet.vehicles.columns_menu')}
                            requiredHint={t('fleet.vehicles.columns_required_hint')}
                        />
                    </form>

                    {canBatch && selected.length > 0 && (
                        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50/70 px-4 py-3">
                            <p className="text-sm font-medium text-indigo-900">
                                {t('fleet.vehicles.batch_selected', { count: selected.length })}
                            </p>
                            {can.update && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        className="w-48"
                                        value={batchStatus}
                                        onChange={setBatchStatus}
                                        placeholder={t('fleet.vehicles.batch_status_placeholder')}
                                        options={STATUSES.map((status) => ({
                                            value: status,
                                            label: t(`fleet.status.${status}`),
                                        }))}
                                    />
                                    <PrimaryButton
                                        type="button"
                                        onClick={applyBatchStatus}
                                        disabled={!batchStatus || processing}
                                    >
                                        {t('fleet.vehicles.batch_apply_status')}
                                    </PrimaryButton>
                                </div>
                            )}
                            {can.delete && (
                                <button
                                    type="button"
                                    onClick={() => setShowBatchDeleteDialog(true)}
                                    disabled={processing}
                                    className="inline-flex items-center rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                >
                                    {t('fleet.vehicles.batch_delete')}
                                </button>
                            )}
                            <SecondaryButton type="button" onClick={clearSelection}>
                                {t('fleet.vehicles.batch_clear')}
                            </SecondaryButton>
                        </div>
                    )}

                    {vehicles.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('fleet.vehicles.empty')}</h3>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {canBatch && (
                                                <th className="w-10 px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={allPageSelected}
                                                        ref={(input) => {
                                                            if (input) {
                                                                input.indeterminate = somePageSelected && !allPageSelected;
                                                            }
                                                        }}
                                                        onChange={toggleAllOnPage}
                                                        aria-label={t('fleet.vehicles.batch_selected', { count: pageIds.length })}
                                                    />
                                                </th>
                                            )}
                                            {visibleColumns.photo && (
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    {t('fleet.vehicles.columns.photo')}
                                                </th>
                                            )}
                                            {visibleColumns.name && (
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    {t('fleet.vehicles.columns.name')}
                                                </th>
                                            )}
                                            {visibleColumns.plate_number && (
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    {t('fleet.vehicles.columns.plate_number')}
                                                </th>
                                            )}
                                            {visibleColumns.model_year && (
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    {t('fleet.vehicles.columns.model_year')}
                                                </th>
                                            )}
                                            {visibleColumns.color && (
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    {t('fleet.vehicles.columns.color')}
                                                </th>
                                            )}
                                            {visibleColumns.type && (
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    {t('fleet.vehicles.columns.type')}
                                                </th>
                                            )}
                                            {visibleColumns.odometer && (
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    {t('fleet.vehicles.columns.odometer')}
                                                </th>
                                            )}
                                            {visibleColumns.status && (
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    {t('fleet.vehicles.columns.status')}
                                                </th>
                                            )}
                                            <th className="w-28 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                <span className="sr-only">{t('common.actions')}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {vehicles.data.map((vehicle) => {
                                            const isSelected = selected.includes(vehicle.id);

                                            return (
                                                <tr
                                                    key={vehicle.id}
                                                    className={`group hover:bg-gray-50 ${isSelected ? 'bg-indigo-50/40' : ''}`}
                                                >
                                                    {canBatch && (
                                                        <td className="whitespace-nowrap px-4 py-4">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                checked={isSelected}
                                                                onChange={() => toggleRow(vehicle.id)}
                                                                aria-label={vehicle.name}
                                                            />
                                                        </td>
                                                    )}
                                                    {visibleColumns.photo && (
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            {vehicle.photo_url ? (
                                                                <img
                                                                    src={vehicle.photo_url}
                                                                    alt={vehicle.name}
                                                                    className="h-10 w-14 rounded object-cover"
                                                                />
                                                            ) : (
                                                                <span className="inline-flex h-10 w-14 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {visibleColumns.name && (
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                                                            {vehicle.brand && <div className="text-xs text-gray-500">{vehicle.brand}</div>}
                                                        </td>
                                                    )}
                                                    {visibleColumns.plate_number && (
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{vehicle.plate_number}</td>
                                                    )}
                                                    {visibleColumns.model_year && (
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {vehicle.model_year ?? '—'}
                                                        </td>
                                                    )}
                                                    {visibleColumns.color && (
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {vehicle.color || '—'}
                                                        </td>
                                                    )}
                                                    {visibleColumns.type && (
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-500">{vehicle.type}</td>
                                                    )}
                                                    {visibleColumns.odometer && (
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{vehicle.odometer_km.toLocaleString()} km</td>
                                                    )}
                                                    {visibleColumns.status && (
                                                        <td className="whitespace-nowrap px-6 py-4">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(vehicle.status)}`}>
                                                                {t(`fleet.status.${vehicle.status}`)}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                                                            <Link
                                                                href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                                className="text-gray-600 hover:text-gray-900"
                                                                title={t('common.view', undefined, 'View')}
                                                            >
                                                                <EyeIcon />
                                                            </Link>
                                                            {can.update && (
                                                                <Link
                                                                    href={prefixedRoute('fleet.vehicles.edit', vehicle.id)}
                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                    title={t('common.edit')}
                                                                >
                                                                    <PencilIcon />
                                                                </Link>
                                                            )}
                                                            {can.delete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteDialog(vehicle)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title={t('common.delete')}
                                                                >
                                                                    <TrashIcon />
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

                            <p className="mt-2 text-xs text-gray-400">
                                {t('fleet.vehicles.columns_showing', { count: visibleDataColumnCount })}
                            </p>

                            {vehicles.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (vehicles.current_page - 1) * vehicles.per_page + 1,
                                            to: Math.min(vehicles.current_page * vehicles.per_page, vehicles.total),
                                            total: vehicles.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {vehicles.links.map((link, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${
                                                    link.active
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
                        </>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                message={
                    vehicleToDelete
                        ? t('fleet.vehicles.delete_confirm', { name: vehicleToDelete.name })
                        : undefined
                }
            />

            <ConfirmDeleteDialog
                show={showBatchDeleteDialog}
                onClose={() => !processing && setShowBatchDeleteDialog(false)}
                onConfirm={confirmBatchDelete}
                processing={processing}
                message={t('fleet.vehicles.batch_delete_confirm', { count: selected.length })}
            />
        </DynamicLayout>
    );
}
