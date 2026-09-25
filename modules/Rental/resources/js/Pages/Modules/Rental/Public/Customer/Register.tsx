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

export default function Register({ brand, redirect }: Props) {
    const brandColor = brand.color || '#0f766e';

    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [debugOtp, setDebugOtp] = useState<string | null>(null);

    const form = useForm({
        name: '',
        phone: '',
        code: '',
        email: '',
        password: '',
        redirect: redirect || '',
    });

    const handleSendOtp = async () => {
        if (!form.data.phone.trim()) {
            setOtpError('Silakan masukkan nomor WhatsApp Anda terlebih dahulu.');
            return;
        }

        setOtpSending(true);
        setOtpError(null);

        try {
            const response = await axios.post(route('book.rental.login.otp'), {
                phone: form.data.phone,
            });

            if (response.data.success) {
                setOtpSent(true);
                if (response.data.debug_otp) {
                    setDebugOtp(response.data.debug_otp);
                }
            }
        } catch (err: any) {
            setOtpError(err.response?.data?.message || 'Gagal mengirim kode OTP.');
        } finally {
            setOtpSending(false);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('book.rental.register.submit'), {
            preserveScroll: true,
        });
    };

    return (
        <div
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between selection:bg-teal-500 selection:text-white"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`Daftar Akun Pelanggan · ${brand.name}`} />

            {/* Top Bar */}
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 w-full flex items-center justify-between">
                <Link href={route('book.rental.search')} className="flex items-center gap-2.5">
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

            {/* Register Card */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                    <div className="text-center space-y-1.5">
                        <div
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md mb-3"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Daftar Akun Pelanggan</h2>
                        <p className="text-xs text-slate-500">
                            Nikmati kemudahan sewa mobil mandiri, simpan dokumen KYC, dan pantau status unit Anda.
                        </p>
                    </div>

                    {otpError && (
                        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
                            {otpError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">
                                Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="Contoh: Budi Santoso"
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                required
                            />
                            {form.errors.name && (
                                <p className="text-xs font-bold text-rose-600">{form.errors.name}</p>
                            )}
                        </div>

                        {/* WhatsApp Phone + OTP Trigger */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">
                                Nomor WhatsApp <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    placeholder="081234567890"
                                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={otpSending || !form.data.phone}
                                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 shrink-0"
                                >
                                    {otpSending ? 'Mengirim…' : otpSent ? 'Kirim Ulang' : 'Kirim OTP'}
                                </button>
                            </div>
                            {form.errors.phone && (
                                <p className="text-xs font-bold text-rose-600">{form.errors.phone}</p>
                            )}
                        </div>

                        {/* OTP Verification Input */}
                        {otpSent && (
                            <div className="space-y-1.5 p-3 rounded-2xl bg-teal-50 border border-teal-200">
                                <div className="flex items-center justify-between text-xs text-teal-900 font-bold">
                                    <span>Masukkan 6 Digit OTP</span>
                                    {debugOtp && (
                                        <span className="font-mono bg-white px-2 py-0.5 rounded text-[10px]">
                                            OTP: {debugOtp}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456"
                                    className="w-full text-center tracking-[0.4em] font-mono text-base font-black rounded-xl border border-teal-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                                    required
                                    autoFocus
                                />
                                {form.errors.code && (
                                    <p className="text-xs font-bold text-rose-600">{form.errors.code}</p>
                                )}
                            </div>
                        )}

                        {/* Email (Optional) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Email
                                </label>
                                <span className="text-[10px] text-slate-400">Opsional (untuk e-receipt)</span>
                            </div>
                            <input
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                placeholder="budi@contoh.com"
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                            />
                            {form.errors.email && (
                                <p className="text-xs font-bold text-rose-600">{form.errors.email}</p>
                            )}
                        </div>

                        {/* Password (Optional) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Kata Sandi
                                </label>
                                <span className="text-[10px] text-slate-400">Opsional (bisa login OTP tanpa sandi)</span>
                            </div>
                            <input
                                type="password"
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                            />
                            {form.errors.password && (
                                <p className="text-xs font-bold text-rose-600">{form.errors.password}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing || (!otpSent && !form.data.code)}
                            className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:opacity-95 disabled:opacity-50 mt-2"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            {form.processing ? 'Mendaftarkan Akun…' : 'Daftar & Masuk'}
                        </button>
                    </form>

                    <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                        <span>Sudah memiliki akun? </span>
                        <Link
                            href={route('book.rental.login') + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '')}
                            className="font-bold text-teal-700 hover:text-teal-900 transition"
                        >
                            Masuk Disini
                        </Link>
                    </div>
                </div>
            </div>

            <div className="py-4 text-center text-[11px] text-slate-400">
                © 2026 {brand.name}. Seluruh Hak Cipta Dilindungi.
            </div>
        </div>
    );
}
