import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    settings?: Record<string, string>;
}

export default function Register({ settings }: Props) {
    const { t } = useTrans();

    interface RegisterForm {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    }

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
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
                                    <span className="material-symbols-outlined text-5xl text-cyan-400">location_on</span>
                                </div>
                            )}
                        </div>

                        <h1 className="mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-center text-4xl font-bold text-transparent">
                            {t('auth_ui.register_welcome')}
                        </h1>
                        <p className="max-w-md text-center text-lg text-white/70">{t('auth_ui.register_welcome_subtitle')}</p>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">rocket_launch</span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.register_feature_trial')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">directions_car</span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.register_feature_verticals')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-cyan-400">account_balance</span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.register_feature_accounting')}</span>
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
                                    <span className="material-symbols-outlined text-4xl text-cyan-400">location_on</span>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
                            <div className="mb-8 text-center">
                                <h2 className="text-3xl font-bold text-white">{t('auth_ui.register_title')}</h2>
                                <p className="mt-2 text-white/60">{t('auth_ui.register_form_subtitle')}</p>
                            </div>

                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/80">
                                        {t('auth_ui.name')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <span className="material-symbols-outlined text-white/40">badge</span>
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
                                            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-white/40 transition-all duration-200 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                            placeholder={t('auth_ui.name')}
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                                        {t('auth_ui.email')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <span className="material-symbols-outlined text-white/40">mail</span>
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            autoComplete="username"
                                            required
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-white/40 transition-all duration-200 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                            placeholder={t('auth_ui.email_placeholder')}
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
                                        {t('auth_ui.password')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <span className="material-symbols-outlined text-white/40">lock</span>
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            autoComplete="new-password"
                                            required
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-white/40 transition-all duration-200 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password_confirmation"
                                        className="mb-2 block text-sm font-medium text-white/80"
                                    >
                                        {t('auth_ui.password_confirmation')}
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <span className="material-symbols-outlined text-white/40">lock_reset</span>
                                        </div>
                                        <input
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            autoComplete="new-password"
                                            required
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-white/40 transition-all duration-200 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full transform rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:scale-[1.02] hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? t('auth_ui.register_submitting') : t('auth_ui.register_submit')}
                                </button>
                            </form>

                            <div className="mt-6 flex flex-col items-center gap-3 text-center">
                                <Link
                                    href={route('login')}
                                    className="text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                                >
                                    {t('auth_ui.already_registered')}
                                </Link>
                                <a
                                    href="/"
                                    className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white/80"
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                                    {t('auth_ui.back_home')}
                                </a>
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
