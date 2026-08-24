import { Head, Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
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
    'mt-1 w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10';

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    pending_reserved: { label: 'Menunggu Deposit', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    pending: { label: 'Kedaluwarsa', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
    confirmed: { label: 'Reservasi Aktif', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
    active: { label: 'Sedang Disewa', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    returned: { label: 'Dikembalikan', color: 'text-indigo-800', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
    completed: { label: 'Selesai', color: 'text-slate-800', bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-500' },
    cancelled: { label: 'Dibatalkan', color: 'text-rose-800', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
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
            className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col justify-between"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`Pelacak Riwayat Sewa · ${brand.name}`} />

            <div>
                {/* Modern Crisp Glass Navbar */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
                        <Link href={route('book.rental.search')} className="flex items-center gap-3 group">
                            {brand.logo_url ? (
                                <img
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    className="h-10 w-10 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105"
                                />
                            ) : (
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs transition-transform duration-200 group-hover:scale-105"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">{brand.name}</h1>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Showroom & Rental Resmi</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link
                                href={route('book.rental.search')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 shadow-2xs"
                            >
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span>Cari Kendaraan</span>
                            </Link>

                            {brand.support_phone && (
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 transition hover:bg-emerald-100 shadow-2xs"
                                >
                                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                    WhatsApp CS
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
                    
                    <div className="text-center max-w-xl mx-auto space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pelacak & Riwayat Sewa</h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Masukkan nomor WhatsApp yang Anda gunakan saat pemesanan untuk melihat seluruh tiket dan voucher reservasi Anda.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start max-w-5xl mx-auto">
                        
                        {/* Left Column: Lookup Form */}
                        <div className="w-full lg:w-[360px] shrink-0">
                            <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                                        Nomor WhatsApp Pemesan
                                    </label>
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
                                        <label className="text-xs font-bold text-slate-800">Kode OTP Verifikasi</label>
                                        {!phoneVerified && (
                                            <button
                                                type="button"
                                                onClick={() => void sendOtp()}
                                                disabled={sendingOtp || !form.data.phone}
                                                className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                                            >
                                                {sendingOtp ? 'Mengirim...' : 'Kirim OTP'}
                                            </button>
                                        )}
                                    </div>

                                    {phoneVerified ? (
                                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                            <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            WhatsApp Terverifikasi ✓
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            className={`${fieldClassName} tracking-widest text-center text-sm font-black bg-white`}
                                            placeholder="0 0 0 0 0 0"
                                            maxLength={6}
                                            value={form.data.otp_code}
                                            onChange={(e) => form.setData('otp_code', e.target.value)}
                                            required
                                        />
                                    )}

                                    {otpHint && !phoneVerified && (
                                        <p className="rounded-lg bg-teal-50 p-2 text-xs font-bold text-teal-800 border border-teal-200 text-center">
                                            {otpHint}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-11 flex items-center justify-center rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:opacity-95"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    Cari Riwayat Reservasi
                                </button>
                            </form>
                        </div>

                        {/* Right Column: History list */}
                        <div className="flex-1 w-full space-y-4">
                            {bookings.length === 0 && phone && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h3 className="mt-4 text-base font-black text-slate-900">Belum Ada Reservasi</h3>
                                    <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                                        Pastikan nomor WhatsApp dan kode OTP yang Anda masukkan sesuai dengan saat melakukan reservasi.
                                    </p>
                                </div>
                            )}

                            {bookings.length === 0 && !phone && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </div>
                                    <h3 className="mt-4 text-base font-black text-slate-900">Lacak Tiket Sewa</h3>
                                    <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                                        Masukkan nomor WhatsApp Anda pada panel di samping untuk menampilkan seluruh tiket reservasi aktif Anda.
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
                                            dot: 'bg-slate-400',
                                        };

                                        return (
                                            <Link
                                                key={booking.public_token}
                                                href={route('book.rental.booking.show', booking.public_token)}
                                                className="group flex flex-col justify-between rounded-2xl bg-white p-5 shadow-xs border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="border-b border-slate-100 pb-3 space-y-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <span className="font-mono text-base font-black text-slate-900 group-hover:text-slate-950 transition-colors">
                                                            {booking.code}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black border shrink-0 ${badge.bg} ${badge.color}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-600">
                                                        {booking.vehicle?.name ?? 'Kendaraan'} · <span className="font-mono text-slate-400 font-bold">{booking.vehicle?.plate_number}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between text-xs font-bold">
                                                    <div className="text-slate-400 text-[11px]">
                                                        {booking.start_date} → {booking.end_date}
                                                    </div>
                                                    <div className="text-sm font-black text-slate-900">
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
                </main>
            </div>

            {/* Grounded Deep Slate Footer */}
            <footer className="mt-16 bg-slate-900 text-slate-400 border-t border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        {/* Column 1: Brand Info */}
                        <div className="md:col-span-5 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <span 
                                    className="block h-3 w-3 rounded-full shadow-xs"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                />
                                <span className="font-black text-white tracking-tight text-sm">{brand.name}</span>
                            </div>
                            <p className="text-xs font-normal text-slate-400 leading-relaxed max-w-sm">
                                Layanan penyewaan kendaraan resmi, aman, dan berlisensi. Kami menghadirkan armada terawat dengan jaminan kenyamanan ekstra dan dukungan serah terima cabang yang luas.
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-3 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">Navigasi Cepat</h4>
                            <ul className="space-y-2 text-xs font-medium text-slate-400">
                                <li>
                                    <Link href={route('book.rental.search')} className="hover:text-white transition-colors">
                                        Katalog Kendaraan
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('book.rental.history')} className="hover:text-white transition-colors">
                                        Riwayat & Cek Status
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Contact/Support */}
                        <div className="md:col-span-4 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">Pusat Bantuan</h4>
                            <div className="text-xs font-medium text-slate-400 space-y-2.5">
                                <p className="leading-relaxed">
                                    Butuh konsultasi armada atau konfirmasi pembayaran transfer? Hubungi tim support kami:
                                </p>
                                {brand.support_phone ? (
                                    <a
                                        href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-emerald-400 font-bold text-xs hover:underline"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                        WhatsApp Hotline: {brand.support_phone} ↗
                                    </a>
                                ) : (
                                    <span className="font-bold text-slate-300">Silakan hubungi cabang terdekat.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                        <div>
                            © 2026 {brand.name}. Seluruh Hak Cipta Dilindungi.
                        </div>
                        <div className="flex gap-4">
                            <span className="hover:text-slate-300 cursor-pointer">Syarat & Ketentuan</span>
                            <span className="hover:text-slate-300 cursor-pointer">Kebijakan Privasi</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
