import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

interface Props {
    phone?: string;
    hasPhone: boolean;
    cooldown?: number;
    isDevelopment?: boolean;
    debugOtp?: string | null;
    settings?: Record<string, string>;
    status?: string;
}

export default function VerifyPhone({
    phone = '',
    hasPhone = false,
    cooldown = 0,
    isDevelopment = false,
    debugOtp = null,
    settings,
    status,
}: Props) {
    const { t } = useTrans();
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [isEditingPhone, setIsEditingPhone] = useState(!hasPhone);
    const [secondsLeft, setSecondsLeft] = useState(cooldown);

    // Form to verify OTP
    const verifyForm = useForm({
        code: '',
    });

    // Form to resend OTP
    const resendForm = useForm({});

    // Form to change/update phone
    const updatePhoneForm = useForm({
        phone: phone,
    });

    // Countdown timer for resending OTP
    useEffect(() => {
        if (secondsLeft <= 0) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [secondsLeft]);

    const handleVerifyOtp: FormEventHandler = (e) => {
        e.preventDefault();
        verifyForm.post(route('central.phone.verify'), {
            preserveScroll: true,
        });
    };

    const handleResendOtp = () => {
        if (secondsLeft > 0 || resendForm.processing) return;

        resendForm.post(route('central.phone.send'), {
            preserveScroll: true,
            onSuccess: () => {
                setSecondsLeft(60);
            },
        });
    };

    const handleUpdatePhone: FormEventHandler = (e) => {
        e.preventDefault();
        updatePhoneForm.patch(route('central.phone.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditingPhone(false);
                setSecondsLeft(60);
            },
        });
    };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];

    return (
        <>
            <Head title="Verifikasi Nomor WhatsApp" />

            <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/50 text-slate-800 selection:bg-emerald-500 selection:text-white">
                {/* Ambient background glows */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-300/20 blur-[120px]" />
                    <div className="absolute -right-28 -bottom-28 h-96 w-96 rounded-full bg-teal-300/20 blur-[120px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-indigo-200/15 blur-[140px]" />
                </div>

                {/* Top Navigation */}
                <header className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-8">
                    <Link href="/" className="group flex items-center gap-2.5 transition focus:outline-none">
                        {siteLogo ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xs transition group-hover:shadow">
                                <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                            </div>
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-600 text-white shadow-xs shadow-emerald-600/20 transition group-hover:scale-105">
                                <span className="material-symbols-outlined text-lg">chat</span>
                            </div>
                        )}
                        <span className="text-sm font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-600 transition">
                            {siteName}
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher compact />
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-xs backdrop-blur-md hover:bg-slate-50 hover:text-rose-600 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            <span>{t('auth_ui.logout', undefined, 'Keluar')}</span>
                        </Link>
                    </div>
                </header>

                {/* Main Content Box */}
                <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
                        {/* Header Banner */}
                        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
                                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                        <span className="material-symbols-outlined text-xs">chat</span>
                                        <span>WhatsApp Verification</span>
                                    </div>
                                    <h1 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                                        Verifikasi Nomor WhatsApp
                                    </h1>
                                </div>
                            </div>
                            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Demi keamanan akun bisnis dan keandalan pengiriman tagihan serta notifikasi platform, mohon verifikasi nomor WhatsApp Anda.
                            </p>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 sm:p-8 space-y-6">
                            {/* Flash Alerts */}
                            {(status || flash?.success) && (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-bold">
                                        ✓
                                    </span>
                                    <span>{status || flash?.success}</span>
                                </div>
                            )}

                            {flash?.error && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-semibold text-rose-800 flex items-center gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white font-bold">
                                        ✕
                                    </span>
                                    <span>{flash.error}</span>
                                </div>
                            )}

                            {/* Dev Mode Banner (Debug OTP) */}
                            {isDevelopment && debugOtp && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-amber-900 font-bold">
                                            <span className="material-symbols-outlined text-amber-600 text-base">developer_mode</span>
                                            <span>Mode Development OTP</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => verifyForm.setData('code', debugOtp)}
                                            className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700 transition"
                                        >
                                            Gunakan Kode Ini
                                        </button>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-amber-800">Kode OTP Anda:</span>
                                        <span className="font-mono text-base font-black tracking-widest text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded-md">
                                            {debugOtp}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Current Phone Info & Edit Toggle */}
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs text-slate-600 border border-slate-200/60">
                                            <span className="material-symbols-outlined text-base">smartphone</span>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-medium text-slate-500">Nomor WhatsApp Terdaftar:</div>
                                            <div className="font-mono text-sm font-bold text-slate-900">
                                                {phone || 'Belum diatur'}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsEditingPhone(!isEditingPhone)}
                                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline transition"
                                    >
                                        {isEditingPhone ? 'Batal' : 'Ubah Nomor'}
                                    </button>
                                </div>

                                {/* Edit Phone Form */}
                                {isEditingPhone && (
                                    <form onSubmit={handleUpdatePhone} className="mt-4 pt-4 border-t border-slate-200/60 space-y-3">
                                        <div>
                                            <label htmlFor="new_phone" className="block text-xs font-bold text-slate-700">
                                                Nomor WhatsApp Baru
                                            </label>
                                            <div className="mt-1 flex gap-2">
                                                <input
                                                    id="new_phone"
                                                    type="tel"
                                                    value={updatePhoneForm.data.phone}
                                                    onChange={(e) => updatePhoneForm.setData('phone', e.target.value)}
                                                    placeholder="Contoh: 081234567890"
                                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    required
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={updatePhoneForm.processing || !updatePhoneForm.data.phone}
                                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                                                >
                                                    {updatePhoneForm.processing ? 'Menyimpan...' : 'Simpan & Minta OTP'}
                                                </button>
                                            </div>
                                            <InputError message={updatePhoneForm.errors.phone} className="mt-1" />
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Verify OTP Input Form */}
                            {!isEditingPhone && hasPhone && (
                                <form onSubmit={handleVerifyOtp} className="space-y-5">
                                    <div>
                                        <label htmlFor="otp_code" className="block text-xs font-bold text-slate-700 mb-2">
                                            Masukkan 6-Digit Kode Verifikasi (OTP)
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="otp_code"
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={verifyForm.data.code}
                                                onChange={(e) => verifyForm.setData('code', e.target.value.replace(/\D/g, ''))}
                                                placeholder="••••••"
                                                autoFocus
                                                required
                                                className="block w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition"
                                            />
                                        </div>
                                        <InputError message={verifyForm.errors.code} className="mt-1.5" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={verifyForm.processing || verifyForm.data.code.length !== 6}
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {verifyForm.processing ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Memverifikasi...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                                <span>Verifikasi & Masuk Workspace</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Resend Action */}
                                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
                                        <span>Tidak menerima kode verifikasi?</span>
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={secondsLeft > 0 || resendForm.processing}
                                            className="font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                                        >
                                            {secondsLeft > 0
                                                ? `Kirim ulang dalam (${secondsLeft}s)`
                                                : resendForm.processing
                                                ? 'Mengirim ulang...'
                                                : 'Kirim Ulang Kode OTP'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Empty Phone Initial Prompt */}
                            {!hasPhone && !isEditingPhone && (
                                <div className="text-center py-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingPhone(true)}
                                        className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
                                    >
                                        Masukkan Nomor WhatsApp
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer Help */}
                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:px-8 text-center text-xs text-slate-500">
                            Pesan verifikasi dikirimkan langsung dari akun resmi WhatsApp platform Seruwit.
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 py-4 text-center text-xs font-semibold text-slate-400">
                    &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                </footer>
            </div>
        </>
    );
}
