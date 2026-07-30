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

interface Location {
    id: number;
    code: string;
    name: string;
}

interface Corridor {
    id: number;
    code: string;
    name: string;
    origin_city: string;
    destination_city: string;
    origin_location_id: number | null;
    destination_location_id: number | null;
    base_fare: string | number;
    estimated_duration_minutes: number | null;
    distance_km: string | number | null;
    is_active: boolean;
    notes: string | null;
}

interface Props {
    corridor: Corridor;
    locations: Location[];
}

export default function Edit({ corridor, locations }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        code: corridor.code,
        name: corridor.name,
        origin_city: corridor.origin_city,
        destination_city: corridor.destination_city,
        origin_location_id: corridor.origin_location_id ? String(corridor.origin_location_id) : '',
        destination_location_id: corridor.destination_location_id ? String(corridor.destination_location_id) : '',
        base_fare: String(corridor.base_fare),
        estimated_duration_minutes: corridor.estimated_duration_minutes ? String(corridor.estimated_duration_minutes) : '',
        distance_km: corridor.distance_km ? String(corridor.distance_km) : '',
        is_active: corridor.is_active,
        notes: corridor.notes ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('shuttle.corridors.update', corridor.id));
    };

    const locationOptions = [
        { value: '', label: '—' },
        ...locations.map((l) => ({ value: String(l.id), label: `${l.code} — ${l.name}` })),
    ];

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.corridors.edit')}</h2>}>
            <Head title={t('shuttle.corridors.edit')} />
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
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.corridors.destination_city')} />
                                <TextInput className="mt-1 w-full" value={data.destination_city} onChange={(e) => setData('destination_city', e.target.value)} />
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
                                <InputLabel value={t('shuttle.corridors.base_fare')} />
                                <TextInput type="number" min={0} className="mt-1 w-full" value={data.base_fare} onChange={(e) => setData('base_fare', e.target.value)} />
                                <InputError message={errors.base_fare} className="mt-1" />
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
