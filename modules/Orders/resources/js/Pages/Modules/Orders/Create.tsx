import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback } from 'react';

interface Partner {
    id: number;
    code: string;
    name: string;
}

interface Props {
    partners: Partner[];
    canGeocode?: boolean;
}

export default function Create({ partners, canGeocode = false }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        partner_id: '',
        order_date: '',
        pickup_address: '',
        delivery_address: '',
        delivery_lat: '',
        delivery_lng: '',
        demand_kg: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('orders.store'));
    };

    const handleMapChange = useCallback(
        (next: { latitude: string; longitude: string; address?: string }) => {
            setData((current) => ({
                ...current,
                delivery_lat: next.latitude,
                delivery_lng: next.longitude,
                ...(next.address ? { delivery_address: next.address } : {}),
            }));
        },
        [setData],
    );

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('orders.create.title')}</h2>}
        >
            <Head title={t('orders.create.title')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="partner_id" value={t('orders.create.partner')} />
                                <Select
                                    id="partner_id"
                                    className="mt-1 w-full"
                                    value={data.partner_id}
                                    onChange={(value) => setData('partner_id', value)}
                                    placeholder={t('orders.create.select_partner')}
                                    options={partners.map((partner) => ({
                                        value: String(partner.id),
                                        label: `${partner.name} (${partner.code})`,
                                    }))}
                                />
                                <InputError message={errors.partner_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="order_date" value={t('orders.create.order_date')} />
                                <TextInput id="order_date" type="date" className="mt-1 block w-full" value={data.order_date} onChange={(e) => setData('order_date', e.target.value)} required />
                                <InputError message={errors.order_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="pickup_address" value={t('orders.create.pickup_address')} />
                                <TextInput id="pickup_address" className="mt-1 block w-full" value={data.pickup_address} onChange={(e) => setData('pickup_address', e.target.value)} required />
                                <InputError message={errors.pickup_address} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="demand_kg" value={t('orders.create.demand_kg')} />
                                <TextInput id="demand_kg" type="number" step="0.01" min={0} className="mt-1 block w-full" value={data.demand_kg} onChange={(e) => setData('demand_kg', e.target.value)} />
                                <InputError message={errors.demand_kg} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('orders.create.map_title')} />
                            <p className="mb-2 text-xs text-gray-500">{t('orders.create.map_hint')}</p>
                            <LocationMapPicker
                                latitude={String(data.delivery_lat)}
                                longitude={String(data.delivery_lng)}
                                onChange={handleMapChange}
                                height="360px"
                                resolveAddress={canGeocode}
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="delivery_address" value={t('orders.create.delivery_address')} />
                            <TextInput
                                id="delivery_address"
                                className="mt-1 block w-full"
                                value={data.delivery_address}
                                onChange={(e) => setData('delivery_address', e.target.value)}
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('orders.create.address_hint')}</p>
                            <InputError message={errors.delivery_address} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="delivery_lat" value={t('orders.create.delivery_lat')} />
                                <TextInput
                                    id="delivery_lat"
                                    type="number"
                                    step="0.0000001"
                                    className="mt-1 block w-full"
                                    value={data.delivery_lat}
                                    onChange={(e) => setData('delivery_lat', e.target.value)}
                                    readOnly
                                />
                                <InputError message={errors.delivery_lat} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="delivery_lng" value={t('orders.create.delivery_lng')} />
                                <TextInput
                                    id="delivery_lng"
                                    type="number"
                                    step="0.0000001"
                                    className="mt-1 block w-full"
                                    value={data.delivery_lng}
                                    onChange={(e) => setData('delivery_lng', e.target.value)}
                                    readOnly
                                />
                                <InputError message={errors.delivery_lng} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value={t('orders.create.notes')} />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('orders.create.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('orders.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
