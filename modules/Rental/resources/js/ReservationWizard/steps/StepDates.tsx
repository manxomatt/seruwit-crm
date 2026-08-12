import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { useMemo } from 'react';
import type { ReservationFormData } from '../types';
import { PERIOD_TYPES } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
}

export default function StepDates({
    data,
    setData,
    errors,
}: Props): JSX.Element {
    const { t } = useTrans();

    const periodOptions = useMemo(
        () => PERIOD_TYPES.map((type) => ({ value: type, label: t(`rental.period_type.${type}`, undefined, type) })),
        [t],
    );

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('rental.wizard.steps.1')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <p className="mt-1 text-xs text-gray-500">{t('rental.wizard.dates_auto_hint')}</p>
                </div>
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
                    <p className="mt-1 text-xs text-gray-500">{t('rental.wizard.dates_manual_hint')}</p>
                </div>
            </div>
        </div>
    );
}
