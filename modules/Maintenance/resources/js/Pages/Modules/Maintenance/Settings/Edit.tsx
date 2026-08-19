import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';

interface Settings {
    alert_km_before: string;
    alert_days_before: string;
    auto_create_wo: boolean;
    single_active_wo_per_vehicle: boolean;
    single_active_wo_per_bay: boolean;
    ai_predictive_maintenance_enabled: boolean;
}

interface Props {
    settings: Settings;
}

export default function Edit({ settings }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        alert_km_before: settings.alert_km_before,
        alert_days_before: settings.alert_days_before,
        auto_create_wo: settings.auto_create_wo,
        single_active_wo_per_vehicle: settings.single_active_wo_per_vehicle,
        single_active_wo_per_bay: settings.single_active_wo_per_bay,
        ai_predictive_maintenance_enabled: settings.ai_predictive_maintenance_enabled ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('maintenance.settings.update'), { preserveScroll: true });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('maintenance.settings.head')} />}>
            <Head title={t('maintenance.settings.head')} />
            <MaintenanceNav />

            <form onSubmit={submit} className="max-w-2xl space-y-6">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900">{t('maintenance.settings.alerts_section')}</h2>
                    <p className="mt-1 text-sm text-gray-500">{t('maintenance.settings.alerts_section_hint')}</p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="alert_km_before" value={t('maintenance.settings.alert_km_before')} />
                            <TextInput
                                id="alert_km_before"
                                type="number"
                                min={0}
                                className="mt-1 block w-full"
                                value={data.alert_km_before}
                                onChange={(e) => setData('alert_km_before', e.target.value)}
                            />
                            <InputError message={errors.alert_km_before} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="alert_days_before" value={t('maintenance.settings.alert_days_before')} />
                            <TextInput
                                id="alert_days_before"
                                type="number"
                                min={0}
                                className="mt-1 block w-full"
                                value={data.alert_days_before}
                                onChange={(e) => setData('alert_days_before', e.target.value)}
                            />
                            <InputError message={errors.alert_days_before} className="mt-1" />
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900">{t('maintenance.settings.workflow_section')}</h2>
                    <p className="mt-1 text-sm text-gray-500">{t('maintenance.settings.workflow_section_hint')}</p>

                    <div className="mt-4 space-y-3">
                        <label className="flex items-start gap-3">
                            <Checkbox
                                checked={data.auto_create_wo}
                                onChange={(e) => setData('auto_create_wo', e.target.checked)}
                            />
                            <span>
                                <span className="block text-sm font-medium text-gray-900">{t('maintenance.settings.auto_create_wo')}</span>
                                <span className="mt-0.5 block text-xs text-gray-500">{t('maintenance.settings.auto_create_wo_hint')}</span>
                            </span>
                        </label>
                        <label className="flex items-start gap-3">
                            <Checkbox
                                checked={data.single_active_wo_per_vehicle}
                                onChange={(e) => setData('single_active_wo_per_vehicle', e.target.checked)}
                            />
                            <span>
                                <span className="block text-sm font-medium text-gray-900">{t('maintenance.settings.single_active_wo_per_vehicle')}</span>
                                <span className="mt-0.5 block text-xs text-gray-500">{t('maintenance.settings.single_active_wo_per_vehicle_hint')}</span>
                            </span>
                        </label>
                        <label className="flex items-start gap-3">
                            <Checkbox
                                checked={data.single_active_wo_per_bay}
                                onChange={(e) => setData('single_active_wo_per_bay', e.target.checked)}
                            />
                            <span>
                                <span className="block text-sm font-medium text-gray-900">{t('maintenance.settings.single_active_wo_per_bay')}</span>
                                <span className="mt-0.5 block text-xs text-gray-500">{t('maintenance.settings.single_active_wo_per_bay_hint')}</span>
                            </span>
                        </label>
                    </div>
                </section>

                <section className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-5 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
                            ✨
                        </span>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                                {t('maintenance.settings.ai_features_title', undefined, 'Kecerdasan Buatan (AI Features)')}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('maintenance.settings.ai_features_subtitle', undefined, 'Kelola aktivasi fitur AI Predictive Maintenance & Anomaly Detection.')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/80 p-4 transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/80">
                            <Checkbox
                                checked={data.ai_predictive_maintenance_enabled}
                                onChange={(e) => setData('ai_predictive_maintenance_enabled', e.target.checked)}
                                className="mt-0.5"
                            />
                            <span>
                                <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                    {t('maintenance.settings.ai_predictive_enabled', undefined, 'AI Predictive Maintenance & Anomaly Detection')}
                                </span>
                                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                                    {t('maintenance.settings.ai_predictive_enabled_hint', undefined, 'Prediksi waktu servis otomatis berbasis laju KM harian, deteksi anomali pemakaian, dan skor kesehatan armada.')}
                                </span>
                            </span>
                        </label>
                    </div>
                </section>

                <div className="flex items-center gap-3">
                    <PrimaryButton disabled={processing}>{t('maintenance.settings.save')}</PrimaryButton>
                    {recentlySuccessful && (
                        <span className="text-sm text-green-600">{t('maintenance.messages.settings_updated')}</span>
                    )}
                </div>
            </form>
        </DynamicLayout>
    );
}
