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
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20';

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending_reserved: { label: 'Menunggu Deposit', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
    pending: { label: 'Kedaluwarsa', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    confirmed: { label: 'Reservasi Aktif', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
    active: { label: 'Sedang Disewa', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
    returned: { label: 'Dikembalikan', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300' },
    completed: { label: 'Selesai', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
    cancelled: { label: 'Dibatalkan', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
};

export default function History({ brand, phone, bookings }: Props) {
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [sendingOtp, setSendingOtp] = useState(false);
    const form = useForm({ phone: phone || '', otp_code: '' });

    const sendOtp = async () => {
        if (!form.data.phone) {
            alert('Masukkan nomor telepon terlebih dahulu');
            return;
        }
        setSendingOtp(true);
        try {
            const { data } = await axios.post(route('book.rental.otp'), { booker_phone: form.data.phone });
            setOtpHint(data.debug_code ? `Kode OTP (Dev): ${data.debug_code}` : (data.message || 'OTP berhasil dikirim'));
        } catch (err: any) {
            setOtpHint(err.response?.data?.message || 'Gagal mengirim OTP');
        } finally {
            setSendingOtp(false);
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('book.rental.history'), form.data, { preserveState: true });
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans antialiased pb-16">
            <Head title={`Riwayat Pesanan · ${brand.name}`} />

            {/* Header section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 pb-12 pt-6 text-white shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_50%)] pointer-events-none" />
                <div className="mx-auto max-w-xl px-4 relative z-10">
                    <div className="flex items-center justify-between">
                        <Link
                            href={route('book.rental.search')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Kembali ke Pencarian
                        </Link>
                        <span className="text-xs font-bold text-teal-400">{brand.name}</span>
                    </div>

                    <div className="mt-6 text-center">
                        <h1 className="text-xl font-bold tracking-tight text-white">Riwayat Reservasi Sewa</h1>
                        <p className="text-xs text-slate-400 mt-1">Masukkan Nomor HP & OTP untuk melihat riwayat pesanan Anda.</p>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="mx-auto max-w-xl px-4 -mt-6 relative z-20 space-y-5">
                {/* Lookup form */}
                <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200/80 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-700">Nomor Telepon (WhatsApp)</label>
                        <input
                            type="tel"
                            className={fieldClassName}
                            placeholder="081234567890"
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                            required
                        />
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">Kode OTP Verifikasi</label>
                            <button
                                type="button"
                                onClick={() => void sendOtp()}
                                disabled={sendingOtp || !form.data.phone}
                                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
                            >
                                {sendingOtp ? 'Sending...' : 'Kirim Kode OTP'}
                            </button>
                        </div>

                        <input
                            type="text"
                            className={`${fieldClassName} tracking-widest text-center text-base font-bold bg-white`}
                            placeholder="0 0 0 0 0 0"
                            maxLength={6}
                            value={form.data.otp_code}
                            onChange={(e) => form.setData('otp_code', e.target.value)}
                            required
                        />

                        {otpHint && (
                            <p className="rounded-lg bg-teal-50 p-2.5 text-xs font-medium text-teal-800 border border-teal-200">
                                {otpHint}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-700"
                    >
                        Tampilkan Riwayat Pesanan
                    </button>
                </form>

                {/* Booking list */}
                <div className="space-y-3">
                    {bookings.length === 0 && (
                        <div className="rounded-2xl bg-slate-800/80 p-8 text-center backdrop-blur-sm ring-1 ring-white/10">
                            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="mt-3 text-sm font-medium text-slate-300">Belum ada riwayat pesanan ditemukan.</p>
                            <p className="mt-1 text-xs text-slate-500">Pastikan nomor telepon sesuai dan verifikasi OTP berhasil.</p>
                        </div>
                    )}

                    {bookings.map((booking) => {
                        const badge = statusBadgeConfig[booking.status] || {
                            label: booking.status,
                            color: 'text-slate-700',
                            bg: 'bg-slate-100 border-slate-300',
                        };

                        return (
                            <Link
                                key={booking.public_token}
                                href={route('book.rental.booking.show', booking.public_token)}
                                className="group block rounded-2xl bg-white p-4 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ring-1 ring-slate-200/80"
                            >
                                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div>
                                        <span className="font-mono text-sm font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors">
                                            {booking.code}
                                        </span>
                                        <div className="text-xs font-medium text-slate-600 mt-0.5">
                                            {booking.vehicle?.name ?? 'Kendaraan'} · <span className="font-mono text-slate-500">{booking.vehicle?.plate_number}</span>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${badge.bg} ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <div className="text-slate-500">
                                        Jadwal: <b>{booking.start_date} → {booking.end_date}</b>
                                    </div>
                                    <div className="text-sm font-extrabold text-teal-600">
                                        {money(booking.total_amount)}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
