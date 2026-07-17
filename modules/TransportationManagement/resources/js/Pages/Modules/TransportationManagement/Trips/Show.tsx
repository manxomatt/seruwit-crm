import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import TransportationNav from '../../../../TransportationNav';

interface Checkpoint {
    id: number;
    latitude: string;
    longitude: string;
    note: string | null;
    recorded_at: string;
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
    checkpoints: Checkpoint[];
}

interface Props {
    trip: Trip;
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

export default function Show({ trip, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showCheckpointModal, setShowCheckpointModal] = useState(false);

    const cancelForm = useForm({ cancelled_reason: '' });
    const checkpointForm = useForm({
        latitude: '',
        longitude: '',
        note: '',
        recorded_at: '',
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
                                    <Link href={prefixedRoute('transportation.vehicles.show', trip.vehicle.id)} className="text-indigo-600 hover:text-indigo-900">
                                        {trip.vehicle.name} ({trip.vehicle.plate_number})
                                    </Link>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Driver</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <Link href={prefixedRoute('transportation.drivers.show', trip.driver.id)} className="text-indigo-600 hover:text-indigo-900">
                                        {trip.driver.name}
                                    </Link>{' '}
                                    ({trip.driver.phone})
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
                                            <p className="text-sm font-medium text-gray-900">{checkpoint.recorded_at}</p>
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
