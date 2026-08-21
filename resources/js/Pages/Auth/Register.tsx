import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    settings?: Record<string, string>;
    initialCompanyName?: string;
    initialPlan?: string;
}

export default function Register({ settings, initialCompanyName = '', initialPlan = '' }: Props) {
    const { t } = useTrans();
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    interface RegisterForm {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        terms: boolean;
        company_name: string;
        plan: string;
    }

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
        company_name: initialCompanyName,
        plan: initialPlan,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];

    return (
        <>
            <Head title={t('auth_ui.register_title')} />

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
                                Instant Provisioning • No Credit Card
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
                                        <span className="material-symbols-outlined text-4xl text-indigo-600">rocket_launch</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                                {t('auth_ui.register_welcome')}
                            </h1>
                            <p className="mt-4 text-base font-medium text-slate-600 leading-relaxed">
                                {t('auth_ui.register_welcome_subtitle')}
                            </p>

                            {/* Features Showcase */}
                            <div className="mt-10 space-y-3.5">
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                                        <span className="material-symbols-outlined text-xl">rocket_launch</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.register_feature_trial')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                                        <span className="material-symbols-outlined text-xl">directions_car</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.register_feature_verticals')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600">
                                        <span className="material-symbols-outlined text-xl">account_balance</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('auth_ui.register_feature_accounting')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Tagline */}
                        <div className="text-xs font-medium text-slate-400">
                            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Right Side: Register Form */}
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
                                    <span className="material-symbols-outlined text-4xl text-indigo-600">rocket_launch</span>
                                </div>
                            )}
                        </div>

                        {/* Register Card */}
                        <div className="rounded-3xl border border-white/90 bg-white/85 p-8 sm:p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
                            <div className="mb-8 text-center">
                                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t('auth_ui.register_title')}</h2>
                                <p className="mt-2 text-xs font-medium text-slate-500">{t('auth_ui.register_form_subtitle')}</p>
                            </div>

                            <form onSubmit={submit} className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        {t('auth_ui.name')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                            <span className="material-symbols-outlined text-xl">badge</span>
                                        </div>
                                        <input
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={data.name}
                                            autoComplete="name"
                                            autoFocus
                                            required
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="block w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder={t('auth_ui.name')}
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        {t('auth_ui.email')}
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
                                            autoComplete="username"
                                            required
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="block w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder={t('auth_ui.email_placeholder')}
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        {t('auth_ui.password')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                            <span className="material-symbols-outlined text-xl">lock</span>
                                        </div>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            autoComplete="new-password"
                                            required
                                            onFocus={() => setIsPasswordFocused(true)}
                                            onBlur={() => setIsPasswordFocused(false)}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="block w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-11 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition"
                                            tabIndex={-1}
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>

                                        {/* Floating Password Requirements Indicator on the Right */}
                                        {(isPasswordFocused || data.password.length > 0) && (
                                            <div className="absolute z-30 w-64 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl shadow-slate-300/40 backdrop-blur-xl transition-all duration-200 top-full mt-2 left-0 sm:top-1/2 sm:-translate-y-1/2 sm:mt-0 sm:left-full sm:ml-3 sm:w-60 sm:right-auto pointer-events-none">
                                                {/* Directional arrow pointing to the input field on desktop */}
                                                <div className="hidden sm:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-slate-200/90 rotate-45" />

                                                <div className="relative z-10 space-y-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        {t('auth_ui.password_hint_title')}
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {[
                                                            { ok: data.password.length >= 8, label: t('auth_ui.password_hint_length') },
                                                            { ok: /[a-zA-Z]/.test(data.password), label: t('auth_ui.password_hint_letters') },
                                                            { ok: /[0-9]/.test(data.password), label: t('auth_ui.password_hint_numbers') },
                                                        ].map(({ ok, label }) => (
                                                            <div key={label} className="flex items-center gap-2">
                                                                <span className={`material-symbols-outlined text-sm ${ok ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                                    {ok ? 'check_circle' : 'radio_button_unchecked'}
                                                                </span>
                                                                <span className={`text-[11px] font-bold ${ok ? 'text-emerald-700' : 'text-slate-400'}`}>{label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                {/* Password Confirmation */}
                                <div>
                                    <label htmlFor="password_confirmation" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        {t('auth_ui.password_confirmation')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                            <span className="material-symbols-outlined text-xl">lock_reset</span>
                                        </div>
                                        <input
                                            id="password_confirmation"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            autoComplete="new-password"
                                            required
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="block w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                </div>

                                {/* Terms Agreement */}
                                <div className="pt-1">
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            id="terms"
                                            type="checkbox"
                                            name="terms"
                                            checked={data.terms}
                                            required
                                            onChange={(e) => setData('terms', e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 transition focus:ring-indigo-500/30 focus:ring-offset-0"
                                        />
                                        <span className="text-xs font-medium text-slate-600 leading-relaxed">
                                            Saya menyetujui{' '}
                                            <a
                                                href="/terms"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-indigo-600 hover:text-indigo-700 underline"
                                            >
                                                Syarat & Ketentuan
                                            </a>{' '}
                                            dan{' '}
                                            <a
                                                href="/privacy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-indigo-600 hover:text-indigo-700 underline"
                                            >
                                                Kebijakan Privasi
                                            </a>
                                        </span>
                                    </label>
                                    <InputError message={errors.terms} className="mt-2" />
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
                                            <span>{t('auth_ui.register_submitting')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('auth_ui.register_submit')}</span>
                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Links */}
                            <div className="mt-8 flex flex-col items-center gap-3 text-center">
                                <Link
                                    href={route('login')}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition hover:underline"
                                >
                                    {t('auth_ui.already_registered')}
                                </Link>
                                <a
                                    href="/"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-800"
                                >
                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                    {t('auth_ui.back_home')}
                                </a>
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
