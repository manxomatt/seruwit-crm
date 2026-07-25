import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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

const VEHICLE_STATUSES = ['active', 'maintenance', 'retired', 'out_of_service'] as const;

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        plate_number: '',
        type: 'car',
        brand: '',
        model_year: '',
        capacity: '',
        capacity_kg: '',
        cost_per_km: '',
        tank_capacity_liters: '',
        expected_km_per_liter: '',
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
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('fleet.vehicles.add')}</h2>}
        >
            <Head title={t('fleet.vehicles.add')} />

            <FleetNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value={t('fleet.vehicles.name')} />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="plate_number" value={t('fleet.vehicles.plate')} />
                                <TextInput id="plate_number" className="mt-1 block w-full" value={data.plate_number} onChange={(e) => setData('plate_number', e.target.value)} required />
                                <InputError message={errors.plate_number} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="type" value={t('fleet.vehicles.type')} />
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
                                <InputLabel htmlFor="fuel_type" value={t('fleet.vehicles.fuel_type')} />
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
                                <InputLabel htmlFor="brand" value={t('fleet.vehicles.brand')} />
                                <TextInput id="brand" className="mt-1 block w-full" value={data.brand} onChange={(e) => setData('brand', e.target.value)} />
                                <InputError message={errors.brand} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="model_year" value={t('fleet.vehicles.model_year')} />
                                <TextInput id="model_year" type="number" className="mt-1 block w-full" value={data.model_year} onChange={(e) => setData('model_year', e.target.value)} />
                                <InputError message={errors.model_year} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="capacity" value={t('fleet.vehicles.capacity')} />
                                <TextInput id="capacity" placeholder="e.g. 1200 kg or 12 seats" className="mt-1 block w-full" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} />
                                <InputError message={errors.capacity} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="capacity_kg" value={t('fleet.vehicles.capacity_kg')} />
                                <TextInput id="capacity_kg" type="number" step="0.01" min={0} className="mt-1 block w-full" value={data.capacity_kg} onChange={(e) => setData('capacity_kg', e.target.value)} />
                                <InputError message={errors.capacity_kg} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="cost_per_km" value={t('fleet.vehicles.cost_per_km')} />
                                <TextInput id="cost_per_km" type="number" step="0.01" min={0} className="mt-1 block w-full" value={data.cost_per_km} onChange={(e) => setData('cost_per_km', e.target.value)} />
                                <InputError message={errors.cost_per_km} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="tank_capacity_liters" value={t('fleet.vehicles.tank_capacity')} />
                                <TextInput id="tank_capacity_liters" type="number" step="0.01" min={0} className="mt-1 block w-full" value={data.tank_capacity_liters} onChange={(e) => setData('tank_capacity_liters', e.target.value)} />
                                <InputError message={errors.tank_capacity_liters} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="expected_km_per_liter" value={t('fleet.vehicles.expected_kml')} />
                                <TextInput id="expected_km_per_liter" type="number" step="0.01" min={0} className="mt-1 block w-full" value={data.expected_km_per_liter} onChange={(e) => setData('expected_km_per_liter', e.target.value)} />
                                <InputError message={errors.expected_km_per_liter} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="odometer_km" value={t('fleet.vehicles.odometer')} />
                                <TextInput id="odometer_km" type="number" min={0} className="mt-1 block w-full" value={data.odometer_km} onChange={(e) => setData('odometer_km', parseInt(e.target.value) || 0)} />
                                <InputError message={errors.odometer_km} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value={t('fleet.vehicles.status')} />
                                <Select
                                    id="status"
                                    className="mt-1"
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    options={VEHICLE_STATUSES.map((status) => ({
                                        value: status,
                                        label: t(`fleet.status.${status}`),
                                    }))}
                                />
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="stnk_expires_at" value={t('fleet.vehicles.stnk_expires')} />
                                <TextInput id="stnk_expires_at" type="date" className="mt-1 block w-full" value={data.stnk_expires_at} onChange={(e) => setData('stnk_expires_at', e.target.value)} />
                                <InputError message={errors.stnk_expires_at} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="kir_expires_at" value={t('fleet.vehicles.kir_expires')} />
                                <TextInput id="kir_expires_at" type="date" className="mt-1 block w-full" value={data.kir_expires_at} onChange={(e) => setData('kir_expires_at', e.target.value)} />
                                <InputError message={errors.kir_expires_at} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('fleet.vehicles.photo')} />
                            <ImageUploader value={data.photo_url} onChange={(value) => setData('photo_url', value)} className="mt-1" />
                            <InputError message={errors.photo_url} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value={t('fleet.vehicles.notes')} />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('fleet.vehicles.create')}</PrimaryButton>
                            <Link href={prefixedRoute('fleet.vehicles.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
