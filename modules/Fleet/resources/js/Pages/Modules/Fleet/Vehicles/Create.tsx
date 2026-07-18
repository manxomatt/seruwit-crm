import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        plate_number: '',
        type: 'car',
        brand: '',
        model_year: '',
        capacity: '',
        fuel_type: 'petrol',
        status: 'active',
        odometer_km: 0,
        stnk_expires_at: '',
        kir_expires_at: '',
        photo_url: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('fleet.vehicles.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Add Vehicle</h2>}
        >
            <Head title="Add Vehicle" />

            <FleetNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value="Name" />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="plate_number" value="Plate Number" />
                                <TextInput id="plate_number" className="mt-1 block w-full" value={data.plate_number} onChange={(e) => setData('plate_number', e.target.value)} required />
                                <InputError message={errors.plate_number} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="type" value="Type" />
                                <Select
                                    id="type"
                                    className="mt-1"
                                    value={data.type}
                                    onChange={(value) => setData('type', value)}
                                    options={[
                                        { value: 'car', label: 'Car' },
                                        { value: 'truck', label: 'Truck' },
                                        { value: 'van', label: 'Van' },
                                        { value: 'motorcycle', label: 'Motorcycle' },
                                        { value: 'bus', label: 'Bus' },
                                    ]}
                                />
                                <InputError message={errors.type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="fuel_type" value="Fuel Type" />
                                <Select
                                    id="fuel_type"
                                    className="mt-1"
                                    value={data.fuel_type}
                                    onChange={(value) => setData('fuel_type', value)}
                                    options={[
                                        { value: 'petrol', label: 'Petrol' },
                                        { value: 'diesel', label: 'Diesel' },
                                        { value: 'electric', label: 'Electric' },
                                        { value: 'hybrid', label: 'Hybrid' },
                                    ]}
                                />
                                <InputError message={errors.fuel_type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="brand" value="Brand (optional)" />
                                <TextInput id="brand" className="mt-1 block w-full" value={data.brand} onChange={(e) => setData('brand', e.target.value)} />
                                <InputError message={errors.brand} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="model_year" value="Model Year (optional)" />
                                <TextInput id="model_year" type="number" className="mt-1 block w-full" value={data.model_year} onChange={(e) => setData('model_year', e.target.value)} />
                                <InputError message={errors.model_year} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="capacity" value="Capacity (optional)" />
                                <TextInput id="capacity" placeholder="e.g. 1200 kg or 12 seats" className="mt-1 block w-full" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} />
                                <InputError message={errors.capacity} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="odometer_km" value="Odometer (km)" />
                                <TextInput id="odometer_km" type="number" min={0} className="mt-1 block w-full" value={data.odometer_km} onChange={(e) => setData('odometer_km', parseInt(e.target.value) || 0)} />
                                <InputError message={errors.odometer_km} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <Select
                                    id="status"
                                    className="mt-1"
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'maintenance', label: 'Maintenance' },
                                        { value: 'retired', label: 'Retired' },
                                        { value: 'out_of_service', label: 'Out of Service' },
                                    ]}
                                />
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="stnk_expires_at" value="STNK Expiry (optional)" />
                                <TextInput id="stnk_expires_at" type="date" className="mt-1 block w-full" value={data.stnk_expires_at} onChange={(e) => setData('stnk_expires_at', e.target.value)} />
                                <InputError message={errors.stnk_expires_at} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="kir_expires_at" value="KIR Expiry (optional)" />
                                <TextInput id="kir_expires_at" type="date" className="mt-1 block w-full" value={data.kir_expires_at} onChange={(e) => setData('kir_expires_at', e.target.value)} />
                                <InputError message={errors.kir_expires_at} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Photo (optional)" />
                            <ImageUploader value={data.photo_url} onChange={(value) => setData('photo_url', value)} className="mt-1" />
                            <InputError message={errors.photo_url} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Notes (optional)" />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Add Vehicle</PrimaryButton>
                            <Link href={prefixedRoute('fleet.vehicles.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
