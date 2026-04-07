import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, usePage } from '@inertiajs/react';

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
    const { auth } = usePage().props as any;
    const permissions = auth.user?.permissions || {};
    const permissionModules = Object.keys(permissions);

    return (
        <DynamicLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {primaryRole ? `${primaryRole.name} Dashboard` : 'Module Dashboard'}
                </h2>
            }
        >
            <Head title={primaryRole ? `${primaryRole.name} Dashboard` : 'Module Dashboard'} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Welcome Card */}
                <div className="col-span-full overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        <h3 className="text-lg font-medium mb-4">
                            Welcome, {user.name}!
                        </h3>
                        <p className="text-gray-600 mb-2">
                            Email: {user.email}
                        </p>
                        <p className="text-gray-600 mb-2">
                            Roles: {user.roles.join(', ')}
                        </p>
                        {primaryRole && (
                            <p className="text-gray-600">
                                Primary Role: {primaryRole.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Permissions Overview Card */}
                <div className="col-span-full overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Your Permissions
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
                                No specific permissions assigned. Contact an administrator for access.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
