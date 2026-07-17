import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TransportationNav from '../../../../TransportationNav';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TripSchedule {
    id: number;
    origin: string;
    destination: string;
    cargo_notes: string | null;
    distance_km: string | null;
    days_of_week: number[];
    time_of_day: string;
    starts_on: string;
    ends_on: string | null;
    is_active: boolean;
    trips_count: number;
    vehicle: { id: number; name: string; plate_number: string };
    driver: { id: number; name: string };
}

interface Props {
    schedule: TripSchedule;
    can: { update: boolean; delete: boolean };
}

export default function Show({ schedule, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('transportation.schedules.destroy', schedule.id), {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{schedule.origin} → {schedule.destination}</h2>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('transportation.schedules.edit', schedule.id)}>
                                <SecondaryButton>Edit</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('transportation.schedules.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`${schedule.origin} → ${schedule.destination}`} />

            <TransportationNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Vehicle</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <Link href={prefixedRoute('fleet.vehicles.show', schedule.vehicle.id)} className="text-indigo-600 hover:text-indigo-900">
                                        {schedule.vehicle.name} ({schedule.vehicle.plate_number})
                                    </Link>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Driver</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <Link href={prefixedRoute('fleet.drivers.show', schedule.driver.id)} className="text-indigo-600 hover:text-indigo-900">
                                        {schedule.driver.name}
                                    </Link>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {schedule.is_active ? 'Active' : 'Paused'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Days of Week</dt>
                                <dd className="mt-1 text-sm text-gray-900">{schedule.days_of_week.map((d) => DAY_LABELS[d]).join(', ')}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Time of Day</dt>
                                <dd className="mt-1 text-sm text-gray-900">{schedule.time_of_day.slice(0, 5)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Distance</dt>
                                <dd className="mt-1 text-sm text-gray-900">{schedule.distance_km ? `${schedule.distance_km} km` : '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Starts On</dt>
                                <dd className="mt-1 text-sm text-gray-900">{schedule.starts_on}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Ends On</dt>
                                <dd className="mt-1 text-sm text-gray-900">{schedule.ends_on || 'No end date'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Trips Generated</dt>
                                <dd className="mt-1 text-sm text-gray-900">{schedule.trips_count}</dd>
                            </div>
                            {schedule.cargo_notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Cargo Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{schedule.cargo_notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <p className="text-sm text-gray-500">
                            Trips are generated from the <Link href={prefixedRoute('transportation.schedules.index')} className="text-indigo-600 hover:text-indigo-900">Schedules</Link> page —
                            pick a date range there and every active schedule (including this one) is applied at once. Check the{' '}
                            <Link href={prefixedRoute('transportation.calendar.index')} className="text-indigo-600 hover:text-indigo-900">Calendar</Link> to see generated trips laid out by day.
                        </p>
                    </div>
                </div>

                {can.delete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Delete this schedule</h3>
                                <p className="text-sm text-gray-500">Trips already generated from it are kept.</p>
                            </div>
                            <button onClick={() => setShowDeleteDialog(true)} className="text-sm font-medium text-red-600 hover:text-red-900">
                                Delete Schedule
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                title="Delete Schedule"
                message={`Are you sure you want to delete the schedule "${schedule.origin} → ${schedule.destination}"? Trips already generated from it are kept.`}
            />
        </DynamicLayout>
    );
}
