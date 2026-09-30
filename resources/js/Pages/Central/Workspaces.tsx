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
            return 'bg-rose-50 text-rose-700 border border-rose-200/80';
        case 'user':
            return 'bg-sky-50 text-sky-700 border border-sky-200/80';
        case 'warehouse_head':
        case 'warehouse_manager':
            return 'bg-amber-50 text-amber-700 border border-amber-200/80';
        case 'fleet_base_head':
        case 'fleet_base_manager':
        case 'driver':
            return 'bg-purple-50 text-purple-700 border border-purple-200/80';
        case 'salesperson':
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
        default:
            return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80';
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
        <>
            <Head title={t('central.workspaces.title', undefined, 'Pusat Ruang Kerja')} />

            <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/70 text-slate-800 selection:bg-indigo-500 selection:text-white">
                {/* Ambient background glow effects */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-sky-300/25 blur-[120px]" />
                    <div className="absolute -right-28 -bottom-28 h-96 w-96 rounded-full bg-indigo-300/25 blur-[120px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-emerald-200/20 blur-[140px]" />
                </div>

                {/* Top Bar Navigation */}
                <header className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-8 border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
                    <Link
                        href="/"
                        className="group flex items-center gap-2.5 transition focus:outline-none"
                    >
                        {siteLogo ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xs transition group-hover:shadow">
                                <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                            </div>
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-600 text-white shadow-xs shadow-indigo-600/20 transition group-hover:scale-105">
                                <span className="material-symbols-outlined text-lg">domain_add</span>
                            </div>
                        )}
                        <div>
                            <div className="text-sm font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                                {siteName}
                            </div>
                            <div className="text-[10px] font-semibold text-indigo-600 hidden sm:block">
                                {t('auth_ui.brand_sub_rental', undefined, 'Sistem Operasional Rental Kendaraan')}
                            </div>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {auth?.user && (
                            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 py-1 px-3 text-xs shadow-xs backdrop-blur-sm">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 text-[10px] font-bold text-white uppercase">
                                    {(auth.user.name || auth.user.email || 'U').charAt(0)}
                                </span>
                                <span className="font-semibold text-slate-700 max-w-[150px] truncate">
                                    {auth.user.name || auth.user.email}
                                </span>
                            </div>
                        )}

                        <LanguageSwitcher
                            compact
                            className="bg-white/80 border border-slate-200/80 backdrop-blur-md text-xs font-bold shadow-xs [&_button]:text-slate-600 [&_button.bg-white]:bg-indigo-600 [&_button.bg-white]:text-white"
                        />

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 shadow-xs transition"
                        >
                            <span className="material-symbols-outlined text-base">logout</span>
                            <span className="hidden sm:inline">{t('shell.log_out', undefined, 'Keluar')}</span>
                        </Link>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="relative z-10 flex flex-1 items-start justify-center px-4 py-8 sm:px-6 lg:py-12">
                    <div className="w-full max-w-5xl">
                        
                        {/* Page Header Banner */}
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-white/85 px-3 py-1 text-[11px] font-bold text-indigo-700 shadow-xs backdrop-blur-md">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                    {t('central.workspaces.badge', undefined, 'Pusat Ruang Kerja • Multi-Tenant')}
                                </div>
                                <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                                    {t('central.workspaces.title', undefined, 'Pusat Ruang Kerja')}
                                </h1>
                                <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 max-w-xl leading-relaxed">
                                    {t('central.workspaces.subtitle', undefined, 'Pilih workspace untuk mengakses dashboard operasional armada, atau daftarkan workspace baru.')}
                                </p>
                            </div>
                        </div>

                        {/* Incoming Invitations Banner */}
                        {invitations.length > 0 && (
                            <div className="mb-8 rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 p-5 sm:p-6 shadow-xl shadow-indigo-950/5 backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                                        <span className="material-symbols-outlined text-xl">mark_email_unread</span>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900">
                                            {t('central.invitation.incoming_title', undefined, 'Undangan Workspace Baru')}
                                        </h2>
                                        <p className="text-xs text-slate-600 font-medium">
                                            {t('central.invitation.incoming_desc', { count: invitations.length }, `Anda memiliki ${invitations.length} undangan untuk bergabung ke workspace.`)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2.5">
                                    {invitations.map((inv) => {
                                        const isAccepting = acceptingToken === inv.token;

                                        return (
                                            <div
                                                key={inv.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-extrabold text-slate-900 text-sm">
                                                            {inv.tenant_name}
                                                        </span>
                                                        <span className="rounded-lg bg-indigo-100/90 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                                            {t('central.invitation.incoming_role', { role: inv.role_slug }, `Sebagai: ${inv.role_slug}`)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500 font-medium">
                                                        {t('central.invitation.incoming_expires', {
                                                            date: new Date(inv.expires_at).toLocaleDateString(localeTag, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            }),
                                                        }, `Berlaku hingga: ${new Date(inv.expires_at).toLocaleDateString()}`)}
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
                                                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition"
                                                    >
                                                        {isAccepting ? '...' : t('central.invitation.btn_accept', undefined, 'Terima Undangan')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isAccepting || processing}
                                                        onClick={() => {
                                                            setInvitationToDecline(inv);
                                                            setShowDeclineDialog(true);
                                                        }}
                                                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition"
                                                    >
                                                        {t('central.invitation.btn_decline', undefined, 'Tolak')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Workspaces Grid or Empty State */}
                        {workspaces.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                {workspaces.map((workspace) => {
                                    const active = workspace.status === 'active';
                                    const onTrial = workspace.is_on_trial && active;

                                    return (
                                        <div
                                            key={workspace.id}
                                            className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/90 bg-white/85 p-5 sm:p-6 shadow-xl shadow-indigo-950/5 backdrop-blur-2xl transition-all duration-200 hover:shadow-2xl hover:border-indigo-300 group ${
                                                onTrial ? 'ring-1 ring-sky-300/40' : active ? 'ring-1 ring-emerald-300/30' : 'ring-1 ring-amber-300/40 opacity-90'
                                            }`}
                                        >
                                            {/* Card Top: Details & Status Pill */}
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-600 to-teal-500 text-white font-black text-lg shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                                                            {workspace.name.charAt(0).toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <h3 className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition truncate">
                                                                {workspace.name}
                                                            </h3>

                                                            {workspace.domain && (
                                                                <a
                                                                    href={`https://${workspace.domain}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-500 hover:text-indigo-600 transition truncate mt-0.5"
                                                                >
                                                                    <span>{workspace.domain}</span>
                                                                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0">
                                                        {onTrial ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-800 shadow-xs">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                                                                {t('central.trial.days_left', { days: String(workspace.trial_days_left ?? 0) }, `${workspace.trial_days_left} Hari Trial`)}
                                                            </span>
                                                        ) : active ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 shadow-xs">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                {t('central.workspaces.active', undefined, 'Aktif')}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 shadow-xs">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                                {t('central.workspaces.suspended', undefined, 'Ditangguhkan')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Badges: Plan & Roles */}
                                                <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                                                    {workspace.plan_name && (
                                                        <span className="rounded-lg bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700">
                                                            {workspace.plan_name}
                                                        </span>
                                                    )}
                                                    {workspace.plan_key === 'free' && (
                                                        <span className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                                                            Free Lifetime
                                                        </span>
                                                    )}
                                                    {workspace.roles?.map((role) => (
                                                        <span
                                                            key={role.id ? `${role.id}-${role.slug}` : role.slug}
                                                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeStyle(role.slug)}`}
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">
                                                                {role.slug === 'admin' ? 'shield_person' : role.slug === 'driver' ? 'directions_car' : 'person'}
                                                            </span>
                                                            <span>{role.name}</span>
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Trial / Notes Info */}
                                                {onTrial && (
                                                    <div className="mt-3.5 rounded-xl border border-sky-100 bg-sky-50/60 p-2.5 text-[11px] font-medium text-sky-800 leading-relaxed">
                                                        {t('central.workspaces.trial_info_card', { plan: workspace.plan_name || 'Trial' }, `Sedang dalam masa uji coba gratis paket ${workspace.plan_name || 'Trial'}.`)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Bottom: Enter / Manage Button */}
                                            <div className="mt-6 pt-4 border-t border-slate-100">
                                                {active ? (
                                                    <a
                                                        href={route('central.workspaces.enter', workspace.id)}
                                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:scale-[0.99] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all duration-200"
                                                    >
                                                        <span>{t('central.workspaces.enter_btn', undefined, 'Masuk ke Workspace →')}</span>
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={route('central.workspaces.enter', workspace.id)}
                                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 active:scale-[0.99] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200"
                                                    >
                                                        <span>{t('central.workspaces.pay_btn', undefined, 'Aktivasi Pembayaran →')}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="mx-auto max-w-lg rounded-3xl border border-white/90 bg-white/85 p-8 sm:p-10 text-center shadow-2xl shadow-indigo-950/10 backdrop-blur-2xl">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/25">
                                    <span className="material-symbols-outlined text-3xl">domain_add</span>
                                </div>
                                <h3 className="mt-5 text-xl font-black tracking-tight text-slate-900">
                                    {t('central.workspaces.empty_title', undefined, 'Belum Ada Ruang Kerja')}
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
                                    {t('central.workspaces.empty_hint', undefined, 'Anda belum memiliki atau tergabung dalam workspace mana pun saat ini. Mulai dengan membuat workspace bisnis rental Anda.')}
                                </p>
                                <div className="mt-6">
                                    <Link
                                        href={route('central.onboarding.show')}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:scale-[0.99] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
                                    >
                                        <span>{t('central.workspaces.create_workspace', undefined, 'Buat Workspace Baru')}</span>
                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        )}

                    </div>
                </main>

                {/* Footer copyright */}
                <footer className="relative z-20 py-3 text-center text-[11px] font-medium text-slate-400">
                    &copy; {new Date().getFullYear()} {siteName}. {t('central.onboarding.all_rights_reserved', undefined, 'All rights reserved.')}
                </footer>
            </div>

            {/* Confirm Decline Invitation Modal */}
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
                title={t('central.invitation.decline_confirm_title', undefined, 'Tolak Undangan')}
                message={
                    invitationToDecline
                        ? t('central.invitation.decline_confirm_message', { tenant: invitationToDecline.tenant_name }, `Apakah Anda yakin ingin menolak undangan dari ${invitationToDecline.tenant_name}?`)
                        : ''
                }
            />
        </>
    );
}
