import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    status?: string;
    settings?: Record<string, string>;
    resetUrl?: string | null;
}

export default function ForgotPassword({ status, settings, resetUrl }: Props) {
    const { t } = useTrans();

    interface ForgotForm {
        email: string;
    }

    const { data, setData, post, processing, errors } = useForm<ForgotForm>({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('password.email'));
    };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];

    return (
        <>
            <Head title={t('auth_ui.forgot_title')} />

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

                {/* Left Side - Branding/Illustration */}
                <div className="relative hidden lg:flex lg:w-1/2 border-r border-slate-200/60 bg-white/40 backdrop-blur-md">
                    <div className="relative z-10 flex w-full flex-col justify-between p-12 lg:p-16">
                        {/* Top System Status Pill */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Account Recovery • SSL 256-bit
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
                                        <span className="material-symbols-outlined text-4xl text-indigo-600">lock_reset</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                                {t('auth_ui.forgot_title')}
                            </h1>
                            <p className="mt-4 text-base font-medium text-slate-600 leading-relaxed">
                                {t('auth_ui.forgot_subtitle')}
                            </p>

                            {/* Feature highlights */}
                            <div className="mt-10 space-y-3.5">
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                                        <span className="material-symbols-outlined text-xl">mail</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.forgot_feature_email')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                                        <span className="material-symbols-outlined text-xl">timer</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.forgot_feature_fast')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600">
                                        <span className="material-symbols-outlined text-xl">lock_reset</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.forgot_feature_new_password')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Tagline */}
                        <div className="text-xs font-medium text-slate-400">
                            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Right Side - Forgot Password Form */}
                <div className="relative z-10 flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="mb-8 flex justify-center lg:hidden">
                            {siteLogo ? (
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                                    <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                </div>
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-100 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 backdrop-blur-xl">
                                    <span className="material-symbols-outlined text-4xl text-indigo-600">lock_reset</span>
                                </div>
                            )}
                        </div>

                        {/* Glassmorphism Card */}
                        <div className="rounded-3xl border border-white/90 bg-white/85 p-8 sm:p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
                            {/* Header */}
                            <div className="mb-8 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-md">
                                    <span className="material-symbols-outlined text-3xl">lock_reset</span>
                                </div>
                                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t('auth_ui.reset_password_heading')}</h2>
                                <p className="mt-2 text-xs font-medium text-slate-500">
                                    {t('auth_ui.reset_password_subtitle')}
                                </p>
                            </div>

                            {/* Status Message */}
                            {status && (
                                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 backdrop-blur-md">
                                    <div className="flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                                        <span className="text-xs font-bold text-emerald-800">{status}</span>
                                    </div>
                                </div>
                            )}

                            {/* Dev Mode: Reset URL */}
                            {resetUrl && (
                                <div className="mb-6 space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-600 text-base">developer_mode</span>
                                        <span className="font-bold text-amber-900">{t('auth_ui.reset_dev_banner')}</span>
                                    </div>
                                    <p className="text-amber-800">{t('auth_ui.reset_message_dev')}</p>
                                    <a
                                        href={resetUrl}
                                        className="block break-all font-mono font-bold text-indigo-600 underline hover:text-indigo-700"
                                    >
                                        {resetUrl}
                                    </a>
                                </div>
                            )}

                            {/* Forgot Password Form */}
                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        {t('auth_ui.email_label')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                            <span className="material-symbols-outlined text-xl">mail</span>
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            autoComplete="email"
                                            autoFocus
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="block w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder={t('auth_ui.email_placeholder')}
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:from-indigo-700 active:to-sky-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>{t('auth_ui.sending')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('auth_ui.send_reset_link')}</span>
                                            <span className="material-symbols-outlined text-base">send</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Back to Login Link */}
                            <div className="mt-8 text-center">
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-800"
                                >
                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                    {t('auth_ui.back_to_login')}
                                </Link>
                            </div>
                        </div>

                        {/* Footer Branding */}
                        <div className="mt-8 text-center">
                            <p className="text-xs font-medium text-slate-400">
                                {t('auth_ui.tagline', { name: siteName })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
