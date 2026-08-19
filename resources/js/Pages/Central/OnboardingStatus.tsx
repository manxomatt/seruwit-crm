import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

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
    const ready = session.status === 'ready' && Boolean(enterUrl);
    const pending = session.status === 'pending';
    const showQueueHint =
        pending &&
        queueConnection !== 'sync' &&
        Boolean(session.updated_at) &&
        Date.now() - Date.parse(session.updated_at as string) > 15000;

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

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];
    const workspaceHost = `${session.subdomain}.${centralHost}`;

    return (
        <>
            <Head
                title={
                    ready
                        ? t('central.onboarding.status.ready_title')
                        : t('central.onboarding.status.title')
                }
            />

            <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/60 to-indigo-50/80 text-slate-800 selection:bg-indigo-500 selection:text-white">
                {/* Ambient fresh glow effects */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 -top-20 h-[450px] w-[450px] rounded-full bg-sky-300/30 blur-[130px]" />
                    <div className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-full bg-indigo-300/30 blur-[130px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-300/20 blur-[150px]" />
                </div>

                {/* Top-Right Language Switcher */}
                <div className="absolute right-6 top-6 z-20">
                    <LanguageSwitcher compact className="bg-white/80 border border-slate-200/80 backdrop-blur-md text-xs font-bold shadow-sm [&_button]:text-slate-600 [&_button.bg-white]:bg-indigo-600 [&_button.bg-white]:text-white" />
                </div>

                {/* Left Side: Brand Showcase */}
                <div className="relative hidden lg:flex lg:w-1/2 border-r border-slate-200/60 bg-white/40 backdrop-blur-md">
                    <div className="relative z-10 flex w-full flex-col justify-between p-12 lg:p-16">
                        {/* Top System Status Pill */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                {ready ? 'Workspace Ready' : 'Setting Up Workspace'}
                            </span>
                        </div>

                        {/* Middle Hero Content */}
                        <div className="max-w-lg">
                            <div className="mb-6 inline-flex">
                                {siteLogo ? (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                                        <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-100 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 backdrop-blur-xl">
                                        <span className="material-symbols-outlined text-4xl text-indigo-600">
                                            {ready ? 'check_circle' : 'hourglass_top'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                                {ready
                                    ? t('central.onboarding.status.welcome_ready')
                                    : t('central.onboarding.status.welcome')}
                            </h1>
                            <p className="mt-4 text-base font-medium text-slate-600 leading-relaxed">
                                {ready
                                    ? t('central.onboarding.status.welcome_ready_subtitle')
                                    : t('central.onboarding.status.welcome_subtitle')}
                            </p>

                            {/* Features Showcase */}
                            <div className="mt-10 space-y-3.5">
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                                        <span className="material-symbols-outlined text-xl">database</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('central.onboarding.status.feature_database')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                                        <span className="material-symbols-outlined text-xl">extension</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('central.onboarding.status.feature_modules')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600">
                                        <span className="material-symbols-outlined text-xl">login</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('central.onboarding.status.feature_enter')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Tagline */}
                        <div className="text-xs font-medium text-slate-400">
                            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Right Side: Status Card */}
                <div className="relative z-10 flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
                    <div className="w-full max-w-md">
                        {/* Mobile Brand Logo */}
                        <div className="mb-8 flex justify-center lg:hidden">
                            {siteLogo ? (
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                                    <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                </div>
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-100 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 backdrop-blur-xl">
                                    <span className="material-symbols-outlined text-4xl text-indigo-600">
                                        {ready ? 'check_circle' : 'hourglass_top'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Status Card */}
                        <div className="rounded-3xl border border-white/90 bg-white/85 p-8 sm:p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
                            <div className="mb-8 text-center">
                                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                    {ready
                                        ? t('central.onboarding.status.ready_title')
                                        : t('central.onboarding.status.title')}
                                </h2>
                                <p className="mt-3 text-xs font-bold text-slate-700">
                                    {session.company_name}
                                </p>
                                <p className="mt-1 font-mono text-xs font-bold text-indigo-600">{workspaceHost}</p>
                            </div>

                            {ready ? (
                                <div className="space-y-5">
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 backdrop-blur-md">
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
                                            <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                                                {t('central.onboarding.status.ready_message')}
                                            </p>
                                        </div>
                                    </div>

                                    {trialEndsAt && (
                                        <div className="rounded-2xl border border-sky-200 bg-sky-50/90 p-4 backdrop-blur-md">
                                            <div className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-sky-600 text-xl">new_releases</span>
                                                <div>
                                                    <p className="text-xs font-bold text-sky-900">
                                                        {t('central.trial.trial_info', { plan: session.verticals?.includes('rental') ? 'Rental' : 'Workspace' })}
                                                    </p>
                                                    <p className="mt-1 text-xs text-sky-700">
                                                        {t('central.trial.days_left', {
                                                            days: String(Math.max(1, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))),
                                                        })}{' '}
                                                        — {new Date(trialEndsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (enterUrl) {
                                                window.location.href = enterUrl;
                                            }
                                        }}
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:from-indigo-700 active:to-sky-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                    >
                                        <span>{t('central.onboarding.status.enter')}</span>
                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 text-xs font-bold text-indigo-900">
                                        <span className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-indigo-400 border-t-indigo-600" />
                                        <span>
                                            {pending
                                                ? t('central.onboarding.status.pending')
                                                : t('central.onboarding.status.provisioning')}
                                        </span>
                                    </div>

                                    <p className="text-center text-xs font-medium text-slate-400">
                                        {t('central.onboarding.status.polling')}
                                    </p>

                                    {showQueueHint && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-medium text-amber-900">
                                            <p className="font-bold">{t('central.onboarding.status.queue_hint')}</p>
                                            <code className="mt-2 block rounded-xl bg-amber-100/80 px-3 py-2 font-mono text-xs text-amber-950">
                                                php artisan queue:work --timeout=300
                                            </code>
                                        </div>
                                    )}

                                    {session.preview_modules.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                {t('central.onboarding.preview_title')}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {session.preview_modules.map((moduleKey) => (
                                                    <span
                                                        key={moduleKey}
                                                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm"
                                                    >
                                                        {moduleKey}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-8 text-center">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    type="button"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-rose-600"
                                >
                                    <span className="material-symbols-outlined text-base">logout</span>
                                    {t('shell.log_out')}
                                </Link>
                            </div>
                        </div>

                        {/* Footer Branding */}
                        <div className="mt-8 text-center">
                            <p className="text-xs font-medium text-slate-400">{t('auth_ui.tagline', { name: siteName })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
