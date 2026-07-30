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
import { FormEventHandler } from 'react';
import ShuttleNav from '../ShuttleNav';

interface Location {
    id: number;
    code: string;
    name: string;
    city: string | null;
}

interface Props {
    locations: Location[];
}

export default function Create({ locations }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        origin_city: '',
        destination_city: '',
        origin_location_id: '',
        destination_location_id: '',
        base_fare: '200000',
        estimated_duration_minutes: '180',
        distance_km: '150',
        is_active: true as boolean,
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('shuttle.corridors.store'));
    };

    const locationOptions = [
        { value: '', label: '—' },
        ...locations.map((l) => ({ value: String(l.id), label: `${l.code} — ${l.name}` })),
    ];

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.corridors.create')}</h2>}>
            <Head title={t('shuttle.corridors.create')} />
            <ShuttleNav active="corridors" />
            <form onSubmit={submit} className="space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value={t('shuttle.corridors.code')} />
                                <TextInput className="mt-1 w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                                <InputError message={errors.code} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.corridors.name')} />
                                <TextInput className="mt-1 w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.corridors.origin_city')} />
                                <TextInput className="mt-1 w-full" value={data.origin_city} onChange={(e) => setData('origin_city', e.target.value)} />
                                <InputError message={errors.origin_city} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.corridors.destination_city')} />
                                <TextInput className="mt-1 w-full" value={data.destination_city} onChange={(e) => setData('destination_city', e.target.value)} />
                                <InputError message={errors.destination_city} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.corridors.origin_pool')} />
                                <Select className="mt-1 w-full" value={data.origin_location_id} onChange={(v) => setData('origin_location_id', v)} options={locationOptions} />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.corridors.destination_pool')} />
                                <Select className="mt-1 w-full" value={data.destination_location_id} onChange={(v) => setData('destination_location_id', v)} options={locationOptions} />
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
                                <TextInput type="number" min={1} className="mt-1 w-full" value={data.estimated_duration_minutes} onChange={(e) => setData('estimated_duration_minutes', e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Link href={prefixedRoute('shuttle.corridors.index')} className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                {t('common.cancel')}
                            </Link>
                            <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                        </div>
                    </form>
        </DynamicLayout>
    );
}
