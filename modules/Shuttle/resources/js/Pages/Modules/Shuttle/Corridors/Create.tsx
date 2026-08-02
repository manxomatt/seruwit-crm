import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
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

interface City {
    id: number;
    code: string;
    name: string;
}

interface Pool {
    id: number;
    city_id: number;
    code: string;
    name: string;
    is_origin: boolean;
    is_destination: boolean;
}

interface Props {
    cities: City[];
    pools: Pool[];
    defaults: { pool_base_fare: string; door_base_fare: string };
}

export default function Create({ cities, pools, defaults }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        origin_city_id: cities[0] ? String(cities[0].id) : '',
        destination_city_id: cities[1] ? String(cities[1].id) : cities[0] ? String(cities[0].id) : '',
        origin_pool_id: '',
        destination_pool_id: '',
        service_type: 'pool',
        base_fare: defaults.pool_base_fare || '200000',
        estimated_duration_minutes: '180',
        distance_km: '150',
        is_active: true as boolean,
        notes: '',
    });

    const originPools = useMemo(
        () => pools.filter((p) => String(p.city_id) === data.origin_city_id && p.is_origin),
        [pools, data.origin_city_id],
    );
    const destinationPools = useMemo(
        () => pools.filter((p) => String(p.city_id) === data.destination_city_id && p.is_destination),
        [pools, data.destination_city_id],
    );

    const cityOptions = cities.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('shuttle.corridors.store'));
    };

    const setServiceType = (value: string) => {
        const nextFare =
            value === 'door'
                ? defaults.door_base_fare || '250000'
                : defaults.pool_base_fare || '200000';
        setData({ ...data, service_type: value, base_fare: nextFare });
    };

    return (
        <DynamicLayout header={<ShuttlePageHeader title={t('shuttle.corridors.create')} />}>
            <Head title={t('shuttle.corridors.create')} />
            <ShuttleNav active="corridors" />
            <form onSubmit={submit} className="space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                {cities.length === 0 || pools.length === 0 ? (
                    <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                        {t('shuttle.corridors.need_masters')}{' '}
                        <Link href={prefixedRoute('shuttle.settings.index') + '?tab=cities'} className="font-medium underline">
                            {t('shuttle.settings.title')}
                        </Link>
                    </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value={t('shuttle.corridors.code')} />
                        <TextInput className="mt-1 w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                        <InputError message={errors.code} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.corridors.name')} />
                        <TextInput
                            className="mt-1 w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('shuttle.corridors.name_placeholder')}
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="service_type" value={t('shuttle.corridors.service_type')} />
                        <Select
                            id="service_type"
                            className="mt-1 w-full"
                            value={data.service_type}
                            onChange={setServiceType}
                            options={[
                                { value: 'pool', label: t('shuttle.service.pool') },
                                { value: 'door', label: t('shuttle.service.door') },
                            ]}
                        />
                        <p className="mt-1 text-xs text-gray-500">{t('shuttle.corridors.service_type_hint')}</p>
                        <InputError message={errors.service_type} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.corridors.origin_city')} />
                        <Select
                            className="mt-1 w-full"
                            value={data.origin_city_id}
                            onChange={(v) => setData({ ...data, origin_city_id: v, origin_pool_id: '' })}
                            options={cityOptions}
                        />
                        <InputError message={errors.origin_city_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.corridors.destination_city')} />
                        <Select
                            className="mt-1 w-full"
                            value={data.destination_city_id}
                            onChange={(v) => setData({ ...data, destination_city_id: v, destination_pool_id: '' })}
                            options={cityOptions}
                        />
                        <InputError message={errors.destination_city_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.corridors.origin_pool')} />
                        <Select
                            className="mt-1 w-full"
                            value={data.origin_pool_id}
                            onChange={(v) => setData('origin_pool_id', v)}
                            options={[
                                { value: '', label: '—' },
                                ...originPools.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
                            ]}
                        />
                        <InputError message={errors.origin_pool_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.corridors.destination_pool')} />
                        <Select
                            className="mt-1 w-full"
                            value={data.destination_pool_id}
                            onChange={(v) => setData('destination_pool_id', v)}
                            options={[
                                { value: '', label: '—' },
                                ...destinationPools.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
                            ]}
                        />
                        <InputError message={errors.destination_pool_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="base_fare" value={`${t('shuttle.corridors.base_fare')} (${t('shuttle.corridors.base_fare_currency')})`} />
                        <div className="relative mt-1">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-gray-500">
                                {t('shuttle.corridors.base_fare_currency_symbol')}
                            </span>
                            <MoneyInput
                                id="base_fare"
                                value={data.base_fare}
                                onChange={(value) => setData('base_fare', value)}
                                className="w-full pl-10"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{t('shuttle.corridors.base_fare_hint')}</p>
                        <InputError message={errors.base_fare} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.corridors.duration')} />
                        <TextInput
                            type="number"
                            min={1}
                            className="mt-1 w-full"
                            value={data.estimated_duration_minutes}
                            onChange={(e) => setData('estimated_duration_minutes', e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Link href={prefixedRoute('shuttle.corridors.index')} className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                        {t('common.cancel')}
                    </Link>
                    <PrimaryButton disabled={processing || cities.length === 0 || pools.length === 0}>{t('common.save')}</PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}
