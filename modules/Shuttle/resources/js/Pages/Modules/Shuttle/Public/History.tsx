import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Booking {
    booking_number: string;
    public_token: string;
    status: string;
    payment_status: string;
    total_fare: number;
    departure: { depart_date: string | null; depart_time: string; corridor: string | null } | null;
}

interface Props {
    brand: { name: string; color: string };
    phone: string;
    bookings: Booking[];
}

export default function History({ brand, phone, bookings }: Props) {
    const form = useForm({ phone, otp_code: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('book.shuttle.history'), form.data, { preserveState: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <Head title="My bookings" />
            <div className="mx-auto max-w-lg px-4">
                <h1 className="mb-1 text-xl font-semibold" style={{ color: brand.color }}>
                    {brand.name}
                </h1>
                <Link href={route('book.shuttle.search')} className="text-sm text-slate-500">
                    Back to search
                </Link>

                <form onSubmit={submit} className="mt-6 space-y-3 rounded-xl bg-white p-4 shadow-sm">
                    <input
                        className="w-full rounded-md border-slate-300 text-sm"
                        placeholder="Phone"
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                        required
                    />
                    <input
                        className="w-full rounded-md border-slate-300 text-sm"
                        placeholder="OTP code"
                        value={form.data.otp_code}
                        onChange={(e) => form.setData('otp_code', e.target.value)}
                        required
                    />
                    <button type="submit" className="w-full rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: brand.color }}>
                        Show bookings
                    </button>
                    <p className="text-xs text-slate-500">Request an OTP from the booking form first, then enter it here.</p>
                </form>

                <div className="mt-4 space-y-2">
                    {bookings.map((b) => (
                        <Link
                            key={b.public_token}
                            href={route('book.shuttle.ticket', b.public_token)}
                            className="block rounded-xl bg-white p-4 shadow-sm"
                        >
                            <div className="font-medium">{b.booking_number}</div>
                            <div className="text-xs text-slate-500">
                                {b.departure?.corridor} · {b.departure?.depart_date} {b.departure?.depart_time} · {b.status}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
