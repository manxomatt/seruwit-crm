import DriverLayout from '@/Layouts/DriverLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Pod {
    recipient_name: string;
    delivered_at: string | null;
}

interface DeliveryOrder {
    id: number;
    code: string;
    status: string;
    partner: { id: number; name: string } | null;
    pod: Pod | null;
}

interface Stop {
    id: number;
    sequence: number;
    type: string;
    address: string;
    status: string;
    delivery_order_id: number | null;
    delivery_order: DeliveryOrder | null;
}

interface Trip {
    id: number;
    code: string;
    status: string;
    origin: string | null;
    destination: string | null;
    vehicle: { id: number; plate_number: string; name: string | null } | null;
    stops: Stop[];
}

interface Props {
    driverName: string;
    trip: Trip;
}

const typeLabel: Record<string, string> = { pickup: 'Ambil', dropoff: 'Antar' };

export default function TripPage({ driverName, trip }: Props): JSX.Element {
    const [processing, setProcessing] = useState(false);

    const startTrip = () => {
        setProcessing(true);
        router.post(route('module.driver.trips.start', trip.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const arriveStop = (stopId: number) => {
        setProcessing(true);
        router.post(route('module.driver.stops.arrive', [trip.id, stopId]), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DriverLayout driverName={driverName} title={trip.code} back={route('module.driver.today')}>
            <Head title={trip.code} />

            <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-700">
                    {trip.origin || '—'} <span className="text-gray-400">→</span> {trip.destination || '—'}
                </p>
                {trip.vehicle && <p className="mt-1 text-xs text-gray-500">🚚 {trip.vehicle.plate_number}</p>}

                {trip.status === 'scheduled' && (
                    <button
                        onClick={startTrip}
                        disabled={processing}
                        className="mt-4 w-full rounded-md bg-indigo-600 py-3 text-sm font-semibold text-white active:bg-indigo-700 disabled:opacity-50"
                    >
                        Mulai Trip
                    </button>
                )}
            </div>

            <h2 className="mb-2 mt-6 text-sm font-semibold text-gray-700">Pemberhentian</h2>
            <ol className="space-y-3">
                {trip.stops.map((stop) => {
                    const order = stop.delivery_order;
                    const isDropoff = stop.type === 'dropoff';
                    const done = stop.status === 'completed';
                    const canArrive = trip.status === 'in_progress' && stop.status === 'pending';
                    const canPod =
                        isDropoff &&
                        order !== null &&
                        order.status === 'in_transit' &&
                        !done &&
                        trip.status === 'in_progress';

                    return (
                        <li key={stop.id} className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                                            {stop.sequence}
                                        </span>
                                        <span className="text-xs font-medium uppercase text-gray-500">
                                            {typeLabel[stop.type] ?? stop.type}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-900">{stop.address}</p>
                                    {order && <p className="text-xs text-gray-500">{order.code} · {order.partner?.name}</p>}
                                </div>
                                {done && (
                                    <span className="text-green-600" aria-label="Selesai">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </div>

                            {order?.pod && (
                                <p className="mt-2 rounded bg-green-50 px-2 py-1 text-xs text-green-700">
                                    Diterima oleh {order.pod.recipient_name}
                                </p>
                            )}

                            <div className="mt-3 flex gap-2">
                                {canArrive && (
                                    <button
                                        onClick={() => arriveStop(stop.id)}
                                        disabled={processing}
                                        className="flex-1 rounded-md border border-indigo-600 py-2 text-sm font-semibold text-indigo-600 active:bg-indigo-50 disabled:opacity-50"
                                    >
                                        Sampai
                                    </button>
                                )}
                                {canPod && (
                                    <Link
                                        href={route('module.driver.pod.create', order!.id)}
                                        className="flex-1 rounded-md bg-indigo-600 py-2 text-center text-sm font-semibold text-white active:bg-indigo-700"
                                    >
                                        Serah Terima (POD)
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </DriverLayout>
    );
}
