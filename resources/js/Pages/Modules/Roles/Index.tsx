import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import PageHeader from '@/Components/PageHeader';

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    users_count: number;
    permissions_count: number;
    created_at: string;
    updated_at: string;
}

interface PaginatedRoles {
    data: Role[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Stats {
    total_roles: number;
    system_roles: number;
    custom_roles: number;
    assigned_users: number;
}

interface Filters {
    search: string | null;
    type: string | null;
}

interface Props {
    roles: PaginatedRoles;
    stats?: Stats;
    filters: Filters;
}

export default function Index({ roles, stats, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [search, setSearch] = useState(filters.search || '');
    const [activeType, setActiveType] = useState<string>(filters.type || 'all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [processing, setProcessing] = useState(false);

    const EyeIcon = () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    const PencilIcon = () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );

    const TrashIcon = () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition data-[focus]:bg-slate-100 dark:data-[focus]:bg-slate-800';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition data-[focus]:bg-rose-50 dark:data-[focus]:bg-rose-900/30';

    const menuItemDangerDisabledClassName =
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 dark:text-slate-600 cursor-not-allowed';

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            prefixedRoute('roles.index'),
            {
                search: search || undefined,
                type: activeType !== 'all' ? activeType : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleFilterType = (type: string) => {
        setActiveType(type);
        router.get(
            prefixedRoute('roles.index'),
            {
                search: search || undefined,
                type: type !== 'all' ? type : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setActiveType('all');
        router.get(prefixedRoute('roles.index'));
    };

    const openDeleteDialog = (role: Role) => {
        setRoleToDelete(role);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setRoleToDelete(null);
    };

    const confirmDelete = () => {
        if (!roleToDelete) return;

        setProcessing(true);
        router.delete(prefixedRoute('roles.destroy', roleToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getRoleAvatarBg = (slug: string) => {
        switch (slug) {
            case 'admin':
            case 'superadmin':
                return 'from-rose-500 to-pink-600';
            case 'manager':
            case 'user':
                return 'from-blue-500 to-indigo-600';
            default:
                return 'from-emerald-500 to-teal-600';
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('roles.pages.index.head')}
                    actions={
                        <Link href={prefixedRoute('roles.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">{t('roles.pages.index.new')}</PrimaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('roles.pages.index.head')} />

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
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">✕</span>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Hero Stat Overview Cards */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {t('roles.pages.index.stats.total_roles')}
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                    🛡️
                                </div>
                            </div>
                            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                                {stats.total_roles}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {t('roles.pages.index.stats.system_roles')}
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 font-bold text-sm">
                                    🔒
                                </div>
                            </div>
                            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                                {stats.system_roles}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {t('roles.pages.index.stats.custom_roles')}
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                    ✏️
                                </div>
                            </div>
                            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                                {stats.custom_roles}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {t('roles.pages.index.stats.assigned_users')}
                                </span>
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-sm">
                                    👥
                                </div>
                            </div>
                            <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                                {stats.assigned_users}
                            </div>
                        </div>
                    </div>
                )}

                {/* Control Toolbar: Search, Type Filter Pills & View Mode Switcher */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 max-w-md">
                        <div className="relative flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('roles.placeholders.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full !rounded-xl border-slate-200 dark:border-slate-800 !py-2 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                        <PrimaryButton type="submit" className="!rounded-xl text-xs shadow-sm">
                            {t('common.search')}
                        </PrimaryButton>
                        {(search || activeType !== 'all') && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                {t('common.clear_filters')}
                            </button>
                        )}
                    </form>

                    <div className="flex items-center justify-between gap-4 md:justify-end">
                        {/* Type Filter Pills */}
                        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => handleFilterType('all')}
                                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                                    activeType === 'all'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                {t('roles.pages.index.filters.all')}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterType('system')}
                                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                                    activeType === 'system'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                🔒 {t('roles.pages.index.filters.system')}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterType('custom')}
                                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                                    activeType === 'custom'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                ✏️ {t('roles.pages.index.filters.custom')}
                            </button>
                        </div>

                        {/* View Mode Switcher */}
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                title={t('roles.pages.index.view_modes.table')}
                                className={`rounded-lg p-1.5 transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5m-16.5-7.5h16.5" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                title={t('roles.pages.index.view_modes.grid')}
                                className={`rounded-lg p-1.5 transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {roles.data.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 text-xl font-bold">
                            🛡️
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                            {t('roles.pages.index.empty_title')}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {t('roles.pages.index.empty_hint')}
                        </p>
                        <div className="mt-6">
                            <Link href={prefixedRoute('roles.create')}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    {t('roles.pages.index.new')}
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Card View */
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {roles.data.map((role) => (
                            <div
                                key={role.id}
                                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getRoleAvatarBg(
                                                    role.slug,
                                                )} text-white font-bold text-lg shadow-sm`}
                                            >
                                                🛡️
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                    {role.name}
                                                </h3>
                                                <span className="font-mono text-[11px] text-slate-400">
                                                    {role.slug}
                                                </span>
                                            </div>
                                        </div>

                                        <Menu as="div" className="relative inline-block text-right">
                                            <MenuButton className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all">
                                                <EllipsisVerticalIcon />
                                            </MenuButton>
                                            <MenuItems
                                                anchor="bottom end"
                                                className="z-50 w-48 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none"
                                            >
                                                <MenuItem>
                                                    <Link
                                                        href={prefixedRoute('roles.show', role.id)}
                                                        className={menuItemClassName}
                                                    >
                                                        <EyeIcon />
                                                        {t('roles.actions.view')}
                                                    </Link>
                                                </MenuItem>
                                                <MenuItem>
                                                    <Link
                                                        href={prefixedRoute('roles.edit', role.id)}
                                                        className={menuItemClassName}
                                                    >
                                                        <PencilIcon />
                                                        {t('common.edit')}
                                                    </Link>
                                                </MenuItem>
                                                {!role.is_system && (
                                                    <>
                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                        <MenuItem disabled={role.users_count > 0}>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(role)}
                                                                className={
                                                                    role.users_count > 0
                                                                        ? menuItemDangerDisabledClassName
                                                                        : menuItemDangerClassName
                                                                }
                                                                disabled={role.users_count > 0}
                                                            >
                                                                <TrashIcon />
                                                                {t('common.delete')}
                                                            </button>
                                                        </MenuItem>
                                                    </>
                                                )}
                                            </MenuItems>
                                        </Menu>
                                    </div>

                                    <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                                        {role.description || '—'}
                                    </p>
                                </div>

                                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 text-[10px] font-bold">
                                            👥 {t('roles.pages.index.users_count', { count: role.users_count })}
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 text-[10px] font-bold">
                                            🔑 {t('roles.pages.index.permissions_count', { count: role.permissions_count })}
                                        </span>
                                    </div>

                                    {role.is_system ? (
                                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold">
                                            🔒 {t('roles.type.system')}
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                                            ✏️ {t('roles.type.custom')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('roles.pages.index.columns.role')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('roles.pages.index.columns.description')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('roles.pages.index.columns.users')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('roles.pages.index.columns.permissions')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('roles.pages.index.columns.type')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('roles.pages.index.columns.created')}
                                        </th>
                                        <th className="px-6 py-3.5 text-right font-bold text-slate-400 uppercase tracking-wider">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-white">
                                    {roles.data.map((role) => (
                                        <tr key={role.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${getRoleAvatarBg(
                                                            role.slug,
                                                        )} text-white font-bold text-xs`}
                                                    >
                                                        🛡️
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {role.name}
                                                        </div>
                                                        <div className="font-mono text-[10px] text-slate-400">
                                                            {role.slug}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs truncate text-slate-500">
                                                    {role.description || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 text-[10px] font-bold">
                                                    {t('roles.pages.index.users_count', { count: role.users_count })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 text-[10px] font-bold">
                                                    {t('roles.pages.index.permissions_count', { count: role.permissions_count })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {role.is_system ? (
                                                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold">
                                                        🔒 {t('roles.type.system')}
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                                                        ✏️ {t('roles.type.custom')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                {formatDate(role.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all">
                                                        <EllipsisVerticalIcon />
                                                    </MenuButton>
                                                    <MenuItems
                                                        anchor="bottom end"
                                                        className="z-50 w-48 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('roles.show', role.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                <EyeIcon />
                                                                {t('roles.actions.view')}
                                                            </Link>
                                                        </MenuItem>
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('roles.edit', role.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                <PencilIcon />
                                                                {t('common.edit')}
                                                            </Link>
                                                        </MenuItem>
                                                        {!role.is_system && (
                                                            <>
                                                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                <MenuItem disabled={role.users_count > 0}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openDeleteDialog(role)}
                                                                        className={
                                                                            role.users_count > 0
                                                                                ? menuItemDangerDisabledClassName
                                                                                : menuItemDangerClassName
                                                                        }
                                                                        disabled={role.users_count > 0}
                                                                    >
                                                                        <TrashIcon />
                                                                        {t('common.delete')}
                                                                    </button>
                                                                </MenuItem>
                                                            </>
                                                        )}
                                                    </MenuItems>
                                                </Menu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {roles.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-xs">
                        <p className="text-slate-500">
                            {t('common.showing_results', {
                                from: (roles.current_page - 1) * roles.per_page + 1,
                                to: Math.min(roles.current_page * roles.per_page, roles.total),
                                total: roles.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {roles.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                                        link.active
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : link.url
                                            ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('roles.delete_confirm.title')}
                message={
                    roleToDelete
                        ? t('roles.delete_confirm.message', { name: roleToDelete.name })
                        : t('roles.delete_confirm.message_generic')
                }
            />
        </DynamicLayout>
    );
}

