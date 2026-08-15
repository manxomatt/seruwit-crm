import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

interface TenantRow {
    id: string;
    name: string;
    status: string;
    domain: string | null;
    members: number;
    created_at: string | null;
    subscription_plan: string | null;
    subscription_status: string | null;
}

interface PaginatedTenants {
    data: TenantRow[];
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
    tenants: PaginatedTenants;
    filters: Filters;
}

const PLAN_COLORS: Record<string, string> = {
    trial: 'bg-slate-100 text-slate-600',
    free: 'bg-sky-100 text-sky-700',
    basic: 'bg-violet-100 text-violet-700',
    pro: 'bg-amber-100 text-amber-700',
};

const planBadgeClass = (planName: string, status: string | null): string => {
    if (status !== 'active') {
        return 'bg-gray-100 text-gray-400 line-through';
    }
    return PLAN_COLORS[planName.toLowerCase()] ?? 'bg-teal-100 text-teal-700';
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


const CloseIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const BuildingIcon = () => (
    <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);

const STATUSES = ['active', 'suspended'] as const;

export default function Index({ tenants, filters }: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;

    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<string[]>([]);
    const [batchStatus, setBatchStatus] = useState('');
    const [batchProcessing, setBatchProcessing] = useState(false);

    const pageIds = useMemo(() => tenants.data.map((t) => t.id), [tenants.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));
    const selectionMode = selected.length > 0;
    const hasActiveFilters = Boolean(filters.search || filters.status);

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        setSelected((prev) => prev.filter((id) => pageIds.includes(id)));
    }, [pageIds]);

    const applyFilters = (next: Partial<Filters> & { search?: string }) => {
        router.get(
            route('module.tenants.index'),
            {
                search: (next.search !== undefined ? next.search : search) || undefined,
                status: (next.status !== undefined ? next.status : filters.status) || undefined,
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
        router.get(route('module.tenants.index'), {}, { preserveState: true, replace: true });
    };

    const toggleRow = (id: string) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const toggleAllOnPage = () => {
        setSelected((prev) =>
            allPageSelected ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds])),
        );
    };

    const clearSelection = () => {
        setSelected([]);
        setBatchStatus('');
    };

    const applyBatchStatus = () => {
        if (!batchStatus || selected.length === 0) return;
        setBatchProcessing(true);
        router.patch(
            route('module.tenants.batch-status'),
            { ids: selected, status: batchStatus },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setBatchProcessing(false),
            },
        );
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const statusPills = [
        { value: '', label: t('tenants.status.all') },
        ...STATUSES.map((s) => ({ value: s, label: t(`tenants.status.${s}`) })),
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('tenants.title')}
                    actions={
                        <Link href={route('module.tenants.create')}>
                            <PrimaryButton>
                                {t('tenants.pages.index.new')}
                            </PrimaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('tenants.title')} />

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

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                {/* ── Toolbar ── */}
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700 sm:px-5">
                    {selectionMode ? (
                        /* Batch bar */
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                                {selected.length} {t('tenants.pages.index.batch_selected')}
                            </span>

                            <div className="flex items-center gap-1.5">
                                <Select
                                    className="!py-1.5 text-sm"
                                    value={batchStatus}
                                    onChange={setBatchStatus}
                                    placeholder={t('tenants.pages.index.batch_status_placeholder')}
                                    options={STATUSES.map((s) => ({ value: s, label: t(`tenants.status.${s}`) }))}
                                />
                                <button
                                    type="button"
                                    onClick={applyBatchStatus}
                                    disabled={!batchStatus || batchProcessing}
                                    className="inline-flex h-9 items-center rounded-md bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                                >
                                    {t('tenants.pages.index.batch_apply')}
                                </button>
                            </div>

                            <div className="ml-auto">
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                                    title={t('tenants.pages.index.batch_clear')}
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Search + filter bar */
                        <div className="flex flex-col gap-3">
                            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[200px] flex-1">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                        <SearchIcon />
                                    </span>
                                    <TextInput
                                        type="search"
                                        placeholder={t('tenants.pages.index.search_placeholder')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full !py-2 pl-9 text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    {t('common.search')}
                                </button>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                                    >
                                        <CloseIcon />
                                        {t('common.clear_filters')}
                                    </button>
                                )}
                            </form>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {statusPills.map((pill) => {
                                    const active = (filters.status ?? '') === pill.value;
                                    return (
                                        <button
                                            key={`status-${pill.value || 'all'}`}
                                            type="button"
                                            onClick={() => applyFilters({ status: pill.value || null })}
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                                                active
                                                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {pill.label}
                                        </button>
                                    );
                                })}
                                <span className="ml-auto text-xs tabular-nums text-gray-400">
                                    {t('common.showing_results', {
                                        from: tenants.total === 0 ? 0 : (tenants.current_page - 1) * tenants.per_page + 1,
                                        to: Math.min(tenants.current_page * tenants.per_page, tenants.total),
                                        total: tenants.total,
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Table or empty ── */}
                {tenants.data.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="flex justify-center">
                            <BuildingIcon />
                        </div>
                        <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t('tenants.pages.index.empty_title')}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{t('tenants.pages.index.empty_hint')}</p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                {t('common.clear_filters')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                <thead>
                                    <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                                        <th className="w-10 px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={allPageSelected}
                                                ref={(input) => {
                                                    if (input) input.indeterminate = somePageSelected && !allPageSelected;
                                                }}
                                                onChange={toggleAllOnPage}
                                            />
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            {t('tenants.pages.index.columns.name')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            {t('tenants.pages.index.columns.domain')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            {t('tenants.pages.index.columns.members')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            Langganan
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            {t('tenants.pages.index.columns.status')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            {t('tenants.pages.index.columns.created_at')}
                                        </th>
                                        <th className="w-16 px-3 py-2.5">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {tenants.data.map((tenant) => {
                                        const isSelected = selected.includes(tenant.id);
                                        return (
                                            <tr
                                                key={tenant.id}
                                                className={`group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/40 ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                                            >
                                                <td className="px-3 py-2.5">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={isSelected}
                                                        onChange={() => toggleRow(tenant.id)}
                                                        aria-label={tenant.name}
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5">
                                                    <Link
                                                        href={route('module.tenants.show', tenant.id)}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                                    >
                                                        {tenant.name}
                                                    </Link>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5">
                                                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                        {tenant.domain ?? '—'}
                                                    </code>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-sm tabular-nums text-gray-500 dark:text-gray-400">
                                                    {tenant.members}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5">
                                                    {tenant.subscription_plan ? (
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${planBadgeClass(tenant.subscription_plan, tenant.subscription_status)}`}
                                                        >
                                                            {tenant.subscription_plan}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                            tenant.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                                                : 'bg-slate-50 text-slate-600 ring-slate-500/20'
                                                        }`}
                                                    >
                                                        {t(`tenants.status.${tenant.status}`)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(tenant.created_at)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                                    <Link
                                                        href={route('module.tenants.show', tenant.id)}
                                                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 opacity-100 transition hover:bg-gray-100 hover:text-gray-700 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-gray-700"
                                                        title={t('tenants.actions.view_detail')}
                                                    >
                                                        <EyeIcon />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {tenants.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700 sm:px-5">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('common.showing_results', {
                                        from: (tenants.current_page - 1) * tenants.per_page + 1,
                                        to: Math.min(tenants.current_page * tenants.per_page, tenants.total),
                                        total: tenants.total,
                                    })}
                                </p>
                                <div className="flex gap-1">
                                    {tenants.links.map((link, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                                link.active
                                                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                                                    : link.url
                                                      ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                      : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
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
        </DynamicLayout>
    );
}
