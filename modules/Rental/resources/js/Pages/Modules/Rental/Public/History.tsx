import { Head, Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
}

interface Booking {
    code: string;
    public_token: string;
    status: string;
    channel: string;
    start_date: string | null;
    end_date: string | null;
    total_amount: number;
    deposit_received: boolean;
    vehicle: { name: string; plate_number: string } | null;
}

interface Props {
    brand: Brand;
    phone: string;
    bookings: Booking[];
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const fieldClassName =
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-[var(--brand-color)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20';

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending_reserved: { label: 'Menunggu Deposit', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    pending: { label: 'Kedaluwarsa', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    confirmed: { label: 'Reservasi Aktif', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
    active: { label: 'Sedang Disewa', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200' },
    returned: { label: 'Dikembalikan', color: 'text-indigo-850', bg: 'bg-indigo-50 border-indigo-200' },
    completed: { label: 'Selesai', color: 'text-slate-850', bg: 'bg-slate-100 border-slate-250' },
    cancelled: { label: 'Dibatalkan', color: 'text-rose-800', bg: 'bg-rose-50 border-rose-200' },
};

export default function History({ brand, phone, bookings }: Props) {
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const form = useForm({ phone: phone || '', otp_code: '' });

    const sendOtp = async () => {
        if (!form.data.phone) {
            alert('Masukkan nomor telepon terlebih dahulu');
            return;
        }
        setSendingOtp(true);
        setOtpHint(null);
        try {
            const { data } = await axios.post(route('book.rental.otp'), { booker_phone: form.data.phone });
            if (data.already_verified) {
                setPhoneVerified(true);
                form.setData('otp_code', '000000');
                setOtpHint('Nomor WhatsApp Anda sudah terverifikasi ✓');
            } else {
                setPhoneVerified(false);
                setOtpHint(data.debug_code ? `Kode OTP (Dev): ${data.debug_code}` : (data.message || 'OTP berhasil dikirim'));
                if (data.debug_code) {
                    form.setData('otp_code', String(data.debug_code));
                }
            }
        } catch (err: any) {
            setPhoneVerified(false);
            setOtpHint(err.response?.data?.message || 'Gagal mengirim OTP');
        } finally {
            setSendingOtp(false);
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('book.rental.history'), form.data, { preserveState: true });
    };

    const brandColor = brand.color || '#0f766e';

    return (
        <div 
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 pb-16"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`Riwayat Pesanan · ${brand.name}`} />

            {/* Brand Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <Link
                        href={route('book.rental.search')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Cari Kendaraan
                    </Link>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--brand-color)]">{brand.name}</span>
                </div>
            </div>

            {/* Main content */}
            <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
                
                {/* Section title */}
                <div className="text-center py-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Reservasi</h1>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        Masukkan nomor WhatsApp Anda untuk melacak dan mengelola reservasi sewa aktif.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start max-w-5xl mx-auto">
                    
                    {/* Left Column: Lookup Form */}
                    <div className="w-full lg:w-[360px] shrink-0">
                        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700">Nomor Telepon (WhatsApp)</label>
                                <input
                                    type="tel"
                                    className={fieldClassName}
                                    placeholder="Contoh: 081234567890"
                                    value={form.data.phone}
                                    onChange={(e) => {
                                        form.setData('phone', e.target.value);
                                        setPhoneVerified(false);
                                        setOtpHint(null);
                                    }}
                                    required
                                />
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-850">Kode OTP Verifikasi</label>
                                    {!phoneVerified && (
                                        <button
                                            type="button"
                                            onClick={() => void sendOtp()}
                                            disabled={sendingOtp || !form.data.phone}
                                            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
                                        >
                                            {sendingOtp ? 'Mengirim...' : 'Kirim OTP'}
                                        </button>
                                    )}
                                </div>

                                {phoneVerified ? (
                                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                        <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        WhatsApp Terverifikasi ✓ (OTP tidak diperlukan)
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        className={`${fieldClassName} tracking-widest text-center text-base font-extrabold bg-white`}
                                        placeholder="0 0 0 0 0 0"
                                        maxLength={6}
                                        value={form.data.otp_code}
                                        onChange={(e) => form.setData('otp_code', e.target.value)}
                                        required
                                    />
                                )}

                                {otpHint && !phoneVerified && (
                                    <p className="rounded-lg bg-teal-50 p-2.5 text-xs font-medium text-teal-800 border border-teal-200">
                                        {otpHint}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-xl py-3 text-sm font-extrabold text-white shadow-md transition hover:opacity-95"
                                style={{ backgroundColor: 'var(--brand-color)' }}
                            >
                                Cari Riwayat Pesanan
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Bookings list */}
                    <div className="flex-1 w-full space-y-4">
                        {bookings.length === 0 && phone && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                                <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <h3 className="mt-4 text-base font-bold text-slate-800 font-bold">Belum Ada Riwayat Pesanan</h3>
                                <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                                    Pastikan nomor WhatsApp Anda sudah sesuai dan Anda telah memasukkan kode OTP dengan benar.
                                </p>
                            </div>
                        )}

                        {bookings.length === 0 && !phone && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                                <svg className="mx-auto h-16 w-16 text-slate-350" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                                <h3 className="mt-4 text-base font-bold text-slate-700">Silakan Lakukan Pencarian</h3>
                                <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                                    Masukkan nomor WhatsApp di form sebelah kiri untuk memuat daftar reservasi sewa Anda.
                                </p>
                            </div>
                        )}

                        {bookings.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bookings.map((booking) => {
                                    const badge = statusBadgeConfig[booking.status] || {
                                        label: booking.status,
                                        color: 'text-slate-800',
                                        bg: 'bg-slate-100 border-slate-200',
                                    };

                                    return (
                                        <Link
                                            key={booking.public_token}
                                            href={route('book.rental.booking.show', booking.public_token)}
                                            className="group flex flex-col justify-between rounded-2xl bg-white p-4 shadow-xs border border-slate-200/85 hover:border-[var(--brand-color)] hover:shadow-sm transition-all duration-200"
                                        >
                                            <div className="border-b border-slate-100 pb-3 space-y-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className="font-mono text-sm font-black text-slate-900 group-hover:text-[var(--brand-color)] transition-colors">
                                                        {booking.code}
                                                    </span>
                                                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border shrink-0 ${badge.bg} ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-bold text-slate-600">
                                                    {booking.vehicle?.name ?? 'Kendaraan'} · <span className="font-mono text-slate-400 font-bold">{booking.vehicle?.plate_number}</span>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between text-xs font-bold">
                                                <div className="text-slate-500 font-semibold text-[10px]">
                                                    {booking.start_date} → {booking.end_date}
                                                </div>
                                                <div className="text-sm font-extrabold text-[var(--brand-color)]">
                                                    {money(booking.total_amount)}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
