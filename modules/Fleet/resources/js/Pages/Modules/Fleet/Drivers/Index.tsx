import DynamicLayout from '@/Layouts/DynamicLayout';
import ColumnVisibilityMenu, {
    buildColumnVisibility,
    type ColumnDef,
} from '@/Components/ColumnVisibilityMenu';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatDate } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState, FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';
import PageHeader from '@/Components/PageHeader';

interface Driver {
    id: number;
    name: string;
    license_number: string;
    license_type: string | null;
    license_expires_at: string | null;
    phone: string | null;
    email: string | null;
    photo_url: string | null;
    user_id: number | null;
    status: string;
}

interface PaginatedDrivers {
    data: Driver[];
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
    drivers: PaginatedDrivers;
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

type DriverColumn =
    | 'photo'
    | 'name'
    | 'license_number'
    | 'license_type'
    | 'license_expires'
    | 'phone'
    | 'email'
    | 'login'
    | 'status';

type ExpiryTone = 'ok' | 'soon' | 'expired' | 'empty';

const STORAGE_KEY = 'fleet.drivers.list.visibleColumns.v2';

const DRIVER_COLUMN_KEYS: Array<{ key: DriverColumn; required?: boolean; defaultVisible?: boolean }> = [
    { key: 'photo', defaultVisible: true },
    { key: 'name', required: true },
    { key: 'license_number', required: true },
    { key: 'license_type', defaultVisible: true },
    { key: 'license_expires', defaultVisible: true },
    { key: 'phone', defaultVisible: true },
    { key: 'email', defaultVisible: false },
    { key: 'login', defaultVisible: false },
    { key: 'status', defaultVisible: true },
];

const STATUSES = ['available', 'on_trip', 'off_duty', 'inactive'];

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'available':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        case 'on_trip':
            return 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20';
        case 'off_duty':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        case 'inactive':
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
    }
};

function expiryTone(date: string | null): ExpiryTone {
    if (!date) {
        return 'empty';
    }

    const target = new Date(`${date}T00:00:00`);
    if (Number.isNaN(target.getTime())) {
        return 'empty';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);

    if (diffDays < 0) {
        return 'expired';
    }

    if (diffDays <= 30) {
        return 'soon';
    }

    return 'ok';
}

function expiryBadgeClass(tone: ExpiryTone): string {
    switch (tone) {
        case 'expired':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
        case 'soon':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        case 'ok':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
    }
}

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

