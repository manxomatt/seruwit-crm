import PrimaryButton from '@/Components/PrimaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import ShuttleNav from '../ShuttleNav';

interface Booking {
    id: number;
    booking_number: string;
    status: string;
    passenger_count: number;
    unit_fare: string | number;
    total_fare: string | number;
    pickup_mode: string;
    dropoff_mode: string;
    pickup_address: string | null;
    dropoff_address: string | null;
    notes: string | null;
    partner?: { name: string; code: string } | null;
    departure?: {
        id: number;
        departure_number: string;
        depart_date: string;
        depart_time: string;
        corridor?: { name: string } | null;
    } | null;
    passengers: Array<{ id: number; name: string; phone: string | null }>;
    invoice?: { id: number; code: string; status: string } | null;
}

interface Props {
    booking: Booking;
    can: { confirm: boolean; update: boolean };
}

const money = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

export default function Show({ booking, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{booking.booking_number}</h2>}>
            <Head title={booking.booking_number} />
            <div className="py-6">
                <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <ShuttleNav active="bookings" />
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="text-sm text-gray-500">{t(`shuttle.status.${booking.status}`)}</div>
                                <div className="mt-1 text-lg font-semibold">{booking.partner?.name}</div>
                                <div className="mt-2 text-sm text-gray-600">
                                    {booking.departure?.corridor?.name} · {booking.departure?.depart_date}{' '}
                                    {String(booking.departure?.depart_time ?? '').slice(0, 5)}
                                </div>
                                <div className="mt-1 text-sm">
                                    {booking.passenger_count} pax · {money(booking.total_fare)}
                                </div>
                                {booking.invoice && (
                                    <div className="mt-2 text-sm text-sky-700">Invoice {booking.invoice.code} ({booking.invoice.status})</div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {can.confirm && booking.status === 'draft' && (
                                    <PrimaryButton type="button" onClick={() => router.post(prefixedRoute('shuttle.bookings.confirm', booking.id))}>
                                        {t('shuttle.bookings.confirm')}
                                    </PrimaryButton>
                                )}
                                {can.update && booking.status === 'confirmed' && (
                                    <PrimaryButton type="button" onClick={() => router.post(prefixedRoute('shuttle.bookings.board', booking.id))}>
                                        {t('shuttle.bookings.board')}
                                    </PrimaryButton>
                                )}
                                {can.update && ['draft', 'confirmed'].includes(booking.status) && (
                                    <button
                                        type="button"
                                        className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700"
                                        onClick={() => router.post(prefixedRoute('shuttle.bookings.cancel', booking.id))}
                                    >
                                        {t('shuttle.bookings.cancel')}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
                            <div>
                                <div className="font-medium text-gray-800">{t('shuttle.bookings.pickup_mode')}</div>
                                <div>
                                    {t(`shuttle.bookings.${booking.pickup_mode}`)}
                                    {booking.pickup_address ? ` — ${booking.pickup_address}` : ''}
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-gray-800">{t('shuttle.bookings.dropoff_mode')}</div>
                                <div>
                                    {t(`shuttle.bookings.${booking.dropoff_mode}`)}
                                    {booking.dropoff_address ? ` — ${booking.dropoff_address}` : ''}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="font-medium text-gray-800">{t('shuttle.bookings.passengers')}</div>
                            <ul className="mt-2 divide-y divide-gray-100 text-sm">
                                {booking.passengers.map((p) => (
                                    <li key={p.id} className="py-2">
                                        {p.name}
                                        {p.phone ? ` · ${p.phone}` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {booking.departure && (
                            <div className="mt-6">
                                <Link
                                    href={prefixedRoute('shuttle.departures.show', booking.departure.id)}
                                    className="text-sky-700 hover:underline"
                                >
                                    View departure {booking.departure.departure_number}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
