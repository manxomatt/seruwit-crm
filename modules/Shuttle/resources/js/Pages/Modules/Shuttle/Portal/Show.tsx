import PrimaryButton from '@/Components/PrimaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
    partner: { id: number; code: string; name: string };
    booking: {
        id: number;
        booking_number: string;
        status: string;
        passenger_count: number;
        total_fare: string | number;
        pickup_mode: string;
        dropoff_mode: string;
        pickup_address: string | null;
        dropoff_address: string | null;
        refund_status: string | null;
        departure?: {
            departure_number: string;
            depart_date: string;
            depart_time: string;
            corridor?: { name: string } | null;
        } | null;
        passengers: Array<{ id: number; name: string; phone: string | null; seat_label: string | null }>;
        invoice?: { id: number; code: string; status: string; total: string | number; amount_paid: string | number } | null;
        credit_invoice?: { id: number; code: string; status: string; total: string | number } | null;
    };
    gatewayEnabled: boolean;
    canPayInvoice: boolean;
}

const money = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

export default function Show({ partner, booking, canPayInvoice }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{booking.booking_number}</h2>}>
            <Head title={booking.booking_number} />
            <Link href={prefixedRoute('portal.shuttle.bookings.index')} className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
                ← {t('shuttle.portal.back')}
            </Link>

            <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <div className="text-sm text-gray-500">{partner.name}</div>
                        <div className="mt-1 text-lg font-semibold">{booking.departure?.corridor?.name}</div>
                        <div className="mt-1 text-sm text-gray-600">
                            {booking.departure?.depart_date} {String(booking.departure?.depart_time ?? '').slice(0, 5)} ·{' '}
                            {t(`shuttle.status.${booking.status}`)}
                        </div>
                        <div className="mt-2 font-medium">{money(booking.total_fare)}</div>

                        <div className="mt-6 space-y-2 text-sm">
                            <div>
                                {t('shuttle.bookings.pickup_mode')}: {t(`shuttle.bookings.${booking.pickup_mode}`)}
                                {booking.pickup_address ? ` — ${booking.pickup_address}` : ''}
                            </div>
                            <div>
                                {t('shuttle.bookings.dropoff_mode')}: {t(`shuttle.bookings.${booking.dropoff_mode}`)}
                                {booking.dropoff_address ? ` — ${booking.dropoff_address}` : ''}
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="font-medium">{t('shuttle.bookings.passengers')}</div>
                            <ul className="mt-2 divide-y divide-gray-100 text-sm">
                                {booking.passengers.map((p) => (
                                    <li key={p.id} className="py-2">
                                        {p.seat_label ? <span className="mr-2 font-semibold text-gray-700">{p.seat_label}</span> : null}
                                        {p.name}
                                        {p.phone ? ` · ${p.phone}` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {booking.invoice && (
                            <div className="mt-6 rounded-md bg-gray-50 p-3 text-sm">
                                Invoice {booking.invoice.code} · {booking.invoice.status} · {money(booking.invoice.total)}
                                {canPayInvoice && (
                                    <div className="mt-2">
                                        <PrimaryButton
                                            type="button"
                                            onClick={() => router.post(prefixedRoute('portal.shuttle.invoices.pay', booking.invoice!.id))}
                                        >
                                            Pay invoice
                                        </PrimaryButton>
                                    </div>
                                )}
                            </div>
                        )}

                        {booking.credit_invoice && (
                            <div className="mt-3 text-sm text-emerald-700">
                                Credit note {booking.credit_invoice.code} ({money(booking.credit_invoice.total)})
                            </div>
                        )}
                    </div>
        </DynamicLayout>
    );
}
