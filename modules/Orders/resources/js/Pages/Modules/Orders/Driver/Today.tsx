import DriverLayout from '@/Layouts/DriverLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';

interface Trip {
    id: number;
    code: string;
    status: string;
    origin: string | null;
    destination: string | null;
    scheduled_at: string | null;
    stops_count: number;
    vehicle: { id: number; plate_number: string; name: string | null } | null;
    partner: { id: number; name: string } | null;
}

interface Props {
    driverName: string;
    trips: Trip[];
}

const statusColor: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
};

export default function Today({ driverName, trips }: Props): JSX.Element {
    const { t } = useTrans();
    const todayTitle = t('orders.driver.today.title');

    return (
        <DriverLayout driverName={driverName} title={todayTitle}>
            <Head title={todayTitle} />

            {trips.length === 0 ? (
                <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                    <p className="text-sm text-gray-500">{t('orders.driver.today.empty')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {trips.map((trip) => (
                        <Link
                            key={trip.id}
                            href={route('module.driver.trip', trip.id)}
                            className="block rounded-lg bg-white p-4 shadow-sm active:bg-gray-50"
                        >
                            <div className="flex items-start justify-between">
                                <span className="font-semibold text-gray-900">{trip.code}</span>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[trip.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                    {t(`orders.trip_status.${trip.status}`, undefined, trip.status)}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">
                                {trip.origin || '—'} <span className="text-gray-400">→</span> {trip.destination || '—'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                {trip.vehicle && <span>🚚 {trip.vehicle.plate_number}</span>}
                                {trip.partner && <span>🏢 {trip.partner.name}</span>}
                                <span>📍 {t('orders.driver.today.stops', { count: trip.stops_count })}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </DriverLayout>
    );
}
