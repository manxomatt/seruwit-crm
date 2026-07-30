import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
    partner: { id: number; code: string; name: string };
    bookings: {
        data: Array<{
            id: number;
            booking_number: string;
            status: string;
            passenger_count: number;
            total_fare: string | number;
            departure?: {
                departure_number: string;
                depart_date: string;
                depart_time: string;
                corridor?: { name: string } | null;
            } | null;
        }>;
    };
    openInvoices: Array<{
        id: number;
        code: string;
        status: string;
        total: string | number;
        amount_paid: string | number;
        due_date: string | null;
    }>;
    gatewayEnabled: boolean;
}

const money = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

export default function Index({ partner, bookings, openInvoices, gatewayEnabled }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.portal.title')}</h2>}>
            <Head title={t('shuttle.portal.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-500">
                        {partner.name} <span className="text-gray-400">({partner.code})</span>
                    </p>

                    <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                        <div className="border-b border-gray-200 px-4 py-3 font-medium">{t('shuttle.bookings.title')}</div>
                        <ul className="divide-y divide-gray-100 text-sm">
                            {bookings.data.map((b) => (
                                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                    <div>
                                        <Link
                                            href={prefixedRoute('portal.shuttle.bookings.show', b.id)}
                                            className="font-medium text-sky-700 hover:underline"
                                        >
                                            {b.booking_number}
                                        </Link>
                                        <div className="text-gray-500">
                                            {b.departure?.corridor?.name} · {b.departure?.depart_date}{' '}
                                            {String(b.departure?.depart_time ?? '').slice(0, 5)} · {b.passenger_count} pax
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div>{money(b.total_fare)}</div>
                                        <div className="text-xs text-gray-500">{t(`shuttle.status.${b.status}`)}</div>
                                    </div>
                                </li>
                            ))}
                            {bookings.data.length === 0 && (
                                <li className="px-4 py-6 text-center text-gray-500">{t('shuttle.portal.empty_bookings')}</li>
                            )}
                        </ul>
                    </div>

                    {openInvoices.length > 0 && (
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                            <div className="border-b border-gray-200 px-4 py-3 font-medium">{t('shuttle.portal.open_invoices')}</div>
                            <ul className="divide-y divide-gray-100 text-sm">
                                {openInvoices.map((inv) => (
                                    <li key={inv.id} className="flex items-center justify-between px-4 py-3">
                                        <div>
                                            {inv.code} · {inv.status}
                                            <div className="text-xs text-gray-500">{inv.due_date}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span>{money(inv.total)}</span>
                                            {gatewayEnabled && (
                                                <button
                                                    type="button"
                                                    className="text-sky-700 hover:underline"
                                                    onClick={() => router.post(prefixedRoute('portal.shuttle.invoices.pay', inv.id))}
                                                >
                                                    Pay
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
