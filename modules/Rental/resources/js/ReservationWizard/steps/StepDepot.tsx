import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { useMemo } from 'react';
import type { LocationOption, ReservationFormData } from '../types';
import { locationLabel } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    locations: LocationOption[];
    onApplyLocation: (field: 'pickup' | 'return', locationId: string) => void;
}

export default function StepDepot({
    data,
    setData,
    errors,
    locations,
    onApplyLocation,
}: Props): JSX.Element {
    const { t } = useTrans();

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
                {t('rental.wizard.steps.3')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            {data.pickup_location_id && data.return_location_id && data.pickup_location_id !== data.return_location_id && (
                <p className="text-xs text-gray-500">
                    {t('rental.wizard.one_way_fee_applied')}
                </p>
            )}
        </div>
    );
}
