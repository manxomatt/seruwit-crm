import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';

interface PlanOption {
    id: number;
    key: string;
    name: string;
    description: string | null;
    badge?: string | null;
    is_popular?: boolean;
    is_default?: boolean;
    is_trial?: boolean;
    trial_days?: number | null;
    price: string | null;
    original_price: string | null;
    annual_price: string | null;
    currency: string;
    limits?: {
        max_vehicles?: number | null;
        max_users?: number | null;
        max_branches?: number | null;
    } | null;
    features_list?: string[] | null;
    modules: string[];
}

interface VerticalOption {
    key: string;
    label: string;
    description: string;
    available: boolean;
}

interface FailedSession {
    company_name: string;
    subdomain: string;
    plan_key?: string | null;
    verticals: string[];
    error_message: string | null;
}

interface Props {
    user: { name: string; email: string };
    centralHost: string;
    availablePlans?: PlanOption[];
    initialPlanKey?: string;
    verticalOptions: VerticalOption[];
    failedSession: FailedSession | null;
    settings?: Record<string, string>;
}

export default function Onboarding({
    user,
    centralHost,
    availablePlans = [],
    initialPlanKey = 'free',
    verticalOptions,
    failedSession,
    settings,
}: Props): JSX.Element {
    const { t } = useTrans();

    const { data, setData, post, processing, errors } = useForm({
        company_name: failedSession?.company_name ?? '',
        subdomain: failedSession?.subdomain ?? '',
        plan_key: failedSession?.plan_key ?? initialPlanKey,
        verticals: failedSession?.verticals ?? (['rental'] as string[]),
    });

    const toggleVertical = (key: string): void => {
        if (!verticalOptions.some((option) => option.key === key && option.available)) {
            return;
        }

        if (data.verticals.includes(key)) {
            setData(
                'verticals',
                data.verticals.filter((item) => item !== key),
            );
            return;
        }

        setData('verticals', [...data.verticals, key]);
    };

    const previewHint = useMemo(() => {
        if (data.verticals.length === 0) {
            return t('central.onboarding.preview_core');
        }

        return `${t('central.onboarding.preview_core')} + ${data.verticals
            .map((key) => t(`central.onboarding.verticals.${key}`))
            .join(', ')}`;
    }, [data.verticals, t]);

    const submit = (e: FormEvent): void => {
        e.preventDefault();
        post(route('central.onboarding.store'));
    };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];

    const verticalIcon = (key: string): string => {
        if (key === 'rental') {
            return 'directions_car';
        }
        if (key === 'travel') {
            return 'airport_shuttle';
        }

        return 'apps';
    };

    return (
        <>
            <Head title={t('central.onboarding.title')} />

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
                                Instant Provisioning
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
                                        <span className="material-symbols-outlined text-4xl text-indigo-600">apartment</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                                {t('central.onboarding.welcome')}
                            </h1>
                            <p className="mt-4 text-base font-medium text-slate-600 leading-relaxed">
                                {t('central.onboarding.welcome_subtitle')}
                            </p>

                            {/* Features Showcase */}
                            <div className="mt-10 space-y-3.5">
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                                        <span className="material-symbols-outlined text-xl">domain</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('central.onboarding.feature_company')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                                        <span className="material-symbols-outlined text-xl">tune</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('central.onboarding.feature_verticals')}</span>
                                </div>
                                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600">
                                        <span className="material-symbols-outlined text-xl">account_balance</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{t('central.onboarding.feature_accounting')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Tagline */}
                        <div className="text-xs font-medium text-slate-400">
                            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Right Side: Onboarding Form */}
                <div className="relative z-10 flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
                    <div className="w-full max-w-md">
                        {/* Mobile Brand Logo */}
                        <div className="mb-6 flex justify-center lg:hidden">
                            {siteLogo ? (
                                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-2.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                                    <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                </div>
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-indigo-100 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 backdrop-blur-xl">
                                    <span className="material-symbols-outlined text-3xl text-indigo-600">apartment</span>
                                </div>
                            )}
                        </div>

                        {/* Onboarding Card */}
                        <div className="rounded-3xl border border-white/90 bg-white/85 p-8 sm:p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                    {t('central.onboarding.title')}
                                </h2>
                                <p className="mt-2 text-xs font-medium text-slate-500">
                                    {t('central.onboarding.verified_as', { email: user.email })}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">{t('central.onboarding.pending_message')}</p>
                            </div>

                            {failedSession && (
                                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 backdrop-blur-md">
                                    <div className="flex items-start gap-2.5">
                                        <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
                                        <div>
                                            <p className="text-xs font-bold text-rose-800">
                                                {t('central.onboarding.failed_title')}
                                            </p>
                                            {failedSession.error_message && (
                                                <p className="mt-1 break-words text-xs text-rose-700">
                                                    {failedSession.error_message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                {/* Company Name */}
                                <div>
                                    <label
                                        htmlFor="company_name"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        {t('central.onboarding.company_name')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                            <span className="material-symbols-outlined text-xl">business</span>
                                        </div>
                                        <input
                                            id="company_name"
                                            type="text"
                                            value={data.company_name}
                                            required
                                            autoFocus
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            className="block w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder={t('central.onboarding.company_name')}
                                        />
                                    </div>
                                    <InputError message={errors.company_name} className="mt-2" />
                                </div>

                                {/* Subdomain */}
                                <div>
                                    <label
                                        htmlFor="subdomain"
                                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                                    >
                                        {t('central.onboarding.subdomain')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative min-w-0 flex-1">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                <span className="material-symbols-outlined text-xl">language</span>
                                            </div>
                                            <input
                                                id="subdomain"
                                                type="text"
                                                value={data.subdomain}
                                                required
                                                onChange={(e) =>
                                                    setData('subdomain', e.target.value.toLowerCase())
                                                }
                                                className="block w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                placeholder="acme"
                                            />
                                        </div>
                                        <span className="shrink-0 font-mono text-xs font-bold text-slate-400">.{centralHost}</span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.subdomain_hint')}</p>
                                    <InputError message={errors.subdomain} className="mt-2" />
                                </div>

                                {/* Plan Selection */}
                                {availablePlans.length > 0 && (
                                    <div>
                                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                                            {t('central.onboarding.plans_title')}
                                        </p>
                                        <p className="mb-3 text-[11px] text-slate-400">
                                            {t('central.onboarding.plans_hint')}
                                        </p>
                                        <div className="space-y-2.5">
                                            {availablePlans.map((p) => {
                                                const selected = data.plan_key === p.key;
                                                const hasMonthly = p.price && Number(p.price) > 0;

                                                return (
                                                    <div
                                                        key={p.key}
                                                        onClick={() => setData('plan_key', p.key)}
                                                        className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all ${
                                                            selected
                                                                ? 'border-indigo-600 bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/80 shadow-md ring-2 ring-indigo-500/20'
                                                                : p.is_popular
                                                                  ? 'border-indigo-200 bg-white/90 hover:border-indigo-300'
                                                                  : 'border-slate-200/80 bg-white/80 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                                                selected
                                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                    : 'border-slate-300 bg-white'
                                                            }`}>
                                                                {selected && (
                                                                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-xs font-black text-slate-900">{p.name}</span>
                                                                    {p.badge && (
                                                                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">
                                                                            {p.badge}
                                                                        </span>
                                                                    )}
                                                                    {p.trial_days !== undefined && p.trial_days !== null && Number(p.trial_days) > 0 && (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                            Trial {p.trial_days} Hari
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{p.description}</p>
                                                                {p.limits && (
                                                                    <div className="mt-1 flex items-center gap-2 text-[10px] font-medium text-slate-600">
                                                                        <span>🚗 {p.limits.max_vehicles ? `Maks. ${p.limits.max_vehicles} Armada` : 'Unlimited Armada'}</span>
                                                                        <span>•</span>
                                                                        <span>👥 {p.limits.max_users ? `Maks. ${p.limits.max_users} Pengguna` : 'Unlimited Pengguna'}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="sm:text-right shrink-0 pl-8 sm:pl-0">
                                                            <div className="text-xs font-black text-slate-900">
                                                                {!hasMonthly ? (
                                                                    <span className="text-emerald-700">Gratis</span>
                                                                ) : (
                                                                    <span>
                                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: p.currency || 'IDR', maximumFractionDigits: 0 }).format(Number(p.price))}
                                                                        <span className="text-[10px] font-normal text-slate-400">/bln</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {p.trial_days !== undefined && p.trial_days !== null && Number(p.trial_days) > 0 ? (
                                                                <span className="block text-[10px] font-bold text-emerald-600">
                                                                    Gratis {p.trial_days} Hari Pertama
                                                                </span>
                                                            ) : p.key === 'free' ? (
                                                                <span className="block text-[10px] font-semibold text-emerald-600">Selamanya</span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <InputError message={errors.plan_key} className="mt-2" />
                                    </div>
                                )}

                                {/* Verticals */}
                                <div>
                                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                                        {t('central.onboarding.verticals_title')}
                                    </p>
                                    <p className="mb-3 text-[11px] text-slate-400">{t('central.onboarding.verticals_hint')}</p>
                                    <div className="space-y-2">
                                        {verticalOptions.map((option) => {
                                            const checked = data.verticals.includes(option.key);
                                            const disabled = !option.available;

                                            return (
                                                <label
                                                    key={option.key}
                                                    aria-disabled={disabled}
                                                    className={`flex gap-3 rounded-2xl border p-3 transition-all ${
                                                        disabled
                                                            ? 'cursor-not-allowed border-slate-200/50 bg-slate-100/50 opacity-50'
                                                            : checked
                                                              ? 'cursor-pointer border-indigo-500/60 bg-indigo-50/80 shadow-sm'
                                                              : 'cursor-pointer border-slate-200/80 bg-white/80 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 focus:ring-offset-0 disabled:cursor-not-allowed"
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onChange={() => toggleVertical(option.key)}
                                                    />
                                                    <span className="flex min-w-0 items-start gap-3">
                                                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                                                            checked ? 'border-indigo-200 bg-indigo-100 text-indigo-600' : 'border-slate-200 bg-slate-50 text-slate-500'
                                                        }`}>
                                                            <span className="material-symbols-outlined text-lg">
                                                                {verticalIcon(option.key)}
                                                            </span>
                                                        </span>
                                                        <span>
                                                            <span className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-900">
                                                                {option.label}
                                                                {disabled && (
                                                                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                        {t('central.onboarding.verticals.coming_soon')}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="block text-[11px] text-slate-500">
                                                                {option.description}
                                                            </span>
                                                        </span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.verticals} className="mt-2" />
                                </div>

                                {/* Core Modules Preview */}
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-xs text-slate-600">
                                    <p className="font-bold text-slate-800">{t('central.onboarding.preview_title')}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">{previewHint}</p>
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
                                            <span>{t('central.onboarding.submitting')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>
                                                {failedSession
                                                    ? t('central.onboarding.retry')
                                                    : t('central.onboarding.submit')}
                                            </span>
                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Logout */}
                            <div className="mt-6 text-center">
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
                        <div className="mt-6 text-center">
                            <p className="text-xs font-medium text-slate-400">{t('auth_ui.tagline', { name: siteName })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
