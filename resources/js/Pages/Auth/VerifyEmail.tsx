import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    status?: string;
    settings?: Record<string, string>;
}

export default function VerifyEmail({ status, settings }: Props) {
    const { t } = useTrans();
    const { post, processing } = useForm<Record<string, never>>({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];
    const linkSent = status === 'verification-link-sent';

    return (
        <>
            <Head title={t('auth_ui.verify_title')} />

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
                                    <span className="material-symbols-outlined text-5xl text-cyan-400">mark_email_unread</span>
                                </div>
                            )}
                        </div>

                        <h1 className="mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-center text-4xl font-bold text-transparent">
                            {t('auth_ui.verify_welcome')}
                        </h1>
                        <p className="max-w-md text-center text-lg text-white/70">{t('auth_ui.verify_welcome_subtitle')}</p>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">inbox</span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.verify_feature_inbox')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">link</span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.verify_feature_link')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">apartment</span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.verify_feature_workspace')}</span>
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
                                    <span className="material-symbols-outlined text-4xl text-cyan-400">mark_email_unread</span>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
                            <div className="mb-8 text-center">
                                <h2 className="text-3xl font-bold text-white">{t('auth_ui.verify_title')}</h2>
                                <p className="mt-2 text-white/60">{t('auth_ui.verify_message')}</p>
                            </div>

                            {linkSent && (
                                <div className="mb-6 rounded-xl border border-green-400/30 bg-green-500/20 p-4 backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-400">check_circle</span>
                                        <span className="text-sm font-medium text-green-300">{t('auth_ui.verify_sent')}</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full transform rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:scale-[1.02] hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? t('auth_ui.verify_resending') : t('auth_ui.resend_verification')}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
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
