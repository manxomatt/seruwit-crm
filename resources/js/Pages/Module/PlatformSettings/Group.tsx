import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface PlatformSetting {
    id: number;
    key: string;
    group: string;
    value: string | null;
    type: string;
    label: string;
    description: string | null;
    is_public: boolean;
    sort_order: number;
}

interface Props {
    groupSettings: PlatformSetting[];
    groups: string[];
    currentGroup: string;
    systemModes: string[];
}

const GROUP_ICONS: Record<string, string> = {
    general: '⚙️',
    capacity: '🚗',
    billing: '💳',
    email: '✉️',
    security: '🛡️',
};

export default function Group({
    groupSettings,
    groups,
    currentGroup,
    systemModes,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { flash } = usePage<{ flash?: { success?: string } }>().props;

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        group: currentGroup,
        settings: groupSettings.map((s) => ({
            id: s.id,
            value: s.value ?? '',
        })),
    });

    const updateValue = (index: number, value: string) => {
        const next = [...data.settings];
        next[index] = { ...next[index], value };
        setData('settings', next);
    };

    const findSettingIndex = (key: string): number => {
        return groupSettings.findIndex((s) => s.key === key);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('module.platform-settings.bulk-update'), { preserveScroll: true });
    };

    const formatGroupLabel = (group: string): string => {
        return t(
            `settings.platform.groups.${group}`,
            undefined,
            t(`settings.groups.${group}`, undefined, group.charAt(0).toUpperCase() + group.slice(1)),
        );
    };

    // General indices
    const systemModeIndex = findSettingIndex('general.system_mode');
    const currentSystemMode = systemModeIndex >= 0 ? data.settings[systemModeIndex]?.value : 'development';

    const aiFeaturesIndex = findSettingIndex('general.ai_features_enabled');
    const isAiEnabled = aiFeaturesIndex >= 0 ? data.settings[aiFeaturesIndex]?.value === '1' : false;

    // Capacity indices
    const lifetimeCreditIndex = findSettingIndex('capacity_credits_lifetime_enabled');
    const isLifetimeCredit = lifetimeCreditIndex >= 0 ? data.settings[lifetimeCreditIndex]?.value === '1' : true;

    const pauseMaintenanceIndex = findSettingIndex('pause_during_maintenance_enabled');
    const isPauseMaintenance = pauseMaintenanceIndex >= 0 ? data.settings[pauseMaintenanceIndex]?.value === '1' : false;

    const durationDaysIndex = findSettingIndex('vehicle_activation_duration_days');
    const graceDaysIndex = findSettingIndex('vehicle_grace_period_days');

    // Email indices
    const emailFromAddressIndex = findSettingIndex('email.from_address');
    const emailFromNameIndex = findSettingIndex('email.from_name');

    // Security indices
    const maxAttemptsIndex = findSettingIndex('security.max_login_attempts');
    const lockoutDurationIndex = findSettingIndex('security.lockout_duration_minutes');
    const enforce2faIndex = findSettingIndex('security.enforce_two_factor');
    const isEnforce2fa = enforce2faIndex >= 0 ? data.settings[enforce2faIndex]?.value === '1' : false;

    const groupIcon = GROUP_ICONS[currentGroup] ?? '⚙️';

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('settings.platform.title', undefined, 'Pengaturan Platform')}
                    subtitle={t(
                        'settings.platform.subtitle',
                        undefined,
                        'Konfigurasi global platform SaaS, kontrol fitur AI, dan kebijakan kapasitas armada.',
                    )}
                />
            }
        >
            <Head title={t('settings.platform.title', undefined, 'Pengaturan Platform')} />

            <div className="mx-auto max-w-5xl space-y-6 pb-12">
                {/* Global Scope Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 p-4 shadow-xs dark:border-indigo-950/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                            <span className="material-symbols-outlined text-[22px]">tune</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                                {t('settings.platform.title', undefined, 'Pengaturan Platform SaaS')}
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                                {t(
                                    'settings.platform.scope_hint',
                                    undefined,
                                    'Pengaturan global platform — berlaku untuk seluruh workspace tenant di sistem. Hanya dapat dikonfigurasi oleh Admin Central.',
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Flash Message */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-900 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold shadow-xs">
                            ✓
                        </span>
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Group Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <nav className="flex items-center gap-2 overflow-x-auto">
                        {groups.map((g) => {
                            const active = g === currentGroup;
                            const icon = GROUP_ICONS[g] ?? '⚙️';
                            return (
                                <Link
                                    key={g}
                                    href={route('module.platform-settings.group', g)}
                                    className={`inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
                                        active
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    <span className="text-sm">{icon}</span>
                                    <span>{formatGroupLabel(g)}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Form Container */}
                <form onSubmit={submit} className="space-y-6">
                    {/* SPECIFIC VIEW: GENERAL & AI GROUP */}
                    {currentGroup === 'general' && (
                        <div className="space-y-6">
                            {/* System Mode Modern Card */}
                            {systemModeIndex >= 0 && (
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                                <span className="material-symbols-outlined text-[20px]">memory</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {t('settings.platform.system_mode.label', undefined, 'Mode Sistem (Environment)')}
                                                </h3>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {t(
                                                        'settings.platform.system_mode.description',
                                                        undefined,
                                                        'Tentukan lingkungan operasional sistem. Mengatur perilaku pengiriman email keluar, verifikasi OTP, dan proteksi keamanan.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            {currentSystemMode === 'production' ? 'LIVE' : 'DEV'}
                                        </span>
                                    </div>

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                        {/* Option: Development */}
                                        <div
                                            onClick={() => updateValue(systemModeIndex, 'development')}
                                            className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all ${
                                                currentSystemMode === 'development'
                                                    ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20 dark:border-amber-600 dark:bg-amber-950/20'
                                                    : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/70'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-xl">🛠️</span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                                {t('settings.platform.system_mode.dev_title', undefined, 'Development')}
                                                            </h4>
                                                            <span className="rounded-md bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                                                {t('settings.platform.system_mode.dev_badge', undefined, 'DEV')}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                            {t(
                                                                'settings.platform.system_mode.dev_desc',
                                                                undefined,
                                                                'Mode pengembangan & uji coba. Email keluar dibypass dan kode verifikasi OTP ditampilkan di layar browser.',
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                        currentSystemMode === 'development'
                                                            ? 'border-amber-500 bg-amber-500 text-white'
                                                            : 'border-slate-300 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {currentSystemMode === 'development' && (
                                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Option: Production */}
                                        <div
                                            onClick={() => updateValue(systemModeIndex, 'production')}
                                            className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all ${
                                                currentSystemMode === 'production'
                                                    ? 'border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-400/20 dark:border-emerald-600 dark:bg-emerald-950/20'
                                                    : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/70'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-xl">🚀</span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                                {t('settings.platform.system_mode.prod_title', undefined, 'Production')}
                                                            </h4>
                                                            <span className="rounded-md bg-emerald-200/70 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                                                {t('settings.platform.system_mode.prod_badge', undefined, 'LIVE')}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                            {t(
                                                                'settings.platform.system_mode.prod_desc',
                                                                undefined,
                                                                'Mode operasional produksi langsung. Email keluar dikirim via SMTP nyata dan sistem keamanan penuh aktif.',
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                        currentSystemMode === 'production'
                                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                                            : 'border-slate-300 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {currentSystemMode === 'production' && (
                                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${systemModeIndex}.value`]}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            {/* Master AI Toggle Modern Card */}
                            {aiFeaturesIndex >= 0 && (
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
                                                <span className="material-symbols-outlined text-[20px]">psychology</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.ai_features.label', undefined, 'Fitur AI (Artificial Intelligence)')}
                                                    </h3>
                                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                        Master Switch
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {t(
                                                        'settings.platform.ai_features.description',
                                                        undefined,
                                                        'Master switch untuk mengaktifkan atau menonaktifkan seluruh kapabilitas AI di seluruh workspace tenant.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                isAiEnabled
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isAiEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                                                }`}
                                            />
                                            {isAiEnabled ? 'AKTIF' : 'NONAKTIF'}
                                        </span>
                                    </div>

                                    {/* Toggle Bar */}
                                    <div className="mt-5">
                                        <div
                                            onClick={() => updateValue(aiFeaturesIndex, isAiEnabled ? '0' : '1')}
                                            className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                                isAiEnabled
                                                    ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white dark:border-indigo-900/60 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900'
                                                    : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/90'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white shadow-xs">
                                                    ✨
                                                </span>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {isAiEnabled
                                                            ? t('settings.platform.ai_features.active_label', undefined, 'Fitur AI Aktif Global')
                                                            : t('settings.platform.ai_features.inactive_label', undefined, 'Fitur AI Dinonaktifkan Global')}
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {isAiEnabled
                                                            ? t(
                                                                  'settings.platform.ai_features.active_desc',
                                                                  undefined,
                                                                  'Tenant yang berlangganan dapat menggunakan seluruh modul AI cerdas.',
                                                              )
                                                            : t(
                                                                  'settings.platform.ai_features.inactive_desc',
                                                                  undefined,
                                                                  'Seluruh layanan AI dinonaktifkan sementara di semua workspace.',
                                                              )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Reliable Animated Switch */}
                                            <div
                                                role="switch"
                                                aria-checked={isAiEnabled}
                                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                    isAiEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                        isAiEnabled ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Sub-services Grid */}
                                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/40">
                                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                                            {t('settings.platform.ai_features.included_modules_title', undefined, 'Layanan AI yang Terhubung:')}
                                        </h5>
                                        <div className="grid gap-2.5 sm:grid-cols-2">
                                            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs text-slate-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">🔍</span>
                                                <span>{t('settings.platform.ai_features.modules.kyc', undefined, 'Smart KYC & Verifikasi Dokumen KTP/SIM')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs text-slate-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">📸</span>
                                                <span>{t('settings.platform.ai_features.modules.vision', undefined, 'Visual Handover & Deteksi Kerusakan Unit')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs text-slate-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">📈</span>
                                                <span>{t('settings.platform.ai_features.modules.pricing', undefined, 'Dynamic Pricing & Rekomendasi Tarif Sewa')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs text-slate-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">🛠️</span>
                                                <span>{t('settings.platform.ai_features.modules.maintenance', undefined, 'Predictive Maintenance & Jadwal Servis Cerdas')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${aiFeaturesIndex}.value`]}
                                        className="mt-2"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* SPECIFIC VIEW: CAPACITY GROUP */}
                    {currentGroup === 'capacity' && (
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                        <span className="material-symbols-outlined text-[20px]">directions_car</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {t('settings.platform.groups.capacity', undefined, 'Kebijakan Kapasitas Unit & Armada')}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {t(
                                                'settings.platform.capacity.duration_desc',
                                                undefined,
                                                'Aturan konsumsi saldo kredit kapasitas unit dan siklus masa aktif kendaraan tenant.',
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Lifetime Credit Toggle */}
                            {lifetimeCreditIndex >= 0 && (
                                <div>
                                    <div
                                        onClick={() => updateValue(lifetimeCreditIndex, isLifetimeCredit ? '0' : '1')}
                                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                            isLifetimeCredit
                                                ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                                : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white shadow-xs">
                                                ♾️
                                            </span>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {t('settings.platform.capacity.lifetime_label', undefined, 'Saldo Kredit Lifetime')}
                                                </span>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {t(
                                                        'settings.platform.capacity.lifetime_desc',
                                                        undefined,
                                                        'Saldo kredit kapasitas unit yang dimiliki tenant akan tersimpan selamanya sampai digunakan (tidak pernah kadaluarsa).',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            role="switch"
                                            aria-checked={isLifetimeCredit}
                                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                isLifetimeCredit ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    isLifetimeCredit ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${lifetimeCreditIndex}.value`]}
                                        className="mt-1.5"
                                    />
                                </div>
                            )}

                            {/* Dual Stepper: Duration & Grace Period */}
                            <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {durationDaysIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="vehicle_activation_duration_days"
                                            value={t('settings.platform.capacity.duration_label', undefined, 'Durasi 1 Siklus Aktivasi (Hari)')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <TextInput
                                                id="vehicle_activation_duration_days"
                                                type="number"
                                                className="block w-full !rounded-xl !py-2.5 text-xs font-semibold border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                value={data.settings[durationDaysIndex].value}
                                                onChange={(e) => updateValue(durationDaysIndex, e.target.value)}
                                                required
                                            />
                                            <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                {t('settings.platform.capacity.days_suffix', undefined, 'Hari')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t(
                                                'settings.platform.capacity.duration_desc',
                                                undefined,
                                                'Masa aktif yang didapat kendaraan saat mengkonsumsi 1 unit kapasitas kuota armada (default: 30 hari).',
                                            )}
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${durationDaysIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}

                                {graceDaysIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="vehicle_grace_period_days"
                                            value={t('settings.platform.capacity.grace_period_label', undefined, 'Masa Tenggang / Grace Period (Hari)')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <TextInput
                                                id="vehicle_grace_period_days"
                                                type="number"
                                                className="block w-full !rounded-xl !py-2.5 text-xs font-semibold border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                value={data.settings[graceDaysIndex].value}
                                                onChange={(e) => updateValue(graceDaysIndex, e.target.value)}
                                                required
                                            />
                                            <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                {t('settings.platform.capacity.days_suffix', undefined, 'Hari')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t(
                                                'settings.platform.capacity.grace_period_desc',
                                                undefined,
                                                'Toleransi hari setelah masa aktif habis sebelum unit dinonaktifkan dari jadwal operasional (default: 3 hari).',
                                            )}
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${graceDaysIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Pause During Maintenance Toggle */}
                            {pauseMaintenanceIndex >= 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div
                                        onClick={() => updateValue(pauseMaintenanceIndex, isPauseMaintenance ? '0' : '1')}
                                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                            isPauseMaintenance
                                                ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                                : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-sm text-white shadow-xs">
                                                🛠️
                                            </span>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {t('settings.platform.capacity.pause_maintenance_label', undefined, 'Bekukan Masa Aktif Saat Masuk Bengkel')}
                                                </span>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {t(
                                                        'settings.platform.capacity.pause_maintenance_desc',
                                                        undefined,
                                                        'Jika diaktifkan, masa aktif kendaraan tidak berkurang saat kendaraan berstatus dalam perbaikan (maintenance).',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            role="switch"
                                            aria-checked={isPauseMaintenance}
                                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                isPauseMaintenance ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    isPauseMaintenance ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${pauseMaintenanceIndex}.value`]}
                                        className="mt-1.5"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* SPECIFIC VIEW: EMAIL GROUP */}
                    {currentGroup === 'email' && (
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {t('settings.platform.email.title', undefined, 'Email Pengirim Sentral (Root Mailer)')}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {t('settings.platform.email.description', undefined, 'Konfigurasi identitas pengirim email resmi platform untuk notifikasi sistem, tagihan langganan, dan pengumuman central.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                {emailFromAddressIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="email_from_address"
                                            value={t('settings.platform.email.from_address_label', undefined, 'Alamat Email Pengirim')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <TextInput
                                            id="email_from_address"
                                            type="email"
                                            className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                            value={data.settings[emailFromAddressIndex].value}
                                            onChange={(e) => updateValue(emailFromAddressIndex, e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t('settings.platform.email.from_address_desc', undefined, 'Alamat email yang tertera sebagai pengirim resmi platform (cth: noreply@seruwit.com).')}
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${emailFromAddressIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}

                                {emailFromNameIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="email_from_name"
                                            value={t('settings.platform.email.from_name_label', undefined, 'Nama Pengirim Platform')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <TextInput
                                            id="email_from_name"
                                            type="text"
                                            className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                            value={data.settings[emailFromNameIndex].value}
                                            onChange={(e) => updateValue(emailFromNameIndex, e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t('settings.platform.email.from_name_desc', undefined, 'Nama brand atau entitas yang tampil di inbox penerima (cth: Seruwit Platform).')}
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${emailFromNameIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SPECIFIC VIEW: SECURITY GROUP */}
                    {currentGroup === 'security' && (
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                        <span className="material-symbols-outlined text-[20px]">security</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {t('settings.platform.security.title', undefined, 'Keamanan & Autentikasi Central')}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {t('settings.platform.security.description', undefined, 'Kebijakan keamanan akses dashboard central, proteksi brute force login, dan otentikasi multi-faktor.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                {maxAttemptsIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="security_max_attempts"
                                            value={t('settings.platform.security.max_attempts_label', undefined, 'Batas Percobaan Login Gagal')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <TextInput
                                                id="security_max_attempts"
                                                type="number"
                                                className="block w-full !rounded-xl !py-2.5 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                value={data.settings[maxAttemptsIndex].value}
                                                onChange={(e) => updateValue(maxAttemptsIndex, e.target.value)}
                                                required
                                            />
                                            <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                {t('settings.platform.security.attempts_suffix', undefined, 'Kali')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t('settings.platform.security.max_attempts_desc', undefined, 'Jumlah toleransi kesalahan password berturut-turut sebelum akun dibekukan sementara.')}
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${maxAttemptsIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}

                                {lockoutDurationIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="security_lockout_duration"
                                            value={t('settings.platform.security.lockout_duration_label', undefined, 'Durasi Pembekuan Akun (Menit)')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <TextInput
                                                id="security_lockout_duration"
                                                type="number"
                                                className="block w-full !rounded-xl !py-2.5 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                value={data.settings[lockoutDurationIndex].value}
                                                onChange={(e) => updateValue(lockoutDurationIndex, e.target.value)}
                                                required
                                            />
                                            <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                {t('settings.platform.security.minutes_suffix', undefined, 'Menit')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t('settings.platform.security.lockout_duration_desc', undefined, 'Waktu tunggu sebelum user diizinkan mencoba login kembali setelah limit terlampaui.')}
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${lockoutDurationIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Enforce 2FA Toggle */}
                            {enforce2faIndex >= 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div
                                        onClick={() => updateValue(enforce2faIndex, isEnforce2fa ? '0' : '1')}
                                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                            isEnforce2fa
                                                ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                                : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white shadow-xs">
                                                🛡️
                                            </span>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {t('settings.platform.security.enforce_2fa_label', undefined, 'Wajibkan Otentikasi Dua Faktor (2FA)')}
                                                </span>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {t('settings.platform.security.enforce_2fa_desc', undefined, 'Wajibkan seluruh admin central untuk memverifikasi kode 2FA (Authenticator App) saat masuk.')}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            role="switch"
                                            aria-checked={isEnforce2fa}
                                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                isEnforce2fa ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    isEnforce2fa ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${enforce2faIndex}.value`]}
                                        className="mt-1.5"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* GENERIC FALLBACK FOR OTHER GROUPS */}
                    {currentGroup !== 'general' && currentGroup !== 'capacity' && currentGroup !== 'email' && currentGroup !== 'security' && (
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{groupIcon}</span>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            {formatGroupLabel(currentGroup)}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {groupSettings.length}{' '}
                                            {t(
                                                'settings.platform.count_hint',
                                                { count: groupSettings.length },
                                                `${groupSettings.length} pengaturan platform di grup ini`,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {groupSettings.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl font-bold text-indigo-600">
                                        ⚙️
                                    </div>
                                    <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                        {t('settings.platform.empty', undefined, 'Belum ada pengaturan di grup ini')}
                                    </h3>
                                </div>
                            ) : (
                                groupSettings.map((setting, index) => (
                                    <div
                                        key={setting.id}
                                        className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0 dark:border-slate-800"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <InputLabel
                                                        htmlFor={`value-${setting.id}`}
                                                        value={setting.label}
                                                        className="!text-xs !font-bold !uppercase !tracking-wider"
                                                    />
                                                </div>

                                                {setting.description && (
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {setting.description}
                                                    </p>
                                                )}

                                                <div className="mt-3 max-w-xl">
                                                    {setting.type === 'textarea' || setting.type === 'json' ? (
                                                        <textarea
                                                            id={`value-${setting.id}`}
                                                            rows={4}
                                                            className="block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                                            value={data.settings[index].value}
                                                            onChange={(e) => updateValue(index, e.target.value)}
                                                        />
                                                    ) : setting.type === 'boolean' ? (
                                                        <div
                                                            onClick={() =>
                                                                updateValue(index, data.settings[index].value === '1' ? '0' : '1')
                                                            }
                                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60"
                                                        >
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                {data.settings[index].value === '1'
                                                                    ? 'Aktif (Enabled)'
                                                                    : 'Nonaktif (Disabled)'}
                                                            </span>
                                                            <div
                                                                role="switch"
                                                                aria-checked={data.settings[index].value === '1'}
                                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                                    data.settings[index].value === '1'
                                                                        ? 'bg-indigo-600'
                                                                        : 'bg-slate-300 dark:bg-slate-700'
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                        data.settings[index].value === '1'
                                                                            ? 'translate-x-5'
                                                                            : 'translate-x-0'
                                                                    }`}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <TextInput
                                                            id={`value-${setting.id}`}
                                                            type={setting.type === 'number' ? 'number' : 'text'}
                                                            className="block w-full !rounded-xl !py-2 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                            value={data.settings[index].value}
                                                            onChange={(e) => updateValue(index, e.target.value)}
                                                        />
                                                    )}

                                                    <InputError
                                                        message={
                                                            (errors as Record<string, string>)[`settings.${index}.value`]
                                                        }
                                                        className="mt-1.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Bottom Action Card */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {t('settings.platform.groups.' + currentGroup, undefined, formatGroupLabel(currentGroup))}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {recentlySuccessful && (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                                    <span>✓</span>
                                    <span>{t('settings.platform.saved', undefined, 'Tersimpan')}</span>
                                </span>
                            )}
                            <PrimaryButton
                                disabled={processing}
                                className="!rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs hover:shadow-sm"
                            >
                                {t('settings.platform.save', undefined, 'Simpan Pengaturan Platform')}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
