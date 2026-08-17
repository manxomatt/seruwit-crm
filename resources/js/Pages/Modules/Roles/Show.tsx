import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    created_at: string;
    updated_at: string;
    permissions: Permission[];
    users: User[];
}

interface Props {
    role: Role;
    permissionsByModule: Record<string, Permission[]>;
    modules: Record<string, string>;
    actions: Record<string, string>;
}

export default function Show({ role, permissionsByModule, modules, actions }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('roles.pages.show.head', { name: role.name })}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={prefixedRoute('roles.edit', role.id)}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    ✏️ {t('roles.actions.edit_role')}
                                </PrimaryButton>
                            </Link>
                            <Link href={prefixedRoute('roles.index')}>
                                <SecondaryButton className="!rounded-xl text-xs">
                                    ← {t('roles.actions.back_to_roles')}
                                </SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('roles.pages.show.title', { name: role.name })} />

            <div className="space-y-6">
                {/* Hero Role Banner Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl text-white font-bold shadow-md">
                                🛡️
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        {role.name}
                                    </h3>
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
                                <p className="mt-0.5 font-mono text-xs text-slate-400">
                                    {role.slug}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 text-xs font-bold">
                                👥 {t('roles.pages.show.users_count', { count: role.users.length })}
                            </span>
                            <span className="rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1.5 text-xs font-bold">
                                🔑 {t('roles.pages.show.permissions_title', { count: role.permissions.length })}
                            </span>
                        </div>
                    </div>

                    {role.description && (
                        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-600 dark:text-slate-300">
                            {role.description}
                        </div>
                    )}
                </div>

                {/* Permissions Breakdown by Module */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                        🔑 {t('roles.pages.show.permissions_title', { count: role.permissions.length })}
                    </h4>

                    {Object.keys(permissionsByModule).length === 0 ? (
                        <p className="text-xs text-slate-500">{t('roles.pages.show.permissions_empty')}</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                                <div key={module} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-2">
                                    <h5 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                        🧩 {modules[module] || module}
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                        {modulePermissions.map((permission) => (
                                            <span
                                                key={permission.id}
                                                className="inline-flex items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-semibold"
                                            >
                                                {actions[permission.action] || permission.action}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Users Assigned to this Role */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                        👥 {t('roles.pages.show.users_title', { count: role.users.length })}
                    </h4>

                    {role.users.length === 0 ? (
                        <p className="text-xs text-slate-500">{t('roles.pages.show.users_empty')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            {t('roles.pages.index.columns.role')}
                                        </th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-right font-bold text-slate-400 uppercase tracking-wider">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-white">
                                    {role.users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                                <Link
                                                    href={prefixedRoute('users.show', user.id)}
                                                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                                >
                                                    {t('roles.pages.show.view_user')} ↗
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

