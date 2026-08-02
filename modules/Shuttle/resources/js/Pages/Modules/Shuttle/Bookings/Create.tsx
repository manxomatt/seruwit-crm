import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import ShuttleNav from '../ShuttleNav';
import ShuttlePageHeader from '../components/ShuttlePageHeader';

interface PoolPin {
    latitude: string;
    longitude: string;
    address: string;
    name: string;
}

interface DepartureOption {
    id: number;
    label: string;
    service_type: 'pool' | 'door';
    unit_fare: string | number | null;
    seats_remaining: number;
    origin_pool: PoolPin | null;
    destination_pool: PoolPin | null;
}

interface Props {
    departures: DepartureOption[];
    partners: Array<{ id: number; name: string; code: string }>;
}

type Passenger = { name: string; phone: string; id_number: string };

function doorDefaultsFromDeparture(departure: DepartureOption | null | undefined): {
    pickup_address: string;
    pickup_lat: string;
    pickup_lng: string;
    dropoff_address: string;
    dropoff_lat: string;
    dropoff_lng: string;
} {
    return {
        pickup_address: departure?.origin_pool?.address ?? '',
        pickup_lat: departure?.origin_pool?.latitude ?? '',
        pickup_lng: departure?.origin_pool?.longitude ?? '',
        dropoff_address: departure?.destination_pool?.address ?? '',
        dropoff_lat: departure?.destination_pool?.latitude ?? '',
        dropoff_lng: departure?.destination_pool?.longitude ?? '',
    };
}

