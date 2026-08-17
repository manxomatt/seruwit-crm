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

interface Manager {
    id: number;
    name: string;
    email: string;
}

interface FleetBaseRow {
    id: number;
    code: string;
    name: string;
    kind: string;
    status: string;
    city: string | null;
    phone: string | null;
    vehicles_count: number;
    manager: Manager | null;
}

interface PaginatedBases {
    data: FleetBaseRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    kind: string | null;
}

interface Props {
    bases: PaginatedBases;
    filters: Filters;
    kinds: string[];
    can: { create: boolean; update: boolean; delete: boolean };
}

type BaseColumn = 'code' | 'name' | 'kind' | 'city' | 'phone' | 'manager' | 'vehicles' | 'status';

const STORAGE_KEY = 'fleet.bases.list.visibleColumns.v1';

const BASE_COLUMN_KEYS: Array<{ key: BaseColumn; required?: boolean; defaultVisible?: boolean }> = [
    { key: 'code', required: true },
    { key: 'name', required: true },
    { key: 'kind', defaultVisible: true },
    { key: 'city', defaultVisible: true },
    { key: 'phone', defaultVisible: false },
    { key: 'manager', defaultVisible: true },
    { key: 'vehicles', defaultVisible: true },
    { key: 'status', defaultVisible: true },
];

const STATUSES = ['active', 'inactive'];

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
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

