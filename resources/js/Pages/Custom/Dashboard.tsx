import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

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
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {primaryRole ? `${primaryRole.name} Dashboard` : 'Custom Dashboard'}
                </h2>
            }
        >
            <Head title={primaryRole ? `${primaryRole.name} Dashboard` : 'Custom Dashboard'} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
