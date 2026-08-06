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
import { toDateInputValue } from '@/utils/date';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, type ReactNode } from 'react';
import FleetNav from '../../../../FleetNav';

const VEHICLE_STATUSES = ['active', 'maintenance', 'retired', 'out_of_service'] as const;
const VEHICLE_TYPES = ['car', 'truck', 'van', 'motorcycle', 'bus'] as const;
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
const RENTAL_CLASSES = ['economy', 'mpv', 'suv', 'premium', 'other'] as const;

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    rental_class: string | null;
    brand: string | null;
    model_year: number | null;
    color: string | null;
    capacity: string | null;
    capacity_kg: string | number | null;
    capacity_seats: number | null;
    cost_per_km: string | number | null;
    tank_capacity_liters: string | number | null;
    expected_km_per_liter: string | number | null;
    fuel_type: string;
    status: string;
    odometer_km: number;
    stnk_expires_at: string | null;
    kir_expires_at: string | null;
    photo_url: string | null;
    notes: string | null;
    home_base_id: number | null;
}

interface HomeBaseOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    vehicle: Vehicle;
    bases?: HomeBaseOption[];
}

function FormSection({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700 sm:px-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
        </section>
    );
}

export default function Edit({ vehicle, bases = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        name: vehicle.name,
        plate_number: vehicle.plate_number,
        type: vehicle.type,
        rental_class: vehicle.rental_class || '',
        brand: vehicle.brand || '',
        model_year: vehicle.model_year ?? '',
        color: vehicle.color || '',
        capacity: vehicle.capacity || '',
        capacity_kg: vehicle.capacity_kg ?? '',
        capacity_seats: vehicle.capacity_seats ?? '',
        cost_per_km: vehicle.cost_per_km ?? '',
        tank_capacity_liters: vehicle.tank_capacity_liters ?? '',
        expected_km_per_liter: vehicle.expected_km_per_liter ?? '',
        fuel_type: vehicle.fuel_type,
        status: vehicle.status,
        home_base_id: vehicle.home_base_id ? String(vehicle.home_base_id) : '',
        odometer_km: vehicle.odometer_km,
        stnk_expires_at: toDateInputValue(vehicle.stnk_expires_at),
        kir_expires_at: toDateInputValue(vehicle.kir_expires_at),
        photo_url: vehicle.photo_url || '',
        notes: vehicle.notes || '',
    });

    const displayName = data.name.trim() || t('fleet.vehicles.preview_untitled');
    const displayPlate = data.plate_number.trim() || t('fleet.vehicles.preview_no_plate');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('fleet.vehicles.update', vehicle.id));
    };

    const textareaClass =
        'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('fleet.vehicles.title')}
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-100">
                            {t('fleet.vehicles.edit')}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('fleet.vehicles.show', vehicle.id)}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" form="fleet-vehicle-edit-form" disabled={processing}>
                            {processing ? t('fleet.vehicles.saving') : t('fleet.vehicles.save')}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title={t('fleet.vehicles.edit')} />
            <FleetNav />

            <form id="fleet-vehicle-edit-form" onSubmit={submit} className="space-y-6">
                <div className="space-y-6">
                    <FormSection
                        title={t('fleet.vehicles.sections.identity')}
                        subtitle={t('fleet.vehicles.sections.identity_hint')}
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value={t('fleet.vehicles.name')} />
                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="Avanza Putih 01"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="plate_number" value={t('fleet.vehicles.plate')} />
                                <TextInput
                                    id="plate_number"
                                    className="mt-1 block w-full font-mono uppercase"
                                    value={data.plate_number}
                                    onChange={(e) => setData('plate_number', e.target.value.toUpperCase())}
                                    required
                                    placeholder="B 1234 XYZ"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('fleet.vehicles.plate_hint')}</p>
                                <InputError message={errors.plate_number} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('fleet.vehicles.type')} />
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {VEHICLE_TYPES.map((type) => {
                                    const active = data.type === type;

                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setData('type', type)}
                                            className={`rounded-xl border px-4 py-3 text-left transition ${
                                                active
                                                    ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200 dark:border-sky-700 dark:bg-sky-950/40 dark:ring-sky-800'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700/60'
                                            }`}
                                        >
                                            <p className={`text-sm font-semibold ${active ? 'text-sky-900 dark:text-sky-100' : 'text-gray-900 dark:text-white'}`}>
                                                {t(`fleet.vehicles.types.${type}`)}
                                            </p>
                                            <p className={`mt-0.5 text-xs ${active ? 'text-sky-700 dark:text-sky-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {t(`fleet.vehicles.type_hints.${type}`)}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={errors.type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="rental_class" value={t('fleet.vehicles.rental_class')} />
                            <Select
                                id="rental_class"
                                className="mt-1"
                                value={data.rental_class}
                                onChange={(value) => setData('rental_class', value)}
                                placeholder={t('fleet.vehicles.rental_class_none')}
                                options={[
                                    { value: '', label: t('fleet.vehicles.rental_class_none') },
                                    ...RENTAL_CLASSES.map((rentalClass) => ({
                                        value: rentalClass,
                                        label: t(`fleet.rental_class.${rentalClass}`),
                                    })),
                                ]}
                            />
                            <InputError message={errors.rental_class} className="mt-2" />
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('fleet.vehicles.sections.specs')}
                        subtitle={t('fleet.vehicles.sections.specs_hint')}
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                                <InputLabel htmlFor="color" value={t('fleet.vehicles.color')} />
                                <TextInput id="color" className="mt-1 block w-full" value={data.color} onChange={(e) => setData('color', e.target.value)} />
                                <InputError message={errors.color} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="capacity" value={t('fleet.vehicles.capacity')} />
                                <TextInput
                                    id="capacity"
                                    placeholder="e.g. 1200 kg or 12 seats"
                                    className="mt-1 block w-full"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', e.target.value)}
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('fleet.vehicles.capacity_label_hint')}</p>
                                <InputError message={errors.capacity} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="capacity_kg" value={t('fleet.vehicles.capacity_kg')} />
                                <TextInput id="capacity_kg" type="number" step="0.01" min={0} className="mt-1 block w-full" value={data.capacity_kg} onChange={(e) => setData('capacity_kg', e.target.value)} />
                                <InputError message={errors.capacity_kg} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="capacity_seats" value={t('fleet.vehicles.capacity_seats')} />
                                <TextInput id="capacity_seats" type="number" min={1} max={100} className="mt-1 block w-full" value={data.capacity_seats} onChange={(e) => setData('capacity_seats', e.target.value)} />
                                <InputError message={errors.capacity_seats} className="mt-2" />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('fleet.vehicles.sections.fuel')}
                        subtitle={t('fleet.vehicles.sections.fuel_hint')}
                    >
                        <div>
                            <InputLabel value={t('fleet.vehicles.fuel_type')} />
                            <div className="mt-2 flex flex-wrap gap-2">
                                {FUEL_TYPES.map((fuelType) => {
                                    const active = data.fuel_type === fuelType;

                                    return (
                                        <button
                                            key={fuelType}
                                            type="button"
                                            onClick={() => setData('fuel_type', fuelType)}
                                            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                                                active
                                                    ? 'bg-sky-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {t(`fleet.vehicles.fuel_types.${fuelType}`)}
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={errors.fuel_type} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                                <InputLabel htmlFor="cost_per_km" value={t('fleet.vehicles.cost_per_km')} />
                                <TextInput id="cost_per_km" type="number" step="0.01" min={0} className="mt-1 block w-full" value={data.cost_per_km} onChange={(e) => setData('cost_per_km', e.target.value)} />
                                <InputError message={errors.cost_per_km} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="odometer_km" value={t('fleet.vehicles.odometer')} />
                                <TextInput
                                    id="odometer_km"
                                    type="number"
                                    min={0}
                                    className="mt-1 block w-full"
                                    value={data.odometer_km}
                                    onChange={(e) => setData('odometer_km', parseInt(e.target.value) || 0)}
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('fleet.vehicles.odometer_hint')}</p>
                                <InputError message={errors.odometer_km} className="mt-2" />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('fleet.vehicles.sections.assignment')}
                        subtitle={t('fleet.vehicles.sections.assignment_hint')}
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                                <InputLabel htmlFor="home_base_id" value={t('fleet.vehicles.home_base')} />
                                <Select
                                    id="home_base_id"
                                    className="mt-1"
                                    value={data.home_base_id}
                                    onChange={(value) => setData('home_base_id', value)}
                                    placeholder={t('fleet.vehicles.home_base_none')}
                                    options={[
                                        { value: '', label: t('fleet.vehicles.home_base_none') },
                                        ...bases.map((base) => ({
                                            value: String(base.id),
                                            label: `${base.code} — ${base.name}`,
                                        })),
                                    ]}
                                />
                                <InputError message={errors.home_base_id} className="mt-2" />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('fleet.vehicles.sections.compliance')}
                        subtitle={t('fleet.vehicles.sections.compliance_hint')}
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    </FormSection>

                    <FormSection
                        title={t('fleet.vehicles.sections.photo')}
                        subtitle={t('fleet.vehicles.sections.photo_hint')}
                    >
                        <ImageUploader value={data.photo_url} onChange={(value) => setData('photo_url', value)} />
                        <InputError message={errors.photo_url} className="mt-2" />
                    </FormSection>

                    <FormSection
                        title={t('fleet.vehicles.sections.notes')}
                        subtitle={t('fleet.vehicles.sections.notes_hint')}
                    >
                        <div>
                            <InputLabel htmlFor="notes" value={t('fleet.vehicles.notes')} />
                            <textarea
                                id="notes"
                                rows={3}
                                className={textareaClass}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>
                    </FormSection>
                </div>

                <div className="sticky bottom-4 z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
                        <p className="min-w-0 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-800 dark:text-gray-100">{displayName}</span>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                            <span className="font-mono text-xs">{displayPlate}</span>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                            <span>{t(`fleet.vehicles.types.${data.type}`, undefined, data.type)}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link href={prefixedRoute('fleet.vehicles.show', vehicle.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? t('fleet.vehicles.saving') : t('fleet.vehicles.save')}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}
