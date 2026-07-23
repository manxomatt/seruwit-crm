import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import LeafletMap from '@/Components/Map/LeafletMap';
import RouteTrail from '@/Components/Map/RouteTrail';
import VehicleMarker from '@/Components/Map/VehicleMarker';
import { formatSpeedKph, toLatLng, type LatLng } from '@/utils/geo';
import { Head, Link, router, useForm, usePoll } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import TransportationNav from '../../../../TransportationNav';

interface Checkpoint {
    id: number;
    source: string;
    latitude: string;
    longitude: string;
    note: string | null;
    recorded_at: string;
}

interface LivePosition {
    latitude: string;
    longitude: string;
    speed_kph: string | null;
    recorded_at: string | null;
}

interface Product {
    id: number;
    code: string;
    name: string;
    unit: string;
}

interface TripItem {
    id: number;
    quantity: string;
    notes: string | null;
    product: Product;
}

interface TripStop {
    id: number;
    sequence: number;
    type: string;
    address: string;
    lat: string | null;
    lng: string | null;
    delivery_order_id: number | null;
    status: string;
    arrived_at: string | null;
    completed_at: string | null;
    delivery_order?: { id: number; code: string } | null;
}

interface DeliveryOrderSummary {
    id: number;
    code: string;
    status: string;
    delivery_address: string;
    partner: { id: number; name: string } | null;
}

interface Trip {
    id: number;
    code: string;
    origin: string;
    destination: string;
    cargo_notes: string | null;
    scheduled_at: string;
    started_at: string | null;
    completed_at: string | null;
    distance_km: string | null;
    status: string;
    cancelled_reason: string | null;
    vehicle: { id: number; name: string; plate_number: string };
    driver: { id: number; name: string; phone: string };
    partner: { id: number; code: string; name: string; phone: string } | null;
    checkpoints: Checkpoint[];
    items: TripItem[];
    stops: TripStop[];
    delivery_orders?: DeliveryOrderSummary[];
}

interface Props {
    trip: Trip;
    products: Product[];
    ordersEnabled: boolean;
    trackingEnabled: boolean;
    livePosition: LivePosition | null;
    can: { create: boolean; update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'scheduled':
            return 'bg-gray-100 text-gray-800';
        case 'in_progress':
            return 'bg-blue-100 text-blue-800';
        case 'completed':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-red-100 text-red-800';
    }
};

const getStopStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-gray-100 text-gray-800';
        case 'arrived':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-green-100 text-green-800';
    }
};

const getOrderStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'assigned':
            return 'bg-indigo-100 text-indigo-800';
        case 'in_transit':
            return 'bg-yellow-100 text-yellow-800';
        case 'delivered':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Show({ trip, products, ordersEnabled, trackingEnabled, livePosition, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showCheckpointModal, setShowCheckpointModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);

    const cancelForm = useForm({ cancelled_reason: '' });
    const checkpointForm = useForm({
        latitude: '',
        longitude: '',
        note: '',
        recorded_at: '',
    });
    const itemForm = useForm({
        product_id: '',
        quantity: '',
        notes: '',
    });
    const stopForm = useForm({
        type: 'dropoff',
        address: '',
        lat: '',
        lng: '',
    });

    const start = () => {
        router.post(prefixedRoute('transportation.trips.start', trip.id), {}, { preserveScroll: true });
    };

    const complete = () => {
        router.post(prefixedRoute('transportation.trips.complete', trip.id), {}, { preserveScroll: true });
    };

    const submitCancel: FormEventHandler = (e) => {
        e.preventDefault();
        cancelForm.post(prefixedRoute('transportation.trips.cancel', trip.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCancelModal(false);
                cancelForm.reset();
            },
        });
    };

    const submitCheckpoint: FormEventHandler = (e) => {
        e.preventDefault();
        checkpointForm.post(prefixedRoute('transportation.trips.checkpoints.store', trip.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCheckpointModal(false);
                checkpointForm.reset();
            },
        });
    };

    const deleteCheckpoint = (id: number) => {
        router.delete(prefixedRoute('transportation.trips.checkpoints.destroy', [trip.id, id]), { preserveScroll: true });
    };

    const submitItem: FormEventHandler = (e) => {
        e.preventDefault();
        itemForm.post(prefixedRoute('transportation.trips.items.store', trip.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowItemModal(false);
                itemForm.reset();
            },
        });
    };

    const deleteItem = (id: number) => {
        router.delete(prefixedRoute('transportation.trips.items.destroy', [trip.id, id]), { preserveScroll: true });
    };

    const submitStop: FormEventHandler = (e) => {
        e.preventDefault();
        stopForm.post(prefixedRoute('transportation.trips.stops.store', trip.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowStopModal(false);
                stopForm.reset();
            },
        });
    };

    const deleteStop = (id: number) => {
        router.delete(prefixedRoute('transportation.trips.stops.destroy', [trip.id, id]), { preserveScroll: true });
    };

    const arriveStop = (id: number) => {
        router.post(prefixedRoute('transportation.trips.stops.arrive', [trip.id, id]), {}, { preserveScroll: true });
    };

    const completeStop = (id: number) => {
        router.post(prefixedRoute('transportation.trips.stops.complete', [trip.id, id]), {}, { preserveScroll: true });
    };

    // Only worth refreshing while the vehicle is actually moving.
    usePoll(20000, { only: ['trip', 'livePosition'] }, { autoStart: trackingEnabled && trip.status === 'in_progress' });

    const trail = useMemo(
        () =>
            trip.checkpoints
                .map((checkpoint) => toLatLng(checkpoint.latitude, checkpoint.longitude))
                .filter((point): point is LatLng => point !== null),
        [trip.checkpoints],
    );

    const mappedStops = useMemo(
        () =>
            trip.stops
                .map((stop) => ({ stop, position: toLatLng(stop.lat, stop.lng) }))
                .filter((entry): entry is { stop: TripStop; position: LatLng } => entry.position !== null)
                .map(({ stop, position }) => ({
                    position,
                    label: stop.address,
                    sequence: stop.sequence,
                    status: stop.status,
                })),
        [trip.stops],
    );

    const live = livePosition ? toLatLng(livePosition.latitude, livePosition.longitude) : null;
    const hasMap = trail.length > 0 || mappedStops.length > 0 || live !== null;
    const bounds = [...trail, ...mappedStops.map((stop) => stop.position), ...(live ? [live] : [])];

    const canDelete = can.delete && trip.status !== 'in_progress';

    const deleteTrip = () => {
        router.delete(prefixedRoute('transportation.trips.destroy', trip.id));
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{trip.code}</h2>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(trip.status)}`}>
                            {trip.status.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {can.update && trip.status === 'scheduled' && (
                            <PrimaryButton onClick={start}>Start Trip</PrimaryButton>
                        )}
                        {can.update && trip.status === 'in_progress' && (
                            <PrimaryButton onClick={complete}>Complete Trip</PrimaryButton>
                        )}
                        {can.update && (trip.status === 'scheduled' || trip.status === 'in_progress') && (
                            <DangerButton onClick={() => setShowCancelModal(true)}>Cancel Trip</DangerButton>
                        )}
                        <Link href={prefixedRoute('transportation.trips.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={trip.code} />

            <TransportationNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Vehicle</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <Link href={prefixedRoute('fleet.vehicles.show', trip.vehicle.id)} className="text-indigo-600 hover:text-indigo-900">
                                        {trip.vehicle.name} ({trip.vehicle.plate_number})
                                    </Link>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Driver</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <Link href={prefixedRoute('fleet.drivers.show', trip.driver.id)} className="text-indigo-600 hover:text-indigo-900">
                                        {trip.driver.name}
                                    </Link>{' '}
                                    ({trip.driver.phone})
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Partner</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {trip.partner ? (
                                        <>
                                            <Link href={prefixedRoute('partners.show', trip.partner.id)} className="text-indigo-600 hover:text-indigo-900">
                                                {trip.partner.name}
                                            </Link>{' '}
                                            ({trip.partner.code})
                                        </>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Distance</dt>
                                <dd className="mt-1 text-sm text-gray-900">{trip.distance_km ? `${trip.distance_km} km` : '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Origin</dt>
                                <dd className="mt-1 text-sm text-gray-900">{trip.origin}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Destination</dt>
                                <dd className="mt-1 text-sm text-gray-900">{trip.destination}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Scheduled At</dt>
                                <dd className="mt-1 text-sm text-gray-900">{trip.scheduled_at}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Started At</dt>
                                <dd className="mt-1 text-sm text-gray-900">{trip.started_at || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                                <dd className="mt-1 text-sm text-gray-900">{trip.completed_at || '—'}</dd>
                            </div>
                            {trip.cancelled_reason && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Cancellation Reason</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{trip.cancelled_reason}</dd>
                                </div>
                            )}
                            {trip.cargo_notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Cargo Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{trip.cargo_notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {hasMap && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Route</h3>
                                {live && (
                                    <span className="text-sm text-gray-500">
                                        Live: {formatSpeedKph(livePosition?.speed_kph)} — {livePosition?.recorded_at}
                                    </span>
                                )}
                            </div>
                            <LeafletMap bounds={bounds} height="420px">
                                <RouteTrail trail={trail} stops={mappedStops} />
                                {live && (
                                    <VehicleMarker
                                        position={live}
                                        label={trip.vehicle.name}
                                        tone={Number(livePosition?.speed_kph ?? 0) > 3 ? 'moving' : 'idle'}
                                    />
                                )}
                            </LeafletMap>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Stops</h3>
                            {can.create && trip.status === 'scheduled' && (
                                <PrimaryButton onClick={() => setShowStopModal(true)}>Add Stop</PrimaryButton>
                            )}
                        </div>
                        {trip.stops.length === 0 ? (
                            <p className="text-sm text-gray-500">No stops planned. Origin and destination describe the route.</p>
                        ) : (
                            <ol className="space-y-3">
                                {trip.stops.map((stop) => (
                                    <li key={stop.id} className="flex items-start justify-between rounded-md border border-gray-200 p-3">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                                {stop.sequence}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stop.address}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    <span className="capitalize">{stop.type}</span>
                                                    {stop.delivery_order && (
                                                        <>
                                                            {' — '}
                                                            <Link href={prefixedRoute('orders.show', stop.delivery_order.id)} className="text-indigo-600 hover:text-indigo-900">
                                                                {stop.delivery_order.code}
                                                            </Link>
                                                        </>
                                                    )}
                                                    {stop.completed_at ? ` — done ${stop.completed_at}` : stop.arrived_at ? ` — arrived ${stop.arrived_at}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStopStatusBadgeColor(stop.status)}`}>
                                                {stop.status}
                                            </span>
                                            {can.update && trip.status === 'in_progress' && stop.status === 'pending' && (
                                                <button onClick={() => arriveStop(stop.id)} className="text-sm text-indigo-600 hover:text-indigo-900">
                                                    Arrive
                                                </button>
                                            )}
                                            {can.update && trip.status === 'in_progress' && stop.status !== 'completed' && (
                                                <button onClick={() => completeStop(stop.id)} className="text-sm text-green-600 hover:text-green-900">
                                                    Complete
                                                </button>
                                            )}
                                            {can.delete && trip.status === 'scheduled' && stop.status === 'pending' && !stop.delivery_order_id && (
                                                <button onClick={() => deleteStop(stop.id)} className="text-sm text-red-600 hover:text-red-900">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>

                {ordersEnabled && trip.delivery_orders && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Delivery Orders</h3>
                            </div>
                            {trip.delivery_orders.length === 0 ? (
                                <p className="text-sm text-gray-500">No delivery orders consolidated onto this trip. Attach them from the Orders module.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {trip.delivery_orders.map((order) => (
                                        <li key={order.id} className="flex items-start justify-between rounded-md border border-gray-200 p-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    <Link href={prefixedRoute('orders.show', order.id)} className="text-indigo-600 hover:text-indigo-900">
                                                        {order.code}
                                                    </Link>
                                                    {order.partner ? ` — ${order.partner.name}` : ''}
                                                </p>
                                                <p className="text-sm text-gray-500">{order.delivery_address}</p>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getOrderStatusBadgeColor(order.status)}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Tracking Checkpoints</h3>
                            {can.create && trip.status === 'in_progress' && (
                                <PrimaryButton onClick={() => setShowCheckpointModal(true)}>Log Checkpoint</PrimaryButton>
                            )}
                        </div>
                        {trip.checkpoints.length === 0 ? (
                            <p className="text-sm text-gray-500">No checkpoints logged yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {trip.checkpoints.map((checkpoint) => (
                                    <li key={checkpoint.id} className="flex items-start justify-between rounded-md border border-gray-200 p-3">
                                        <div>
                                            <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                                {checkpoint.recorded_at}
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${checkpoint.source === 'gps' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {checkpoint.source}
                                                </span>
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {checkpoint.latitude}, {checkpoint.longitude}
                                                {checkpoint.note ? ` — ${checkpoint.note}` : ''}
                                            </p>
                                            <a
                                                href={`https://maps.google.com/?q=${checkpoint.latitude},${checkpoint.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-indigo-600 hover:text-indigo-900"
                                            >
                                                Open in Maps
                                            </a>
                                        </div>
                                        {can.delete && (
                                            <button onClick={() => deleteCheckpoint(checkpoint.id)} className="text-sm text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Cargo Items</h3>
                            {can.create && (
                                <PrimaryButton onClick={() => setShowItemModal(true)}>Add Item</PrimaryButton>
                            )}
                        </div>
                        {trip.items.length === 0 ? (
                            <p className="text-sm text-gray-500">No cargo items recorded yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {trip.items.map((item) => (
                                    <li key={item.id} className="flex items-start justify-between rounded-md border border-gray-200 p-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.product.name} ({item.product.code})
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} {item.product.unit}
                                                {item.notes ? ` — ${item.notes}` : ''}
                                            </p>
                                        </div>
                                        {can.delete && (
                                            <button onClick={() => deleteItem(item.id)} className="text-sm text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {canDelete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Delete this trip</h3>
                                <p className="text-sm text-gray-500">This cannot be undone once confirmed.</p>
                            </div>
                            <button onClick={deleteTrip} className="text-sm font-medium text-red-600 hover:text-red-900">
                                Delete Trip
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal show={showCheckpointModal} onClose={() => setShowCheckpointModal(false)} maxWidth="md">
                <form onSubmit={submitCheckpoint} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Log Checkpoint</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="c_latitude" value="Latitude" />
                                <TextInput id="c_latitude" type="number" step="0.0000001" className="mt-1 block w-full" value={checkpointForm.data.latitude} onChange={(e) => checkpointForm.setData('latitude', e.target.value)} required />
                                <InputError message={checkpointForm.errors.latitude} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="c_longitude" value="Longitude" />
                                <TextInput id="c_longitude" type="number" step="0.0000001" className="mt-1 block w-full" value={checkpointForm.data.longitude} onChange={(e) => checkpointForm.setData('longitude', e.target.value)} required />
                                <InputError message={checkpointForm.errors.longitude} className="mt-2" />
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="c_recorded_at" value="Recorded At" />
                            <TextInput id="c_recorded_at" type="datetime-local" className="mt-1 block w-full" value={checkpointForm.data.recorded_at} onChange={(e) => checkpointForm.setData('recorded_at', e.target.value)} required />
                            <InputError message={checkpointForm.errors.recorded_at} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="c_note" value="Note (optional)" />
                            <TextInput id="c_note" className="mt-1 block w-full" value={checkpointForm.data.note} onChange={(e) => checkpointForm.setData('note', e.target.value)} />
                            <InputError message={checkpointForm.errors.note} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowCheckpointModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={checkpointForm.processing}>Save</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showItemModal} onClose={() => setShowItemModal(false)} maxWidth="md">
                <form onSubmit={submitItem} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Add Cargo Item</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="i_product_id" value="Product" />
                            <Select
                                id="i_product_id"
                                className="mt-1"
                                value={itemForm.data.product_id}
                                onChange={(value) => itemForm.setData('product_id', value)}
                                placeholder="Select a product"
                                options={products.map((product) => ({
                                    value: String(product.id),
                                    label: `${product.name} (${product.code})`,
                                }))}
                            />
                            <InputError message={itemForm.errors.product_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="i_quantity" value="Quantity" />
                            <TextInput id="i_quantity" type="number" step="0.01" min="0.01" className="mt-1 block w-full" value={itemForm.data.quantity} onChange={(e) => itemForm.setData('quantity', e.target.value)} required />
                            <InputError message={itemForm.errors.quantity} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="i_notes" value="Notes (optional)" />
                            <TextInput id="i_notes" className="mt-1 block w-full" value={itemForm.data.notes} onChange={(e) => itemForm.setData('notes', e.target.value)} />
                            <InputError message={itemForm.errors.notes} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowItemModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={itemForm.processing}>Save</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showStopModal} onClose={() => setShowStopModal(false)} maxWidth="md">
                <form onSubmit={submitStop} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Add Stop</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="s_type" value="Type" />
                            <Select
                                id="s_type"
                                className="mt-1"
                                value={stopForm.data.type}
                                onChange={(value) => stopForm.setData('type', value)}
                                options={[
                                    { value: 'pickup', label: 'Pickup' },
                                    { value: 'dropoff', label: 'Dropoff' },
                                ]}
                            />
                            <InputError message={stopForm.errors.type} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="s_address" value="Address" />
                            <TextInput id="s_address" className="mt-1 block w-full" value={stopForm.data.address} onChange={(e) => stopForm.setData('address', e.target.value)} required />
                            <InputError message={stopForm.errors.address} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="s_lat" value="Latitude (optional)" />
                                <TextInput id="s_lat" type="number" step="0.0000001" className="mt-1 block w-full" value={stopForm.data.lat} onChange={(e) => stopForm.setData('lat', e.target.value)} />
                                <InputError message={stopForm.errors.lat} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="s_lng" value="Longitude (optional)" />
                                <TextInput id="s_lng" type="number" step="0.0000001" className="mt-1 block w-full" value={stopForm.data.lng} onChange={(e) => stopForm.setData('lng', e.target.value)} />
                                <InputError message={stopForm.errors.lng} className="mt-2" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowStopModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={stopForm.processing}>Save</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showCancelModal} onClose={() => setShowCancelModal(false)} maxWidth="md">
                <form onSubmit={submitCancel} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Cancel Trip</h3>
                    <InputLabel htmlFor="cancelled_reason" value="Reason" />
                    <TextInput id="cancelled_reason" className="mt-1 block w-full" value={cancelForm.data.cancelled_reason} onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)} required />
                    <InputError message={cancelForm.errors.cancelled_reason} className="mt-2" />
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowCancelModal(false)}>Back</SecondaryButton>
                        <DangerButton disabled={cancelForm.processing}>Confirm Cancellation</DangerButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
