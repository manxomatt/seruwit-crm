import DynamicLayout from '@/Layouts/DynamicLayout';
import ColumnVisibilityMenu, {
    buildColumnVisibility,
    type ColumnDef,
} from '@/Components/ColumnVisibilityMenu';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState, FormEventHandler } from 'react';
import PartnersNav from '../../../PartnersNav';
import PartnerExportModal, { type ExportColumnOption } from './Partials/PartnerExportModal';
import PartnerImportModal from './Partials/PartnerImportModal';

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface Industry {
    id: number;
    name: string | Record<string, string>;
    label?: string;
}

interface PartnerTypeOption {
    id: number;
    code: string;
    name: string;
}

interface PartnerTypeRef {
    id: number;
    code: string;
    label?: string;
}

interface Partner {
    id: number;
    code: string;
    name: string;
    account_type: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    customer_rank: number;
    supplier_rank: number;
    status: string;
    industry: Industry | null;
    tags: Tag[];
    types: PartnerTypeRef[];
}

interface PaginatedPartners {
    data: Partner[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    account_type: string | null;
    role: string | null;
    type_id: string | null;
}

interface Props {
    partners: PaginatedPartners;
    filters: Filters;
    partnerTypes: PartnerTypeOption[];
    exportColumns: ExportColumnOption[];
    can: { create: boolean; update: boolean; delete: boolean; export: boolean; import: boolean };
}

type PartnerColumn = 'code' | 'name' | 'role' | 'phone' | 'email' | 'industry' | 'status';

const STORAGE_KEY = 'partners.list.visibleColumns';
const STATUSES = ['active', 'inactive'] as const;

const PARTNER_COLUMN_KEYS: Array<{ key: PartnerColumn; required?: boolean; defaultVisible?: boolean }> = [
    { key: 'code', required: true },
    { key: 'name', required: true },
    { key: 'role', required: true },
    { key: 'phone', defaultVisible: true },
    { key: 'email', defaultVisible: false },
    { key: 'industry', defaultVisible: true },
    { key: 'status', defaultVisible: true },
];

const getStatusBadgeColor = (status: string) => {
    return status === 'active'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
        : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
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

function readStoredColumns(): Partial<Record<PartnerColumn, boolean>> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<Record<PartnerColumn, boolean>>;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export default function Index({ partners, filters, partnerTypes, exportColumns, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [batchStatus, setBatchStatus] = useState('');

    const canBatch = can.update || can.delete;
    const pageIds = useMemo(() => partners.data.map((partner) => partner.id), [partners.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));
    const hasActiveFilters = Boolean(
        filters.search || filters.status || filters.account_type || filters.role || filters.type_id,
    );
    const selectionMode = canBatch && selected.length > 0;

    const columnDefs = useMemo<Array<ColumnDef<PartnerColumn>>>(
        () =>
            PARTNER_COLUMN_KEYS.map((column) => ({
                ...column,
                label: t(`partners.index.columns.${column.key}`),
            })),
        [t],
    );

    const [visibleColumns, setVisibleColumns] = useState<Record<PartnerColumn, boolean>>(() =>
        buildColumnVisibility(PARTNER_COLUMN_KEYS, typeof window !== 'undefined' ? readStoredColumns() : null),
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

    const getRoleBadges = (partner: Partner) => {
        if (partner.types?.length > 0) {
            return partner.types.map((type) => ({
                key: type.code,
                label: type.label || type.code,
                className: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
            }));
        }

        const badges: Array<{ key: string; label: string; className: string }> = [];
        if (partner.customer_rank > 0) {
            badges.push({
                key: 'customer',
                label: t('partners.role.customer'),
                className: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
            });
        }
        if (partner.supplier_rank > 0) {
            badges.push({
                key: 'supplier',
                label: t('partners.role.supplier'),
                className: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
            });
        }
        return badges;
    };

    const applyFilters = (next: Partial<Filters> & { search?: string }) => {
        router.get(
            prefixedRoute('partners.index'),
            {
                search: (next.search !== undefined ? next.search : search) || undefined,
                status: (next.status !== undefined ? next.status : filters.status) || undefined,
                account_type:
                    (next.account_type !== undefined ? next.account_type : filters.account_type) || undefined,
                role: (next.role !== undefined ? next.role : filters.role) || undefined,
                type_id: (next.type_id !== undefined ? next.type_id : filters.type_id) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(prefixedRoute('partners.index'), {}, { preserveState: true, replace: true });
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

    const openDeleteDialog = (partner: Partner) => {
        setPartnerToDelete(partner);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setPartnerToDelete(null);
    };

    const confirmDelete = () => {
        if (!partnerToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('partners.destroy', partnerToDelete.id), {
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
            prefixedRoute('partners.batch-status'),
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
            prefixedRoute('partners.batch-destroy'),
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
        { value: '', label: t('partners.status.all') },
        ...STATUSES.map((status) => ({
            value: status,
            label: t(`partners.status.${status}`),
        })),
    ];

    const accountTypePills = [
        { value: '', label: t('partners.account_type.all') },
        { value: 'company', label: t('partners.account_type.company') },
        { value: 'individual', label: t('partners.account_type.individual') },
    ];

    const rolePills = [
        { value: '', label: t('partners.role.all') },
        { value: 'customer', label: t('partners.role.customer') },
        { value: 'supplier', label: t('partners.role.supplier') },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('partners.index.head')}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can.export && (
                                <SecondaryButton onClick={() => setShowExportModal(true)}>
                                    {t('partners.export.action')}
                                </SecondaryButton>
                            )}
                            {can.import && (
                                <SecondaryButton onClick={() => setShowImportModal(true)}>
                                    {t('partners.import.action')}
                                </SecondaryButton>
                            )}
                            {can.create && (
                                <Link href={prefixedRoute('partners.create')}>
                                    <PrimaryButton>{t('partners.index.new')}</PrimaryButton>
                                </Link>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={t('partners.title')} />

            <PartnersNav />

            {flash?.success && (
                <div className="mb-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                    {selectionMode ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                                {t('partners.index.batch_selected', { count: selected.length })}
                            </span>

                            {can.update && (
                                <div className="flex items-center gap-1.5">
                                    <Select
                                        className="!py-1.5 text-sm"
                                        value={batchStatus}
                                        onChange={setBatchStatus}
                                        placeholder={t('partners.index.batch_status_placeholder')}
                                        options={STATUSES.map((status) => ({
                                            value: status,
                                            label: t(`partners.status.${status}`),
                                        }))}
                                    />
                                    <button
                                        type="button"
                                        onClick={applyBatchStatus}
                                        disabled={!batchStatus || processing}
                                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {t('partners.index.batch_apply_status')}
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
                                        {t('partners.index.batch_delete')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    title={t('partners.index.batch_clear')}
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
                                        placeholder={t('partners.placeholders.search')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full !py-2 pl-9 text-sm"
                                    />
                                </div>
                                <div className="w-56 shrink-0 sm:w-64">
                                    <Select
                                        className="!py-1.5 text-sm"
                                        value={filters.type_id || ''}
                                        onChange={(value) => applyFilters({ type_id: value || null })}
                                        placeholder={t('partners.types.all')}
                                        options={[
                                            { value: '', label: t('partners.types.all') },
                                            ...partnerTypes.map((type) => ({
                                                value: String(type.id),
                                                label: type.name,
                                            })),
                                        ]}
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
                                    label={t('partners.index.columns_menu')}
                                    requiredHint={t('partners.index.columns_required_hint')}
                                    iconOnly
                                />
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    >
                                        <CloseIcon />
                                        {t('partners.index.clear_filters')}
                                    </button>
                                )}
                            </form>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {statusPills.map((pill) => {
                                    const active = (filters.status || '') === pill.value;

                                    return (
                                        <button
                                            key={`status-${pill.value || 'all'}`}
                                            type="button"
                                            onClick={() => applyFilters({ status: pill.value || null })}
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
                                <span className="mx-1 hidden h-4 w-px bg-gray-200 sm:inline-block" aria-hidden />
                                {accountTypePills.map((pill) => {
                                    const active = (filters.account_type || '') === pill.value;

                                    return (
                                        <button
                                            key={`account-${pill.value || 'all'}`}
                                            type="button"
                                            onClick={() => applyFilters({ account_type: pill.value || null })}
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                                                active
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                            }`}
                                        >
                                            {pill.label}
                                        </button>
                                    );
                                })}
                                <span className="mx-1 hidden h-4 w-px bg-gray-200 sm:inline-block" aria-hidden />
                                {rolePills.map((pill) => {
                                    const active = (filters.role || '') === pill.value;

                                    return (
                                        <button
                                            key={`role-${pill.value || 'all'}`}
                                            type="button"
                                            onClick={() => applyFilters({ role: pill.value || null })}
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                                                active
                                                    ? 'bg-sky-700 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                            }`}
                                        >
                                            {pill.label}
                                        </button>
                                    );
                                })}
                                <span className="ml-auto text-xs tabular-nums text-gray-400">
                                    {t('common.showing_results', {
                                        from: partners.total === 0 ? 0 : (partners.current_page - 1) * partners.per_page + 1,
                                        to: Math.min(partners.current_page * partners.per_page, partners.total),
                                        total: partners.total,
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {partners.data.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <h3 className="text-sm font-medium text-gray-900">{t('partners.index.empty_title')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('partners.index.empty_hint')}</p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                {t('partners.index.clear_filters')}
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
                                                    aria-label={t('partners.index.batch_selected', { count: pageIds.length })}
                                                />
                                            </th>
                                        )}
                                        {visibleColumns.code && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('partners.index.columns.code')}
                                            </th>
                                        )}
                                        {visibleColumns.name && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('partners.index.columns.name')}
                                            </th>
                                        )}
                                        {visibleColumns.role && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('partners.index.columns.role')}
                                            </th>
                                        )}
                                        {visibleColumns.phone && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('partners.index.columns.phone')}
                                            </th>
                                        )}
                                        {visibleColumns.email && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('partners.index.columns.email')}
                                            </th>
                                        )}
                                        {visibleColumns.industry && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('partners.index.columns.industry')}
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                {t('partners.index.columns.status')}
                                            </th>
                                        )}
                                        <th className="w-24 px-3 py-2.5">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {partners.data.map((partner) => {
                                        const isSelected = selected.includes(partner.id);

                                        return (
                                            <tr
                                                key={partner.id}
                                                className={`group transition-colors hover:bg-gray-50/80 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                {canBatch && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={isSelected}
                                                            onChange={() => toggleRow(partner.id)}
                                                            aria-label={partner.name}
                                                        />
                                                    </td>
                                                )}
                                                {visibleColumns.code && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-sm text-gray-800">
                                                        {partner.code}
                                                    </td>
                                                )}
                                                {visibleColumns.name && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <Link
                                                            href={prefixedRoute('partners.show', partner.id)}
                                                            className="text-sm font-medium text-gray-900 hover:text-indigo-700"
                                                        >
                                                            {partner.name}
                                                        </Link>
                                                        <div className="text-xs text-gray-500">
                                                            {t(`partners.account_type.${partner.account_type}`)}
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.role && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {getRoleBadges(partner).map((badge) => (
                                                                <span
                                                                    key={badge.key}
                                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                                                                >
                                                                    {badge.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.phone && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {partner.phone || partner.mobile || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.email && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {partner.email || '—'}
                                                    </td>
                                                )}
                                                {visibleColumns.industry && (
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">
                                                        {partner.industry?.label ||
                                                            (typeof partner.industry?.name === 'string'
                                                                ? partner.industry.name
                                                                : '—')}
                                                    </td>
                                                )}
                                                {visibleColumns.status && (
                                                    <td className="whitespace-nowrap px-3 py-2.5">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(partner.status)}`}
                                                        >
                                                            {t(`partners.status.${partner.status}`, undefined, partner.status)}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                                                        <Link
                                                            href={prefixedRoute('partners.show', partner.id)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                            title={t('common.view', undefined, 'View')}
                                                        >
                                                            <EyeIcon />
                                                        </Link>
                                                        {can.update && (
                                                            <Link
                                                                href={prefixedRoute('partners.edit', partner.id)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50"
                                                                title={t('common.edit')}
                                                            >
                                                                <PencilIcon />
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(partner)}
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

                        {partners.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
                                <p className="text-xs text-gray-500">
                                    {t('common.showing_results', {
                                        from: (partners.current_page - 1) * partners.per_page + 1,
                                        to: Math.min(partners.current_page * partners.per_page, partners.total),
                                        total: partners.total,
                                    })}
                                </p>
                                <div className="flex gap-1">
                                    {partners.links.map((link, index) => (
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
                title={t('partners.index.delete_title')}
                message={
                    partnerToDelete
                        ? t('partners.index.delete_confirm', { name: partnerToDelete.name, code: partnerToDelete.code })
                        : t('partners.index.delete_confirm_generic')
                }
            />

            <ConfirmDeleteDialog
                show={showBatchDeleteDialog}
                onClose={() => !processing && setShowBatchDeleteDialog(false)}
                onConfirm={confirmBatchDelete}
                processing={processing}
                title={t('partners.index.delete_title')}
                message={t('partners.index.batch_delete_confirm', { count: selected.length })}
            />

            {can.export && (
                <PartnerExportModal
                    show={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    columns={exportColumns}
                    filters={filters}
                />
            )}

            {can.import && (
                <PartnerImportModal
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                />
            )}
        </DynamicLayout>
    );
}
