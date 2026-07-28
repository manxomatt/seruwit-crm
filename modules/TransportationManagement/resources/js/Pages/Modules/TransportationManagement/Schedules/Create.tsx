import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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

interface Partner {
    id: number;
    code: string;
    name: string;
}

interface Props {
    vehicles: Vehicle[];
    drivers: Driver[];
    partners: Partner[];
}

const DAYS = [
    { value: 1, key: 'mon' },
    { value: 2, key: 'tue' },
    { value: 3, key: 'wed' },
    { value: 4, key: 'thu' },
    { value: 5, key: 'fri' },
    { value: 6, key: 'sat' },
    { value: 0, key: 'sun' },
] as const;

export default function Create({ vehicles, drivers, partners }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        vehicle_id: '',
        driver_id: '',
        partner_id: '',
        origin: '',
        destination: '',
        cargo_notes: '',
        distance_km: '',
        days_of_week: [] as number[],
        time_of_day: '08:00',
        duration_minutes: '480',
        starts_on: new Date().toISOString().slice(0, 10),
        ends_on: '',
        is_active: true,
    });

    const toggleDay = (day: number) => {
        setData('days_of_week', data.days_of_week.includes(day)
            ? data.days_of_week.filter((d) => d !== day)
            : [...data.days_of_week, day]);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('transportation.schedules.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('transportation.pages.schedules.create')}</h2>}
        >
            <Head title={t('transportation.pages.schedules.create')} />

            <TransportationNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="vehicle_id" value={t('transportation.fields.vehicle')} />
                                <Select
                                    id="vehicle_id"
                                    className="mt-1"
                                    value={data.vehicle_id}
                                    onChange={(value) => setData('vehicle_id', value)}
                                    placeholder={t('transportation.placeholders.select_vehicle')}
                                    options={vehicles.map((vehicle) => ({ value: String(vehicle.id), label: `${vehicle.name} (${vehicle.plate_number})` }))}
                                />
                                <InputError message={errors.vehicle_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="driver_id" value={t('transportation.fields.driver')} />
                                <Select
                                    id="driver_id"
                                    className="mt-1"
                                    value={data.driver_id}
                                    onChange={(value) => setData('driver_id', value)}
                                    placeholder={t('transportation.placeholders.select_driver')}
                                    options={drivers.map((driver) => ({ value: String(driver.id), label: `${driver.name} (${driver.license_number})` }))}
                                />
                                <InputError message={errors.driver_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="partner_id" value={t('transportation.fields.partner')} />
                                <Select
                                    id="partner_id"
                                    className="mt-1"
                                    value={data.partner_id}
                                    onChange={(value) => setData('partner_id', value)}
                                    placeholder={t('transportation.placeholders.select_partner')}
                                    options={partners.map((partner) => ({ value: String(partner.id), label: `${partner.name} (${partner.code})` }))}
                                />
                                <InputError message={errors.partner_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="origin" value={t('transportation.fields.origin')} />
                                <TextInput id="origin" className="mt-1 block w-full" value={data.origin} onChange={(e) => setData('origin', e.target.value)} required />
                                <InputError message={errors.origin} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="destination" value={t('transportation.fields.destination')} />
                                <TextInput id="destination" className="mt-1 block w-full" value={data.destination} onChange={(e) => setData('destination', e.target.value)} required />
                                <InputError message={errors.destination} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="time_of_day" value={t('transportation.fields.time_of_day')} />
                                <TextInput id="time_of_day" type="time" className="mt-1 block w-full" value={data.time_of_day} onChange={(e) => setData('time_of_day', e.target.value)} required />
                                <InputError message={errors.time_of_day} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="duration_minutes" value={t('transportation.fields.duration_minutes')} />
                                <TextInput id="duration_minutes" type="number" min={15} step={15} className="mt-1 block w-full" value={data.duration_minutes} onChange={(e) => setData('duration_minutes', e.target.value)} required />
                                <p className="mt-1 text-xs text-gray-500">{t('transportation.hints.duration_minutes')}</p>
                                <InputError message={errors.duration_minutes} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="distance_km" value={`${t('transportation.fields.distance_km')} (optional)`} />
                                <TextInput id="distance_km" type="number" min={0} step="0.01" className="mt-1 block w-full" value={data.distance_km} onChange={(e) => setData('distance_km', e.target.value)} />
                                <InputError message={errors.distance_km} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="starts_on" value={t('transportation.fields.starts_on')} />
                                <TextInput id="starts_on" type="date" className="mt-1 block w-full" value={data.starts_on} onChange={(e) => setData('starts_on', e.target.value)} required />
                                <InputError message={errors.starts_on} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="ends_on" value={`${t('transportation.fields.ends_on')} (optional)`} />
                                <TextInput id="ends_on" type="date" className="mt-1 block w-full" value={data.ends_on} onChange={(e) => setData('ends_on', e.target.value)} />
                                <InputError message={errors.ends_on} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('transportation.fields.days_of_week')} />
                            <div className="mt-2 flex flex-wrap gap-2">
                                {DAYS.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                                            data.days_of_week.includes(day.value)
                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {t(`transportation.days.${day.key}`)}
                                    </button>
                                ))}
                            </div>
                            <InputError message={errors.days_of_week} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="cargo_notes" value={`${t('transportation.fields.cargo_notes')} (optional)`} />
                            <textarea id="cargo_notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.cargo_notes} onChange={(e) => setData('cargo_notes', e.target.value)} />
                            <InputError message={errors.cargo_notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('transportation.actions.add_schedule')}</PrimaryButton>
                            <Link href={prefixedRoute('transportation.schedules.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
