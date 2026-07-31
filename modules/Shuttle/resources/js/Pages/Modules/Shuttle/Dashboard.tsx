import PrimaryButton from '@/Components/PrimaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import ShuttleNav from './ShuttleNav';
import { ActionIconButton, EyeIcon } from './components/ActionIcons';

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

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'open':
            return 'bg-sky-100 text-sky-800';
        case 'locked':
            return 'bg-amber-100 text-amber-800';
        case 'optimized':
            return 'bg-indigo-100 text-indigo-800';
        case 'dispatched':
        case 'in_transit':
            return 'bg-violet-100 text-violet-800';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

export default function Dashboard({ stats, upcomingDepartures, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('shuttle.dashboard.title')}</h2>
                    {can.create && (
                        <div className="flex flex-wrap gap-2">
                            <Link href={prefixedRoute('shuttle.bookings.create')}>
                                <PrimaryButton type="button">{t('shuttle.bookings.create')}</PrimaryButton>
                            </Link>
                            <Link
                                href={prefixedRoute('shuttle.corridors.create')}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                {t('shuttle.corridors.create')}
                            </Link>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={t('shuttle.dashboard.title')} />
            <ShuttleNav active="dashboard" />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-200 px-4 py-3 font-medium text-gray-800">{t('shuttle.dashboard.upcoming')}</div>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.number')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.schedules.corridor')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.date')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.seats')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.status')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions', undefined, 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {upcomingDepartures.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    —
                                </td>
                            </tr>
                        ) : (
                            upcomingDepartures.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{d.departure_number}</td>
                                    <td className="px-4 py-3 text-gray-700">{d.corridor?.name ?? '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                        {d.depart_date} {String(d.depart_time).slice(0, 5)}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-700" title={t('shuttle.departures.seats_booked_hint', undefined, 'Booked / capacity')}>
                                        {d.seats_booked}/{d.seat_capacity}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(d.status)}`}>
                                            {t(`shuttle.status.${d.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <ActionIconButton
                                                title={t('common.view', undefined, 'View')}
                                                href={prefixedRoute('shuttle.departures.show', d.id)}
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
            </div>
        </DynamicLayout>
    );
}
