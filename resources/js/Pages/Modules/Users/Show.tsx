import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/Components/PageHeader';

interface Role {
    id: number;
    name: string;
    slug: string;
}

interface UserProfile {
    id: number;
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    avatar_url: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    profile: UserProfile | null;
}

interface Props {
    user: User;
}

export default function Show({ user }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openDeleteDialog = () => {
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
    };

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('users.destroy', user.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const getUserFullName = () => {
        if (user.profile?.first_name || user.profile?.last_name) {
            return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim();
        }
        return user.name;
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('users.pages.show.head')}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={prefixedRoute('users.edit', user.id)}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    ✏️ {t('users.actions.edit_user')}
                                </PrimaryButton>
                            </Link>
                            <DangerButton onClick={openDeleteDialog} className="!rounded-xl text-xs shadow-sm">
                                🗑️ {t('users.actions.delete_user')}
                            </DangerButton>
                            <Link href={prefixedRoute('users.index')}>
                                <SecondaryButton className="!rounded-xl text-xs">
                                    ← {t('users.pages.show.back')}
                                </SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('users.pages.show.title', { name: user.name })} />

            <div className="space-y-6">
                {/* Hero User Banner Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {user.profile?.avatar_url ? (
                                <img
                                    src={user.profile.avatar_url}
                                    alt={user.name}
                                    className="h-20 w-20 rounded-2xl object-cover shadow-md border border-slate-200 dark:border-slate-800"
                                />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl text-white font-bold shadow-md">
                                    {user.profile?.first_name?.charAt(0)?.toUpperCase() || user.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        {getUserFullName()}
                                    </h3>
                                    {user.email_verified_at ? (
                                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                                            ✅ {t('users.pages.show.email_verified')}
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[10px] font-bold">
                                            ⏳ {t('users.pages.show.email_not_verified')}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 font-mono text-xs text-slate-400">
                                    {user.email}
                                </p>
                                {user.profile?.phone_number && (
                                    <p className="mt-1 text-xs text-slate-500 font-mono">
                                        📞 {user.profile.phone_number}
                                    </p>
                                )}
                            </div>
                        </div>

                        {user.roles && user.roles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 sm:justify-end">
                                {user.roles.map((role) => (
                                    <span
                                        key={role.id}
                                        className="rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3 py-1 text-xs font-bold"
                                    >
                                        🛡️ {role.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile & Account Details Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Profile Information */}
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                            👤 {t('users.sections.profile_information')}
                        </h4>
                        <dl className="grid grid-cols-1 gap-4 text-xs">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                <dt className="text-slate-400 font-medium">{t('users.fields.first_name')}</dt>
                                <dd className="font-bold text-slate-900 dark:text-white">{user.profile?.first_name || '-'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                <dt className="text-slate-400 font-medium">{t('users.fields.last_name')}</dt>
                                <dd className="font-bold text-slate-900 dark:text-white">{user.profile?.last_name || '-'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                <dt className="text-slate-400 font-medium">{t('users.fields.phone_number')}</dt>
                                <dd className="font-bold font-mono text-slate-900 dark:text-white">{user.profile?.phone_number || '-'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-400 font-medium">{t('users.fields.avatar_url')}</dt>
                                <dd className="font-mono text-slate-500 truncate max-w-[180px]">{user.profile?.avatar_url || '-'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Account Details */}
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                            ⚙️ {t('users.sections.account_details')}
                        </h4>
                        <dl className="grid grid-cols-1 gap-4 text-xs">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                <dt className="text-slate-400 font-medium">{t('users.pages.show.user_id')}</dt>
                                <dd className="font-mono font-bold text-slate-900 dark:text-white">#{user.id}</dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                <dt className="text-slate-400 font-medium">{t('users.pages.show.username')}</dt>
                                <dd className="font-bold text-slate-900 dark:text-white">{user.name}</dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                <dt className="text-slate-400 font-medium">{t('users.pages.show.created_at')}</dt>
                                <dd className="text-slate-700 dark:text-slate-300">{formatDate(user.created_at)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-400 font-medium">{t('users.pages.show.updated_at')}</dt>
                                <dd className="text-slate-700 dark:text-slate-300">{formatDate(user.updated_at)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('users.delete_confirm.title')}
                message={t('users.delete_confirm.message', { name: user.name, email: user.email })}
            />
        </DynamicLayout>
    );
}

