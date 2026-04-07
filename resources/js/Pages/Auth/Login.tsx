import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    status?: string;
    canResetPassword?: boolean;
    settings?: Record<string, string>;
}

export default function Login({ status, canResetPassword, settings }: Props) {
    interface LoginForm {
        email: string;
        password: string;
        remember: boolean;
    }

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const siteName = settings?.['general.site_name'] || 'Sky Track';
    const siteLogo = settings?.['site.logo'];

    return (
        <>
            <Head title="Masuk" />

            <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-400/5 rounded-full blur-2xl" />
                    <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-cyan-400/5 rounded-full blur-2xl" />
                </div>

                {/* Left Side - Branding/Illustration */}
                <div className="hidden lg:flex lg:w-1/2 relative">
                    <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
                        {/* Logo/Icon */}
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
                                        location_on
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <h1 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                            Selamat Datang Kembali!
                        </h1>
                        <p className="text-lg text-white/70 text-center max-w-md">
                            Masuk untuk mengakses dashboard dan kelola pelacakan kendaraan Anda dengan mudah.
                        </p>
                        
                        {/* Feature highlights */}
                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-cyan-400">
                                        verified_user
                                    </span>
                                </div>
                                <span className="text-white/80">Autentikasi aman</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-cyan-400">
                                        my_location
                                    </span>
                                </div>
                                <span className="text-white/80">Pelacakan real-time</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-cyan-400">
                                        analytics
                                    </span>
                                </div>
                                <span className="text-white/80">Analitik lengkap</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
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
                                        location_on
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Glassmorphism Card */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-white">Masuk</h2>
                                <p className="mt-2 text-white/60">
                                    Masukkan kredensial untuk mengakses akun Anda
                                </p>
                            </div>

                            {/* Status Message */}
                            {status && (
                                <div className="mb-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-400">
                                            check_circle
                                        </span>
                                        <span className="text-sm font-medium text-green-300">{status}</span>
                                    </div>
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={submit} className="space-y-6">
                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                                        Alamat Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-white/40">
                                                mail
                                            </span>
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            autoComplete="username"
                                            autoFocus
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                                            placeholder="anda@contoh.com"
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                                        Kata Sandi
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
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="w-4 h-4 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-cyan-500/50 focus:ring-offset-0 transition-colors"
                                        />
                                        <span className="ml-2 text-sm text-white/70">Ingat saya</span>
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                                        >
                                            Lupa kata sandi?
                                        </Link>
                                    )}
                                </div>

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
                                            Sedang masuk...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">
                                                login
                                            </span>
                                            Masuk
                                        </span>
                                    )}
                                </button>
                            </form>

                            {/* Back to Home Link */}
                            <div className="mt-6 text-center">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        arrow_back
                                    </span>
                                    Kembali ke Beranda
                                </Link>
                            </div>
                        </div>

                        {/* App Name */}
                        <div className="mt-8 text-center">
                            <p className="text-white/40 text-sm">
                                {siteName} - Solusi Pelacakan Kendaraan Terpercaya
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
