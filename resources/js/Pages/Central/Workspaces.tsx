import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface WorkspaceRole {
    id?: number;
    name: string;
    slug: string;
}

interface Workspace {
    id: string;
    name: string;
    status: string;
    plan_key?: string | null;
    plan_name?: string | null;
    plan_badge?: string | null;
    domain: string | null;
    trial_ends_at?: string | null;
    trial_days_left?: number;
    is_on_trial?: boolean;
    roles?: WorkspaceRole[];
}

function getRoleBadgeStyle(slug: string): string {
    switch (slug) {
        case 'admin':
            return 'bg-rose-50 text-rose-700 border border-rose-200';
        case 'user':
            return 'bg-sky-50 text-sky-700 border border-sky-200';
        case 'warehouse_head':
        case 'warehouse_manager':
            return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'fleet_base_head':
        case 'fleet_base_manager':
        case 'driver':
            return 'bg-purple-50 text-purple-700 border border-purple-200';
        case 'salesperson':
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        default:
            return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    }
}

interface IncomingInvitation {
    id: number;
    token: string;
    tenant_name: string;
    role_slug: string;
    expires_at: string;
    accept_url: string;
}

interface Props {
    workspaces: Workspace[];
    invitations?: IncomingInvitation[];
    settings?: Record<string, string>;
}

