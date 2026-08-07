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
    'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

export default function History({ brand, phone, bookings }: Props) {
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const form = useForm({ phone: phone || '', otp_code: '' });

    const sendOtp = async () => {
        if (!form.data.phone) {
            return;
        }
        const { data } = await axios.post(route('book.rental.otp'), { booker_phone: form.data.phone });
        setOtpHint(data.debug_code ? `Kode (dev): ${data.debug_code}` : data.message);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('book.rental.history'), form.data, { preserveState: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <Head title="Riwayat sewa" />
            <div className="mx-auto max-w-lg px-4">
                <h1 className="mb-1 text-xl font-semibold" style={{ color: brand.color }}>
                    {brand.name}
                </h1>
                <Link href={route('book.rental.search')} className="text-sm text-slate-500">
                    Kembali ke pencarian
                </Link>

                <form onSubmit={submit} className="mt-6 space-y-3 rounded-xl bg-white p-4 shadow-sm">
                    <label className="block text-xs font-medium text-slate-600">
                        Nomor HP
                        <input
                            className={fieldClassName}
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                            required
                        />
                    </label>
                    <div className="flex gap-2">
                        <label className="block flex-1 text-xs font-medium text-slate-600">
                            Kode OTP
                            <input
                                className={fieldClassName}
                                value={form.data.otp_code}
                                onChange={(e) => form.setData('otp_code', e.target.value)}
                                maxLength={6}
                                required
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => void sendOtp()}
                            className="mt-5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                        >
                            Kirim OTP
                        </button>
                    </div>
                    {otpHint && <p className="text-xs text-slate-500">{otpHint}</p>}
                    <button
                        type="submit"
                        className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white"
                        style={{ background: brand.color }}
                    >
                        Lihat riwayat
                    </button>
                </form>

                <div className="mt-6 space-y-3">
                    {bookings.length === 0 && (
                        <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
                            Belum ada pesanan, atau verifikasi OTP dulu.
                        </p>
                    )}
                    {bookings.map((booking) => (
                        <Link
                            key={booking.public_token}
                            href={route('book.rental.booking.show', booking.public_token)}
                            className="block rounded-xl bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-medium text-slate-900">{booking.code}</div>
                                    <div className="text-xs text-slate-500">
                                        {booking.vehicle?.name ?? '—'} · {booking.start_date} → {booking.end_date}
                                    </div>
                                    <div className="mt-1 text-xs capitalize text-slate-400">
                                        {booking.status.replace('_', ' ')} · {booking.channel}
                                        {booking.deposit_received ? ' · deposit OK' : ''}
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-slate-800">{money(booking.total_amount)}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