export default function Create({ departures, partners }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const first = departures[0];
    const initialDoor = first?.service_type === 'door';
    const initialPins = initialDoor ? doorDefaultsFromDeparture(first) : doorDefaultsFromDeparture(null);

    const { data, setData, post, processing, errors } = useForm({
        departure_id: first ? String(first.id) : '',
        partner_id: '',
        passenger_count: 1,
        pickup_mode: initialDoor ? 'door' : 'pool',
        dropoff_mode: initialDoor ? 'door' : 'pool',
        ...initialPins,
        notes: '',
        passengers: [{ name: '', phone: '', id_number: '' }] as Passenger[],
    });

    const selectedDeparture = useMemo(
        () => departures.find((d) => String(d.id) === data.departure_id) ?? null,
        [departures, data.departure_id],
    );
    const isPoolProduct = (selectedDeparture?.service_type ?? 'pool') === 'pool';

    const applyDeparture = (departureId: string): void => {
        const departure = departures.find((d) => String(d.id) === departureId);
        if (!departure) {
            setData('departure_id', departureId);
            return;
        }

        if (departure.service_type === 'pool') {
            setData({
                ...data,
                departure_id: departureId,
                pickup_mode: 'pool',
                dropoff_mode: 'pool',
                ...doorDefaultsFromDeparture(null),
            });
            return;
        }

        const nextPickup = data.pickup_mode === 'pool' && data.dropoff_mode === 'pool' ? 'door' : data.pickup_mode;
        const nextDropoff = data.pickup_mode === 'pool' && data.dropoff_mode === 'pool' ? 'door' : data.dropoff_mode;
        const pins = doorDefaultsFromDeparture(departure);

        setData({
            ...data,
            departure_id: departureId,
            pickup_mode: nextPickup,
            dropoff_mode: nextDropoff,
            ...(nextPickup === 'door'
                ? {
                      pickup_address: pins.pickup_address,
                      pickup_lat: pins.pickup_lat,
                      pickup_lng: pins.pickup_lng,
                  }
                : { pickup_address: '', pickup_lat: '', pickup_lng: '' }),
            ...(nextDropoff === 'door'
                ? {
                      dropoff_address: pins.dropoff_address,
                      dropoff_lat: pins.dropoff_lat,
                      dropoff_lng: pins.dropoff_lng,
                  }
                : { dropoff_address: '', dropoff_lat: '', dropoff_lng: '' }),
        });
    };

    const setPickupMode = (mode: string): void => {
        const pins = doorDefaultsFromDeparture(selectedDeparture);
        setData({
            ...data,
            pickup_mode: mode,
            ...(mode === 'pool'
                ? { pickup_address: '', pickup_lat: '', pickup_lng: '' }
                : {
                      pickup_address: pins.pickup_address,
                      pickup_lat: pins.pickup_lat,
                      pickup_lng: pins.pickup_lng,
                  }),
        });
    };

    const setDropoffMode = (mode: string): void => {
        const pins = doorDefaultsFromDeparture(selectedDeparture);
        setData({
            ...data,
            dropoff_mode: mode,
            ...(mode === 'pool'
                ? { dropoff_address: '', dropoff_lat: '', dropoff_lng: '' }
                : {
                      dropoff_address: pins.dropoff_address,
                      dropoff_lat: pins.dropoff_lat,
                      dropoff_lng: pins.dropoff_lng,
                  }),
        });
    };

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

    const modeOptions = [
        { value: 'pool', label: t('shuttle.bookings.pool') },
        { value: 'door', label: t('shuttle.bookings.door') },
    ];

    return (
        <DynamicLayout header={<ShuttlePageHeader title={t('shuttle.bookings.create')} />}>
            <Head title={t('shuttle.bookings.create')} />
            <ShuttleNav active="bookings" />
            <form onSubmit={submit} className="space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                <div>
                    <InputLabel value={t('shuttle.bookings.departure')} />
                    <Select
                        className="mt-1 w-full"
                        value={data.departure_id}
                        onChange={applyDeparture}
                        options={departures.map((d) => ({ value: String(d.id), label: d.label }))}
                    />
                    {selectedDeparture && (
                        <p className="mt-1 text-xs text-gray-500">
                            {selectedDeparture.service_type === 'door' ? t('shuttle.service.door') : t('shuttle.service.pool')}
                            {selectedDeparture.unit_fare != null && (
                                <> · Rp {Number(selectedDeparture.unit_fare).toLocaleString('id-ID')}</>
                            )}
                        </p>
                    )}
                    <InputError message={errors.departure_id} className="mt-1" />
                </div>
                <div>
                    <InputLabel value={t('shuttle.bookings.partner')} />
                    <Select
                        className="mt-1 w-full"
                        value={data.partner_id}
                        onChange={(v) => setData('partner_id', v)}
                        options={[
                            { value: '', label: t('shuttle.bookings.walk_in') },
                            ...partners.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
                        ]}
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('shuttle.bookings.partner_hint')}</p>
                    <InputError message={errors.partner_id} className="mt-1" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
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
                            onChange={setPickupMode}
                            options={isPoolProduct ? [{ value: 'pool', label: t('shuttle.bookings.pool') }] : modeOptions}
                            disabled={isPoolProduct}
                        />
                        <InputError message={errors.pickup_mode} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.bookings.dropoff_mode')} />
                        <Select
                            className="mt-1 w-full"
                            value={data.dropoff_mode}
                            onChange={setDropoffMode}
                            options={isPoolProduct ? [{ value: 'pool', label: t('shuttle.bookings.pool') }] : modeOptions}
                            disabled={isPoolProduct}
                        />
                        <InputError message={errors.dropoff_mode} className="mt-1" />
                    </div>
                </div>

                {!isPoolProduct && data.pickup_mode === 'door' && (
                    <div className="space-y-3">
                        <div>
                            <InputLabel value={t('shuttle.bookings.pickup_address')} />
                            <TextInput
                                className="mt-1 w-full"
                                value={data.pickup_address}
                                onChange={(e) => setData('pickup_address', e.target.value)}
                            />
                            <InputError message={errors.pickup_address} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value={t('shuttle.bookings.pickup_map')} />
                            <p className="mb-2 text-xs text-gray-500">{t('shuttle.bookings.map_hint')}</p>
                            <LocationMapPicker
                                latitude={data.pickup_lat}
                                longitude={data.pickup_lng}
                                height="280px"
                                onChange={({ latitude, longitude, address }) => {
                                    setData((current) => ({
                                        ...current,
                                        pickup_lat: latitude,
                                        pickup_lng: longitude,
                                        pickup_address: address ?? current.pickup_address,
                                    }));
                                }}
                            />
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                                <div>Lat: {data.pickup_lat || '—'}</div>
                                <div>Lng: {data.pickup_lng || '—'}</div>
                            </div>
                            <InputError message={errors.pickup_lat || errors.pickup_lng} className="mt-1" />
                        </div>
                    </div>
                )}

                {!isPoolProduct && data.dropoff_mode === 'door' && (
                    <div className="space-y-3">
                        <div>
                            <InputLabel value={t('shuttle.bookings.dropoff_address')} />
                            <TextInput
                                className="mt-1 w-full"
                                value={data.dropoff_address}
                                onChange={(e) => setData('dropoff_address', e.target.value)}
                            />
                            <InputError message={errors.dropoff_address} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value={t('shuttle.bookings.dropoff_map')} />
                            <p className="mb-2 text-xs text-gray-500">{t('shuttle.bookings.map_hint')}</p>
                            <LocationMapPicker
                                latitude={data.dropoff_lat}
                                longitude={data.dropoff_lng}
                                height="280px"
                                onChange={({ latitude, longitude, address }) => {
                                    setData((current) => ({
                                        ...current,
                                        dropoff_lat: latitude,
                                        dropoff_lng: longitude,
                                        dropoff_address: address ?? current.dropoff_address,
                                    }));
                                }}
                            />
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                                <div>Lat: {data.dropoff_lat || '—'}</div>
                                <div>Lng: {data.dropoff_lng || '—'}</div>
                            </div>
                            <InputError message={errors.dropoff_lat || errors.dropoff_lng} className="mt-1" />
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
