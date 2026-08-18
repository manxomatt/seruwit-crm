import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import PageHeader from '@/Components/PageHeader';

interface Role {
    id: number;
    name: string;
    slug: string;
}

interface UserProfile {
    id: number;
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    avatar_url: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Role[];
    profile: UserProfile | null;
}

interface PaginatedUsers {
    data: User[];
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

interface Filters {
    search: string | null;
    status: string | null;
}

interface Stats {
    total_users: number;
    verified_users: number;
    unverified_users: number;
    admin_users: number;
}

interface Props {
    users: PaginatedUsers;
    stats: Stats;
    filters: Filters;
}

export default function Index({ users, stats, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [search, setSearch] = useState(filters.search || '');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [activeStatus, setActiveStatus] = useState<string>(filters.status || 'all');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
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
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
            />
        </svg>
    );

    const menuItemClassName =
        'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition data-[focus]:bg-slate-100 dark:data-[focus]:bg-slate-800';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition data-[focus]:bg-rose-50 dark:data-[focus]:bg-rose-950/30';

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            prefixedRoute('users.index'),
            {
                search: search || undefined,
                status: activeStatus !== 'all' ? activeStatus : undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleFilterStatus = (status: string) => {
        setActiveStatus(status);
        router.get(
            prefixedRoute('users.index'),
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const clearFilters = () => {
        setSearch('');
        setActiveStatus('all');
        router.get(prefixedRoute('users.index'));
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setUserToDelete(null);
    };

    const confirmDelete = () => {
        if (!userToDelete) return;

        setProcessing(true);
        router.delete(prefixedRoute('users.destroy', userToDelete.id), {
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

    const getRoleBadgeStyle = (slug: string) => {
        switch (slug) {
            case 'admin':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
            case 'user':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
            default:
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
        }
    };

    const getUserFullName = (user: User) => {
        if (user.profile?.first_name || user.profile?.last_name) {
            return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim();
        }
        return user.name;
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('users.pages.index.head')}
                    actions={
                        <Link href={prefixedRoute('users.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                + {t('users.pages.index.new')}
                            </PrimaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('users.pages.index.head')} />

            <div className="space-y-6">
                {/* Top Stat Overview Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t('users.stats.total_users')}
                            </span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 text-lg font-bold">
                                👤
                            </span>
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                            {stats.total_users}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t('users.stats.verified_users')}
                            </span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 text-lg font-bold">
                                ✅
                            </span>
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                            {stats.verified_users}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t('users.stats.unverified_users')}
                            </span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 text-lg font-bold">
                                ⏳
                            </span>
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                            {stats.unverified_users}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t('users.stats.admin_users')}
                            </span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 text-lg font-bold">
                                🔑
                            </span>
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                            {stats.admin_users}
                        </div>
                    </div>
                </div>

                {/* Filter and View Mode Control Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative w-full">
                            <TextInput
                                type="text"
                                placeholder={t('users.placeholders.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full !rounded-2xl !py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 pl-9"
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                        </div>
                        <PrimaryButton type="submit" className="!rounded-2xl text-xs !py-2 shadow-sm">
                            {t('common.search')}
                        </PrimaryButton>
                        {(search || activeStatus !== 'all') && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2"
                            >
                                ✕
                            </button>
                        )}
                    </form>

                    {/* Status Filter Pills & View Switcher */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                        {/* Status Pills */}
                        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('all')}
                                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                                    activeStatus === 'all'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                {t('users.filters.all_status')}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('verified')}
                                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                                    activeStatus === 'verified'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                ✅ {t('users.filters.verified')}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('unverified')}
                                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                                    activeStatus === 'unverified'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                ⏳ {t('users.filters.unverified')}
                            </button>
                        </div>

                        {/* View Mode Switcher */}
                        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`rounded-xl p-1.5 transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={t('users.view_modes.grid')}
                            >
                                🎴
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`rounded-xl p-1.5 transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={t('users.view_modes.table')}
                            >
                                📄
                            </button>
                        </div>
                    </div>
                </div>

                {users.data.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 text-xl font-bold">
                            👤
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                            {t('users.pages.index.empty_title')}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {t('users.pages.index.empty_hint')}
                        </p>
                        <div className="mt-6">
                            <Link href={prefixedRoute('users.create')}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    + {t('users.pages.index.new')}
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Card View */
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {users.data.map((user) => (
                            <div
                                key={user.id}
                                className="group relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {user.profile?.avatar_url ? (
                                                <img
                                                    src={user.profile.avatar_url}
                                                    alt={user.name}
                                                    className="h-12 w-12 rounded-2xl object-cover shadow-sm border border-slate-200 dark:border-slate-800"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-base shadow-sm">
                                                    {user.profile?.first_name?.charAt(0)?.toUpperCase() || user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {getUserFullName(user)}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-mono truncate max-w-[160px]">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        <Menu as="div" className="relative">
                                            <MenuButton className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition">
                                                <EllipsisVerticalIcon />
                                            </MenuButton>
                                            <MenuItems
                                                transition
                                                anchor="bottom end"
                                                className="z-50 w-44 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                            >
                                                <MenuItem>
                                                    <Link
                                                        href={prefixedRoute('users.show', user.id)}
                                                        className={menuItemClassName}
                                                    >
                                                        <EyeIcon />
                                                        {t('users.actions.view')}
                                                    </Link>
                                                </MenuItem>
                                                <MenuItem>
                                                    <Link
                                                        href={prefixedRoute('users.edit', user.id)}
                                                        className={menuItemClassName}
                                                    >
                                                        <PencilIcon />
                                                        {t('common.edit')}
                                                    </Link>
                                                </MenuItem>
                                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                <MenuItem>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteDialog(user)}
                                                        className={menuItemDangerClassName}
                                                    >
                                                        <TrashIcon />
                                                        {t('common.delete')}
                                                    </button>
                                                </MenuItem>
                                            </MenuItems>
                                        </Menu>
                                    </div>

                                    {user.profile?.phone_number && (
                                        <div className="mt-3 text-xs text-slate-500 font-mono flex items-center gap-1.5">
                                            <span>📞</span>
                                            <span>{user.profile.phone_number}</span>
                                        </div>
                                    )}

                                    {/* Roles Badges */}
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {user.roles.length > 0 ? (
                                            user.roles.map((role) => (
                                                <span
                                                    key={role.id}
                                                    className={`rounded-xl px-2.5 py-0.5 text-[11px] font-bold ${getRoleBadgeStyle(role.slug)}`}
                                                >
                                                    {role.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">
                                                {t('users.pages.index.no_roles')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px]">
                                    {user.email_verified_at ? (
                                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-bold">
                                            ✅ {t('users.pages.index.verified')}
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 font-bold">
                                            ⏳ {t('users.pages.index.unverified')}
                                        </span>
                                    )}
                                    <span className="text-slate-400">
                                        {formatDate(user.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('users.pages.index.columns.user')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('users.pages.index.columns.email')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('users.pages.index.columns.roles')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('users.pages.index.columns.status')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('users.pages.index.columns.created')}
                                        </th>
                                        <th className="px-6 py-3.5 text-right font-bold text-slate-400 uppercase tracking-wider">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-white">
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {user.profile?.avatar_url ? (
                                                        <img
                                                            src={user.profile.avatar_url}
                                                            alt={user.name}
                                                            className="h-9 w-9 rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm">
                                                            {user.profile?.first_name?.charAt(0)?.toUpperCase() || user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {getUserFullName(user)}
                                                        </div>
                                                        {user.profile?.phone_number && (
                                                            <div className="text-[10px] text-slate-400 font-mono">
                                                                {user.profile.phone_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-500">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.length > 0 ? (
                                                        user.roles.map((role) => (
                                                            <span
                                                                key={role.id}
                                                                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeStyle(role.slug)}`}
                                                            >
                                                                {role.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 italic">
                                                            {t('users.pages.index.no_roles')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.email_verified_at ? (
                                                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 font-bold text-[10px]">
                                                        ✅ {t('users.pages.index.verified')}
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 font-bold text-[10px]">
                                                        ⏳ {t('users.pages.index.unverified')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition">
                                                        <EllipsisVerticalIcon />
                                                    </MenuButton>
                                                    <MenuItems
                                                        transition
                                                        anchor="bottom end"
                                                        className="z-50 w-44 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('users.show', user.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                <EyeIcon />
                                                                {t('users.actions.view')}
                                                            </Link>
                                                        </MenuItem>
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('users.edit', user.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                <PencilIcon />
                                                                {t('common.edit')}
                                                            </Link>
                                                        </MenuItem>
                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(user)}
                                                                className={menuItemDangerClassName}
                                                            >
                                                                <TrashIcon />
                                                                {t('common.delete')}
                                                            </button>
                                                        </MenuItem>
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

                {/* Pagination Footer */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-xs">
                        <p className="text-slate-500">
                            {t('common.showing_results', {
                                from: (users.current_page - 1) * users.per_page + 1,
                                to: Math.min(users.current_page * users.per_page, users.total),
                                total: users.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {users.links.map((link, index) => (
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
                title={t('users.delete_confirm.title')}
                message={
                    userToDelete
                        ? t('users.delete_confirm.message', { name: userToDelete.name, email: userToDelete.email })
                        : t('users.delete_confirm.message_generic')
                }
            />
        </DynamicLayout>
    );
}

