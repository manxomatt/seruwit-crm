import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link } from '@inertiajs/react';

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
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Role Details: {role.name}
                    </h2>
                    <div className="flex gap-2">
                        {!role.is_system && (
                            <Link href={route('admin.roles.edit', role.id)}>
                                <PrimaryButton>Edit Role</PrimaryButton>
                            </Link>
                        )}
                        <Link href={route('admin.roles.index')}>
                            <SecondaryButton>Back to Roles</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Role: ${role.name}`} />

            <div className="space-y-6">
                {/* Role Information */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Information</h3>
                        
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{role.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Slug</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">{role.slug}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Type</dt>
                                <dd className="mt-1">
                                    {role.is_system ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            System Role
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Custom Role
                                        </span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Users</dt>
                                <dd className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {role.users.length} user(s)
                                    </span>
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {role.description || 'No description provided'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(role.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(role.updated_at)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Permissions */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Permissions ({role.permissions.length})
                        </h3>
                        
                        {Object.keys(permissionsByModule).length === 0 ? (
                            <p className="text-sm text-gray-500">No permissions assigned to this role.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                                    <div key={module} className="border rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            {modules[module] || module}
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {modulePermissions.map((permission) => (
                                                <span
                                                    key={permission.id}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
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
                </div>

                {/* Users with this role */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Users with this Role ({role.users.length})
                        </h3>
                        
                        {role.users.length === 0 ? (
                            <p className="text-sm text-gray-500">No users have been assigned this role.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {role.users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 flex-shrink-0">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                                                <span className="text-xs font-medium text-white">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link
                                                        href={route('admin.users.show', user.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        View User
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
            </div>
        </AdminLayout>
    );
}
