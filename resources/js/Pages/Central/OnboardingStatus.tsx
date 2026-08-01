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
    centralHost?: string;
    queueConnection?: string;
    settings?: Record<string, string>;
}

export default function OnboardingStatus({
    session,
    enterUrl,
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

            <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
                </div>

                <div className="absolute right-4 top-4 z-20">
                    <LanguageSwitcher compact className="bg-white/10 [&_button]:text-white/70 [&_button.bg-white]:text-gray-900" />
                </div>

                <div className="relative hidden lg:flex lg:w-1/2">
                    <div className="relative z-10 flex w-full flex-col items-center justify-center px-12 text-white">
                        <div className="mb-8">
                            {siteLogo ? (
                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                                    <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                </div>
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-5xl text-cyan-400">
                                        {ready ? 'check_circle' : 'hourglass_top'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <h1 className="mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-center text-4xl font-bold text-transparent">
                            {ready
                                ? t('central.onboarding.status.welcome_ready')
                                : t('central.onboarding.status.welcome')}
                        </h1>
                        <p className="max-w-md text-center text-lg text-white/70">
                            {ready
                                ? t('central.onboarding.status.welcome_ready_subtitle')
                                : t('central.onboarding.status.welcome_subtitle')}
                        </p>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">database</span>
                                </div>
                                <span className="text-white/80">{t('central.onboarding.status.feature_database')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">extension</span>
                                </div>
                                <span className="text-white/80">{t('central.onboarding.status.feature_modules')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">login</span>
                                </div>
                                <span className="text-white/80">{t('central.onboarding.status.feature_enter')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex w-full items-center justify-center p-8 lg:w-1/2">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex justify-center lg:hidden">
                            {siteLogo ? (
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                                    <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                </div>
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-4xl text-cyan-400">
                                        {ready ? 'check_circle' : 'hourglass_top'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
                            <div className="mb-8 text-center">
                                <h2 className="text-3xl font-bold text-white">
                                    {ready
                                        ? t('central.onboarding.status.ready_title')
                                        : t('central.onboarding.status.title')}
                                </h2>
                                <p className="mt-3 text-sm text-white/70">
                                    <span className="font-medium text-white">{session.company_name}</span>
                                </p>
                                <p className="mt-1 font-mono text-xs text-cyan-300/80">{workspaceHost}</p>
                            </div>

                            {ready ? (
                                <div className="space-y-5">
                                    <div className="rounded-xl border border-green-400/30 bg-green-500/20 p-4 backdrop-blur-sm">
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-green-400">verified</span>
                                            <p className="text-sm text-green-100">
                                                {t('central.onboarding.status.ready_message')}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (enterUrl) {
                                                window.location.href = enterUrl;
                                            }
                                        }}
                                        className="w-full transform rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:scale-[1.02] hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.98]"
                                    >
                                        {t('central.onboarding.status.enter')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 rounded-xl border border-cyan-400/30 bg-cyan-500/15 p-4 text-sm text-cyan-100">
                                        <span className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-cyan-300/40 border-t-cyan-300" />
                                        <span>
                                            {pending
                                                ? t('central.onboarding.status.pending')
                                                : t('central.onboarding.status.provisioning')}
                                        </span>
                                    </div>

                                    <p className="text-center text-xs text-white/40">
                                        {t('central.onboarding.status.polling')}
                                    </p>

                                    {showQueueHint && (
                                        <div className="rounded-xl border border-amber-400/30 bg-amber-500/15 p-4 text-sm text-amber-100">
                                            <p className="font-medium">{t('central.onboarding.status.queue_hint')}</p>
                                            <code className="mt-2 block rounded-lg bg-black/20 px-3 py-2 font-mono text-xs text-amber-50">
                                                php artisan queue:work --timeout=300
                                            </code>
                                        </div>
                                    )}

                                    {session.preview_modules.length > 0 && (
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
                                                {t('central.onboarding.preview_title')}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {session.preview_modules.map((moduleKey) => (
                                                    <span
                                                        key={moduleKey}
                                                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70"
                                                    >
                                                        {moduleKey}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    type="button"
                                    className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white/80"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    {t('shell.log_out')}
                                </Link>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-white/40">{t('auth_ui.tagline', { name: siteName })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
