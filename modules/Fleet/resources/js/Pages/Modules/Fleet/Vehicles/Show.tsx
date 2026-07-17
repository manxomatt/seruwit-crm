import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import FleetNav from '../../../../FleetNav';

interface MaintenanceLog {
    id: number;
    type: string;
    description: string;
    scheduled_date: string;
    completed_date: string | null;
    cost: string | null;
    odometer_km: number | null;
    status: string;
}

interface FuelLog {
    id: number;
    filled_at: string;
    liters: string;
    cost: string;
    odometer_km: number | null;
}

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    brand: string | null;
    model_year: number | null;
    capacity: string | null;
    fuel_type: string;
    status: string;
    odometer_km: number;
    stnk_expires_at: string | null;
    kir_expires_at: string | null;
    photo_url: string | null;
    notes: string | null;
    maintenance_logs: MaintenanceLog[];
    fuel_logs: FuelLog[];
}

interface Props {
    vehicle: Vehicle;
    can: { create: boolean; update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'maintenance':
            return 'bg-yellow-100 text-yellow-800';
        case 'out_of_service':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Show({ vehicle, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const maintenanceForm = useForm({
        type: 'scheduled_service',
        description: '',
        scheduled_date: '',
        completed_date: '',
        cost: '',
        odometer_km: '',
        status: 'scheduled',
    });

    const fuelForm = useForm({
        filled_at: '',
        liters: '',
        cost: '',
        odometer_km: '',
    });

    const submitMaintenance: FormEventHandler = (e) => {
        e.preventDefault();
        maintenanceForm.post(prefixedRoute('fleet.vehicles.maintenance-logs.store', vehicle.id), {
            onSuccess: () => {
                setShowMaintenanceModal(false);
                maintenanceForm.reset();
            },
        });
    };

    const submitFuel: FormEventHandler = (e) => {
        e.preventDefault();
        fuelForm.post(prefixedRoute('fleet.vehicles.fuel-logs.store', vehicle.id), {
            onSuccess: () => {
                setShowFuelModal(false);
                fuelForm.reset();
            },
        });
    };

    const deleteMaintenance = (id: number) => {
        router.delete(prefixedRoute('fleet.vehicles.maintenance-logs.destroy', [vehicle.id, id]), { preserveScroll: true });
    };

    const deleteFuel = (id: number) => {
        router.delete(prefixedRoute('fleet.vehicles.fuel-logs.destroy', [vehicle.id, id]), { preserveScroll: true });
    };

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.vehicles.destroy', vehicle.id), {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{vehicle.name}</h2>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('fleet.vehicles.edit', vehicle.id)}>
                                <SecondaryButton>Edit</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('fleet.vehicles.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={vehicle.name} />

            <FleetNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        {vehicle.photo_url && (
                            <img src={vehicle.photo_url} alt={vehicle.name} className="mb-6 h-48 w-full rounded-lg object-cover sm:w-64" />
                        )}
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Plate Number</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.plate_number}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Type</dt>
                                <dd className="mt-1 text-sm capitalize text-gray-900">{vehicle.type}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(vehicle.status)}`}>
                                        {vehicle.status.replace('_', ' ')}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Brand</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.brand || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Model Year</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.model_year || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.capacity || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Fuel Type</dt>
                                <dd className="mt-1 text-sm capitalize text-gray-900">{vehicle.fuel_type}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Odometer</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.odometer_km.toLocaleString()} km</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">STNK Expiry</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.stnk_expires_at || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">KIR Expiry</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.kir_expires_at || '—'}</dd>
                            </div>
                            {vehicle.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{vehicle.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Maintenance History</h3>
                            {can.create && <PrimaryButton onClick={() => setShowMaintenanceModal(true)}>Log Maintenance</PrimaryButton>}
                        </div>
                        {vehicle.maintenance_logs.length === 0 ? (
                            <p className="text-sm text-gray-500">No maintenance logs yet.</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Scheduled</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Cost</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vehicle.maintenance_logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm capitalize text-gray-900">{log.type.replace('_', ' ')}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{log.description}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{log.scheduled_date}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{log.cost ? `Rp ${Number(log.cost).toLocaleString()}` : '—'}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm capitalize text-gray-500">{log.status}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right text-sm">
                                                {can.delete && (
                                                    <button onClick={() => deleteMaintenance(log.id)} className="text-red-600 hover:text-red-900">
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Fuel Log</h3>
                            {can.create && <PrimaryButton onClick={() => setShowFuelModal(true)}>Add Fuel Log</PrimaryButton>}
                        </div>
                        {vehicle.fuel_logs.length === 0 ? (
                            <p className="text-sm text-gray-500">No fuel logs yet.</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Liters</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Cost</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Odometer</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vehicle.fuel_logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{log.filled_at}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{log.liters} L</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">Rp {Number(log.cost).toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{log.odometer_km ? `${log.odometer_km.toLocaleString()} km` : '—'}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right text-sm">
                                                {can.delete && (
                                                    <button onClick={() => deleteFuel(log.id)} className="text-red-600 hover:text-red-900">
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {can.delete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Delete this vehicle</h3>
                                <p className="text-sm text-gray-500">This cannot be undone once confirmed.</p>
                            </div>
                            <button onClick={() => setShowDeleteDialog(true)} className="text-sm font-medium text-red-600 hover:text-red-900">
                                Delete Vehicle
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal show={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} maxWidth="lg">
                <form onSubmit={submitMaintenance} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Log Maintenance</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="m_type" value="Type" />
                            <select id="m_type" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={maintenanceForm.data.type} onChange={(e) => maintenanceForm.setData('type', e.target.value)}>
                                <option value="scheduled_service">Scheduled Service</option>
                                <option value="repair">Repair</option>
                                <option value="inspection">Inspection</option>
                            </select>
                            <InputError message={maintenanceForm.errors.type} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="m_description" value="Description" />
                            <TextInput id="m_description" className="mt-1 block w-full" value={maintenanceForm.data.description} onChange={(e) => maintenanceForm.setData('description', e.target.value)} required />
                            <InputError message={maintenanceForm.errors.description} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="m_scheduled_date" value="Scheduled Date" />
                                <TextInput id="m_scheduled_date" type="date" className="mt-1 block w-full" value={maintenanceForm.data.scheduled_date} onChange={(e) => maintenanceForm.setData('scheduled_date', e.target.value)} required />
                                <InputError message={maintenanceForm.errors.scheduled_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="m_completed_date" value="Completed Date (optional)" />
                                <TextInput id="m_completed_date" type="date" className="mt-1 block w-full" value={maintenanceForm.data.completed_date} onChange={(e) => maintenanceForm.setData('completed_date', e.target.value)} />
                                <InputError message={maintenanceForm.errors.completed_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="m_cost" value="Cost (optional)" />
                                <TextInput id="m_cost" type="number" min={0} className="mt-1 block w-full" value={maintenanceForm.data.cost} onChange={(e) => maintenanceForm.setData('cost', e.target.value)} />
                                <InputError message={maintenanceForm.errors.cost} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="m_odometer_km" value="Odometer (optional)" />
                                <TextInput id="m_odometer_km" type="number" min={0} className="mt-1 block w-full" value={maintenanceForm.data.odometer_km} onChange={(e) => maintenanceForm.setData('odometer_km', e.target.value)} />
                                <InputError message={maintenanceForm.errors.odometer_km} className="mt-2" />
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="m_status" value="Status" />
                            <select id="m_status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={maintenanceForm.data.status} onChange={(e) => maintenanceForm.setData('status', e.target.value)}>
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <InputError message={maintenanceForm.errors.status} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowMaintenanceModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={maintenanceForm.processing}>Save</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showFuelModal} onClose={() => setShowFuelModal(false)} maxWidth="md">
                <form onSubmit={submitFuel} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Add Fuel Log</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="f_filled_at" value="Date" />
                            <TextInput id="f_filled_at" type="date" className="mt-1 block w-full" value={fuelForm.data.filled_at} onChange={(e) => fuelForm.setData('filled_at', e.target.value)} required />
                            <InputError message={fuelForm.errors.filled_at} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="f_liters" value="Liters" />
                                <TextInput id="f_liters" type="number" min={0} step="0.01" className="mt-1 block w-full" value={fuelForm.data.liters} onChange={(e) => fuelForm.setData('liters', e.target.value)} required />
                                <InputError message={fuelForm.errors.liters} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="f_cost" value="Cost" />
                                <TextInput id="f_cost" type="number" min={0} className="mt-1 block w-full" value={fuelForm.data.cost} onChange={(e) => fuelForm.setData('cost', e.target.value)} required />
                                <InputError message={fuelForm.errors.cost} className="mt-2" />
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="f_odometer_km" value="Odometer (optional)" />
                            <TextInput id="f_odometer_km" type="number" min={0} className="mt-1 block w-full" value={fuelForm.data.odometer_km} onChange={(e) => fuelForm.setData('odometer_km', e.target.value)} />
                            <InputError message={fuelForm.errors.odometer_km} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowFuelModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={fuelForm.processing}>Save</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                title="Delete Vehicle"
                message={`Are you sure you want to delete "${vehicle.name}" (${vehicle.plate_number})? This action cannot be undone.`}
            />
        </DynamicLayout>
    );
}
