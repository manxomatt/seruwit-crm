import { Head, Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
}

interface Props {
    brand: Brand;
    redirect?: string | null;
}

export default function Login({ brand, redirect }: Props) {
    const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
    const brandColor = brand.color || '#0f766e';

    // OTP Flow State
    const [otpPhone, setOtpPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [debugOtp, setDebugOtp] = useState<string | null>(null);

    // Password Flow State
    const passwordForm = useForm({
        login: '',
        password: '',
        remember: true,
        redirect: redirect || '',
    });

    const handleSendOtp = async (e: FormEvent) => {
        e.preventDefault();
        if (!otpPhone.trim()) {
            setOtpError('Silakan masukkan nomor WhatsApp Anda.');
            return;
        }

        setOtpSending(true);
        setOtpError(null);

        try {
            const response = await axios.post(route('book.rental.login.otp'), {
                phone: otpPhone,
            });

            if (response.data.success) {
                setOtpSent(true);
                if (response.data.debug_otp) {
                    setDebugOtp(response.data.debug_otp);
                }
            }
        } catch (err: any) {
            setOtpError(err.response?.data?.message || 'Gagal mengirim kode OTP. Silakan coba lagi.');
        } finally {
            setOtpSending(false);
        }
    };

    const handleVerifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        if (!otpCode.trim()) {
            setOtpError('Silakan masukkan 6 digit kode OTP.');
            return;
        }

        setOtpVerifying(true);
        setOtpError(null);

        try {
            const response = await axios.post(route('book.rental.login.verify_otp'), {
                phone: otpPhone,
                code: otpCode,
                redirect: redirect || undefined,
            });

            if (response.data.success && response.data.redirect) {
                router.visit(response.data.redirect);
            }
        } catch (err: any) {
            const msg = err.response?.data?.errors?.code?.[0] || err.response?.data?.message || 'Verifikasi gagal.';
            setOtpError(msg);
        } finally {
            setOtpVerifying(false);
        }
    };

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.post(route('book.rental.login.password'), {
            preserveScroll: true,
        });
    };

    return (
        <div
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between selection:bg-teal-500 selection:text-white"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`Masuk Akun · ${brand.name}`} />

            {/* Simple Top Bar */}
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 w-full flex items-center justify-between">
                <Link href={route('book.rental.search')} className="flex items-center gap-2.5 group">
                    {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="h-8 w-8 rounded-xl object-contain ring-1 ring-slate-200" />
                    ) : (
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs font-black text-xs"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            R
                        </div>
                    )}
                    <span className="text-sm font-black text-slate-900">{brand.name}</span>
                </Link>

                <Link
                    href={route('book.rental.search')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
                >
                    <span>←</span> Kembali ke Katalog Mobil
                </Link>
            </div>

            {/* Login Card Container */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-1.5">
                        <div
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md mb-3"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Masuk ke Akun Pelanggan</h2>
                        <p className="text-xs text-slate-500">
                            Akses dashboard sewa, kelola pesanan, dan verifikasi dokumen KYC Anda.
                        </p>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => {
                                setLoginMethod('otp');
                                setOtpError(null);
                            }}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                loginMethod === 'otp'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <span>💬</span>
                            <span>WhatsApp OTP</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLoginMethod('password');
                                setOtpError(null);
                            }}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                loginMethod === 'password'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <span>🔑</span>
                            <span>Kata Sandi</span>
                        </button>
                    </div>

                    {/* Method 1: WhatsApp OTP Flow */}
                    {loginMethod === 'otp' && (
                        <div className="space-y-4">
                            {otpError && (
                                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>{otpError}</span>
                                </div>
                            )}

                            {!otpSent ? (
                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">
                                            Nomor WhatsApp Anda
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={otpPhone}
                                                onChange={(e) => setOtpPhone(e.target.value)}
                                                placeholder="Contoh: 081234567890"
                                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <span className="text-[11px] text-slate-400 block">
                                            Kami akan mengirimkan 6 digit kode rahasia ke nomor WhatsApp ini.
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={otpSending}
                                        className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: 'var(--brand-color)' }}
                                    >
                                        {otpSending ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                <span>Mengirim OTP…</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Kirim Kode OTP</span>
                                                <span>→</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 space-y-1">
                                        <div className="font-bold flex items-center justify-between">
                                            <span>Kode OTP Terkirim!</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOtpSent(false);
                                                    setOtpCode('');
                                                }}
                                                className="text-[11px] text-teal-700 underline font-semibold"
                                            >
                                                Ganti Nomor
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-teal-800">
                                            Dikirim ke <strong>{otpPhone}</strong> via WhatsApp.
                                        </p>
                                        {debugOtp && (
                                            <p className="text-[11px] font-mono bg-white/80 p-1 rounded font-bold text-slate-800 mt-1">
                                                Debug OTP: {debugOtp}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">
                                            Masukkan 6 Digit Kode OTP
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="123456"
                                            className="w-full text-center tracking-[0.4em] font-mono text-lg font-black rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={otpVerifying || otpCode.length < 6}
                                        className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: 'var(--brand-color)' }}
                                    >
                                        {otpVerifying ? 'Memverifikasi…' : 'Masuk ke Portal'}
                                    </button>

                                    <div className="text-center pt-1">
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={otpSending}
                                            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                                        >
                                            Kirim ulang kode OTP
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Method 2: Email / Phone + Password Flow */}
                    {loginMethod === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            {passwordForm.errors.login && (
                                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
                                    {passwordForm.errors.login}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Nomor WhatsApp atau Email
                                </label>
                                <input
                                    type="text"
                                    value={passwordForm.data.login}
                                    onChange={(e) => passwordForm.setData('login', e.target.value)}
                                    placeholder="08123456789 atau email@domain.com"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Kata Sandi
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={passwordForm.data.remember}
                                        onChange={(e) => passwordForm.setData('remember', e.target.checked)}
                                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span>Ingat saya di perangkat ini</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
                                style={{ backgroundColor: 'var(--brand-color)' }}
                            >
                                {passwordForm.processing ? 'Memproses Masuk…' : 'Masuk dengan Kata Sandi'}
                            </button>
                        </form>
                    )}

                    {/* Bottom Registration Link */}
                    <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                        <span>Belum memiliki akun pelanggan? </span>
                        <Link
                            href={route('book.rental.register') + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '')}
                            className="font-bold text-teal-700 hover:text-teal-900 transition"
                        >
                            Daftar Sekarang
                        </Link>
                    </div>
                </div>
            </div>

            {/* Simple Footer */}
            <div className="py-4 text-center text-[11px] text-slate-400">
                © 2026 {brand.name}. Seluruh Hak Cipta Dilindungi.
            </div>
        </div>
    );
}