function readStoredColumns(): Partial<Record<DriverColumn, boolean>> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<Record<DriverColumn, boolean>>;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export default function Index({ drivers, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [batchStatus, setBatchStatus] = useState('');

    const canBatch = can.update || can.delete;
    const pageIds = useMemo(() => drivers.data.map((driver) => driver.id), [drivers.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));
    const hasActiveFilters = Boolean(filters.search || filters.status);
    const selectionMode = canBatch && selected.length > 0;

    const columnDefs = useMemo<Array<ColumnDef<DriverColumn>>>(
        () =>
            DRIVER_COLUMN_KEYS.map((column) => ({
                ...column,
                label: t(`fleet.drivers.columns.${column.key}`),
            })),
        [t],
    );

    const [visibleColumns, setVisibleColumns] = useState<Record<DriverColumn, boolean>>(() =>
        buildColumnVisibility(DRIVER_COLUMN_KEYS, typeof window !== 'undefined' ? readStoredColumns() : null),
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
            prefixedRoute('fleet.drivers.index'),
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
        router.get(prefixedRoute('fleet.drivers.index'), {}, { preserveState: true, replace: true });
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

    const openDeleteDialog = (driver: Driver) => {
        setDriverToDelete(driver);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setDriverToDelete(null);
    };

    const confirmDelete = () => {
        if (!driverToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.drivers.destroy', driverToDelete.id), {
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
            prefixedRoute('fleet.drivers.batch-status'),
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
            prefixedRoute('fleet.drivers.batch-destroy'),
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

    const licenseExpiryLabel = (tone: ExpiryTone): string => {
        switch (tone) {
            case 'expired':
                return t('fleet.drivers.license_expired');
            case 'soon':
                return t('fleet.drivers.license_soon');
            case 'ok':
                return t('fleet.drivers.license_ok');
            default:
                return t('fleet.drivers.license_missing');
        }
    };

    const statusPills = [
        { value: '', label: t('fleet.drivers.all_statuses') },
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
                        <Link href={prefixedRoute('fleet.drivers.create')}>
                            <PrimaryButton>{t('fleet.drivers.add')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('fleet.drivers.title')} />

            <FleetNav />

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                    {selectionMode ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                                {t('fleet.drivers.batch_selected', { count: selected.length })}
                            </span>

                            {can.update && (
                                <div className="flex items-center gap-1.5">
                                    <Select
                                        className="!py-1.5 text-sm"
                                        value={batchStatus}
                                        onChange={setBatchStatus}
                                        placeholder={t('fleet.drivers.batch_status_placeholder')}
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
                                        {t('fleet.drivers.batch_apply_status')}
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
                                        {t('fleet.drivers.batch_delete')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    title={t('fleet.drivers.batch_clear')}
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
                                        placeholder={t('fleet.drivers.search')}
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
                                    label={t('fleet.drivers.columns_menu')}
                                    requiredHint={t('fleet.drivers.columns_required_hint')}
                                    iconOnly
                                />
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    >
                                        <CloseIcon />
                                        {t('fleet.drivers.clear_filters')}
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
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                                                active
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
                                        from: drivers.total === 0 ? 0 : (drivers.current_page - 1) * drivers.per_page + 1,
                                        to: Math.min(drivers.current_page * drivers.per_page, drivers.total),
                                        total: drivers.total,
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {drivers.data.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <h3 className="text-sm font-medium text-gray-900">{t('fleet.drivers.empty')}</h3>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                {t('fleet.drivers.clear_filters')}
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
                                                    aria-label={t('fleet.drivers.batch_selected', { count: pageIds.length })}
                                                />
                                            </th>
                                        )}
                                        {visibleColumns.photo && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.photo')}
                                            </th>
                                        )}
                                        {visibleColumns.name && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.name')}
                                            </th>
                                        )}
                                        {visibleColumns.license_number && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.license_number')}
                                            </th>
                                        )}
                                        {visibleColumns.license_type && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.license_type')}
                                            </th>
                                        )}
                                        {visibleColumns.license_expires && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.license_expires')}
                                            </th>
                                        )}
                                        {visibleColumns.phone && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.phone')}
                                            </th>
                                        )}
                                        {visibleColumns.email && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.email')}
                                            </th>
                                        )}
                                        {visibleColumns.login && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.login')}
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('fleet.drivers.columns.status')}
                                            </th>
                                        )}
                                        <th className="w-24 px-3 py-2.5">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {drivers.data.map((driver) => {
                                        const isSelected = selected.includes(driver.id);
                                        const licenseTone = expiryTone(driver.license_expires_at);

                                        return (
                                            <tr
                                                key={driver.id}
                                                className={`group transition-colors hover:bg-gray-50/80 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                {canBatch && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={isSelected}
                                                            onChange={() => toggleRow(driver.id)}
                                                            aria-label={driver.name}
                                                        />
                                                    </td>
                                                )}
                                                {visibleColumns.photo && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        {driver.photo_url ? (
                                                            <img
                                                                src={driver.photo_url}
                                                                alt={driver.name}
                                                                className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200"
                                                            />
                                                        ) : (
                                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold uppercase text-gray-400">
                                                                {driver.name
                                                                    .split(/\s+/)
                                                                    .filter(Boolean)
                                                                    .slice(0, 2)
                                                                    .map((part) => part[0])
                                                                    .join('') || '—'}
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.name && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <Link
                                                            href={prefixedRoute('fleet.drivers.show', driver.id)}
                                                            className="text-sm font-medium text-gray-900 hover:text-indigo-700"
                                                        >
                                                            {driver.name}
                                                        </Link>
                                                    </td>
                                                )}
                                                {visibleColumns.license_number && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-sm text-gray-800">
                                                        {driver.license_number}
                                                    </td>
                                                )}
                                                {visibleColumns.license_type && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-700">
                                                        {driver.license_type || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.license_expires && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm tabular-nums text-gray-800">
                                                                {formatDate(driver.license_expires_at, localeTag)}
                                                            </span>
                                                            <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${expiryBadgeClass(licenseTone)}`}>
                                                                {licenseExpiryLabel(licenseTone)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.phone && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {driver.phone || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.email && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {driver.email || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.login && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                driver.user_id
                                                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                                                                    : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20'
                                                            }`}
                                                        >
                                                            {driver.user_id
                                                                ? t('fleet.drivers.has_login')
                                                                : t('fleet.drivers.needs_login')}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.status && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(driver.status)}`}>
                                                            {t(`fleet.status.${driver.status}`)}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                                                        <Link
                                                            href={prefixedRoute('fleet.drivers.show', driver.id)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                            title={t('common.view', undefined, 'View')}
                                                        >
                                                            <EyeIcon />
                                                        </Link>
                                                        {can.update && (
                                                            <Link
                                                                href={prefixedRoute('fleet.drivers.edit', driver.id)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50"
                                                                title={t('common.edit')}
                                                            >
                                                                <PencilIcon />
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(driver)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50"
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

                        {drivers.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
                                <p className="text-xs text-gray-500">
                                    {t('common.showing_results', {
                                        from: (drivers.current_page - 1) * drivers.per_page + 1,
                                        to: Math.min(drivers.current_page * drivers.per_page, drivers.total),
                                        total: drivers.total,
                                    })}
                                </p>
                                <div className="flex gap-1">
                                    {drivers.links.map((link, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                                link.active
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
                    driverToDelete
                        ? t('fleet.drivers.delete_confirm', { name: driverToDelete.name })
                        : undefined
                }
            />

            <ConfirmDeleteDialog
                show={showBatchDeleteDialog}
                onClose={() => !processing && setShowBatchDeleteDialog(false)}
                onConfirm={confirmBatchDelete}
                processing={processing}
                message={t('fleet.drivers.batch_delete_confirm', { count: selected.length })}
            />
        </DynamicLayout>
    );
}
