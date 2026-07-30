import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, useForm } from '@inertiajs/react';
import ShuttleNav from '../ShuttleNav';

interface RouteStop {
    id: number;
    sequence: number;
    stop_type: string;
    address: string;
    lat: string | number;
    lng: string | number;
    distance_from_previous_km: string | number;
    booking?: { booking_number: string } | null;
}

interface Booking {
    id: number;
    booking_number: string;
    status: string;
    passenger_count: number;
    pickup_mode: string;
    dropoff_mode: string;
    partner?: { name: string } | null;
    passengers?: Array<{ name: string; phone: string | null }>;
}

interface Departure {
    id: number;
    departure_number: string;
    depart_date: string;
    depart_time: string;
    status: string;
    seats_booked: number;
    seat_capacity: number;
    vehicle_id: number | null;
    driver_id: number | null;
    optimized_at: string | null;
    corridor?: { name: string; code: string } | null;
    vehicle?: { name: string; plate_number: string } | null;
    driver?: { name: string } | null;
    bookings: Booking[];
    route_stops: RouteStop[];
}

interface Props {
    departure: Departure;
    vehicles: Array<{ id: number; name: string; plate_number: string }>;
    drivers: Array<{ id: number; name: string }>;
    can: { update: boolean; optimize: boolean; dispatch: boolean };
}

export default function Show({ departure, vehicles, drivers, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const dispatchForm = useForm({
        vehicle_id: departure.vehicle_id ? String(departure.vehicle_id) : '',
        driver_id: departure.driver_id ? String(departure.driver_id) : '',
    });

    const totalKm = departure.route_stops.reduce((sum, s) => sum + Number(s.distance_from_previous_km || 0), 0);

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{departure.departure_number}</h2>}>
            <Head title={departure.departure_number} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ShuttleNav active="departures" />

                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
                            <div className="text-sm text-gray-500">{departure.corridor?.name}</div>
                            <div className="mt-1 text-lg font-semibold text-gray-900">
                                {departure.depart_date} · {String(departure.depart_time).slice(0, 5)}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                                <span>{t(`shuttle.status.${departure.status}`)}</span>
                                <span>
                                    {t('shuttle.departures.seats')}: {departure.seats_booked}/{departure.seat_capacity}
                                </span>
                                {departure.vehicle && (
                                    <span>
                                        {departure.vehicle.name} ({departure.vehicle.plate_number})
                                    </span>
                                )}
                                {departure.optimized_at && <span>Optimized {departure.optimized_at}</span>}
                            </div>
                        </div>

                        <div className="space-y-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
                            {can.update && (
                                <PrimaryButton
                                    type="button"
                                    className="w-full justify-center"
                                    onClick={() => router.post(prefixedRoute('shuttle.departures.lock', departure.id))}
                                >
                                    {t('shuttle.departures.lock')}
                                </PrimaryButton>
                            )}
                            {can.optimize && (
                                <PrimaryButton
                                    type="button"
                                    className="w-full justify-center"
                                    onClick={() => router.post(prefixedRoute('shuttle.departures.optimize', departure.id))}
                                >
                                    {t('shuttle.departures.optimize')}
                                </PrimaryButton>
                            )}
                            {can.dispatch && (
                                <>
                                    <Select
                                        value={dispatchForm.data.vehicle_id}
                                        onChange={(v) => dispatchForm.setData('vehicle_id', v)}
                                        options={[
                                            { value: '', label: 'Vehicle…' },
                                            ...vehicles.map((v) => ({ value: String(v.id), label: `${v.name} (${v.plate_number})` })),
                                        ]}
                                    />
                                    <Select
                                        value={dispatchForm.data.driver_id}
                                        onChange={(v) => dispatchForm.setData('driver_id', v)}
                                        options={[{ value: '', label: 'Driver…' }, ...drivers.map((d) => ({ value: String(d.id), label: d.name }))]}
                                    />
                                    <PrimaryButton
                                        type="button"
                                        className="w-full justify-center"
                                        onClick={() => dispatchForm.post(prefixedRoute('shuttle.departures.dispatch', departure.id))}
                                    >
                                        {t('shuttle.departures.dispatch')}
                                    </PrimaryButton>
                                    <button
                                        type="button"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        onClick={() => router.post(prefixedRoute('shuttle.departures.complete', departure.id))}
                                    >
                                        {t('shuttle.departures.complete')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                                <span className="font-medium">{t('shuttle.departures.route_stops')}</span>
                                <span className="text-sm text-gray-500">
                                    {t('shuttle.departures.total_km')}: {totalKm.toFixed(1)} km
                                </span>
                            </div>
                            <ol className="divide-y divide-gray-100 text-sm">
                                {departure.route_stops.map((stop) => (
                                    <li key={stop.id} className="flex gap-3 px-4 py-3">
                                        <span className="w-6 font-semibold text-gray-400">{stop.sequence}</span>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {stop.stop_type.replace('_', ' ')}
                                                {stop.booking ? ` · ${stop.booking.booking_number}` : ''}
                                            </div>
                                            <div className="text-gray-600">{stop.address}</div>
                                            <div className="text-xs text-gray-400">
                                                +{Number(stop.distance_from_previous_km).toFixed(1)} km · {stop.lat}, {stop.lng}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {departure.route_stops.length === 0 && (
                                    <li className="px-4 py-6 text-center text-gray-500">Run optimize to build stop sequence.</li>
                                )}
                            </ol>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
                            <div className="border-b border-gray-200 px-4 py-3 font-medium">{t('shuttle.departures.manifest')}</div>
                            <ul className="divide-y divide-gray-100 text-sm">
                                {departure.bookings.map((b) => (
                                    <li key={b.id} className="px-4 py-3">
                                        <div className="font-medium">
                                            {b.booking_number} · {b.partner?.name} · {b.passenger_count} pax
                                        </div>
                                        <div className="text-gray-500">
                                            {t(`shuttle.status.${b.status}`)} · pickup {b.pickup_mode} · drop {b.dropoff_mode}
                                        </div>
                                    </li>
                                ))}
                                {departure.bookings.length === 0 && <li className="px-4 py-6 text-center text-gray-500">No bookings yet.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
