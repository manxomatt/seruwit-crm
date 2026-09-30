import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface SessionPayload {
    status: string;
    company_name: string;
    subdomain: string;
    verticals: string[];
    tenant_id: string | null;
    error_message: string | null;
    preview_modules: string[];
    updated_at?: string | null;
}

interface Props {
    session: SessionPayload;
    enterUrl: string | null;
    trialEndsAt?: string | null;
    centralHost?: string;
    queueConnection?: string;
    settings?: Record<string, string>;
}

export default function OnboardingStatus({
    session,
    enterUrl,
    trialEndsAt,
    centralHost = 'localhost',
    queueConnection = 'database',
    settings,
}: Props): JSX.Element {
    const { t } = useTrans();
    const [copied, setCopied] = useState<boolean>(false);

    const ready = session.status === 'ready' && Boolean(enterUrl);
    const pending = session.status === 'pending';
    const showQueueHint =
        pending &&
        queueConnection !== 'sync' &&
        Boolean(session.updated_at) &&
        Date.now() - Date.parse(session.updated_at as string) > 15000;

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];
    const workspaceHost = `${session.subdomain}.${centralHost}`;
    const workspaceUrl = `https://${workspaceHost}`;

    useEffect(() => {
        if (ready && enterUrl) {
            window.location.assign(enterUrl);
            return;
        }

        if (ready) {
            return;
        }

        const id = window.setInterval(() => {
            router.reload({
                only: ['session', 'enterUrl', 'queueConnection'],
                onSuccess: (page) => {
                    const props = page.props as {
                        session?: SessionPayload;
                        enterUrl?: string | null;
                    };
                    if (props.session?.status === 'ready' && props.enterUrl) {
                        window.location.assign(props.enterUrl);
                    }
                },
            });
        }, 2500);

        return () => window.clearInterval(id);
    }, [ready, enterUrl]);

    const handleCopyUrl = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(workspaceUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore clipboard errors
        }
    };

    const verticalIcon = (key: string): string => {
        if (key === 'rental') return 'directions_car';
        if (key === 'travel') return 'airport_shuttle';
        if (key === 'tour') return 'map';
        if (key.includes('accounting') || key.includes('partner')) return 'account_balance_wallet';
        return 'apps';
    };

    return (
        <>
            <Head
                title={
                    ready
                        ? t('central.onboarding.status.ready_title', undefined, 'Workspace Siap Digunakan')
                        : t('central.onboarding.status.title', undefined, 'Membuat Workspace Anda')
                }
            />

            <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/70 text-slate-800 selection:bg-indigo-500 selection:text-white">
                {/* Ambient glow effects */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-sky-300/25 blur-[120px]" />
                    <div className="absolute -right-28 -bottom-28 h-96 w-96 rounded-full bg-indigo-300/25 blur-[120px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-emerald-200/20 blur-[140px]" />
                </div>

                {/* Top Bar Navigation */}
                <header className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-8">
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
                        <span className="text-sm font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                            {siteName}
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher
                            compact
                            className="bg-white/80 border border-slate-200/80 backdrop-blur-md text-xs font-bold shadow-xs [&_button]:text-slate-600 [&_button.bg-white]:bg-indigo-600 [&_button.bg-white]:text-white"
                        />
                    </div>
                </header>

                {/* Main Content: Unified Bento Card Layout matching Onboarding.tsx */}
                <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-4 sm:px-6">
                    <div className="w-full max-w-5xl">
                        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-3xl border border-white/90 bg-white/85 shadow-2xl shadow-indigo-950/10 backdrop-blur-2xl">
                            
                            {/* Left Panel: Brand & Provisioning Progress Tracker */}
                            <div className="relative hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-between p-7 sm:p-8 overflow-hidden bg-gradient-to-b from-sky-50/90 via-indigo-50/65 to-indigo-100/90 border-r border-slate-200/60">
                                {/* Ambient Orbs inside left panel */}
                                <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
                                <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-sky-400/20 blur-2xl" />

                                <div className="relative z-10">
                                    {/* Top Status Pill */}
                                    <div className="flex items-center gap-2">
                                        {ready ? (
                                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/85 px-3 py-1 text-[11px] font-bold text-emerald-700 shadow-xs backdrop-blur-md">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                {t('central.onboarding.status.status_ready_badge', undefined, 'Workspace Siap Digunakan')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/90 bg-white/85 px-3 py-1 text-[11px] font-bold text-sky-700 shadow-xs backdrop-blur-md">
                                                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                                                {t('central.onboarding.status.status_in_progress', undefined, 'Proses Setup Otomatis')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Brand Logo & Subtitle */}
                                    <div className="mt-5 flex items-center gap-3">
                                        {siteLogo ? (
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white p-2 shadow-sm">
                                                <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200/80 bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                                                <span className="material-symbols-outlined text-2xl">
                                                    {ready ? 'verified' : 'hourglass_top'}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-base font-black tracking-tight text-slate-900 leading-tight">
                                                {siteName}
                                            </div>
                                            <div className="text-[11px] font-semibold text-indigo-600">
                                                {t('auth_ui.brand_sub_rental', undefined, 'Sistem Operasional Rental Kendaraan')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Heading */}
                                    <div className="mt-6">
                                        <h2 className="text-xl font-black tracking-tight text-slate-900 leading-snug">
                                            {ready
                                                ? t('central.onboarding.status.welcome_ready', undefined, 'Workspace Telah Siap!')
                                                : t('central.onboarding.status.welcome', undefined, 'Sedang Menyiapkan Workspace…')}
                                        </h2>
                                        <p className="mt-1.5 text-xs font-medium text-slate-600 leading-relaxed">
                                            {ready
                                                ? t('central.onboarding.status.welcome_ready_subtitle', undefined, 'Workspace Anda sudah online. Masuk dan mulai atur bisnis Anda.')
                                                : t('central.onboarding.status.welcome_subtitle', undefined, 'Kami menyiapkan database terisolasi dan memasang modul yang Anda pilih.')}
                                        </p>
                                    </div>

                                    {/* Live Step Progress Guide */}
                                    <div className="mt-6 space-y-2.5">
                                        {[
                                            {
                                                title: t('central.onboarding.status.step_db', undefined, 'Inisialisasi Database Tenant'),
                                                desc: t('central.onboarding.status.feature_database', undefined, 'Database workspace terisolasi'),
                                                isCompleted: ready || !pending,
                                                isActive: pending,
                                            },
                                            {
                                                title: t('central.onboarding.status.step_modules', undefined, 'Pemasangan Modul Pilihan'),
                                                desc: t('central.onboarding.status.feature_modules', undefined, 'Rental, armada & akuntansi'),
                                                isCompleted: ready,
                                                isActive: !ready && !pending,
                                            },
                                            {
                                                title: t('central.onboarding.status.step_domain', undefined, 'Alokasi Subdomain & Routing'),
                                                desc: workspaceHost,
                                                isCompleted: ready,
                                                isActive: false,
                                            },
                                            {
                                                title: t('central.onboarding.status.step_admin', undefined, 'Finalisasi Akun & Hak Akses'),
                                                desc: t('central.onboarding.status.feature_enter', undefined, 'Satu klik langsung terhubung'),
                                                isCompleted: ready,
                                                isActive: false,
                                            },
                                        ].map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-200 ${
                                                    item.isCompleted
                                                        ? 'bg-emerald-500/10 border border-emerald-500/25 shadow-xs'
                                                        : item.isActive
                                                          ? 'bg-white/90 border border-indigo-400 shadow-sm ring-2 ring-indigo-500/15'
                                                          : 'bg-white/40 border border-white/60 opacity-60'
                                                }`}
                                            >
                                                <div
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                                                        item.isCompleted
                                                            ? 'bg-emerald-600 text-white'
                                                            : item.isActive
                                                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                                              : 'bg-slate-200/80 text-slate-500'
                                                    }`}
                                                >
                                                    {item.isCompleted ? (
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : item.isActive ? (
                                                        <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className={`text-xs font-bold truncate ${
                                                        item.isCompleted ? 'text-emerald-950' : item.isActive ? 'text-indigo-950 font-extrabold' : 'text-slate-600'
                                                    }`}>
                                                        {item.title}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 truncate font-medium">
                                                        {item.desc}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Security / Support Badge in Left Panel */}
                                <div className="relative z-10 mt-6 rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-md">
                                    <div className="flex items-start gap-2.5">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <span className="material-symbols-outlined text-base">verified_user</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                                            {t('central.onboarding.status.card_support_hint', undefined, 'Sistem multi-tenant dengan database terisolasi memastikan keamanan data dan privasi transaksi armada Anda sepenuhnya terproteksi.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Interactive Status Detail & Next Action */}
                            <div className="relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 lg:col-span-7 bg-white/60">
                                <div>
                                    {/* Mobile Brand Header */}
                                    <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-100 lg:hidden">
                                        <div className="flex items-center gap-2.5">
                                            {siteLogo ? (
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
                                                    <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-600 text-white shadow-xs">
                                                    <span className="material-symbols-outlined text-lg">domain_add</span>
                                                </div>
                                            )}
                                            <span className="text-sm font-extrabold tracking-tight text-slate-900">
                                                {siteName}
                                            </span>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                            ready ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800 animate-pulse'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                                            {ready ? 'Ready' : 'Provisioning'}
                                        </span>
                                    </div>

                                    {/* Primary Visual Status Box */}
                                    <div className="text-center sm:text-left mb-6">
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                                                {ready ? (
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                                                        <span className="material-symbols-outlined text-3xl">verified</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="absolute inset-0 rounded-2xl bg-indigo-500/15 animate-ping" />
                                                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25">
                                                            <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div>
                                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-snug">
                                                    {ready
                                                        ? t('central.onboarding.status.ready_title', undefined, 'Workspace Siap Digunakan')
                                                        : t('central.onboarding.status.title', undefined, 'Membuat Workspace Anda')}
                                                </h1>
                                                <p className="mt-1 text-xs font-medium text-slate-500">
                                                    {ready
                                                        ? t('central.onboarding.status.auto_redirect_hint', undefined, 'Anda akan dialihkan secara otomatis ke workspace begitu proses selesai.')
                                                        : t('central.onboarding.status.polling', undefined, 'Biasanya selesai dalam kurang dari satu menit setelah antrian diproses.')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Workspace Identifier Card */}
                                    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-indigo-50/40 p-4 shadow-xs mb-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {t('central.onboarding.company_name', undefined, 'Nama Usaha')}
                                                </span>
                                                <div className="text-sm font-black text-slate-900">
                                                    {session.company_name}
                                                </div>
                                            </div>

                                            <div className="sm:text-right">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {t('central.onboarding.status.workspace_url', undefined, 'Alamat Web Workspace')}
                                                </span>
                                                <div className="flex items-center gap-1.5 sm:justify-end mt-0.5">
                                                    <a
                                                        href={workspaceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                                                    >
                                                        {workspaceHost}
                                                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyUrl}
                                                        title={t('central.onboarding.status.copy_url', undefined, 'Salin URL')}
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            {copied ? 'check' : 'content_copy'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activated Modules Preview */}
                                    {session.preview_modules.length > 0 && (
                                        <div className="mb-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                                    {t('central.onboarding.preview_title', undefined, 'Modul Terpasang')}
                                                </span>
                                                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    {t('central.onboarding.preview_core', undefined, 'Accounting & Core Active')}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {session.preview_modules.map((moduleKey) => (
                                                    <div
                                                        key={moduleKey}
                                                        className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white/90 p-2.5 shadow-xs transition hover:border-indigo-300"
                                                    >
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50/80 text-indigo-600">
                                                            <span className="material-symbols-outlined text-base">
                                                                {verticalIcon(moduleKey)}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-bold text-slate-900 capitalize truncate">
                                                                {t(`central.onboarding.verticals.${moduleKey}`, undefined, moduleKey)}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium truncate">
                                                                {moduleKey === 'rental'
                                                                    ? t('central.onboarding.verticals.rental_hint', undefined, 'Armada, kalender booking & invoice')
                                                                    : moduleKey === 'travel'
                                                                      ? t('central.onboarding.verticals.travel_hint', undefined, 'Shuttle & manifest penumpang')
                                                                      : t('central.onboarding.status.feature_modules', undefined, 'Modul operasional aktif')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Alerts / Info Banners */}
                                    {ready ? (
                                        <div className="space-y-3 mb-6">
                                            {trialEndsAt ? (
                                                <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/70 p-3.5 backdrop-blur-md">
                                                    <div className="flex items-start gap-2.5">
                                                        <span className="material-symbols-outlined text-emerald-600 text-lg mt-0.5">verified</span>
                                                        <div>
                                                            <p className="text-xs font-bold text-emerald-900">
                                                                {t('central.trial.trial_info', { plan: session.verticals?.includes('rental') ? 'Rental Pro' : 'Workspace' }, 'Masa Uji Coba Gratis Aktif')}
                                                            </p>
                                                            <p className="text-[11px] text-emerald-700 mt-0.5 font-medium leading-relaxed">
                                                                {t('central.trial.days_left', {
                                                                    days: String(Math.max(1, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))),
                                                                }, `Tersisa ${Math.max(1, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} hari`)}{' '}
                                                                — Berakhir pada {new Date(trialEndsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-3.5 backdrop-blur-md">
                                                    <div className="flex items-start gap-2.5">
                                                        <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">payments</span>
                                                        <div>
                                                            <p className="text-xs font-bold text-amber-900">
                                                                {t('central.onboarding.status.payment_needed_title', undefined, 'Aktivasi Langganan & Pembayaran')}
                                                            </p>
                                                            <p className="text-[11px] text-amber-700 mt-0.5 font-medium leading-relaxed">
                                                                {t('central.onboarding.status.payment_needed_desc', undefined, 'Workspace database Anda telah siap. Silakan selesaikan pembayaran untuk mengaktifkan akses penuh.')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3 mb-6">
                                            {showQueueHint && (
                                                <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs font-medium text-amber-900 shadow-xs">
                                                    <div className="flex items-center gap-2 font-bold text-amber-950 mb-1">
                                                        <span className="material-symbols-outlined text-base">info</span>
                                                        {t('central.onboarding.status.queue_hint', undefined, 'Antrian memakan waktu lebih lama dari biasanya?')}
                                                    </div>
                                                    <p className="text-[11px] text-amber-800 mb-2">
                                                        Pastikan antrian worker backend aktif dengan menjalankan perintah:
                                                    </p>
                                                    <code className="block rounded-xl bg-amber-100/90 px-3 py-1.5 font-mono text-[11px] text-amber-950 font-bold select-all">
                                                        php artisan queue:work --timeout=300
                                                    </code>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-2">
                                        {ready ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (enterUrl) {
                                                        window.location.assign(enterUrl);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:scale-[0.99] py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
                                            >
                                                <span>
                                                    {!trialEndsAt
                                                        ? t('central.onboarding.status.proceed_payment', undefined, 'Lanjut ke Halaman Pembayaran →')
                                                        : t('central.onboarding.status.enter_workspace_now', undefined, 'Masuk ke Workspace Sekarang →')}
                                                </span>
                                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2.5 rounded-xl border border-indigo-200/90 bg-indigo-50/70 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-indigo-700 shadow-xs">
                                                <svg className="h-4 w-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>{t('central.onboarding.status.provisioning', undefined, 'Menyiapkan database dan modul…')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Secondary Actions & Links matching Onboarding.tsx */}
                                <div className="mt-8 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        type="button"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-rose-600"
                                    >
                                        <span className="material-symbols-outlined text-base">logout</span>
                                        {t('shell.log_out', undefined, 'Keluar')}
                                    </Link>

                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-800"
                                    >
                                        <span className="material-symbols-outlined text-base">arrow_back</span>
                                        {t('auth_ui.back_home', undefined, 'Kembali ke Beranda')}
                                    </Link>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>

                {/* Bottom Simple Copyright Bar matching Onboarding.tsx */}
                <footer className="relative z-20 py-2.5 text-center text-[11px] font-medium text-slate-400">
                    &copy; {new Date().getFullYear()} {siteName}. {t('central.onboarding.all_rights_reserved', undefined, 'All rights reserved.')}
                </footer>
            </div>
        </>
    );
}
