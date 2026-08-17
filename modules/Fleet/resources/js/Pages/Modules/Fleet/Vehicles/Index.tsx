import DynamicLayout from '@/Layouts/DynamicLayout';
import ColumnVisibilityMenu, {
    buildColumnVisibility,
    type ColumnDef,
} from '@/Components/ColumnVisibilityMenu';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
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
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        case 'maintenance':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        case 'out_of_service':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
        case 'retired':
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
    }
};

const SearchIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
    const hasActiveFilters = Boolean(filters.search || filters.status);
    const selectionMode = canBatch && selected.length > 0;

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

    useEffect(() => {
        setSearch(filters.search || '');
    }, [filters.search]);

    const applyFilters = (next: { search?: string; status?: string | null }) => {
        router.get(
            prefixedRoute('fleet.vehicles.index'),
            {
                search: (next.search ?? search) || undefined,
                status: (next.status !== undefined ? next.status : filters.status) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleStatusFilter = (status: string) => {
        applyFilters({ status: status || null });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(prefixedRoute('fleet.vehicles.index'), {}, { preserveState: true, replace: true });
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

    const statusPills = [
        { value: '', label: t('fleet.vehicles.all_statuses') },
        ...STATUSES.map((status) => ({
            value: status,
            label: t(`fleet.status.${status}`),
        })),
    ];

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

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-5">
                    {selectionMode ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                                {t('fleet.vehicles.batch_selected', { count: selected.length })}
                            </span>

                            {can.update && (
                                <div className="flex items-center gap-1.5">
                                    <Select
                                        className="!py-1.5 text-sm"
                                        value={batchStatus}
                                        onChange={setBatchStatus}
                                        placeholder={t('fleet.vehicles.batch_status_placeholder')}
                                        options={STATUSES.map((status) => ({
                                            value: status,
                                            label: t(`fleet.status.${status}`),
                                        }))}
                                    />
                                    <button
                                        type="button"
                                        onClick={applyBatchStatus}
                                        disabled={!batchStatus || processing}
                                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {t('fleet.vehicles.batch_apply_status')}
                                    </button>
                                </div>
                            )}

                            <div className="ml-auto flex items-center gap-1.5">
                                {can.delete && (
                                    <button
                                        type="button"
                                        onClick={() => setShowBatchDeleteDialog(true)}
                                        disabled={processing}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                                    >
                                        <TrashIcon />
                                        {t('fleet.vehicles.batch_delete')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    title={t('fleet.vehicles.batch_clear')}
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[200px] flex-1">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                        <SearchIcon />
                                    </span>
                                    <TextInput
                                        type="search"
                                        placeholder={t('fleet.vehicles.search')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full !py-2 pl-9 text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    {t('common.search')}
                                </button>
                                <ColumnVisibilityMenu
                                    columns={columnDefs}
                                    visible={visibleColumns}
                                    onChange={setVisibleColumns}
                                    label={t('fleet.vehicles.columns_menu')}
                                    requiredHint={t('fleet.vehicles.columns_required_hint')}
                                    iconOnly
                                />
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    >
                                        <CloseIcon />
                                        {t('fleet.vehicles.clear_filters')}
                                    </button>
                                )}
                            </form>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {statusPills.map((pill) => {
                                    const active = (filters.status || '') === pill.value;

                                    return (
                                        <button
                                            key={pill.value || 'all'}
                                            type="button"
                                            onClick={() => handleStatusFilter(pill.value)}
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${active
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                                }`}
                                        >
                                            {pill.label}
                                        </button>
                                    );
                                })}
                                <span className="ml-auto text-xs tabular-nums text-gray-400">
                                    {t('common.showing_results', {
                                        from: vehicles.total === 0 ? 0 : (vehicles.current_page - 1) * vehicles.per_page + 1,
                                        to: Math.min(vehicles.current_page * vehicles.per_page, vehicles.total),
                                        total: vehicles.total,
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {vehicles.data.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <h3 className="text-sm font-medium text-gray-900">{t('fleet.vehicles.empty')}</h3>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                {t('fleet.vehicles.clear_filters')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        {canBatch && (
                                            <th className="w-10 px-3 py-2.5">
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
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.vehicles.columns.photo')}
                                            </th>
                                        )}
                                        {visibleColumns.name && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.vehicles.columns.name')}
                                            </th>
                                        )}
                                        {visibleColumns.plate_number && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.vehicles.columns.plate_number')}
                                            </th>
                                        )}
                                        {visibleColumns.model_year && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.vehicles.columns.model_year')}
                                            </th>
                                        )}
                                        {visibleColumns.color && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.vehicles.columns.color')}
                                            </th>
                                        )}
                                        {visibleColumns.type && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.vehicles.columns.type')}
                                            </th>
                                        )}
                                        {visibleColumns.odometer && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.vehicles.columns.odometer')}
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.vehicles.columns.status')}
                                            </th>
                                        )}
                                        <th className="w-24 px-3 py-2.5">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vehicles.data.map((vehicle) => {
                                        const isSelected = selected.includes(vehicle.id);

                                        return (
                                            <tr
                                                key={vehicle.id}
                                                className={`group transition-colors hover:bg-gray-50/80 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                {canBatch && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
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
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        {vehicle.photo_url ? (
                                                            <img
                                                                src={vehicle.photo_url}
                                                                alt={vehicle.name}
                                                                className="h-9 w-12 rounded-md object-cover ring-1 ring-gray-200"
                                                            />
                                                        ) : (
                                                            <span className="inline-flex h-9 w-12 items-center justify-center rounded-md bg-gray-100 text-[10px] text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.name && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <Link
                                                            href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                            className="text-sm font-medium text-gray-900 hover:text-indigo-700"
                                                        >
                                                            {vehicle.name}
                                                        </Link>
                                                        {vehicle.brand && <div className="text-xs text-gray-500">{vehicle.brand}</div>}
                                                    </td>
                                                )}
                                                {visibleColumns.plate_number && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-sm text-gray-800">
                                                        {vehicle.plate_number}
                                                    </td>
                                                )}
                                                {visibleColumns.model_year && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {vehicle.model_year ?? '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.color && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {vehicle.color || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.type && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm capitalize text-gray-500">
                                                        {vehicle.type}
                                                    </td>
                                                )}
                                                {visibleColumns.odometer && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm tabular-nums text-gray-500">
                                                        {vehicle.odometer_km.toLocaleString()} km
                                                    </td>
                                                )}
                                                {visibleColumns.status && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(vehicle.status)}`}>
                                                            {t(`fleet.status.${vehicle.status}`)}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right">
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
                                                                    href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
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
                                                                        href={prefixedRoute('fleet.vehicles.edit', vehicle.id)}
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
                                                                        onClick={() => openDeleteDialog(vehicle)}
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

                        {vehicles.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
                                <p className="text-xs text-gray-500">
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
                                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${link.active
                                                ? 'bg-gray-900 text-white'
                                                : link.url
                                                    ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                    : 'cursor-not-allowed text-gray-300'
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
