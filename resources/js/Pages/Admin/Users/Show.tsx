import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    user: User;
}

export default function Show({ user }: Props): JSX.Element {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const deleteUser = () => {
        if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
            router.delete(route('admin.users.destroy', user.id));
        }
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        User Details
                    </h2>
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.users.edit', user.id)}>
                            <PrimaryButton>Edit User</PrimaryButton>
                        </Link>
                        <DangerButton onClick={deleteUser}>Delete User</DangerButton>
                    </div>
                </div>
            }
        >
            <Head title={`User - ${user.name}`} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="mt-2">
                                {user.email_verified_at ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Email Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Email Not Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email Verified At</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {user.email_verified_at ? formatDate(user.email_verified_at) : 'Not verified'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(user.updated_at)}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Back Button */}
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <Link href={route('admin.users.index')}>
                            <SecondaryButton>Back to Users</SecondaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
