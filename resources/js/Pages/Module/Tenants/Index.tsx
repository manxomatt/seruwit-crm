import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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
    trial: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    free: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    basic: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    pro: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const planBadgeClass = (planName: string, status: string | null): string => {
    if (status !== 'active') {
        return 'bg-slate-100 text-slate-400 line-through border-slate-200';
    }
    return PLAN_COLORS[planName.toLowerCase()] ?? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
};

const AVATAR_BG = [
    'from-indigo-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
];

const getAvatarBg = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_BG.length;
    return AVATAR_BG[index];
};

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
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const pageIds = useMemo(() => tenants.data.map((t) => t.id), [tenants.data]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));
    const selectionMode = selected.length > 0;
    const hasActiveFilters = Boolean(filters.search || filters.status);

    const activeCount = useMemo(
        () => tenants.data.filter((t) => t.status === 'active').length,
        [tenants.data],
    );

    const suspendedCount = useMemo(
        () => tenants.data.filter((t) => t.status === 'suspended').length,
        [tenants.data],
    );

    const totalMembers = useMemo(
        () => tenants.data.reduce((acc, t) => acc + (t.members || 0), 0),
        [tenants.data],
    );

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
                            <PrimaryButton className="!rounded-xl shadow-sm">
                                + {t('tenants.pages.index.new')}
                            </PrimaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('tenants.title')} />

            <div className="space-y-6">
                {/* Alert Notifications */}
                {flash?.success && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-700 dark:text-rose-300 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">!</span>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Hero Stat Overview */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 border border-indigo-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {t('tenants.stats.total_tenants')}
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {tenants.total}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('tenants.stats.total_tenants_hint')}
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 border border-emerald-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {t('tenants.stats.active_tenants')}
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {activeCount}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('tenants.stats.active_tenants_hint')}
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent p-5 border border-rose-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            {t('tenants.stats.suspended_tenants')}
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                            {suspendedCount}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('tenants.stats.suspended_tenants_hint')}
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent p-5 border border-sky-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            {t('tenants.stats.total_members')}
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {totalMembers}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('tenants.stats.total_members_hint')}
                        </p>
                    </div>
                </div>

                {/* Toolbar Card */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-4">
                    {selectionMode ? (
                        /* Batch bar */
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                {selected.length} {t('tenants.pages.index.batch_selected')}
                            </span>

                            <div className="flex items-center gap-2">
                                <Select
                                    className="!rounded-xl !py-1.5 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    value={batchStatus}
                                    onChange={setBatchStatus}
                                    placeholder={t('tenants.pages.index.batch_status_placeholder')}
                                    options={STATUSES.map((s) => ({ value: s, label: t(`tenants.status.${s}`) }))}
                                />
                                <PrimaryButton
                                    type="button"
                                    onClick={applyBatchStatus}
                                    disabled={!batchStatus || batchProcessing}
                                    className="!rounded-xl text-xs"
                                >
                                    {t('tenants.pages.index.batch_apply')}
                                </PrimaryButton>
                            </div>

                            <button
                                type="button"
                                onClick={clearSelection}
                                className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                                {t('tenants.pages.index.batch_clear')} ✕
                            </button>
                        </div>
                    ) : (
                        /* Search + Status filters + View Switcher */
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Filter Status Tabs */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {statusPills.map((pill) => {
                                    const active = (filters.status ?? '') === pill.value;
                                    return (
                                        <button
                                            key={`status-${pill.value || 'all'}`}
                                            type="button"
                                            onClick={() => applyFilters({ status: pill.value || null })}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                                active
                                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {pill.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search & View Switcher */}
                            <div className="flex flex-wrap items-center gap-3">
                                <form onSubmit={handleSearch} className="flex items-center gap-2">
                                    <div className="relative min-w-[340px]">
                                        <svg
                                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                                        </svg>
                                        <TextInput
                                            type="search"
                                            placeholder={t('tenants.pages.index.search_placeholder')}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full !rounded-xl !py-2 pl-9 pr-3 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                                        />
                                    </div>
                                    {hasActiveFilters && (
                                        <SecondaryButton
                                            type="button"
                                            onClick={clearFilters}
                                            className="!rounded-xl text-xs"
                                        >
                                            {t('common.clear_filters')}
                                        </SecondaryButton>
                                    )}
                                </form>

                                {/* Grid / Table Switcher */}
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`rounded-lg px-2.5 py-1.5 transition-all ${
                                            viewMode === 'grid'
                                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        田 {t('tenants.view_modes.grid')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('table')}
                                        className={`rounded-lg px-2.5 py-1.5 transition-all ${
                                            viewMode === 'table'
                                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        ☰ {t('tenants.view_modes.table')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content View: Grid vs Table */}
                {tenants.data.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                            🏢
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                            {t('tenants.pages.index.empty_title')}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">{t('tenants.pages.index.empty_hint')}</p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                {t('common.clear_filters')}
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Cards View */
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tenants.data.map((tenant) => {
                            const isSelected = selected.includes(tenant.id);
                            return (
                                <div
                                    key={tenant.id}
                                    className={`relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md ${
                                        isSelected
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                            : 'border-slate-200/80 dark:border-slate-800'
                                    }`}
                                >
                                    <div>
                                        {/* Avatar & Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarBg(
                                                        tenant.name,
                                                    )} text-white font-bold text-lg shadow-sm`}
                                                >
                                                    {tenant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link
                                                        href={route('module.tenants.show', tenant.id)}
                                                        className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
                                                    >
                                                        {tenant.name}
                                                    </Link>
                                                    {tenant.domain ? (
                                                        <a
                                                            href={`https://${tenant.domain}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                                                        >
                                                            🌐 {tenant.domain} ↗
                                                        </a>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">No domain configured</span>
                                                    )}
                                                </div>
                                            </div>

                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                                    tenant.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                }`}
                                            >
                                                {t(`tenants.status.${tenant.status}`)}
                                            </span>
                                        </div>

                                        {/* Plan & Stats Pill */}
                                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                            {tenant.subscription_plan ? (
                                                <span
                                                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border ${planBadgeClass(
                                                        tenant.subscription_plan,
                                                        tenant.subscription_status,
                                                    )}`}
                                                >
                                                    📦 {tenant.subscription_plan}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">Default Plan</span>
                                            )}

                                            <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                👥 {tenant.members} Anggota
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                        <span>Dibuat: {formatDate(tenant.created_at)}</span>
                                        <Link href={route('module.tenants.show', tenant.id)}>
                                            <SecondaryButton className="!rounded-xl text-xs">
                                                {t('tenants.actions.view_detail')} →
                                            </SecondaryButton>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                <thead>
                                    <tr className="bg-slate-50/60 dark:bg-slate-800/40 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="w-10 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={allPageSelected}
                                                ref={(input) => {
                                                    if (input) input.indeterminate = somePageSelected && !allPageSelected;
                                                }}
                                                onChange={toggleAllOnPage}
                                            />
                                        </th>
                                        <th className="px-4 py-3">{t('tenants.pages.index.columns.name')}</th>
                                        <th className="px-4 py-3">{t('tenants.pages.index.columns.domain')}</th>
                                        <th className="px-4 py-3">{t('tenants.pages.index.columns.members')}</th>
                                        <th className="px-4 py-3">Langganan</th>
                                        <th className="px-4 py-3">{t('tenants.pages.index.columns.status')}</th>
                                        <th className="px-4 py-3">{t('tenants.pages.index.columns.created_at')}</th>
                                        <th className="w-16 px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {tenants.data.map((tenant) => {
                                        const isSelected = selected.includes(tenant.id);
                                        return (
                                            <tr
                                                key={tenant.id}
                                                className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                                                    isSelected ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={isSelected}
                                                        onChange={() => toggleRow(tenant.id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                                    <Link href={route('module.tenants.show', tenant.id)} className="hover:text-indigo-600">
                                                        {tenant.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-slate-500">
                                                    {tenant.domain ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                                                    {tenant.members}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {tenant.subscription_plan ? (
                                                        <span
                                                            className={`inline-flex items-center rounded-lg px-2.5 py-0.5 font-semibold border ${planBadgeClass(
                                                                tenant.subscription_plan,
                                                                tenant.subscription_status,
                                                            )}`}
                                                        >
                                                            {tenant.subscription_plan}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] border ${
                                                            tenant.status === 'active'
                                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                        }`}
                                                    >
                                                        {t(`tenants.status.${tenant.status}`)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {formatDate(tenant.created_at)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link href={route('module.tenants.show', tenant.id)}>
                                                        <SecondaryButton className="!rounded-xl text-xs">
                                                            {t('tenants.actions.view_detail')}
                                                        </SecondaryButton>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {tenants.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
                        <span className="text-slate-500">
                            {t('common.showing_results', {
                                from: (tenants.current_page - 1) * tenants.per_page + 1,
                                to: Math.min(tenants.current_page * tenants.per_page, tenants.total),
                                total: tenants.total,
                            })}
                        </span>

                        <div className="flex items-center gap-1">
                            {tenants.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded-xl px-3 py-1.5 font-semibold transition-all ${
                                        link.active
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : link.url
                                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                              : 'opacity-40 cursor-not-allowed text-slate-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}

