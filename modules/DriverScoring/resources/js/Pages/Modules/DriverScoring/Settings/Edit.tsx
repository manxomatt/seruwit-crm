import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import ScoringNav from '../../../../ScoringNav';
import PageHeader from '@/Components/PageHeader';

interface Settings {
    harsh_brake_kph_per_s: string | number;
    harsh_accel_kph_per_s: string | number;
    speeding_limit_kph: string | number;
    idle_speed_kph: string | number;
    idle_minutes: number;
    min_sample_seconds: number;
    max_sample_seconds: number;
    event_dedupe_seconds: number;
    daily_base_points: number;
    points_harsh_brake: number;
    points_harsh_accel: number;
    points_speeding: number;
    points_idle: number;
}

interface Props {
    settings: Settings;
}

export default function Edit({ settings }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        harsh_brake_kph_per_s: String(settings.harsh_brake_kph_per_s),
        harsh_accel_kph_per_s: String(settings.harsh_accel_kph_per_s),
        speeding_limit_kph: String(settings.speeding_limit_kph),
        idle_speed_kph: String(settings.idle_speed_kph),
        idle_minutes: String(settings.idle_minutes),
        min_sample_seconds: String(settings.min_sample_seconds),
        max_sample_seconds: String(settings.max_sample_seconds),
        event_dedupe_seconds: String(settings.event_dedupe_seconds),
        daily_base_points: String(settings.daily_base_points),
        points_harsh_brake: String(settings.points_harsh_brake),
        points_harsh_accel: String(settings.points_harsh_accel),
        points_speeding: String(settings.points_speeding),
        points_idle: String(settings.points_idle),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('scoring.settings.update'));
    };

    const fields: [keyof typeof data, string][] = [
        ['harsh_brake_kph_per_s', 'Harsh brake threshold (kph/s)'],
        ['harsh_accel_kph_per_s', 'Harsh accel threshold (kph/s)'],
        ['speeding_limit_kph', 'Speeding limit (kph)'],
        ['idle_speed_kph', 'Idle speed max (kph)'],
        ['idle_minutes', 'Idle duration (minutes)'],
        ['min_sample_seconds', 'Min sample gap (s)'],
        ['max_sample_seconds', 'Max sample gap (s)'],
        ['event_dedupe_seconds', 'Event dedupe window (s)'],
        ['daily_base_points', 'Daily base score'],
        ['points_harsh_brake', 'Points: harsh brake'],
        ['points_harsh_accel', 'Points: harsh accel'],
        ['points_speeding', 'Points: speeding'],
        ['points_idle', 'Points: idle'],
    ];

    return (
        <DynamicLayout
            header={<PageHeader title={t('scoring.pages.settings.title')} />}
        >
            <Head title={t('scoring.pages.settings.title')} />

            <ScoringNav />

            <form onSubmit={submit} className="space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {fields.map(([key, label]) => (
                        <div key={key}>
                            <InputLabel value={label} />
                            <TextInput
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full"
                                value={data[key]}
                                onChange={(e) => setData(key, e.target.value)}
                            />
                            <InputError message={errors[key]} className="mt-1" />
                        </div>
                    ))}
                </div>
                <PrimaryButton disabled={processing}>{t('scoring.actions.save_settings')}</PrimaryButton>
            </form>
        </DynamicLayout>
    );
}
