import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import { formatCoordinate, formatSpeedKph } from '@/utils/geo';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import TrackingNav from '../../../../TrackingNav';

interface Device {
    id: number;
    name: string;
    unique_id: string;
    status: string | null;
    last_latitude: string | null;
    last_longitude: string | null;
    last_speed_kph: string | null;
    last_recorded_at: string | null;
    vehicle: { id: number; name: string; plate_number: string } | null;
}

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    odometer_km: number;
}

interface Props {
    devices: Device[];
    pairableVehicles: Vehicle[];
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ devices, pairableVehicles, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [pairing, setPairing] = useState<Device | null>(null);

    const form = useForm({ vehicle_id: '' });

    const sync = () => {
        router.post(prefixedRoute('tracking.devices.sync'), {}, { preserveScroll: true });
    };

    const submitPair: FormEventHandler = (e) => {
        e.preventDefault();
        if (!pairing) return;

        form.patch(prefixedRoute('tracking.devices.pair', pairing.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPairing(null);
                form.reset();
            },
        });
    };

    const unpair = (device: Device) => {
        router.delete(prefixedRoute('tracking.devices.unpair', device.id), { preserveScroll: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Tracking</h2>
                    {can.create && <PrimaryButton onClick={sync}>Sync from Traccar</PrimaryButton>}
                </div>
            }
        >
            <Head title="GPS Devices" />

            <TrackingNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {devices.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">No devices yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Use “Sync from Traccar” to import the trackers on your account.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Device</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">IMEI</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vehicle</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Fix</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {devices.map((device) => (
                                        <tr key={device.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{device.name}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{device.unique_id}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {device.vehicle ? `${device.vehicle.name} (${device.vehicle.plate_number})` : (
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                        belum ter-pair
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {device.last_latitude && device.last_longitude ? (
                                                    <>
                                                        {formatCoordinate(device.last_latitude, device.last_longitude)}
                                                        <span className="block text-xs text-gray-400">
                                                            {formatSpeedKph(device.last_speed_kph)} — {device.last_recorded_at}
                                                        </span>
                                                    </>
                                                ) : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {device.status ?? 'unknown'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    {can.update && !device.vehicle && (
                                                        <button onClick={() => setPairing(device)} className="text-indigo-600 hover:text-indigo-900">
                                                            Pair
                                                        </button>
                                                    )}
                                                    {can.update && device.vehicle && (
                                                        <button onClick={() => unpair(device)} className="text-amber-600 hover:text-amber-900">
                                                            Unpair
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Modal show={pairing !== null} onClose={() => setPairing(null)} maxWidth="md">
                <form onSubmit={submitPair} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Pair {pairing?.name}</h3>

                    {pairableVehicles.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Every vehicle already has a tracker. Unpair one first.
                        </p>
                    ) : (
                        <div>
                            <InputLabel htmlFor="vehicle_id" value="Vehicle" />
                            <Select
                                id="vehicle_id"
                                className="mt-1"
                                value={form.data.vehicle_id}
                                onChange={(value) => form.setData('vehicle_id', value)}
                                placeholder="Select a vehicle"
                                options={pairableVehicles.map((vehicle) => ({
                                    value: String(vehicle.id),
                                    label: `${vehicle.name} (${vehicle.plate_number}) — ${vehicle.odometer_km.toLocaleString('id-ID')} km`,
                                }))}
                            />
                            <InputError message={form.errors.vehicle_id} className="mt-2" />
                            <p className="mt-3 text-xs text-gray-500">
                                The vehicle's current odometer becomes the baseline; GPS kilometres are added on top of it.
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setPairing(null)}>Cancel</SecondaryButton>
                        {pairableVehicles.length > 0 && <PrimaryButton disabled={form.processing}>Pair</PrimaryButton>}
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
