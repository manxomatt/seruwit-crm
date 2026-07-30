import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ShuttleNav from '../ShuttleNav';

interface Booking {
    id: number;
    booking_number: string;
    status: string;
    passenger_count: number;
    total_fare: string | number;
    partner?: { name: string } | null;
    departure?: { departure_number: string; depart_date: string; corridor?: { name: string } | null } | null;
}

interface Props {
    bookings: { data: Booking[] };
    filters: { status: string | null; search: string | null };
    can: { create: boolean; confirm: boolean };
}

const money = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

export default function Index({ bookings, filters, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('shuttle.bookings.index'), { search: search || undefined, status: status || undefined }, { preserveState: true });
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.bookings.title')}</h2>}>
            <Head title={t('shuttle.bookings.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <ShuttleNav active="bookings" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <form onSubmit={submit} className="flex flex-wrap gap-2">
                            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
                            <TextInput value={status} onChange={(e) => setStatus(e.target.value)} placeholder="status" />
                            <PrimaryButton type="submit">Filter</PrimaryButton>
                        </form>
                        {can.create && (
                            <Link href={prefixedRoute('shuttle.bookings.create')}>
                                <PrimaryButton type="button">{t('shuttle.bookings.create')}</PrimaryButton>
                            </Link>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">{t('shuttle.bookings.number')}</th>
                                    <th className="px-4 py-2">{t('shuttle.bookings.partner')}</th>
                                    <th className="px-4 py-2">{t('shuttle.bookings.departure')}</th>
                                    <th className="px-4 py-2">{t('shuttle.bookings.fare')}</th>
                                    <th className="px-4 py-2">{t('shuttle.departures.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bookings.data.map((b) => (
                                    <tr key={b.id}>
                                        <td className="px-4 py-2">
                                            <Link href={prefixedRoute('shuttle.bookings.show', b.id)} className="font-medium text-sky-700 hover:underline">
                                                {b.booking_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">{b.partner?.name}</td>
                                        <td className="px-4 py-2">
                                            {b.departure?.departure_number}
                                            <div className="text-xs text-gray-500">{b.departure?.corridor?.name}</div>
                                        </td>
                                        <td className="px-4 py-2">{money(b.total_fare)}</td>
                                        <td className="px-4 py-2">{t(`shuttle.status.${b.status}`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
