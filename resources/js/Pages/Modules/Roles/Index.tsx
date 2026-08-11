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

interface Filters {
    search: string | null;
}

interface Props {
    roles: PaginatedRoles;
    filters: Filters;
}

export default function Index({ roles, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [processing, setProcessing] = useState(false);

    const EyeIcon = () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    const PencilIcon = () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );

    const TrashIcon = () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-red-600 transition data-[focus]:bg-red-50 data-[focus]:text-red-700';

    const menuItemDangerDisabledClassName =
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-300 cursor-not-allowed';

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('roles.index'), {
            search: search || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
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

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('roles.pages.index.head')}
                    actions={<Link href={prefixedRoute('roles.create')}>
                        <PrimaryButton>{t('roles.pages.index.new')}</PrimaryButton>
                    </Link>}
                />
            }
        >
            <Head title={t('roles.pages.index.head')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {/* Filters */}
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <TextInput
                                type="text"
                                placeholder={t('roles.placeholders.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                        {filters.search && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                {t('common.clear_filters')}
                            </button>
                        )}
                    </form>

                    {roles.data.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('roles.pages.index.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('roles.pages.index.empty_hint')}
                            </p>
                            <div className="mt-6">
                                <Link href={prefixedRoute('roles.create')}>
                                    <PrimaryButton>{t('roles.pages.index.new')}</PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Roles Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('roles.pages.index.columns.role')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('roles.pages.index.columns.description')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('roles.pages.index.columns.users')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('roles.pages.index.columns.permissions')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('roles.pages.index.columns.type')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('roles.pages.index.columns.created')}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('common.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {roles.data.map((role) => (
                                            <tr key={role.id} className="group hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0">
                                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${role.slug === 'admin' ? 'bg-red-600' :
                                                                role.slug === 'user' ? 'bg-blue-600' : 'bg-green-600'
                                                                }`}>
                                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {role.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {role.slug}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                                        {role.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {t('roles.pages.index.users_count', { count: role.users_count })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        {t('roles.pages.index.permissions_count', { count: role.permissions_count })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {role.is_system ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {t('roles.type.system')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {t('roles.type.custom')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(role.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                                                                    href={prefixedRoute('roles.show', role.id)}
                                                                    className={menuItemClassName}
                                                                    title={t('roles.actions.view')}
                                                                >
                                                                    <span className="text-gray-500">
                                                                        <EyeIcon />
                                                                    </span>
                                                                    {t('roles.actions.view')}
                                                                </Link>
                                                            </MenuItem>
                                                            <MenuItem>
                                                                <Link
                                                                    href={prefixedRoute('roles.edit', role.id)}
                                                                    className={menuItemClassName}
                                                                    title={t('common.edit')}
                                                                >
                                                                    <span className="text-indigo-600">
                                                                        <PencilIcon />
                                                                    </span>
                                                                    {t('common.edit')}
                                                                </Link>
                                                            </MenuItem>
                                                            <div className="my-1 border-t border-gray-100" />
                                                            {!role.is_system ? (
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
                                                                        title={t('common.delete')}
                                                                    >
                                                                        <TrashIcon />
                                                                        {t('common.delete')}
                                                                    </button>
                                                                </MenuItem>
                                                            ) : null}
                                                        </MenuItems>
                                                    </Menu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {roles.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
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
                                                className={`px-3 py-1 text-sm rounded ${link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50 border'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
