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
import PageHeader from '@/Components/PageHeader';

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
        scheduled_at: '',
        scheduled_end_at: '',
        distance_km: '',
    });

    const toLocalInput = (date: Date): string => {
        const pad = (n: number) => String(n).padStart(2, '0');

        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const setScheduledStart = (value: string): void => {
        const next: Partial<typeof data> = { scheduled_at: value };

        if (value && !data.scheduled_end_at) {
            const end = new Date(value);
            if (!Number.isNaN(end.getTime())) {
                end.setHours(end.getHours() + 8);
                next.scheduled_end_at = toLocalInput(end);
            }
        }

        setData({ ...data, ...next });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('transportation.trips.store'));
    };

    return (
        <DynamicLayout
            header={<PageHeader title={t('transportation.pages.trips.create')} />}
        >
            <Head title={t('transportation.pages.trips.create')} />

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
                                    options={vehicles.map((vehicle) => ({
                                        value: String(vehicle.id),
                                        label: `${vehicle.name} (${vehicle.plate_number})${vehicle.status !== 'active' ? ` — ${t(`transportation.status.${vehicle.status}`, undefined, vehicle.status)}` : ''}`,
                                        disabled: vehicle.status !== 'active',
                                    }))}
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
                                    options={drivers.map((driver) => ({
                                        value: String(driver.id),
                                        label: `${driver.name} (${driver.license_number})${driver.status !== 'available' ? ` — ${driver.status.replace('_', ' ')}` : ''}`,
                                        disabled: driver.status !== 'available',
                                    }))}
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
                                    options={partners.map((partner) => ({
                                        value: String(partner.id),
                                        label: `${partner.name} (${partner.code})`,
                                    }))}
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
                                <InputLabel htmlFor="scheduled_at" value={t('transportation.fields.scheduled_at')} />
                                <TextInput id="scheduled_at" type="datetime-local" className="mt-1 block w-full" value={data.scheduled_at} onChange={(e) => setScheduledStart(e.target.value)} required />
                                <InputError message={errors.scheduled_at} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="scheduled_end_at" value={t('transportation.fields.scheduled_end_at')} />
                                <TextInput id="scheduled_end_at" type="datetime-local" className="mt-1 block w-full" value={data.scheduled_end_at} onChange={(e) => setData('scheduled_end_at', e.target.value)} required />
                                <p className="mt-1 text-xs text-gray-500">{t('transportation.hints.scheduled_window')}</p>
                                <InputError message={errors.scheduled_end_at} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="distance_km" value={`${t('transportation.fields.distance_km')} (optional)`} />
                                <TextInput id="distance_km" type="number" min={0} step="0.01" className="mt-1 block w-full" value={data.distance_km} onChange={(e) => setData('distance_km', e.target.value)} />
                                <InputError message={errors.distance_km} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="cargo_notes" value={`${t('transportation.fields.cargo_notes')} (optional)`} />
                            <textarea id="cargo_notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.cargo_notes} onChange={(e) => setData('cargo_notes', e.target.value)} />
                            <InputError message={errors.cargo_notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('transportation.actions.dispatch')}</PrimaryButton>
                            <Link href={prefixedRoute('transportation.trips.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
