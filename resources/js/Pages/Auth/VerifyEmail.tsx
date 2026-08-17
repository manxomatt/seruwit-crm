import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    status?: string;
    settings?: Record<string, string>;
    verificationUrl?: string | null;
}

export default function VerifyEmail({ status, settings, verificationUrl }: Props) {
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
                            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                Email Verification Required
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
                                        <span className="material-symbols-outlined text-4xl text-indigo-600">mark_email_unread</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                                {t('auth_ui.verify_welcome')}
                            </h1>
                            <p className="mt-4 text-base font-medium text-slate-600 leading-relaxed">
                                {t('auth_ui.verify_welcome_subtitle')}
                            </p>

                            {/* Features Showcase */}
                            <div className="mt-10 space-y-3.5">
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                                        <span className="material-symbols-outlined text-xl">inbox</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.verify_feature_inbox')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                                        <span className="material-symbols-outlined text-xl">link</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.verify_feature_link')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600">
                                        <span className="material-symbols-outlined text-xl">apartment</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.verify_feature_workspace')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Tagline */}
                        <div className="text-xs font-medium text-slate-400">
                            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Right Side: Verification Form */}
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
                                    <span className="material-symbols-outlined text-4xl text-indigo-600">mark_email_unread</span>
                                </div>
                            )}
                        </div>

                        {/* Verify Card */}
                        <div className="rounded-3xl border border-white/90 bg-white/85 p-8 sm:p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
                            <div className="mb-8 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-md">
                                    <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
                                </div>
                                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t('auth_ui.verify_title')}</h2>
                                <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                                    {verificationUrl ? t('auth_ui.verify_message_dev') : t('auth_ui.verify_message')}
                                </p>
                            </div>

                            {/* Dev Mode Banner */}
                            {verificationUrl && (
                                <div className="mb-6 space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-600 text-base">developer_mode</span>
                                        <span className="font-bold text-amber-900">{t('auth_ui.verify_dev_banner')}</span>
                                    </div>
                                    <a
                                        href={verificationUrl}
                                        className="block break-all font-mono font-bold text-indigo-600 underline hover:text-indigo-700"
                                    >
                                        {verificationUrl}
                                    </a>
                                </div>
                            )}

                            {/* Verification Sent Banner */}
                            {linkSent && (
                                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 backdrop-blur-md">
                                    <div className="flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                                        <span className="text-xs font-bold text-emerald-800">
                                            {verificationUrl ? t('auth_ui.verify_sent_dev') : t('auth_ui.verify_sent')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:from-indigo-700 active:to-sky-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>{t('auth_ui.verify_resending')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-base">send</span>
                                            <span>
                                                {verificationUrl
                                                    ? t('auth_ui.regenerate_verification')
                                                    : t('auth_ui.resend_verification')}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Logout Link */}
                            <div className="mt-8 text-center">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
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
