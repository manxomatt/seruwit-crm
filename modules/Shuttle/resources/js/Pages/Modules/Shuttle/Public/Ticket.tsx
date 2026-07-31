import { Head, Link, router } from '@inertiajs/react';

interface Booking {
    booking_number: string;
    public_token: string;
    status: string;
    payment_status: string;
    passenger_count: number;
    total_fare: number;
    amount_due?: number;
    hold_expires_at: string | null;
    booker_phone: string | null;
    pickup_mode: string;
    dropoff_mode: string;
    pickup_address: string | null;
    dropoff_address: string | null;
    departure: { depart_date: string | null; depart_time: string; corridor: string | null } | null;
    passengers: Array<{ name: string; phone: string | null; seat_label: string | null }>;
}

interface Props {
    brand: { name: string; color: string };
    booking: Booking;
    gateway_available: boolean;
    qr_url: string;
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

export default function Ticket({ brand, booking, gateway_available, qr_url }: Props) {
    const canPay = booking.status === 'draft' && booking.payment_status !== 'paid';
    const canCancel = ['draft', 'confirmed'].includes(booking.status);

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <Head title={`Ticket ${booking.booking_number}`} />
            <div className="mx-auto max-w-lg px-4">
                <div className="mb-4 text-center">
                    <h1 className="text-xl font-semibold" style={{ color: brand.color }}>
                        {brand.name}
                    </h1>
                    <Link href={route('book.shuttle.search')} className="text-sm text-slate-500">
                        Book another
                    </Link>
                </div>

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="border-b p-6 text-center">
                        <img src={qr_url} alt="Ticket QR" className="mx-auto h-44 w-44" />
                        <p className="mt-3 text-lg font-semibold">{booking.booking_number}</p>
                        <p className="text-sm capitalize text-slate-500">
                            {booking.status} · {booking.payment_status}
                        </p>
                        {booking.hold_expires_at && booking.status === 'draft' && (
                            <p className="mt-1 text-xs text-amber-700">Hold until {new Date(booking.hold_expires_at).toLocaleString()}</p>
                        )}
                    </div>
                    <div className="space-y-3 p-6 text-sm">
                        <div>
                            <div className="text-xs uppercase text-slate-400">Trip</div>
                            <div className="font-medium">
                                {booking.departure?.corridor} · {booking.departure?.depart_date} {booking.departure?.depart_time}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">Fare</div>
                            <div className="font-medium">
                                {booking.passenger_count} pax · {money(booking.amount_due ?? booking.total_fare)}
                            </div>
                            {booking.amount_due != null && booking.amount_due !== booking.total_fare && (
                                <div className="text-xs text-slate-500">Base {money(booking.total_fare)} + tax</div>
                            )}
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">Passengers</div>
                            <ul className="mt-1">
                                {booking.passengers.map((p, i) => (
                                    <li key={i}>
                                        {p.seat_label ? `${p.seat_label} · ` : ''}
                                        {p.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 border-t p-4">
                        {canPay && gateway_available && (
                            <button
                                type="button"
                                className="rounded-md px-4 py-2.5 text-sm font-medium text-white"
                                style={{ background: brand.color }}
                                onClick={() => router.post(route('book.shuttle.pay', booking.public_token))}
                            >
                                Pay online · {money(booking.amount_due ?? booking.total_fare)}
                            </button>
                        )}
                        {canPay && !gateway_available && (
                            <p className="text-center text-xs text-slate-500">Pay at counter / transfer — staff will confirm your booking.</p>
                        )}
                        {canCancel && (
                            <button
                                type="button"
                                className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-700"
                                onClick={() => router.post(route('book.shuttle.cancel', booking.public_token))}
                            >
                                Cancel booking
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
