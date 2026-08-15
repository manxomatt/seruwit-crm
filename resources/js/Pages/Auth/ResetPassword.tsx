import InputError from '@/Components/InputError';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    token?: string;
    email?: string;
    settings?: Record<string, string>;
}

export default function ResetPassword({ token, email, settings }: Props) {
    const { t } = useTrans();

    interface ResetForm {
        token?: string;
        email?: string;
        password: string;
        password_confirmation: string;
    }

    const { data, setData, post, processing, errors, reset } = useForm<ResetForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];

    return (
        <>
            <Head title={t('auth_ui.reset_title')} />

            <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-400/5 rounded-full blur-2xl" />
                    <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-cyan-400/5 rounded-full blur-2xl" />
                </div>

                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative">
                    <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
                        <div className="mb-8">
                            {siteLogo ? (
                                <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 p-3">
                                    <img
                                        src={siteLogo}
                                        alt={siteName}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                    <span className="material-symbols-outlined text-5xl text-cyan-400">
                                        lock_reset
                                    </span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                            {t('auth_ui.reset_title')}
                        </h1>
                        <p className="text-lg text-white/70 text-center max-w-md">
                            {t('auth_ui.reset_subtitle')}
                        </p>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-cyan-400">
                                        shield
                                    </span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.reset_feature_secure')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-cyan-400">
                                        bolt
                                    </span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.reset_feature_immediate')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-cyan-400">
                                        login
                                    </span>
                                </div>
                                <span className="text-white/80">{t('auth_ui.reset_feature_access')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Reset Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            {siteLogo ? (
                                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 p-2">
                                    <img
                                        src={siteLogo}
                                        alt={siteName}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                    <span className="material-symbols-outlined text-4xl text-cyan-400">
                                        lock_reset
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Glassmorphism Card */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-3xl text-cyan-400">
                                        lock_reset
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-white">{t('auth_ui.reset_title')}</h2>
                                <p className="mt-2 text-white/60">
                                    {t('auth_ui.reset_subtitle')}
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                {/* Hidden fields */}
                                <input type="hidden" name="token" value={data.token} />
                                <input type="hidden" name="email" value={data.email} />

                                {/* New Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                                        {t('auth_ui.new_password_label')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-white/40">
                                                lock
                                            </span>
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            autoComplete="new-password"
                                            autoFocus
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                                            placeholder={t('auth_ui.new_password_placeholder')}
                                        />
                                    </div>
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-white/80 mb-2">
                                        {t('auth_ui.confirm_password_label')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-white/40">
                                                lock_clock
                                            </span>
                                        </div>
                                        <input
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            autoComplete="new-password"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                                            placeholder={t('auth_ui.confirm_password_placeholder')}
                                        />
                                    </div>
                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                </div>

                                {/* email validation error (server-side) */}
                                {errors.email && (
                                    <InputError message={errors.email} />
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            {t('auth_ui.resetting')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">
                                                lock_reset
                                            </span>
                                            {t('auth_ui.reset_submit')}
                                        </span>
                                    )}
                                </button>
                            </form>

                            {/* Back to Login Link */}
                            <div className="mt-6 text-center">
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        arrow_back
                                    </span>
                                    {t('auth_ui.back_to_login')}
                                </Link>
                            </div>
                        </div>

                        {/* App Name */}
                        <div className="mt-8 text-center">
                            <p className="text-white/40 text-sm">
                                {t('auth_ui.tagline', { name: siteName })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