export default function Workspaces({ workspaces, invitations = [], settings }: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const { auth } = usePage().props as { auth?: { user?: { email?: string; name?: string } } };
    const [invitationToDecline, setInvitationToDecline] = useState<IncomingInvitation | null>(null);
    const [showDeclineDialog, setShowDeclineDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [acceptingToken, setAcceptingToken] = useState<string | null>(null);

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];

    return (
        <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
            <Head title={t('central.workspaces.title')} />

            <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
                    <a href="/" className="flex min-w-0 items-center gap-2.5">
                        {siteLogo ? (
                            <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
                        ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-sm shadow-teal-600/20">
                                <span className="material-symbols-outlined text-[20px]">hub</span>
                            </span>
                        )}
                        <span className="truncate font-display text-lg font-bold tracking-tight text-slate-900">
                            {siteName}
                        </span>
                    </a>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <LanguageSwitcher
                            compact
                            className="bg-slate-100 [&_button]:text-slate-500 [&_button.bg-white]:text-teal-800"
                        />
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            type="button"
                            className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-700"
                        >
                            {t('shell.log_out')}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative isolate flex-1 overflow-hidden bg-slate-50">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl" />
                    <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
                    <div className="absolute left-1/3 top-1/2 h-40 w-40 rounded-full bg-emerald-100/50 blur-2xl" />
                </div>

                <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
                    <div className="mb-10 max-w-xl">
                        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                            {siteName}
                        </p>
                        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            {t('central.workspaces.title')}
                        </h1>
                        <p className="mt-3 text-base text-slate-600">
                            {t('central.workspaces.subtitle')}
                        </p>
                        {auth?.user?.email && (
                            <p className="mt-2 text-sm text-slate-500">
                                {t('central.workspaces.signed_in_as')}{' '}
                                <span className="font-medium text-slate-700">{auth.user.email}</span>
                            </p>
                        )}
                    </div>

                    {/* Incoming Invitations Banner */}
                    {invitations.length > 0 && (
                        <div className="mb-8 rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 p-6 shadow-sm shadow-indigo-100 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 text-lg">
                                    ✉️
                                </span>
                                <div>
                                    <h2 className="font-display text-lg font-bold text-slate-900">
                                        {t('central.invitation.incoming_title')}
                                    </h2>
                                    <p className="text-xs text-slate-600">
                                        {t('central.invitation.incoming_desc', { count: invitations.length })}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {invitations.map((inv) => {
                                    const isAccepting = acceptingToken === inv.token;

                                    return (
                                        <div
                                            key={inv.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-900 text-sm">
                                                        {inv.tenant_name}
                                                    </span>
                                                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                                        {t('central.invitation.incoming_role', { role: inv.role_slug })}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {t('central.invitation.incoming_expires', {
                                                        date: new Date(inv.expires_at).toLocaleDateString(localeTag, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }),
                                                    })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={isAccepting || processing}
                                                    onClick={() => {
                                                        setAcceptingToken(inv.token);
                                                        router.post(`/invitations/${inv.token}`, {}, {
                                                            onFinish: () => setAcceptingToken(null),
                                                        });
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition"
                                                >
                                                    {isAccepting ? '...' : t('central.invitation.btn_accept')}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isAccepting || processing}
                                                    onClick={() => {
                                                        setInvitationToDecline(inv);
                                                        setShowDeclineDialog(true);
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition"
                                                >
                                                    {t('central.invitation.btn_decline')}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {workspaces.length > 0 ? (
                        <ul className="space-y-3">
                            {workspaces.map((workspace) => {
                                const active = workspace.status === 'active';
                                const onTrial = workspace.is_on_trial && active;

                                return (
                                    <li key={workspace.id}>
                                        {onTrial ? (
                                            <div className="rounded-2xl border border-cyan-200/80 bg-white/90 p-5 shadow-sm shadow-cyan-200/60 backdrop-blur-sm">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-500 text-base font-bold text-white shadow-sm shadow-cyan-600/20">
                                                            {workspace.name.charAt(0).toUpperCase()}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="truncate font-semibold text-slate-900">
                                                                    {workspace.name}
                                                                </p>
                                                                <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800">
                                                                    {workspace.plan_name || 'Trial'}
                                                                </span>
                                                                {workspace.roles?.map((role) => (
                                                                    <span
                                                                        key={role.id ? `${role.id}-${role.slug}` : role.slug}
                                                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeStyle(role.slug)}`}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[12px]">
                                                                            {role.slug === 'admin' ? 'shield_person' : 'person'}
                                                                        </span>
                                                                        <span>{role.name}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            {workspace.domain && (
                                                                <p className="truncate text-sm text-slate-500">
                                                                    {workspace.domain}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200">
                                                            {t('central.trial.days_left', { days: String(workspace.trial_days_left ?? 0) })}
                                                        </span>
                                                        <a
                                                            href={route('central.workspaces.enter', workspace.id)}
                                                            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800"
                                                        >
                                                            {t('central.trial.enter_workspace')}
                                                        </a>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs text-slate-500">
                                                    {t('central.trial.trial_info', { plan: workspace.plan_name || 'Trial' })}
                                                </p>
                                            </div>
                                        ) : active ? (
                                            <a
                                                href={route('central.workspaces.enter', workspace.id)}
                                                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-200/60 backdrop-blur-sm transition hover:border-teal-300 hover:shadow-md hover:shadow-teal-700/10"
                                            >
                                                <div className="flex min-w-0 items-center gap-4">
                                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-base font-bold text-white shadow-sm shadow-teal-600/20">
                                                        {workspace.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="truncate font-semibold text-slate-900">
                                                                {workspace.name}
                                                            </p>
                                                            {workspace.plan_name && (
                                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                                                    {workspace.plan_name}
                                                                </span>
                                                            )}
                                                            {workspace.plan_key === 'free' && (
                                                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                                    Free Lifetime
                                                                </span>
                                                            )}
                                                            {workspace.roles?.map((role) => (
                                                                <span
                                                                    key={role.id ? `${role.id}-${role.slug}` : role.slug}
                                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeStyle(role.slug)}`}
                                                                >
                                                                    <span className="material-symbols-outlined text-[12px]">
                                                                        {role.slug === 'admin' ? 'shield_person' : 'person'}
                                                                    </span>
                                                                    <span>{role.name}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {workspace.domain && (
                                                            <p className="truncate text-sm text-slate-500">
                                                                {workspace.domain}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition group-hover:bg-teal-800">
                                                    {t('central.workspaces.enter')}
                                                </span>
                                            </a>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-200/60 backdrop-blur-sm">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-500">
                                                            {workspace.name.charAt(0).toUpperCase()}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="truncate font-semibold text-slate-700">
                                                                    {workspace.name}
                                                                </p>
                                                                {workspace.roles?.map((role) => (
                                                                    <span
                                                                        key={role.id ? `${role.id}-${role.slug}` : role.slug}
                                                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeStyle(role.slug)}`}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[12px]">
                                                                            {role.slug === 'admin' ? 'shield_person' : 'person'}
                                                                        </span>
                                                                        <span>{role.name}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            {workspace.domain && (
                                                                <p className="truncate text-sm text-slate-400">
                                                                    {workspace.domain}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                                                            {t('central.workspaces.suspended')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center shadow-sm">
                            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                                <span className="material-symbols-outlined">apartment</span>
                            </span>
                            <p className="font-semibold text-slate-800">{t('central.workspaces.empty_title')}</p>
                            <p className="mt-1 text-sm text-slate-500">{t('central.workspaces.empty_hint')}</p>
                            <Link
                                href={route('central.onboarding.show')}
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800"
                            >
                                {t('central.workspaces.create_workspace')}
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <ConfirmDeleteDialog
                show={showDeclineDialog}
                onClose={() => {
                    setShowDeclineDialog(false);
                    setInvitationToDecline(null);
                }}
                onConfirm={() => {
                    if (!invitationToDecline) return;
                    setProcessing(true);
                    router.post(
                        `/invitations/${invitationToDecline.token}/decline`,
                        {},
                        {
                            onSuccess: () => {
                                setShowDeclineDialog(false);
                                setInvitationToDecline(null);
                            },
                            onFinish: () => setProcessing(false),
                        }
                    );
                }}
                processing={processing}
                title={t('central.invitation.decline_confirm_title')}
                message={
                    invitationToDecline
                        ? t('central.invitation.decline_confirm_message', { tenant: invitationToDecline.tenant_name })
                        : ''
                }
            />
        </div>
    );
}
