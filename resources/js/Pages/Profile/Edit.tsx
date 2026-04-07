import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useState, useRef, ChangeEvent } from 'react';

interface UserProfile {
    id: number;
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    avatar_url: string | null;
}

interface Props {
    mustVerifyEmail?: boolean;
    status?: string;
    profile?: UserProfile | null;
}

const UserIcon = () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const LockIcon = () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const CameraIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

export default function Edit({ mustVerifyEmail, status, profile }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const user = (usePage().props as any).auth.user;
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'delete'>('profile');
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile form
    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    // Avatar form
    const avatarForm = useForm<{ avatar: File | null }>({
        avatar: null,
    });

    // Password form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Delete form
    const deleteForm = useForm({});

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'));
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            onSuccess: () => passwordForm.reset(),
        });
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();
        deleteForm.delete(route('profile.destroy'));
    };

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload
            const formData = new FormData();
            formData.append('avatar', file);

            router.post(route('profile.avatar.update'), formData, {
                forceFormData: true,
                onSuccess: () => {
                    avatarForm.reset();
                },
                onError: (errors) => {
                    avatarForm.setError('avatar', errors.avatar);
                    setAvatarPreview(profile?.avatar_url || null);
                },
            });
        }
    };

    const removeAvatar = () => {
        router.delete(route('profile.avatar.destroy'), {
            onSuccess: () => {
                setAvatarPreview(null);
            },
        });
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const tabs = [
        { id: 'profile' as const, name: 'Profile Information', icon: <UserIcon /> },
        { id: 'password' as const, name: 'Update Password', icon: <LockIcon /> },
        { id: 'delete' as const, name: 'Delete Account', icon: <TrashIcon /> },
    ];

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Profile Settings
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your account settings and preferences
                        </p>
                    </div>
                    <Link
                        href={prefixedRoute('dashboard')}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Profile Settings" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="p-4">
                            {/* User Avatar */}
                            <div className="flex flex-col items-center pb-4 border-b border-gray-100">
                                <div className="relative group">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={user?.name}
                                            className="h-20 w-20 rounded-full object-cover shadow-lg"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                            <span className="text-2xl font-bold text-white">
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={triggerFileInput}
                                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <CameraIcon />
                                        <span className="sr-only">Change avatar</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </div>
                                <h3 className="mt-3 text-lg font-semibold text-gray-900">{user?.name}</h3>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                                    >
                                        Remove avatar
                                    </button>
                                )}
                                {avatarForm.errors.avatar && (
                                    <p className="mt-2 text-xs text-red-600">{avatarForm.errors.avatar}</p>
                                )}
                                {status === 'avatar-updated' && (
                                    <p className="mt-2 text-xs text-green-600">Avatar updated successfully.</p>
                                )}
                                {status === 'avatar-removed' && (
                                    <p className="mt-2 text-xs text-green-600">Avatar removed successfully.</p>
                                )}
                            </div>

                            {/* Navigation Tabs */}
                            <nav className="mt-4 space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                            activeTab === tab.id
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg ${
                                            activeTab === tab.id
                                                ? 'bg-indigo-600'
                                                : tab.id === 'delete' ? 'bg-red-500' : 'bg-gray-400'
                                        }`}>
                                            {tab.icon}
                                        </span>
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* Profile Information Tab */}
                    {activeTab === 'profile' && (
                        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <div className="flex items-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
                                        <UserIcon />
                                    </div>
                                    <div className="ml-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                                        <p className="text-sm text-gray-500">Update your account's profile information and email address.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <form onSubmit={submitProfile} className="max-w-xl space-y-6">
                                    <div>
                                        <InputLabel htmlFor="name" value="Name" />
                                        <TextInput
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={profileForm.data.name}
                                            onChange={(e) => profileForm.setData('name', e.target.value)}
                                            required
                                            isFocused
                                            autoComplete="name"
                                        />
                                        <InputError className="mt-2" message={profileForm.errors.name} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="Email" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={profileForm.data.email}
                                            onChange={(e) => profileForm.setData('email', e.target.value)}
                                            required
                                            autoComplete="username"
                                        />
                                        <InputError className="mt-2" message={profileForm.errors.email} />
                                    </div>

                                    {mustVerifyEmail && user.email_verified_at === null && (
                                        <div className="rounded-lg bg-yellow-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-700">
                                                        Your email address is unverified.{' '}
                                                        <Link
                                                            href={route('verification.send')}
                                                            method="post"
                                                            as="button"
                                                            className="font-medium text-yellow-700 underline hover:text-yellow-600"
                                                        >
                                                            Click here to re-send the verification email.
                                                        </Link>
                                                    </p>
                                                    {status === 'verification-link-sent' && (
                                                        <p className="mt-2 text-sm font-medium text-green-600">
                                                            A new verification link has been sent to your email address.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <PrimaryButton disabled={profileForm.processing}>
                                            Save Changes
                                        </PrimaryButton>

                                        <Transition
                                            show={profileForm.recentlySuccessful}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in-out"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm text-green-600">Saved successfully.</p>
                                        </Transition>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Update Password Tab */}
                    {activeTab === 'password' && (
                        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <div className="flex items-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                                        <LockIcon />
                                    </div>
                                    <div className="ml-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Update Password</h2>
                                        <p className="text-sm text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <form onSubmit={submitPassword} className="max-w-xl space-y-6">
                                    <div>
                                        <InputLabel htmlFor="current_password" value="Current Password" />
                                        <TextInput
                                            id="current_password"
                                            type="password"
                                            className="mt-1 block w-full"
                                            value={passwordForm.data.current_password}
                                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                            required
                                            autoComplete="current-password"
                                        />
                                        <InputError className="mt-2" message={passwordForm.errors.current_password} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="New Password" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            className="mt-1 block w-full"
                                            value={passwordForm.data.password}
                                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <InputError className="mt-2" message={passwordForm.errors.password} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            className="mt-1 block w-full"
                                            value={passwordForm.data.password_confirmation}
                                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <InputError className="mt-2" message={passwordForm.errors.password_confirmation} />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <PrimaryButton disabled={passwordForm.processing}>
                                            Update Password
                                        </PrimaryButton>

                                        <Transition
                                            show={passwordForm.recentlySuccessful}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in-out"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm text-green-600">Password updated successfully.</p>
                                        </Transition>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Delete Account Tab */}
                    {activeTab === 'delete' && (
                        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <div className="flex items-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
                                        <TrashIcon />
                                    </div>
                                    <div className="ml-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
                                        <p className="text-sm text-gray-500">Permanently delete your account and all associated data.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="max-w-xl">
                                    <div className="rounded-lg bg-red-50 p-4 mb-6">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">Warning</h3>
                                                <p className="mt-1 text-sm text-red-700">
                                                    Once your account is deleted, all of its resources and data will be permanently deleted. 
                                                    Before deleting your account, please download any data or information that you wish to retain.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {!confirmingDeletion ? (
                                        <SecondaryButton
                                            onClick={() => setConfirmingDeletion(true)}
                                            className="border-red-300 text-red-700 hover:bg-red-50"
                                        >
                                            Delete Account
                                        </SecondaryButton>
                                    ) : (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                            <p className="text-sm text-red-700 mb-4">
                                                Are you sure you want to delete your account? This action cannot be undone.
                                            </p>
                                            <form onSubmit={deleteUser}>
                                                <div className="flex items-center gap-4">
                                                    <DangerButton disabled={deleteForm.processing}>
                                                        Yes, Delete My Account
                                                    </DangerButton>
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() => setConfirmingDeletion(false)}
                                                    >
                                                        Cancel
                                                    </SecondaryButton>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