function FilterSegment({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
}): JSX.Element {
    return (
        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {label}
            </span>
            <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5">
                {options.map((option) => {
                    const active = value === option.value;

                    return (
                        <button
                            key={option.value || `${label}-all`}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${active
                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function readStoredColumns(): Partial<Record<BaseColumn, boolean>> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<Record<BaseColumn, boolean>>;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export default function Index({ bases, filters, kinds, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [baseToDelete, setBaseToDelete] = useState<FleetBaseRow | null>(null);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [batchStatus, setBatchStatus] = useState('');

    const canBatch = can.update || can.delete;
    const pageIds = useMemo(() => bases.data.map((base) => base.id), [bases.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));
    const hasActiveFilters = Boolean(filters.search || filters.status || filters.kind);
    const selectionMode = canBatch && selected.length > 0;

    const columnDefs = useMemo<Array<ColumnDef<BaseColumn>>>(
        () =>
            BASE_COLUMN_KEYS.map((column) => ({
                ...column,
                label: t(`fleet.bases.columns.${column.key}`),
            })),
        [t],
    );

    const [visibleColumns, setVisibleColumns] = useState<Record<BaseColumn, boolean>>(() =>
        buildColumnVisibility(BASE_COLUMN_KEYS, typeof window !== 'undefined' ? readStoredColumns() : null),
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

    const applyFilters = (next: { search?: string; status?: string | null; kind?: string | null }) => {
        router.get(
            prefixedRoute('fleet.bases.index'),
            {
                search: (next.search ?? search) || undefined,
                status: (next.status !== undefined ? next.status : filters.status) || undefined,
                kind: (next.kind !== undefined ? next.kind : filters.kind) || undefined,
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

    const handleKindFilter = (kind: string) => {
        applyFilters({ kind: kind || null });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(prefixedRoute('fleet.bases.index'), {}, { preserveState: true, replace: true });
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

    const openDeleteDialog = (base: FleetBaseRow) => {
        setBaseToDelete(base);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setBaseToDelete(null);
    };

    const confirmDelete = () => {
        if (!baseToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.bases.destroy', baseToDelete.id), {
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
            prefixedRoute('fleet.bases.batch-status'),
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
            prefixedRoute('fleet.bases.batch-destroy'),
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

    const statusOptions = [
        { value: '', label: t('fleet.bases.all_statuses') },
        ...STATUSES.map((status) => ({
            value: status,
            label: t(`fleet.status.${status}`),
        })),
    ];

    const kindOptions = [
        { value: '', label: t('fleet.bases.all_kinds') },
        ...kinds.map((kind) => ({
            value: kind,
            label: t(`fleet.base_kinds.${kind}`),
        })),
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('fleet.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('fleet.bases.create')}>
                            <PrimaryButton>{t('fleet.bases.add')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('fleet.bases.title')} />

            <FleetNav />

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-5">
                    {selectionMode ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                                {t('fleet.bases.batch_selected', { count: selected.length })}
                            </span>

                            {can.update && (
                                <div className="flex items-center gap-1.5">
                                    <Select
                                        className="!py-1.5 text-sm"
                                        value={batchStatus}
                                        onChange={setBatchStatus}
                                        placeholder={t('fleet.bases.batch_status_placeholder')}
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
                                        {t('fleet.bases.batch_apply_status')}
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
                                        {t('fleet.bases.batch_delete')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    title={t('fleet.bases.batch_clear')}
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
                                        placeholder={t('fleet.bases.search')}
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
                                    label={t('fleet.bases.columns_menu')}
                                    requiredHint={t('fleet.bases.columns_required_hint')}
                                    iconOnly
                                />
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    >
                                        <CloseIcon />
                                        {t('fleet.bases.clear_filters')}
                                    </button>
                                )}
                            </form>

                            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                                    <FilterSegment
                                        label={t('fleet.bases.filter_status')}
                                        options={statusOptions}
                                        value={filters.status || ''}
                                        onChange={handleStatusFilter}
                                    />
                                    <div className="hidden h-5 w-px bg-gray-200 sm:block" aria-hidden />
                                    <FilterSegment
                                        label={t('fleet.bases.filter_kind')}
                                        options={kindOptions}
                                        value={filters.kind || ''}
                                        onChange={handleKindFilter}
                                    />
                                </div>
                                <span className="shrink-0 text-xs tabular-nums text-gray-400">
                                    {t('common.showing_results', {
                                        from: bases.total === 0 ? 0 : (bases.current_page - 1) * bases.per_page + 1,
                                        to: Math.min(bases.current_page * bases.per_page, bases.total),
                                        total: bases.total,
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {bases.data.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <h3 className="text-sm font-medium text-gray-900">{t('fleet.bases.empty')}</h3>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                {t('fleet.bases.clear_filters')}
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
                                                    aria-label={t('fleet.bases.batch_selected', { count: pageIds.length })}
                                                />
                                            </th>
                                        )}
                                        {visibleColumns.code && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.bases.columns.code')}
                                            </th>
                                        )}
                                        {visibleColumns.name && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.bases.columns.name')}
                                            </th>
                                        )}
                                        {visibleColumns.kind && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.bases.columns.kind')}
                                            </th>
                                        )}
                                        {visibleColumns.city && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.bases.columns.city')}
                                            </th>
                                        )}
                                        {visibleColumns.phone && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.bases.columns.phone')}
                                            </th>
                                        )}
                                        {visibleColumns.manager && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.bases.columns.manager')}
                                            </th>
                                        )}
                                        {visibleColumns.vehicles && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.bases.columns.vehicles')}
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.bases.columns.status')}
                                            </th>
                                        )}
                                        <th className="w-24 px-3 py-2.5">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bases.data.map((base) => {
                                        const isSelected = selected.includes(base.id);

                                        return (
                                            <tr
                                                key={base.id}
                                                className={`group transition-colors hover:bg-gray-50/80 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                {canBatch && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={isSelected}
                                                            onChange={() => toggleRow(base.id)}
                                                            aria-label={base.name}
                                                        />
                                                    </td>
                                                )}
                                                {visibleColumns.code && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-sm text-gray-800">
                                                        {base.code}
                                                    </td>
                                                )}
                                                {visibleColumns.name && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <Link
                                                            href={prefixedRoute('fleet.bases.show', base.id)}
                                                            className="text-sm font-medium text-gray-900 hover:text-indigo-700"
                                                        >
                                                            {base.name}
                                                        </Link>
                                                    </td>
                                                )}
                                                {visibleColumns.kind && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {t(`fleet.base_kinds.${base.kind}`)}
                                                    </td>
                                                )}
                                                {visibleColumns.city && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {base.city || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.phone && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {base.phone || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.manager && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {base.manager?.name || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.vehicles && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm tabular-nums text-gray-500">
                                                        {base.vehicles_count}
                                                    </td>
                                                )}
                                                {visibleColumns.status && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(base.status)}`}>
                                                            {t(`fleet.status.${base.status}`)}
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
                                                                    href={prefixedRoute('fleet.bases.show', base.id)}
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
                                                                        href={prefixedRoute('fleet.bases.edit', base.id)}
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
                                                                        onClick={() => openDeleteDialog(base)}
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

                        {bases.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
                                <p className="text-xs text-gray-500">
                                    {t('common.showing_results', {
                                        from: (bases.current_page - 1) * bases.per_page + 1,
                                        to: Math.min(bases.current_page * bases.per_page, bases.total),
                                        total: bases.total,
                                    })}
                                </p>
                                <div className="flex gap-1">
                                    {bases.links.map((link, index) => (
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
                    baseToDelete
                        ? t('fleet.bases.delete_confirm', { name: baseToDelete.name })
                        : undefined
                }
            />

            <ConfirmDeleteDialog
                show={showBatchDeleteDialog}
                onClose={() => !processing && setShowBatchDeleteDialog(false)}
                onConfirm={confirmBatchDelete}
                processing={processing}
                message={t('fleet.bases.batch_delete_confirm', { count: selected.length })}
            />
        </DynamicLayout>
    );
}
