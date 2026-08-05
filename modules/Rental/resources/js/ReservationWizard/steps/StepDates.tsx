import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { useMemo } from 'react';
import type { LocationOption, ReservationFormData } from '../types';
import { PERIOD_TYPES, locationLabel } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    locations: LocationOption[];
    defaultOneWayFee: number;
    onApplyLocation: (field: 'pickup' | 'return', locationId: string) => void;
}

export default function StepDates({
    data,
    setData,
    errors,
    locations,
    onApplyLocation,
}: Props): JSX.Element {
    const { t } = useTrans();

    const periodOptions = useMemo(
        () => PERIOD_TYPES.map((type) => ({ value: type, label: t(`rental.period_type.${type}`, undefined, type) })),
        [t],
    );
    const locationOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.select_location') },
            ...locations.map((location) => ({ value: String(location.id), label: locationLabel(location) })),
        ],
        [locations, t],
    );

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('rental.wizard.steps.1')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="start_date" value={`${t('rental.fields.start_date')} *`} />
                    <TextInput
                        id="start_date"
                        type="date"
                        value={data.start_date}
                        onChange={(e) => setData('start_date', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={errors.start_date} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="end_date" value={`${t('rental.fields.end_date')} *`} />
                    <TextInput
                        id="end_date"
                        type="date"
                        value={data.end_date}
                        onChange={(e) => setData('end_date', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={errors.end_date} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="period_type" value={`${t('rental.fields.period_type')} *`} />
                    <Select
                        id="period_type"
                        className="mt-1"
                        value={data.period_type}
                        onChange={(value) => setData('period_type', value)}
                        options={periodOptions}
                        searchable={false}
                    />
                    <InputError message={errors.period_type} className="mt-1" />
                </div>
                <div />
                <div>
                    <InputLabel htmlFor="pickup_location_id" value={t('rental.fields.pickup_branch')} />
                    <Select
                        id="pickup_location_id"
                        options={locationOptions}
                        value={data.pickup_location_id}
                        onChange={(value) => onApplyLocation('pickup', value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={errors.pickup_location_id} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="return_location_id" value={t('rental.fields.return_branch')} />
                    <Select
                        id="return_location_id"
                        options={locationOptions}
                        value={data.return_location_id}
                        onChange={(value) => onApplyLocation('return', value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={errors.return_location_id} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="pickup_location" value={t('rental.fields.pickup_location')} />
                    <TextInput
                        id="pickup_location"
                        value={typeof data.pickup_location === 'string' ? data.pickup_location : ''}
                        onChange={(e) => setData('pickup_location', e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
                <div>
                    <InputLabel htmlFor="return_location" value={t('rental.fields.return_location')} />
                    <TextInput
                        id="return_location"
                        value={typeof data.return_location === 'string' ? data.return_location : ''}
                        onChange={(e) => setData('return_location', e.target.value)}
                        className="mt-1 w-full"
                    />
                </div>
            </div>
        </div>
    );
}
