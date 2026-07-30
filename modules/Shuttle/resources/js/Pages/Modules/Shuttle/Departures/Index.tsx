import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import { FormEventHandler, useState } from 'react';
import ShuttleNav from '../ShuttleNav';

interface Departure {
    id: number;
    departure_number: string;
    depart_date: string;
    depart_time: string;
    status: string;
    seats_booked: number;
    seat_capacity: number;
    corridor?: { name: string } | null;
    vehicle?: { name: string; plate_number: string } | null;
}

interface Props {
    departures: { data: Departure[] };
    filters: { status: string | null; date: string | null };
    can: { optimize: boolean; dispatch: boolean };
}

export default function Index({ departures, filters }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [status, setStatus] = useState(filters.status ?? '');
    const [date, setDate] = useState(filters.date ?? '');

    const filter: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('shuttle.departures.index'), { status: status || undefined, date: date || undefined }, { preserveState: true });
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.departures.title')}</h2>}>
            <Head title={t('shuttle.departures.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <ShuttleNav active="departures" />
                    <form onSubmit={filter} className="flex flex-wrap gap-2">
                        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        <TextInput placeholder="status" value={status} onChange={(e) => setStatus(e.target.value)} />
                        <button type="submit" className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white">
                            Filter
                        </button>
                    </form>
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">{t('shuttle.departures.number')}</th>
                                    <th className="px-4 py-2">{t('shuttle.schedules.corridor')}</th>
                                    <th className="px-4 py-2">{t('shuttle.departures.date')}</th>
                                    <th className="px-4 py-2">{t('shuttle.departures.seats')}</th>
                                    <th className="px-4 py-2">{t('shuttle.departures.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {departures.data.map((d) => (
                                    <tr key={d.id}>
                                        <td className="px-4 py-2">
                                            <Link href={prefixedRoute('shuttle.departures.show', d.id)} className="font-medium text-sky-700 hover:underline">
                                                {d.departure_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">{d.corridor?.name}</td>
                                        <td className="px-4 py-2">
                                            {d.depart_date} {String(d.depart_time).slice(0, 5)}
                                        </td>
                                        <td className="px-4 py-2">
                                            {d.seats_booked}/{d.seat_capacity}
                                        </td>
                                        <td className="px-4 py-2">{t(`shuttle.status.${d.status}`)}</td>
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
