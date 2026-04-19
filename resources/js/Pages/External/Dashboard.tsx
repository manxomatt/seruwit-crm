import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head } from '@inertiajs/react';

interface Props {
    user: {
        name: string;
        email: string;
        username: string;
    };
    primaryRole: {
        name: string;
        slug: string;
    } | null;
}

export default function Dashboard({ user, primaryRole }: Props): JSX.Element {
    return (
        <DynamicLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    {primaryRole ? `${primaryRole.name} Dashboard` : 'Dashboard'}
                </h2>
            }
        >
            <Head title={primaryRole ? `${primaryRole.name} Dashboard` : 'Dashboard'} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <h3 className="mb-2 text-lg font-medium">Welcome, {user.name}!</h3>
                    <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                </div>
            </div>
        </DynamicLayout>
    );
}
