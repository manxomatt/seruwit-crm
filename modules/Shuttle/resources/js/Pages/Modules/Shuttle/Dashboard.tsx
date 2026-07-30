import PrimaryButton from '@/Components/PrimaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import ShuttleNav from './ShuttleNav';

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
    stats: {
        corridors: number;
        departures_today: number;
        open_departures: number;
        bookings_today: number;
    };
    upcomingDepartures: Departure[];
    can: { create: boolean; optimize: boolean };
}

export default function Dashboard({ stats, upcomingDepartures, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.dashboard.title')}</h2>}>
            <Head title={t('shuttle.dashboard.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ShuttleNav active="dashboard" />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ['corridors', stats.corridors],
                            ['departures_today', stats.departures_today],
                            ['open_departures', stats.open_departures],
                            ['bookings_today', stats.bookings_today],
                        ].map(([key, value]) => (
                            <div key={key} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
                                <div className="text-sm text-gray-500">{t(`shuttle.dashboard.${key}`)}</div>
                                <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {can.create && (
                            <>
                                <Link href={prefixedRoute('shuttle.bookings.create')}>
                                    <PrimaryButton type="button">{t('shuttle.bookings.create')}</PrimaryButton>
                                </Link>
                                <Link
                                    href={prefixedRoute('shuttle.corridors.create')}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                    {t('shuttle.corridors.create')}
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                        <div className="border-b border-gray-200 px-4 py-3 font-medium text-gray-800">
                            {t('shuttle.dashboard.upcoming')}
                        </div>
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
                                {upcomingDepartures.map((d) => (
                                    <tr key={d.id}>
                                        <td className="px-4 py-2">
                                            <Link
                                                href={prefixedRoute('shuttle.departures.show', d.id)}
                                                className="font-medium text-sky-700 hover:underline"
                                            >
                                                {d.departure_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">{d.corridor?.name ?? '—'}</td>
                                        <td className="px-4 py-2">
                                            {d.depart_date} {String(d.depart_time).slice(0, 5)}
                                        </td>
                                        <td className="px-4 py-2">
                                            {d.seats_booked}/{d.seat_capacity}
                                        </td>
                                        <td className="px-4 py-2">{t(`shuttle.status.${d.status}`)}</td>
                                    </tr>
                                ))}
                                {upcomingDepartures.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                            —
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
