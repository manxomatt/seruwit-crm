import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Props {
    settings: {
        ai_features_enabled: boolean;
        system_mode: string;
    };
    systemModes: string[];
}

export default function Index({ settings, systemModes }: Props): JSX.Element {
    const { t } = useTrans();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        ai_features_enabled: settings.ai_features_enabled,
        system_mode: settings.system_mode,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('module.platform-settings.update'), { preserveScroll: true });
    };

    const modeOptions = systemModes.map((mode) => ({
        value: mode,
        label: mode.charAt(0).toUpperCase() + mode.slice(1),
    }));

    return (
        <DynamicLayout header={<PageHeader title={t('platform_settings.title', undefined, 'Pengaturan Platform')} />}>
            <Head title={t('platform_settings.title', undefined, 'Pengaturan Platform')} />

            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                    {t('platform_settings.scope_hint', undefined, 'Pengaturan global platform — berlaku untuk semua workspace tenant. Hanya admin central yang dapat mengubahnya.')}
                </div>

                {/* AI master switch */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <label htmlFor="ai_features_enabled" className="flex cursor-pointer items-start justify-between gap-4">
                        <div className="min-w-0">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('platform_settings.ai_features', undefined, 'Fitur AI (semua tenant)')}
                            </span>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {t('platform_settings.ai_features_hint', undefined, 'Master switch: Visual Handover, Smart KYC, Dynamic Pricing, Predictive Maintenance.')}
                            </p>
                        </div>
                        <div className="relative mt-0.5 shrink-0">
                            <input
                                type="checkbox"
                                id="ai_features_enabled"
                                checked={data.ai_features_enabled}
                                onChange={(e) => setData('ai_features_enabled', e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-indigo-600 dark:bg-slate-700" />
                            <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                        </div>
                    </label>
                    <InputError message={errors.ai_features_enabled} className="mt-2" />
                </div>

                {/* System mode */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <InputLabel htmlFor="system_mode" value={t('platform_settings.system_mode', undefined, 'Mode Sistem')} />
                    <p className="mb-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t('platform_settings.system_mode_hint', undefined, 'Development menonaktifkan email keluar & menampilkan OTP di layar. Production mengaktifkan email nyata.')}
                    </p>
                    <Select
                        id="system_mode"
                        value={data.system_mode}
                        onChange={(value) => setData('system_mode', value)}
                        options={modeOptions}
                        className="w-full max-w-xs"
                    />
                    <InputError message={errors.system_mode} className="mt-2" />
                </div>

                <div className="flex items-center gap-3">
                    <PrimaryButton disabled={processing}>
                        {t('platform_settings.save', undefined, 'Simpan Pengaturan Platform')}
                    </PrimaryButton>
                    {recentlySuccessful && (
                        <span className="text-xs font-bold text-emerald-600">
                            ✅ {t('platform_settings.saved', undefined, 'Tersimpan')}
                        </span>
                    )}
                </div>
            </form>
        </DynamicLayout>
    );
}
