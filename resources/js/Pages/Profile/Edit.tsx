import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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

interface AvailableLocale {
    code: string;
    label: string;
}

interface Props {
    mustVerifyEmail?: boolean;
    status?: string;
    profile?: UserProfile | null;
}

const LOCALE_FLAGS: Record<string, string> = {
    en: '🇬🇧',
    id: '🇮🇩',
};

const UserIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const LockIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const SubscriptionIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3m-3 3h3m-3 3h3m-9-9.75h.375c.621 0 1.125.504 1.125 1.125v.375m0 0h5.25m-5.25 0v.375c0 .621.504 1.125 1.125 1.125h.375m-9-9.75v.375c0 .621.504 1.125 1.125 1.125h.375m0 0h5.25m-5.25 0v.375c0 .621.504 1.125 1.125 1.125h.375M7.5 21h9a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0016.5 3h-9a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21z" />
    </svg>
);

const CameraIcon = () => (
    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

export default function Edit({ mustVerifyEmail, status, profile }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const pageProps = usePage().props as unknown as {
        auth: { user: { id: number; name: string; email: string; locale?: string; email_verified_at?: string | null } };
        availableLocales?: AvailableLocale[];
        flash?: { success?: string | null; error?: string | null; warning?: string | null };
        currentTenant?: { id: string } | null;
    };
    const isCentral = !pageProps.currentTenant;
    const user = pageProps.auth.user;
    const availableLocales = pageProps.availableLocales ?? [];
    const flash = pageProps.flash;
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription' | 'delete'>('profile');
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const localeOptions = availableLocales.map((item) => ({
        value: item.code,
        label: `${LOCALE_FLAGS[item.code] ?? '🌐'}  ${item.label}`,
    }));

    // Profile form
    const profileForm = useForm({
        name: user.name,
        email: user.email,
        locale: user.locale ?? 'id',
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
        profileForm.patch(route('module.profile.update'));
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            onSuccess: () => passwordForm.reset(),
        });
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();
        deleteForm.delete(route('module.profile.destroy'));
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

            router.post(route('module.profile.avatar.update'), formData, {
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
        router.delete(route('module.profile.avatar.destroy'), {
            onSuccess: () => {
                setAvatarPreview(null);
            },
        });
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const tabs = [
        { id: 'profile' as const, name: t('profile.tabs.profile'), icon: <UserIcon /> },
        { id: 'password' as const, name: t('profile.tabs.password'), icon: <LockIcon /> },
        ...(!isCentral ? [{ id: 'subscription' as const, name: 'Subscription', icon: <SubscriptionIcon /> }] : []),
        { id: 'delete' as const, name: t('profile.tabs.delete'), icon: <TrashIcon /> },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('profile.settings_title')}
                    description={t('profile.settings_subtitle')}
                    actions={
                        <Link href={prefixedRoute('dashboard')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs">
                                ← {t('profile.back_to_dashboard')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('profile.settings_title')} />

            {flash?.success && (
                <div className="mb-6 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    ✅ {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 rounded-2xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/40 p-4 text-xs font-bold text-rose-800 dark:text-rose-300">
                    ⚠️ {flash.error}
                </div>
            )}
            {flash?.warning && (
                <div className="mb-6 rounded-2xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/40 p-4 text-xs font-bold text-amber-800 dark:text-amber-300">
                    🔔 {flash.warning}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        {/* User Avatar */}
                        <div className="flex flex-col items-center pb-6 border-b border-slate-100 dark:border-slate-800/60">
                            <div className="relative group">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt={user?.name}
                                        className="h-24 w-24 rounded-full object-cover shadow-md ring-4 ring-slate-100 dark:ring-slate-800"
                                    />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-slate-800">
                                        <span className="text-3xl font-extrabold text-white">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={triggerFileInput}
                                    className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <CameraIcon />
                                    <span className="sr-only">{t('profile.avatar.change')}</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{user?.name}</h3>
                            <p className="text-xs font-mono text-slate-400 mt-0.5">{user?.email}</p>
                            {avatarPreview && (
                                <button
                                    type="button"
                                    onClick={removeAvatar}
                                    className="mt-3 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                                >
                                    🗑️ {t('profile.avatar.remove')}
                                </button>
                            )}
                            {avatarForm.errors.avatar && (
                                <p className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">{avatarForm.errors.avatar}</p>
                            )}
                            {status === 'avatar-updated' && (
                                <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('profile.avatar.updated')}</p>
                            )}
                            {status === 'avatar-removed' && (
                                <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('profile.avatar.removed')}</p>
                            )}
                        </div>

                        {/* Navigation Tabs */}
                        <nav className="mt-6 space-y-1.5">
                            {tabs.map((tab) => {
                                const active = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-150 ${
                                            active
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className={`flex h-7 w-7 items-center justify-center rounded-xl transition ${
                                            active
                                                ? 'text-white dark:text-slate-900'
                                                : 'text-slate-400'
                                        }`}>
                                            {tab.icon}
                                        </span>
                                        <span className="truncate">{tab.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="lg:col-span-3">
                    {/* Profile Information Tab */}
                    {activeTab === 'profile' && (
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                    <UserIcon />
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t('profile.information')}</h2>
                                    <p className="text-xs text-slate-400">{t('profile.information_help')}</p>
                                </div>
                            </div>

                            <form onSubmit={submitProfile} className="max-w-xl space-y-6">
                                <div>
                                    <InputLabel htmlFor="name" value={t('profile.name')} />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full !rounded-2xl text-xs"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        required
                                        isFocused
                                        autoComplete="name"
                                    />
                                    <InputError className="mt-2" message={profileForm.errors.name} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="profile_email" value={t('profile.email')} />
                                    <TextInput
                                        id="profile_email"
                                        type="email"
                                        className="mt-1 block w-full !rounded-2xl text-xs font-mono"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        required
                                        autoComplete="username"
                                    />
                                    <InputError className="mt-2" message={profileForm.errors.email} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="profile_locale" value={t('profile.language')} />
                                    <Select
                                        id="profile_locale"
                                        className="mt-1 block w-full"
                                        value={profileForm.data.locale}
                                        onChange={(value) => profileForm.setData('locale', value)}
                                        placeholder={t('profile.select_language', undefined, 'Pilih bahasa')}
                                        options={localeOptions}
                                    />
                                    <p className="mt-1 text-xs text-slate-400">{t('profile.language_help')}</p>
                                    <InputError className="mt-2" message={profileForm.errors.locale as string | undefined} />
                                </div>

                                {mustVerifyEmail && user.email_verified_at === null && (
                                    <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/40 p-4">
                                        <div className="flex gap-3">
                                            <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                                            <div>
                                                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                                    {t('profile.email_unverified')}{' '}
                                                    <Link
                                                        href={route('verification.send')}
                                                        method="post"
                                                        as="button"
                                                        className="font-bold underline hover:text-amber-900 dark:hover:text-amber-200"
                                                    >
                                                        {t('profile.resend_verification')}
                                                    </Link>
                                                </p>
                                                {status === 'verification-link-sent' && (
                                                    <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {t('profile.verification_sent')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-2">
                                    <PrimaryButton disabled={profileForm.processing} className="!rounded-xl text-xs shadow-sm">
                                        💾 {t('profile.save_changes')}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Update Password Tab */}
                    {activeTab === 'password' && (
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                                    <LockIcon />
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t('profile.password.title')}</h2>
                                    <p className="text-xs text-slate-400">{t('profile.password.help')}</p>
                                </div>
                            </div>

                            <form onSubmit={submitPassword} className="max-w-xl space-y-6">
                                <div>
                                    <InputLabel htmlFor="current_password" value={t('profile.password.current')} />
                                    <TextInput
                                        id="current_password"
                                        type="password"
                                        className="mt-1 block w-full !rounded-2xl text-xs"
                                        value={passwordForm.data.current_password}
                                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <InputError className="mt-2" message={passwordForm.errors.current_password} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value={t('profile.password.new')} />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        className="mt-1 block w-full !rounded-2xl text-xs"
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <InputError className="mt-2" message={passwordForm.errors.password} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value={t('profile.password.confirm')} />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        className="mt-1 block w-full !rounded-2xl text-xs"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <InputError className="mt-2" message={passwordForm.errors.password_confirmation} />
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <PrimaryButton disabled={passwordForm.processing} className="!rounded-xl text-xs shadow-sm">
                                        🔒 {t('profile.password.update')}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 'subscription' && (
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                                    <SubscriptionIcon />
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Subscription</h2>
                                    <p className="text-xs text-slate-400">Manage your workspace subscription and billing</p>
                                </div>
                            </div>

                            <div className="max-w-xl">
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                                    Manage your workspace subscription, view active limits, and request plan upgrades.
                                </p>
                                <Link
                                    href={route('module.subscription.index')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                                >
                                    <SubscriptionIcon />
                                    Go to Subscription →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Delete Account Tab */}
                    {activeTab === 'delete' && (
                        <div className="rounded-3xl border border-rose-200/60 dark:border-rose-800/50 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                                    <TrashIcon />
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-rose-950 dark:text-rose-200">{t('profile.delete.title')}</h2>
                                    <p className="text-xs text-slate-400">{t('profile.delete.help')}</p>
                                </div>
                            </div>

                            <div className="max-w-xl">
                                <div className="rounded-2xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/60 dark:bg-rose-950/20 p-4 mb-6">
                                    <div className="flex gap-3">
                                        <span className="text-rose-600 dark:text-rose-400">⚠️</span>
                                        <div>
                                            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200">{t('profile.delete.warning_title')}</h3>
                                            <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                                                {t('profile.delete.warning_message')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {!confirmingDeletion ? (
                                    <DangerButton
                                        type="button"
                                        onClick={() => setConfirmingDeletion(true)}
                                        className="!rounded-xl text-xs shadow-sm"
                                    >
                                        🗑️ {t('profile.delete.action')}
                                    </DangerButton>
                                ) : (
                                    <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/40 p-4">
                                        <p className="text-xs font-bold text-rose-900 dark:text-rose-200 mb-4">
                                            {t('profile.delete.confirm_message')}
                                        </p>
                                        <form onSubmit={deleteUser}>
                                            <div className="flex items-center gap-3">
                                                <DangerButton disabled={deleteForm.processing} className="!rounded-xl text-xs">
                                                    🚫 {t('profile.delete.confirm_action')}
                                                </DangerButton>
                                                <SecondaryButton
                                                    type="button"
                                                    onClick={() => setConfirmingDeletion(false)}
                                                    className="!rounded-xl text-xs"
                                                >
                                                    {t('common.cancel')}
                                                </SecondaryButton>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
