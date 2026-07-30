import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import ShuttleNav from '../ShuttleNav';

interface DepartureOption {
    id: number;
    label: string;
    unit_fare: string | number | null;
    seats_remaining: number;
}

interface Props {
    departures: DepartureOption[];
    partners: Array<{ id: number; name: string; code: string }>;
}

type Passenger = { name: string; phone: string; id_number: string };

export default function Create({ departures, partners }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        departure_id: departures[0] ? String(departures[0].id) : '',
        partner_id: partners[0] ? String(partners[0].id) : '',
        passenger_count: 1,
        pickup_mode: 'pool',
        dropoff_mode: 'pool',
        pickup_address: '',
        pickup_lat: '',
        pickup_lng: '',
        dropoff_address: '',
        dropoff_lat: '',
        dropoff_lng: '',
        notes: '',
        passengers: [{ name: '', phone: '', id_number: '' }] as Passenger[],
    });

    const setPassengerCount = (count: number) => {
        const next = Math.max(1, count);
        const passengers = [...data.passengers];
        while (passengers.length < next) {
            passengers.push({ name: '', phone: '', id_number: '' });
        }
        while (passengers.length > next) {
            passengers.pop();
        }
        setData({ ...data, passenger_count: next, passengers });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('shuttle.bookings.store'));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.bookings.create')}</h2>}>
            <Head title={t('shuttle.bookings.create')} />
            <ShuttleNav active="bookings" />
            <form onSubmit={submit} className="space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <div>
                            <InputLabel value={t('shuttle.bookings.departure')} />
                            <Select
                                className="mt-1 w-full"
                                value={data.departure_id}
                                onChange={(v) => setData('departure_id', v)}
                                options={departures.map((d) => ({ value: String(d.id), label: d.label }))}
                            />
                            <InputError message={errors.departure_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value={t('shuttle.bookings.partner')} />
                            <Select
                                className="mt-1 w-full"
                                value={data.partner_id}
                                onChange={(v) => setData('partner_id', v)}
                                options={partners.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` }))}
                            />
                            <InputError message={errors.partner_id} className="mt-1" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value={t('shuttle.bookings.passenger_count')} />
                                <TextInput
                                    type="number"
                                    min={1}
                                    className="mt-1 w-full"
                                    value={data.passenger_count}
                                    onChange={(e) => setPassengerCount(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.bookings.pickup_mode')} />
                                <Select
                                    className="mt-1 w-full"
                                    value={data.pickup_mode}
                                    onChange={(v) => setData('pickup_mode', v)}
                                    options={[
                                        { value: 'pool', label: t('shuttle.bookings.pool') },
                                        { value: 'door', label: t('shuttle.bookings.door') },
                                    ]}
                                />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.bookings.dropoff_mode')} />
                                <Select
                                    className="mt-1 w-full"
                                    value={data.dropoff_mode}
                                    onChange={(v) => setData('dropoff_mode', v)}
                                    options={[
                                        { value: 'pool', label: t('shuttle.bookings.pool') },
                                        { value: 'door', label: t('shuttle.bookings.door') },
                                    ]}
                                />
                            </div>
                        </div>

                        {data.pickup_mode === 'door' && (
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="sm:col-span-3">
                                    <InputLabel value="Pickup address" />
                                    <TextInput className="mt-1 w-full" value={data.pickup_address} onChange={(e) => setData('pickup_address', e.target.value)} />
                                    <InputError message={errors.pickup_address} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Lat" />
                                    <TextInput className="mt-1 w-full" value={data.pickup_lat} onChange={(e) => setData('pickup_lat', e.target.value)} />
                                </div>
                                <div>
                                    <InputLabel value="Lng" />
                                    <TextInput className="mt-1 w-full" value={data.pickup_lng} onChange={(e) => setData('pickup_lng', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {data.dropoff_mode === 'door' && (
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="sm:col-span-3">
                                    <InputLabel value="Dropoff address" />
                                    <TextInput className="mt-1 w-full" value={data.dropoff_address} onChange={(e) => setData('dropoff_address', e.target.value)} />
                                    <InputError message={errors.dropoff_address} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Lat" />
                                    <TextInput className="mt-1 w-full" value={data.dropoff_lat} onChange={(e) => setData('dropoff_lat', e.target.value)} />
                                </div>
                                <div>
                                    <InputLabel value="Lng" />
                                    <TextInput className="mt-1 w-full" value={data.dropoff_lng} onChange={(e) => setData('dropoff_lng', e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <InputLabel value={t('shuttle.bookings.passengers')} />
                            {data.passengers.map((p, index) => (
                                <div key={index} className="grid gap-2 sm:grid-cols-3">
                                    <TextInput
                                        placeholder="Name"
                                        value={p.name}
                                        onChange={(e) => {
                                            const passengers = [...data.passengers];
                                            passengers[index] = { ...passengers[index], name: e.target.value };
                                            setData('passengers', passengers);
                                        }}
                                    />
                                    <TextInput
                                        placeholder="Phone"
                                        value={p.phone}
                                        onChange={(e) => {
                                            const passengers = [...data.passengers];
                                            passengers[index] = { ...passengers[index], phone: e.target.value };
                                            setData('passengers', passengers);
                                        }}
                                    />
                                    <TextInput
                                        placeholder="ID number"
                                        value={p.id_number}
                                        onChange={(e) => {
                                            const passengers = [...data.passengers];
                                            passengers[index] = { ...passengers[index], id_number: e.target.value };
                                            setData('passengers', passengers);
                                        }}
                                    />
                                </div>
                            ))}
                            <InputError message={errors.passengers} className="mt-1" />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Link href={prefixedRoute('shuttle.bookings.index')} className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                {t('common.cancel')}
                            </Link>
                            <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                        </div>
                    </form>
        </DynamicLayout>
    );
}
