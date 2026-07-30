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

interface Props {
    schedule: {
        id: number;
        corridor_id: number;
        code: string;
        days_of_week: number[];
        departure_time: string;
        vehicle_id: number | null;
        driver_id: number | null;
        seat_capacity: number;
        pickup_cutoff_minutes: number;
        starts_on: string | null;
        ends_on: string | null;
        is_active: boolean;
    };
    corridors: Array<{ id: number; code: string; name: string }>;
    vehicles: Array<{ id: number; name: string; plate_number: string }>;
    drivers: Array<{ id: number; name: string }>;
}

const DAY_VALUES = [1, 2, 3, 4, 5, 6, 7];

export default function Edit({ schedule, corridors, vehicles, drivers }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        corridor_id: String(schedule.corridor_id),
        code: schedule.code,
        days_of_week: schedule.days_of_week ?? [],
        departure_time: String(schedule.departure_time).slice(0, 5),
        vehicle_id: schedule.vehicle_id ? String(schedule.vehicle_id) : '',
        driver_id: schedule.driver_id ? String(schedule.driver_id) : '',
        seat_capacity: String(schedule.seat_capacity),
        pickup_cutoff_minutes: String(schedule.pickup_cutoff_minutes ?? 90),
        starts_on: schedule.starts_on ?? '',
        ends_on: schedule.ends_on ?? '',
        is_active: schedule.is_active,
    });

    const toggleDay = (day: number) => {
        setData(
            'days_of_week',
            data.days_of_week.includes(day) ? data.days_of_week.filter((d) => d !== day) : [...data.days_of_week, day].sort(),
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('shuttle.schedules.update', schedule.id));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('shuttle.schedules.edit')}</h2>}>
            <Head title={t('shuttle.schedules.edit')} />
            <ShuttleNav active="schedules" />
            <form onSubmit={submit} className="space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value={t('shuttle.schedules.code')} />
                                <TextInput className="mt-1 w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                                <InputError message={errors.code} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.schedules.corridor')} />
                                <Select
                                    className="mt-1 w-full"
                                    value={data.corridor_id}
                                    onChange={(v) => setData('corridor_id', v)}
                                    options={corridors.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` }))}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel value={t('shuttle.schedules.days')} />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {DAY_VALUES.map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={
                                                data.days_of_week.includes(day)
                                                    ? 'rounded-md bg-gray-900 px-3 py-1 text-sm text-white'
                                                    : 'rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700'
                                            }
                                        >
                                            {t(`shuttle.days.${day}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.schedules.departure_time')} />
                                <TextInput type="time" className="mt-1 w-full" value={data.departure_time} onChange={(e) => setData('departure_time', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel value={t('shuttle.schedules.seat_capacity')} />
                                <TextInput type="number" min={1} className="mt-1 w-full" value={data.seat_capacity} onChange={(e) => setData('seat_capacity', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel value="Vehicle" />
                                <Select
                                    className="mt-1 w-full"
                                    value={data.vehicle_id}
                                    onChange={(v) => setData('vehicle_id', v)}
                                    options={[{ value: '', label: '—' }, ...vehicles.map((v) => ({ value: String(v.id), label: `${v.name} (${v.plate_number})` }))]}
                                />
                            </div>
                            <div>
                                <InputLabel value="Driver" />
                                <Select
                                    className="mt-1 w-full"
                                    value={data.driver_id}
                                    onChange={(v) => setData('driver_id', v)}
                                    options={[{ value: '', label: '—' }, ...drivers.map((d) => ({ value: String(d.id), label: d.name }))]}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Link href={prefixedRoute('shuttle.schedules.index')} className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                {t('common.cancel')}
                            </Link>
                            <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                        </div>
                    </form>
        </DynamicLayout>
    );
}
