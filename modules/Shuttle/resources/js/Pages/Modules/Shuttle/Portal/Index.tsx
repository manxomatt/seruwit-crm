import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, router } from '@inertiajs/react';
import { ActionIconButton, EyeIcon } from '../components/ActionIcons';
import ShuttlePagination, { type PaginatedMeta } from '../components/ShuttlePagination';

interface BookingRow {
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
}

interface Props {
    partner: { id: number; code: string; name: string };
    bookings: PaginatedMeta & { data: BookingRow[] };
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

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700';
        case 'confirmed':
            return 'bg-sky-100 text-sky-800';
        case 'boarded':
            return 'bg-amber-100 text-amber-800';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        case 'cancelled':
        case 'no_show':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

export default function Index({ partner, bookings, openInvoices, gatewayEnabled }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('shuttle.portal.title')}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {partner.name} <span className="text-gray-400">({partner.code})</span>
                    </p>
                </div>
            }
        >
            <Head title={t('shuttle.portal.title')} />

            <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-200 px-4 py-3 font-medium text-gray-800">{t('shuttle.bookings.title')}</div>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.bookings.number')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.bookings.departure')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('shuttle.bookings.fare')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.status')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bookings.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                    {t('shuttle.portal.empty_bookings')}
                                </td>
                            </tr>
                        ) : (
                            bookings.data.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{b.booking_number}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">{b.departure?.corridor?.name ?? '—'}</div>
                                        <div className="text-xs text-gray-500">
                                            {b.departure?.depart_date} {String(b.departure?.depart_time ?? '').slice(0, 5)} · {b.passenger_count}{' '}
                                            pax
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{money(b.total_fare)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(b.status)}`}>
                                            {t(`shuttle.status.${b.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <ActionIconButton
                                                title={t('common.view')}
                                                href={prefixedRoute('portal.shuttle.bookings.show', b.id)}
                                            >
                                                <EyeIcon />
                                            </ActionIconButton>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <ShuttlePagination meta={bookings} />
            </div>

            {openInvoices.length > 0 && (
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="border-b border-gray-200 px-4 py-3 font-medium text-gray-800">{t('shuttle.portal.open_invoices')}</div>
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.status')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('shuttle.bookings.fare')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {openInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{inv.code}</div>
                                        {inv.due_date && <div className="text-xs text-gray-500">{inv.due_date}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{inv.status}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-gray-900">{money(inv.total)}</td>
                                    <td className="px-4 py-3 text-right">
                                        {gatewayEnabled && (
                                            <button
                                                type="button"
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                                onClick={() => router.post(prefixedRoute('portal.shuttle.invoices.pay', inv.id))}
                                            >
                                                Pay
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DynamicLayout>
    );
}
