import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import TransportationNav from '../../../../TransportationNav';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    status: string;
}

interface Driver {
    id: number;
    name: string;
    license_number: string;
    status: string;
}

interface Customer {
    id: number;
    code: string;
    name: string;
}

interface Props {
    vehicles: Vehicle[];
    drivers: Driver[];
    customers: Customer[];
}

export default function Create({ vehicles, drivers, customers }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        vehicle_id: '',
        driver_id: '',
        customer_id: '',
        origin: '',
        destination: '',
        cargo_notes: '',
        scheduled_at: '',
        distance_km: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('transportation.trips.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dispatch Trip</h2>}
        >
            <Head title="Dispatch Trip" />

            <TransportationNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="vehicle_id" value="Vehicle" />
                                <Select
                                    id="vehicle_id"
                                    className="mt-1"
                                    value={data.vehicle_id}
                                    onChange={(value) => setData('vehicle_id', value)}
                                    placeholder="Select a vehicle"
                                    options={vehicles.map((vehicle) => ({
                                        value: String(vehicle.id),
                                        label: `${vehicle.name} (${vehicle.plate_number})${vehicle.status !== 'active' ? ` — ${vehicle.status.replace('_', ' ')}` : ''}`,
                                        disabled: vehicle.status !== 'active',
                                    }))}
                                />
                                <InputError message={errors.vehicle_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="driver_id" value="Driver" />
                                <Select
                                    id="driver_id"
                                    className="mt-1"
                                    value={data.driver_id}
                                    onChange={(value) => setData('driver_id', value)}
                                    placeholder="Select a driver"
                                    options={drivers.map((driver) => ({
                                        value: String(driver.id),
                                        label: `${driver.name} (${driver.license_number})${driver.status !== 'available' ? ` — ${driver.status.replace('_', ' ')}` : ''}`,
                                        disabled: driver.status !== 'available',
                                    }))}
                                />
                                <InputError message={errors.driver_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="customer_id" value="Customer" />
                                <Select
                                    id="customer_id"
                                    className="mt-1"
                                    value={data.customer_id}
                                    onChange={(value) => setData('customer_id', value)}
                                    placeholder="Select a customer"
                                    options={customers.map((customer) => ({
                                        value: String(customer.id),
                                        label: `${customer.name} (${customer.code})`,
                                    }))}
                                />
                                <InputError message={errors.customer_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="origin" value="Origin" />
                                <TextInput id="origin" className="mt-1 block w-full" value={data.origin} onChange={(e) => setData('origin', e.target.value)} required />
                                <InputError message={errors.origin} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="destination" value="Destination" />
                                <TextInput id="destination" className="mt-1 block w-full" value={data.destination} onChange={(e) => setData('destination', e.target.value)} required />
                                <InputError message={errors.destination} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="scheduled_at" value="Scheduled At" />
                                <TextInput id="scheduled_at" type="datetime-local" className="mt-1 block w-full" value={data.scheduled_at} onChange={(e) => setData('scheduled_at', e.target.value)} required />
                                <InputError message={errors.scheduled_at} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="distance_km" value="Distance (km, optional)" />
                                <TextInput id="distance_km" type="number" min={0} step="0.01" className="mt-1 block w-full" value={data.distance_km} onChange={(e) => setData('distance_km', e.target.value)} />
                                <InputError message={errors.distance_km} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="cargo_notes" value="Cargo Notes (optional)" />
                            <textarea id="cargo_notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.cargo_notes} onChange={(e) => setData('cargo_notes', e.target.value)} />
                            <InputError message={errors.cargo_notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Dispatch Trip</PrimaryButton>
                            <Link href={prefixedRoute('transportation.trips.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
