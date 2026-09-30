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

interface ForgotForm {
    email: string;
}

export default function ForgotPassword({ status, settings, resetUrl }: Props) {
    const { t } = useTrans();

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

            <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/70 text-slate-800 selection:bg-indigo-500 selection:text-white antialiased">
                {/* Ambient Soft Glow Effects */}
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
                                <span className="material-symbols-outlined text-lg">rocket_launch</span>
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

                {/* Main Content: Unified Bento Card Layout */}
                <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-4 sm:px-6">
                    <div className="w-full max-w-5xl">
                        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-3xl border border-white/90 bg-white/85 shadow-2xl shadow-indigo-950/10 backdrop-blur-2xl">
                            
                            {/* Left Panel: Combined Brand & Value Showcase (Glassmorphic Gradient) */}
                            <div className="relative hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-between p-8 sm:p-9 overflow-hidden bg-gradient-to-b from-sky-50/90 via-indigo-50/65 to-indigo-100/90 border-r border-slate-200/60">
                                {/* Ambient Orbs inside left panel */}
                                <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
                                <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-sky-400/20 blur-2xl" />

                                <div className="relative z-10">
                                    {/* Top Status Pill */}
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/85 px-3 py-1 text-[11px] font-bold text-emerald-700 shadow-xs backdrop-blur-md">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            {t('auth_ui.status_recovery', undefined, 'Account Recovery • SSL 256-bit')}
                                        </span>
                                    </div>

                                    {/* Brand Logo & Tagline Header */}
                                    <div className="mt-6 flex items-center gap-3">
                                        {siteLogo ? (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white p-2 shadow-sm">
                                                <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200/80 bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                                                <span className="material-symbols-outlined text-2xl">lock_reset</span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-base font-black tracking-tight text-slate-900 leading-tight">
                                                {siteName}
                                            </div>
                                            <div className="text-[11px] font-semibold text-indigo-600">
                                                {t('auth_ui.brand_sub_rental', undefined, 'Sistem Operasi Rental Kendaraan')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Welcome Heading & Subtitle */}
                                    <div className="mt-6">
                                        <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-snug">
                                            {t('auth_ui.forgot_title')}
                                        </h2>
                                        <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
                                            {t('auth_ui.forgot_subtitle')}
                                        </p>
                                    </div>

                                    {/* Feature Cards (3 Recovery Highlights) */}
                                    <div className="mt-6 space-y-2.5">
                                        <div className="flex items-start gap-3 rounded-2xl border border-white/90 bg-white/75 p-3 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100/90 text-indigo-600 mt-0.5">
                                                <span className="material-symbols-outlined text-base">mail</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {t('auth_ui.forgot_feature_email_title', undefined, 'Tautan Verifikasi Email')}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                                                    {t('auth_ui.forgot_feature_email_desc', undefined, 'Link reset resmi dikirimkan langsung ke alamat email terdaftar')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-2xl border border-white/90 bg-white/75 p-3 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100/90 text-sky-600 mt-0.5">
                                                <span className="material-symbols-outlined text-base">timer</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {t('auth_ui.forgot_feature_fast_title', undefined, 'Proses Cepat & Terverifikasi')}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                                                    {t('auth_ui.forgot_feature_fast_desc', undefined, 'Instruksi pemulihan aman dengan batas kedaluwarsa demi keamanan akun')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-2xl border border-white/90 bg-white/75 p-3 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-600 mt-0.5">
                                                <span className="material-symbols-outlined text-base">lock_reset</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {t('auth_ui.forgot_feature_password_title', undefined, 'Atur Kata Sandi Baru')}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                                                    {t('auth_ui.forgot_feature_password_desc', undefined, 'Buat kredensial baru terenkripsi untuk kembali mengakses workspace')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Tagline & Brand Alignment */}
                                <div className="relative z-10 mt-8 pt-4 border-t border-slate-200/60">
                                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                                        {t('auth_ui.tagline', { name: siteName })}
                                    </p>
                                </div>
                            </div>

                            {/* Right Panel: Compact Forgot Password Form */}
                            <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between bg-white/95">
                                <div>
                                    {/* Form Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between">
                                            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                                {t('auth_ui.reset_password_heading')}
                                            </h1>
                                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50/80 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
                                                <span className="material-symbols-outlined text-xs">help</span>
                                                {t('auth_ui.badge_help', undefined, 'Bantuan Akses')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                            {t('auth_ui.reset_password_subtitle')}
                                        </p>
                                    </div>

                                    {/* Status Message */}
                                    {status && (
                                        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 backdrop-blur-md">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                                                <span className="text-xs font-semibold text-emerald-800">{status}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dev Mode: Reset URL */}
                                    {resetUrl && (
                                        <div className="mb-4 space-y-1.5 rounded-xl border border-amber-200/90 bg-amber-50/90 p-3.5 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-amber-600 text-base">developer_mode</span>
                                                <span className="font-bold text-amber-900">{t('auth_ui.reset_dev_banner')}</span>
                                            </div>
                                            <p className="text-amber-800 text-[11px]">{t('auth_ui.reset_message_dev')}</p>
                                            <a
                                                href={resetUrl}
                                                className="block break-all font-mono font-bold text-indigo-600 underline hover:text-indigo-700 text-[11px]"
                                            >
                                                {resetUrl}
                                            </a>
                                        </div>
                                    )}

                                    {/* Forgot Password Form */}
                                    <form onSubmit={submit} className="space-y-4">
                                        <div>
                                            <label htmlFor="email" className="mb-1 block text-xs font-bold text-slate-700">
                                                {t('auth_ui.email_label')}
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    <span className="material-symbols-outlined text-lg">mail</span>
                                                </div>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    value={data.email}
                                                    autoComplete="email"
                                                    autoFocus
                                                    required
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder={t('auth_ui.email_placeholder')}
                                                />
                                            </div>
                                            <InputError message={errors.email} className="mt-1" />
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:via-indigo-600 hover:to-sky-500 active:scale-[0.99] py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
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
                                </div>

                                {/* Secondary Actions & Links */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition hover:underline"
                                    >
                                        <span className="material-symbols-outlined text-base">arrow_back</span>
                                        {t('auth_ui.back_to_login')}
                                    </Link>

                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-800"
                                    >
                                        {t('auth_ui.back_home')}
                                    </Link>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>

                {/* Bottom Simple Copyright Bar */}
                <footer className="relative z-20 py-2.5 text-center text-[11px] font-medium text-slate-400">
                    &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                </footer>
            </div>
        </>
    );
}
