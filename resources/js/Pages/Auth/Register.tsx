import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface Props {
    settings?: Record<string, string>;
    initialCompanyName?: string;
    initialPlan?: string;
}

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    company_name: string;
    plan: string;
}

export default function Register({ settings, initialCompanyName = '', initialPlan = '' }: Props) {
    const { t } = useTrans();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Password criteria computation
    const passwordChecks = useMemo(() => {
        const hasLength = data.password.length >= 8;
        const hasLetters = /[a-zA-Z]/.test(data.password);
        const hasNumbers = /[0-9]/.test(data.password);
        const score = Number(hasLength) + Number(hasLetters) + Number(hasNumbers);

        return {
            hasLength,
            hasLetters,
            hasNumbers,
            score,
        };
    }, [data.password]);

    const isConfirmMatch = useMemo(() => {
        if (!data.password_confirmation) {
            return null;
        }

        return data.password === data.password_confirmation;
    }, [data.password, data.password_confirmation]);

    return (
        <>
            <Head title={t('auth_ui.register_title')} />

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
                                            {t('auth_ui.status_provisioning', undefined, 'Instant Setup • Workspace Gratis')}
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
                                                <span className="material-symbols-outlined text-2xl">directions_car</span>
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
                                            {t('auth_ui.register_welcome')}
                                        </h2>
                                        <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
                                            {t('auth_ui.register_welcome_subtitle')}
                                        </p>
                                    </div>

                                    {/* Feature Cards (3 Highlights: Free Workspace, Rental Focus, Powerful Accounting) */}
                                    <div className="mt-6 space-y-2.5">
                                        <div className="flex items-start gap-3 rounded-2xl border border-white/90 bg-white/75 p-3 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100/90 text-indigo-600 mt-0.5">
                                                <span className="material-symbols-outlined text-base">savings</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {t('auth_ui.register_feature_pricing_title', undefined, 'Workspace Selalu Gratis')}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                                                    {t('auth_ui.register_feature_pricing_desc', undefined, 'Biaya hanya dibebankan berdasarkan jumlah kendaraan yang dikelola')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-2xl border border-white/90 bg-white/75 p-3 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100/90 text-sky-600 mt-0.5">
                                                <span className="material-symbols-outlined text-base">directions_car</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {t('auth_ui.register_feature_focus_title', undefined, 'Fokus Bisnis Rental Kendaraan')}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                                                    {t('auth_ui.register_feature_focus_desc', undefined, 'Dirancang spesifik untuk otomasi armada, reservasi bebas konflik, dan operasional sewa')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-2xl border border-white/90 bg-white/75 p-3 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-600 mt-0.5">
                                                <span className="material-symbols-outlined text-base">account_balance</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {t('auth_ui.register_feature_accounting_title', undefined, 'Akuntansi Rental yang Powerful')}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                                                    {t('auth_ui.register_feature_accounting_desc', undefined, 'Pembukuan otomatis, invoice, kelola deposit, hingga laporan laba-rugi (P&L) per unit mobil')}
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

                            {/* Right Panel: Compact Registration Form */}
                            <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between bg-white/95">
                                <div>
                                    {/* Optional Plan / Workspace Banner */}
                                    {(initialCompanyName || initialPlan) && (
                                        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-700">
                                            <span className="material-symbols-outlined text-base text-indigo-600">domain</span>
                                            <span>
                                                {initialCompanyName ? t('auth_ui.workspace_label', { name: initialCompanyName }, `Workspace: ${initialCompanyName}`) : t('auth_ui.workspace_setup_new', undefined, 'Setup Workspace Baru')}
                                                {initialPlan ? ` • ${t('auth_ui.plan_label', { plan: initialPlan.toUpperCase() }, `Paket: ${initialPlan.toUpperCase()}`)}` : ''}
                                            </span>
                                        </div>
                                    )}

                                    {/* Form Header */}
                                    <div className="mb-5">
                                        <div className="flex items-center justify-between">
                                            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                                {t('auth_ui.register_title')}
                                            </h1>
                                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                                <span className="material-symbols-outlined text-xs">verified</span>
                                                {t('auth_ui.badge_free_workspace', undefined, 'Workspace Gratis')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                            {t('auth_ui.register_form_subtitle')}
                                        </p>
                                    </div>

                                    {/* Registration Form */}
                                    <form onSubmit={submit} className="space-y-3.5">
                                        {/* Name Field */}
                                        <div>
                                            <label htmlFor="name" className="mb-1 block text-xs font-bold text-slate-700">
                                                {t('auth_ui.name')}
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    <span className="material-symbols-outlined text-lg">badge</span>
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
                                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder={t('auth_ui.name')}
                                                />
                                            </div>
                                            <InputError message={errors.name} className="mt-1" />
                                        </div>

                                        {/* Email Field */}
                                        <div>
                                            <label htmlFor="email" className="mb-1 block text-xs font-bold text-slate-700">
                                                {t('auth_ui.email')}
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
                                                    autoComplete="username"
                                                    required
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder={t('auth_ui.email_placeholder')}
                                                />
                                            </div>
                                            <InputError message={errors.email} className="mt-1" />
                                        </div>

                                        {/* Password Field */}
                                        <div>
                                            <label htmlFor="password" className="mb-1 block text-xs font-bold text-slate-700">
                                                {t('auth_ui.password')}
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    <span className="material-symbols-outlined text-lg">lock</span>
                                                </div>
                                                <input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={data.password}
                                                    autoComplete="new-password"
                                                    required
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-9 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition"
                                                    tabIndex={-1}
                                                    title={showPassword ? t('auth_ui.hide_password', undefined, 'Sembunyikan sandi') : t('auth_ui.show_password', undefined, 'Tampilkan sandi')}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {showPassword ? 'visibility_off' : 'visibility'}
                                                    </span>
                                                </button>
                                            </div>
                                            <InputError message={errors.password} className="mt-1" />
                                        </div>

                                        {/* Password Confirmation Field */}
                                        <div>
                                            <div className="mb-1 flex items-center justify-between">
                                                <label htmlFor="password_confirmation" className="block text-xs font-bold text-slate-700">
                                                    {t('auth_ui.password_confirmation')}
                                                </label>
                                                {isConfirmMatch !== null && (
                                                    <span className={`text-[10px] font-bold ${isConfirmMatch ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {isConfirmMatch ? t('auth_ui.password_match', undefined, 'Cocok ✓') : t('auth_ui.password_mismatch', undefined, 'Belum sama')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    <span className="material-symbols-outlined text-lg">lock_reset</span>
                                                </div>
                                                <input
                                                    id="password_confirmation"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    name="password_confirmation"
                                                    value={data.password_confirmation}
                                                    autoComplete="new-password"
                                                    required
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    className={`block w-full rounded-xl border bg-slate-50/60 py-2.5 pl-9 pr-9 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:bg-white focus:outline-none focus:ring-2 ${
                                                        isConfirmMatch === false
                                                            ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/20'
                                                            : isConfirmMatch === true
                                                            ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                                                            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                                                    }`}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition"
                                                    tabIndex={-1}
                                                    title={showConfirmPassword ? t('auth_ui.hide_password', undefined, 'Sembunyikan sandi') : t('auth_ui.show_password', undefined, 'Tampilkan sandi')}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                                    </span>
                                                </button>
                                            </div>
                                            <InputError message={errors.password_confirmation} className="mt-1" />
                                        </div>

                                        {/* Compact Inline Password Strength Meter */}
                                        {data.password.length > 0 && (
                                            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 transition-all">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[11px] font-semibold text-slate-500">
                                                        {t('auth_ui.password_strength_label', undefined, 'Kekuatan Sandi:')}
                                                    </span>
                                                    <span className={`text-[11px] font-bold ${
                                                        passwordChecks.score === 3
                                                            ? 'text-emerald-600'
                                                            : passwordChecks.score === 2
                                                            ? 'text-amber-600'
                                                            : 'text-rose-600'
                                                    }`}>
                                                        {passwordChecks.score === 3
                                                            ? t('auth_ui.strength_strong', undefined, 'Kuat')
                                                            : passwordChecks.score === 2
                                                            ? t('auth_ui.strength_fair', undefined, 'Cukup')
                                                            : t('auth_ui.strength_weak', undefined, 'Lemah')}
                                                    </span>
                                                </div>

                                                {/* 3-segment progressive bar */}
                                                <div className="grid grid-cols-3 gap-1.5 mb-2">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                                            passwordChecks.score >= 1
                                                                ? passwordChecks.score === 1
                                                                    ? 'bg-rose-500'
                                                                    : passwordChecks.score === 2
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-emerald-500'
                                                                : 'bg-slate-200'
                                                        }`}
                                                    />
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                                            passwordChecks.score >= 2
                                                                ? passwordChecks.score === 2
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-emerald-500'
                                                                : 'bg-slate-200'
                                                        }`}
                                                    />
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                                            passwordChecks.score === 3 ? 'bg-emerald-500' : 'bg-slate-200'
                                                        }`}
                                                    />
                                                </div>

                                                {/* 3 micro-criteria pills */}
                                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                    {[
                                                        { ok: passwordChecks.hasLength, label: t('auth_ui.password_hint_length') },
                                                        { ok: passwordChecks.hasLetters, label: t('auth_ui.password_hint_letters') },
                                                        { ok: passwordChecks.hasNumbers, label: t('auth_ui.password_hint_numbers') },
                                                    ].map(({ ok, label }) => (
                                                        <span
                                                            key={label}
                                                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                                                                ok
                                                                    ? 'bg-emerald-100/70 text-emerald-700'
                                                                    : 'bg-slate-200/60 text-slate-400'
                                                            }`}
                                                        >
                                                            <span className="material-symbols-outlined text-[13px]">
                                                                {ok ? 'check_circle' : 'radio_button_unchecked'}
                                                            </span>
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Terms & Conditions Agreement */}
                                        <div className="pt-0.5">
                                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
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
                                                    {t('auth_ui.terms_agreement_prefix', undefined, 'Saya menyetujui')}{' '}
                                                    <a
                                                        href="/terms"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                                                    >
                                                        {t('auth_ui.terms_service', undefined, 'Syarat & Ketentuan')}
                                                    </a>{' '}
                                                    {t('auth_ui.terms_and', undefined, 'dan')}{' '}
                                                    <a
                                                        href="/privacy"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                                                    >
                                                        {t('auth_ui.privacy_policy', undefined, 'Kebijakan Privasi')}
                                                    </a>
                                                </span>
                                            </label>
                                            <InputError message={errors.terms} className="mt-1" />
                                        </div>

                                        {/* Primary CTA Submit Button */}
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
                                </div>

                                {/* Secondary Actions & Links */}
                                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
                                    <Link
                                        href={route('login')}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition hover:underline"
                                    >
                                        {t('auth_ui.already_registered')}
                                    </Link>

                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-800"
                                    >
                                        <span className="material-symbols-outlined text-base">arrow_back</span>
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
