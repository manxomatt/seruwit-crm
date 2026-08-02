import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';

interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
    };
    primaryRole: {
        name: string;
        slug: string;
    } | null;
}

export default function Dashboard({ user, primaryRole }: Props): JSX.Element {
    const { t } = useTrans();
    const { auth } = usePage().props as any;
    const permissions = auth.user?.permissions || {};
    const permissionModules = Object.keys(permissions);
    const title = primaryRole ? t('dashboard.title_with_role', { role: primaryRole.name }) : t('dashboard.title');

    return (
        <DynamicLayout
            header={<PageHeader title={title} />}
        >
            <Head title={title} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Welcome Card */}
                <div className="col-span-full overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        <h3 className="text-lg font-medium mb-4">
                            {t('dashboard.welcome', { name: user.name })}
                        </h3>
                        <p className="text-gray-600 mb-2">
                            {t('dashboard.email')}: {user.email}
                        </p>
                        <p className="text-gray-600 mb-2">
                            {t('dashboard.roles')}: {user.roles.join(', ')}
                        </p>
                        {primaryRole && (
                            <p className="text-gray-600">
                                {t('dashboard.primary_role')}: {primaryRole.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Permissions Overview Card */}
                <div className="col-span-full overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('dashboard.permissions.title')}
                        </h3>
                        {permissionModules.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {permissionModules.map((module) => (
                                    <div key={module} className="border rounded-lg p-4">
                                        <h4 className="font-medium text-gray-800 capitalize mb-2">
                                            {module.replace('-', ' ')}
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {permissions[module].map((action: string) => (
                                                <span
                                                    key={action}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                                                >
                                                    {action}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">
                                {t('dashboard.permissions.empty')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
