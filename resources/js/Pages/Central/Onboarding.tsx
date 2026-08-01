import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';

interface VerticalOption {
    key: string;
    label: string;
    description: string;
}

interface FailedSession {
    company_name: string;
    subdomain: string;
    verticals: string[];
    error_message: string | null;
}

interface Props {
    user: { name: string; email: string };
    centralHost: string;
    verticalOptions: VerticalOption[];
    failedSession: FailedSession | null;
    settings?: Record<string, string>;
}

export default function Onboarding({
    user,
    centralHost,
    verticalOptions,
    failedSession,
    settings,
}: Props): JSX.Element {
    const { t } = useTrans();

    const { data, setData, post, processing, errors } = useForm({
        company_name: failedSession?.company_name ?? '',
        subdomain: failedSession?.subdomain ?? '',
        verticals: failedSession?.verticals ?? ([] as string[]),
    });

    const toggleVertical = (key: string): void => {
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
                                    <span className="material-symbols-outlined text-5xl text-cyan-400">apartment</span>
                                </div>
                            )}
                        </div>

                        <h1 className="mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-center text-4xl font-bold text-transparent">
                            {t('central.onboarding.welcome')}
                        </h1>
                        <p className="max-w-md text-center text-lg text-white/70">
                            {t('central.onboarding.welcome_subtitle')}
                        </p>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">domain</span>
                                </div>
                                <span className="text-white/80">{t('central.onboarding.feature_company')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">tune</span>
                                </div>
                                <span className="text-white/80">{t('central.onboarding.feature_verticals')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">account_balance</span>
                                </div>
                                <span className="text-white/80">{t('central.onboarding.feature_accounting')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex w-full items-center justify-center p-6 sm:p-8 lg:w-1/2">
                    <div className="w-full max-w-md">
                        <div className="mb-6 flex justify-center lg:hidden">
                            {siteLogo ? (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                                    <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                </div>
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-3xl text-cyan-400">apartment</span>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                                    {t('central.onboarding.title')}
                                </h2>
                                <p className="mt-2 text-sm text-white/60">
                                    {t('central.onboarding.verified_as', { email: user.email })}
                                </p>
                                <p className="mt-1 text-sm text-white/50">{t('central.onboarding.pending_message')}</p>
                            </div>

                            {failedSession && (
                                <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/20 p-4 backdrop-blur-sm">
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-red-300">error</span>
                                        <div>
                                            <p className="text-sm font-medium text-red-200">
                                                {t('central.onboarding.failed_title')}
                                            </p>
                                            {failedSession.error_message && (
                                                <p className="mt-1 break-words text-xs text-red-200/80">
                                                    {failedSession.error_message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="company_name"
                                        className="mb-2 block text-sm font-medium text-white/80"
                                    >
                                        {t('central.onboarding.company_name')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <span className="material-symbols-outlined text-white/40">business</span>
                                        </div>
                                        <input
                                            id="company_name"
                                            type="text"
                                            value={data.company_name}
                                            required
                                            autoFocus
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-white/40 transition-all duration-200 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                            placeholder={t('central.onboarding.company_name')}
                                        />
                                    </div>
                                    <InputError message={errors.company_name} className="mt-2" />
                                </div>

                                <div>
                                    <label
                                        htmlFor="subdomain"
                                        className="mb-2 block text-sm font-medium text-white/80"
                                    >
                                        {t('central.onboarding.subdomain')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative min-w-0 flex-1">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                <span className="material-symbols-outlined text-white/40">language</span>
                                            </div>
                                            <input
                                                id="subdomain"
                                                type="text"
                                                value={data.subdomain}
                                                required
                                                onChange={(e) =>
                                                    setData('subdomain', e.target.value.toLowerCase())
                                                }
                                                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-white/40 transition-all duration-200 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                                placeholder="acme"
                                            />
                                        </div>
                                        <span className="shrink-0 text-sm text-white/50">.{centralHost}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-white/40">{t('central.onboarding.subdomain_hint')}</p>
                                    <InputError message={errors.subdomain} className="mt-2" />
                                </div>

                                <div>
                                    <p className="mb-1 text-sm font-medium text-white/80">
                                        {t('central.onboarding.verticals_title')}
                                    </p>
                                    <p className="mb-3 text-xs text-white/40">{t('central.onboarding.verticals_hint')}</p>
                                    <div className="space-y-2">
                                        {verticalOptions.map((option) => {
                                            const checked = data.verticals.includes(option.key);

                                            return (
                                                <label
                                                    key={option.key}
                                                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                                                        checked
                                                            ? 'border-cyan-400/50 bg-cyan-500/15'
                                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0"
                                                        checked={checked}
                                                        onChange={() => toggleVertical(option.key)}
                                                    />
                                                    <span className="flex min-w-0 items-start gap-3">
                                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                                                            <span className="material-symbols-outlined text-lg text-cyan-400">
                                                                {verticalIcon(option.key)}
                                                            </span>
                                                        </span>
                                                        <span>
                                                            <span className="block text-sm font-medium text-white">
                                                                {option.label}
                                                            </span>
                                                            <span className="block text-xs text-white/50">
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

                                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60">
                                    <p className="font-medium text-white/80">{t('central.onboarding.preview_title')}</p>
                                    <p className="mt-1 text-xs text-white/50">{previewHint}</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full transform rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:scale-[1.02] hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? t('central.onboarding.submitting')
                                        : failedSession
                                          ? t('central.onboarding.retry')
                                          : t('central.onboarding.submit')}
                                </button>
                            </form>

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

                        <div className="mt-6 text-center">
                            <p className="text-sm text-white/40">{t('auth_ui.tagline', { name: siteName })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
