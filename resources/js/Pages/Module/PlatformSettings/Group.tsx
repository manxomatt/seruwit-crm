import CentralWhatsAppPanel, { DeviceStatus } from './CentralWhatsAppPanel';
import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useState } from 'react';

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
    hasSmtpPassword?: boolean;
    hasGeminiApiKey?: boolean;
    hasGroqApiKey?: boolean;
    deviceStatus?: DeviceStatus | null;
    sessionId?: string | null;
}

const GROUP_ICONS: Record<string, string> = {
    general: '⚙️',
    ai: '🧠',
    capacity: '🚗',
    billing: '💳',
    email: '✉️',
    whatsapp: '💬',
    security: '🛡️',
};

export default function Group({
    groupSettings,
    groups,
    currentGroup,
    systemModes,
    hasSmtpPassword = false,
    hasGeminiApiKey = false,
    hasGroqApiKey = false,
    deviceStatus = null,
    sessionId = null,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { flash, auth } = usePage<{
        flash?: { success?: string; error?: string };
        auth?: { user?: { email?: string } };
    }>().props;

    const [showTestEmailModal, setShowTestEmailModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // AI credentials testing state
    const [testingGemini, setTestingGemini] = useState(false);
    const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showGeminiKey, setShowGeminiKey] = useState(false);

    const [testingGroq, setTestingGroq] = useState(false);
    const [groqTestResult, setGroqTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showGroqKey, setShowGroqKey] = useState(false);

    const { data, setData, post, processing, errors, recentlySuccessful, isDirty } = useForm({
        group: currentGroup,
        settings: groupSettings.map((s) => ({
            id: s.id,
            value: s.value ?? '',
        })),
    });

    const testEmailForm = useForm({
        recipient: auth?.user?.email ?? '',
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

    const handleSendTestEmail: FormEventHandler = (e) => {
        e.preventDefault();
        testEmailForm.post(route('module.platform-settings.test-email'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowTestEmailModal(false);
            },
        });
    };

    const handleTestGemini = async () => {
        setTestingGemini(true);
        setGeminiTestResult(null);
        try {
            const res = await axios.post(route('module.platform-settings.test-ai'), {
                provider: 'gemini',
                api_key: geminiApiKeyIndex >= 0 ? data.settings[geminiApiKeyIndex]?.value : '',
                model: geminiModelIndex >= 0 ? data.settings[geminiModelIndex]?.value : '',
                base_url: geminiBaseUrlIndex >= 0 ? data.settings[geminiBaseUrlIndex]?.value : '',
            });
            setGeminiTestResult({ success: true, message: res.data.message });
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Gagal terhubung ke Gemini.';
            setGeminiTestResult({ success: false, message: msg });
        } finally {
            setTestingGemini(false);
        }
    };

    const handleTestGroq = async () => {
        setTestingGroq(true);
        setGroqTestResult(null);
        try {
            const res = await axios.post(route('module.platform-settings.test-ai'), {
                provider: 'groq',
                api_key: groqApiKeyIndex >= 0 ? data.settings[groqApiKeyIndex]?.value : '',
                model: groqModelIndex >= 0 ? data.settings[groqModelIndex]?.value : '',
                base_url: groqBaseUrlIndex >= 0 ? data.settings[groqBaseUrlIndex]?.value : '',
            });
            setGroqTestResult({ success: true, message: res.data.message });
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Gagal terhubung ke Groq.';
            setGroqTestResult({ success: false, message: msg });
        } finally {
            setTestingGroq(false);
        }
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

    const maintenanceModeIndex = findSettingIndex('general.maintenance_mode');
    const isMaintenanceMode = maintenanceModeIndex >= 0 ? data.settings[maintenanceModeIndex]?.value === '1' : false;

    const maintenanceMsgIndex = findSettingIndex('general.maintenance_message');

    const allowPublicRegIndex = findSettingIndex('general.allow_public_registration');
    const isAllowPublicReg = allowPublicRegIndex >= 0 ? data.settings[allowPublicRegIndex]?.value === '1' : true;

    const defaultTrialDaysIndex = findSettingIndex('general.default_tenant_trial_days');

    const platformNameIndex = findSettingIndex('general.platform_name');
    const platformTaglineIndex = findSettingIndex('general.platform_tagline');
    const adminEmailIndex = findSettingIndex('general.admin_email');
    const supportUrlIndex = findSettingIndex('general.support_url');
    const platformLogoIndex = findSettingIndex('general.platform_logo');
    const platformFaviconIndex = findSettingIndex('general.platform_favicon');

    const requireVerificationIndex = findSettingIndex('general.require_tenant_verification');
    const isRequireVerification = requireVerificationIndex >= 0 ? data.settings[requireVerificationIndex]?.value === '1' : true;

    const defaultTimezoneIndex = findSettingIndex('general.default_timezone');
    const defaultLocaleIndex = findSettingIndex('general.default_locale');
    const defaultCurrencyIndex = findSettingIndex('general.default_currency');

    const termsUrlIndex = findSettingIndex('general.terms_url');
    const privacyUrlIndex = findSettingIndex('general.privacy_url');

    const aiFeaturesIndex = findSettingIndex('general.ai_features_enabled');
    const isAiEnabled = aiFeaturesIndex >= 0 ? data.settings[aiFeaturesIndex]?.value === '1' : false;

    const aiOcrIndex = findSettingIndex('general.ai_ocr_enabled');
    const isAiOcrEnabled = aiOcrIndex >= 0 ? data.settings[aiOcrIndex]?.value === '1' : true;

    const aiQuickFillIndex = findSettingIndex('general.ai_quick_fill_enabled');
    const isAiQuickFillEnabled = aiQuickFillIndex >= 0 ? data.settings[aiQuickFillIndex]?.value === '1' : true;

    // AI Configuration & Provider indices
    const geminiApiKeyIndex = findSettingIndex('ai.gemini_api_key');
    const geminiModelIndex = findSettingIndex('ai.gemini_model');
    const geminiBaseUrlIndex = findSettingIndex('ai.gemini_base_url');
    const aiKycDriverIndex = findSettingIndex('ai.kyc_driver');
    const groqApiKeyIndex = findSettingIndex('ai.groq_api_key');
    const groqModelIndex = findSettingIndex('ai.groq_model');
    const groqBaseUrlIndex = findSettingIndex('ai.groq_base_url');

    // Capacity indices
    const businessModelIndex = findSettingIndex('capacity.business_model');
    const businessModel = businessModelIndex >= 0 ? data.settings[businessModelIndex]?.value || 'per_vehicle_trial' : 'per_vehicle_trial';

    const trialDurationDaysIndex = findSettingIndex('capacity.vehicle_trial_duration_days');
    const maxTrialVehiclesIndex = findSettingIndex('capacity.max_trial_vehicles_per_tenant');

    const preventDuplicatePlateIndex = findSettingIndex('capacity.prevent_duplicate_plate_trial');
    const isPreventDuplicatePlate = preventDuplicatePlateIndex >= 0 ? data.settings[preventDuplicatePlateIndex]?.value === '1' : true;

    const lifetimeCreditIndex = findSettingIndex('capacity_credits_lifetime_enabled');
    const isLifetimeCredit = lifetimeCreditIndex >= 0 ? data.settings[lifetimeCreditIndex]?.value === '1' : true;

    const pauseMaintenanceIndex = findSettingIndex('pause_during_maintenance_enabled');
    const isPauseMaintenance = pauseMaintenanceIndex >= 0 ? data.settings[pauseMaintenanceIndex]?.value === '1' : false;

    const showDashboardPricingIndex = findSettingIndex('capacity.show_dashboard_pricing_section');
    const isShowDashboardPricing = showDashboardPricingIndex >= 0 ? data.settings[showDashboardPricingIndex]?.value === '1' : true;

    const showVehicleQuotaSectionIndex = findSettingIndex('capacity.show_vehicle_quota_section');
    const isShowVehicleQuotaSection = showVehicleQuotaSectionIndex >= 0 ? data.settings[showVehicleQuotaSectionIndex]?.value === '1' : true;

    const durationDaysIndex = findSettingIndex('vehicle_activation_duration_days');
    const graceDaysIndex = findSettingIndex('vehicle_grace_period_days');

    // Email SMTP indices
    const smtpHostIndex = findSettingIndex('email.smtp_host');
    const smtpPortIndex = findSettingIndex('email.smtp_port');
    const smtpEncryptionIndex = findSettingIndex('email.smtp_encryption');
    const smtpUsernameIndex = findSettingIndex('email.smtp_username');
    const smtpPasswordIndex = findSettingIndex('email.smtp_password');
    const emailFromAddressIndex = findSettingIndex('email.from_address');
    const emailFromNameIndex = findSettingIndex('email.from_name');

    const isSmtpConfigured =
        smtpHostIndex >= 0 &&
        Boolean(data.settings[smtpHostIndex]?.value) &&
        emailFromAddressIndex >= 0 &&
        Boolean(data.settings[emailFromAddressIndex]?.value);

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

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-900 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold shadow-xs">
                            ✓
                        </span>
                        <span>{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-semibold text-rose-900 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs">
                            ✕
                        </span>
                        <span>{flash.error}</span>
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

                            {/* Maintenance Mode Modern Card */}
                            {maintenanceModeIndex >= 0 && (
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-xs">
                                                <span className="material-symbols-outlined text-[20px]">construction</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.general_settings.maintenance_title', undefined, 'Mode Pemeliharaan Sistem (Maintenance Mode)')}
                                                    </h3>
                                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                                        HTTP 503
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {t(
                                                        'settings.platform.general_settings.maintenance_desc',
                                                        undefined,
                                                        'Kunci akses publik sementara saat perbaikan server atau rilis pembaruan besar.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                isMaintenanceMode
                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isMaintenanceMode ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                                                }`}
                                            />
                                            {isMaintenanceMode
                                                ? t('settings.platform.general_settings.maintenance_active', undefined, 'MODE PEMELIHARAAN AKTIF')
                                                : t('settings.platform.general_settings.maintenance_inactive', undefined, 'SISTEM NORMAL')}
                                        </span>
                                    </div>

                                    {/* Maintenance Toggle */}
                                    <div className="mt-5">
                                        <div
                                            onClick={() => updateValue(maintenanceModeIndex, isMaintenanceMode ? '0' : '1')}
                                            className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                                isMaintenanceMode
                                                    ? 'border-rose-300 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/30'
                                                    : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/90'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm text-white shadow-xs ${isMaintenanceMode ? 'bg-rose-600' : 'bg-slate-500'}`}>
                                                    🛠️
                                                </span>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.general_settings.maintenance_toggle_label', undefined, 'Aktifkan Mode Pemeliharaan Platform')}
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {isMaintenanceMode
                                                            ? t(
                                                                  'settings.platform.general_settings.maintenance_toggle_active_desc',
                                                                  undefined,
                                                                  'Pengunjung umum akan melihat halaman Under Maintenance (HTTP 503). Administrator login tetap dapat mengakses sistem.',
                                                              )
                                                            : t(
                                                                  'settings.platform.general_settings.maintenance_toggle_inactive_desc',
                                                                  undefined,
                                                                  'Platform beroperasi normal dan dapat diakses oleh semua pengguna dan pengunjung.',
                                                              )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                role="switch"
                                                aria-checked={isMaintenanceMode}
                                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                    isMaintenanceMode ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                        isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                        {isDirty && (
                                            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                <span>⚠️</span>
                                                <span>Pengaturan belum tersimpan — klik tombol <strong>"Simpan Pengaturan Platform"</strong> di bawah untuk menerapkan.</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Maintenance Message Textarea */}
                                    {maintenanceMsgIndex >= 0 && (
                                        <div className="mt-4">
                                            <InputLabel
                                                htmlFor="maintenance_message"
                                                value={t('settings.platform.general_settings.maintenance_msg_label', undefined, 'Pesan Pemeliharaan untuk Pengunjung')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.general_settings.maintenance_msg_desc', undefined, 'Pesan penjelasan yang tampil di layar saat pengunjung membuka platform di mode maintenance.')}
                                            </p>
                                            <textarea
                                                id="maintenance_message"
                                                rows={2}
                                                value={data.settings[maintenanceMsgIndex]?.value ?? ''}
                                                onChange={(e) => updateValue(maintenanceMsgIndex, e.target.value)}
                                                placeholder="Sistem sedang dalam peningkatan performa berkala. Silakan coba beberapa saat lagi."
                                                className="w-full rounded-2xl border-slate-200 text-xs shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${maintenanceMsgIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tenant Onboarding & Registration Policy Card */}
                            {allowPublicRegIndex >= 0 && (
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-xs">
                                                <span className="material-symbols-outlined text-[20px]">domain_add</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.general_settings.onboarding_title', undefined, 'Kebijakan Pendaftaran Tenant (Workspace Onboarding)')}
                                                    </h3>
                                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                        Onboarding
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {t(
                                                        'settings.platform.general_settings.onboarding_desc',
                                                        undefined,
                                                        'Kontrol mekanisme pembukaan pendaftaran bisnis/tenant baru di platform.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                isAllowPublicReg
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isAllowPublicReg ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`}
                                            />
                                            {isAllowPublicReg
                                                ? t('settings.platform.general_settings.reg_open_badge', undefined, 'PENDAFTARAN BUKA')
                                                : t('settings.platform.general_settings.reg_closed_badge', undefined, 'INVITE ONLY / TUTUP')}
                                        </span>
                                    </div>

                                    {/* Public Registration Switch */}
                                    <div className="mt-5">
                                        <div
                                            onClick={() => updateValue(allowPublicRegIndex, isAllowPublicReg ? '0' : '1')}
                                            className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                                isAllowPublicReg
                                                    ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/60 via-sky-50/40 to-white dark:border-indigo-900/60 dark:from-indigo-950/30 dark:via-sky-950/20 dark:to-slate-900'
                                                    : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/90'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white shadow-xs">
                                                    🏢
                                                </span>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.general_settings.reg_toggle_label', undefined, 'Pendaftaran Mandiri Terbuka (Public Self-Registration)')}
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {isAllowPublicReg
                                                            ? t(
                                                                  'settings.platform.general_settings.reg_toggle_active_desc',
                                                                  undefined,
                                                                  'Calon tenant dapat langsung mendaftarkan akun dan workspace baru dari halaman registrasi publik.',
                                                              )
                                                            : t(
                                                                  'settings.platform.general_settings.reg_toggle_inactive_desc',
                                                                  undefined,
                                                                  'Pendaftaran publik ditutup. Tenant baru hanya dapat dibuat langsung oleh admin atau via tautan undangan.',
                                                              )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                role="switch"
                                                aria-checked={isAllowPublicReg}
                                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                    isAllowPublicReg ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                        isAllowPublicReg ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Default Tenant Trial Duration */}
                                    {defaultTrialDaysIndex >= 0 && (
                                        <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                                            <InputLabel
                                                htmlFor="default_tenant_trial_days"
                                                value={t('settings.platform.general_settings.trial_days_label', undefined, 'Durasi Free Trial Default untuk Tenant Baru (Hari)')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.general_settings.trial_days_desc', undefined, 'Masa aktif gratis otomatis yang diberikan kepada workspace baru saat pertama kali registrasi.')}
                                            </p>
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                <TextInput
                                                    id="default_tenant_trial_days"
                                                    type="number"
                                                    min="0"
                                                    max="365"
                                                    value={data.settings[defaultTrialDaysIndex]?.value ?? ''}
                                                    onChange={(e) => updateValue(defaultTrialDaysIndex, e.target.value)}
                                                    className="w-full sm:w-48 font-mono text-xs"
                                                />
                                                <div className="flex items-center gap-1.5">
                                                    {['14', '30', '60'].map((days) => (
                                                        <button
                                                            key={days}
                                                            type="button"
                                                            onClick={() => updateValue(defaultTrialDaysIndex, days)}
                                                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                                                data.settings[defaultTrialDaysIndex]?.value === days
                                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300'
                                                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}
                                                        >
                                                            {days} Hari
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${defaultTrialDaysIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Require Tenant Contact Verification Switch */}
                                    {requireVerificationIndex >= 0 && (
                                        <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                                            <div
                                                onClick={() => updateValue(requireVerificationIndex, isRequireVerification ? '0' : '1')}
                                                className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                                    isRequireVerification
                                                        ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                                        : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-[20px] text-indigo-600 dark:text-indigo-400">
                                                        verified_user
                                                    </span>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                            {t('settings.platform.general_settings.require_verification_label', undefined, 'Wajib Verifikasi Kontak Tenant Baru')}
                                                        </span>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            {t(
                                                                'settings.platform.general_settings.require_verification_desc',
                                                                undefined,
                                                                'Mewajibkan pemilik tenant memverifikasi email atau nomor telepon sebelum workspace aktif penuh.',
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    role="switch"
                                                    aria-checked={isRequireVerification}
                                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                        isRequireVerification ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                                    }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                            isRequireVerification ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Official Platform Identity & Brand Card */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
                                            <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                {t('settings.platform.general_settings.identity_title', undefined, 'Identitas & Informasi Resmi Platform')}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {t(
                                                    'settings.platform.general_settings.identity_desc',
                                                    undefined,
                                                    'Informasi merek sentral yang digunakan di seluruh header sistem, email notifikasi pusat, dan footer.',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    {/* Platform Name */}
                                    {platformNameIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="platform_name"
                                                value={t('settings.platform.general_settings.platform_name_label', undefined, 'Nama Resmi Platform')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.general_settings.platform_name_desc', undefined, 'Nama platform yang tampil pada judul tab browser dan email notifikasi sistem.')}
                                            </p>
                                            <TextInput
                                                id="platform_name"
                                                type="text"
                                                value={data.settings[platformNameIndex]?.value ?? ''}
                                                onChange={(e) => updateValue(platformNameIndex, e.target.value)}
                                                placeholder="Seruwit CRM"
                                                className="w-full text-xs"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${platformNameIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Platform Tagline */}
                                    {platformTaglineIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="platform_tagline"
                                                value={t('settings.platform.general_settings.tagline_label', undefined, 'Slogan / Tagline Platform')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.general_settings.tagline_desc', undefined, 'Slogan singkat yang tampil pada halaman login dan pendaftaran.')}
                                            </p>
                                            <TextInput
                                                id="platform_tagline"
                                                type="text"
                                                value={data.settings[platformTaglineIndex]?.value ?? ''}
                                                onChange={(e) => updateValue(platformTaglineIndex, e.target.value)}
                                                placeholder="Sistem Manajemen Armada & Rental Terintegrasi"
                                                className="w-full text-xs"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${platformTaglineIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Admin Notification Email */}
                                    {adminEmailIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="platform_admin_email"
                                                value={t('settings.platform.general_settings.admin_email_label', undefined, 'Email Administrator Sentral')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.general_settings.admin_email_desc', undefined, 'Email utama penerima laporan otomatis sistem dan notifikasi pendaftaran tenant baru.')}
                                            </p>
                                            <TextInput
                                                id="platform_admin_email"
                                                type="email"
                                                value={data.settings[adminEmailIndex]?.value ?? ''}
                                                onChange={(e) => updateValue(adminEmailIndex, e.target.value)}
                                                placeholder="admin@seruwit.com"
                                                className="w-full text-xs"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${adminEmailIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Support URL */}
                                    {supportUrlIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="platform_support_url"
                                                value={t('settings.platform.general_settings.support_url_label', undefined, 'Tautan Bantuan / Layanan Pelanggan (Helpdesk URL)')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.general_settings.support_url_desc', undefined, 'URL resmi bantuan (WhatsApp CS, Help Center, atau tautan panduan penggunaan).')}
                                            </p>
                                            <TextInput
                                                id="platform_support_url"
                                                type="url"
                                                value={data.settings[supportUrlIndex]?.value ?? ''}
                                                onChange={(e) => updateValue(supportUrlIndex, e.target.value)}
                                                placeholder="https://wa.me/628123456789"
                                                className="w-full text-xs"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${supportUrlIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Platform Logo */}
                                    {platformLogoIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="platform_logo"
                                                value={t('settings.platform.general_settings.logo_label', undefined, 'URL Logo Resmi Platform')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.general_settings.logo_desc', undefined, 'URL atau path file gambar logo sentral.')}
                                            </p>
                                            <TextInput
                                                id="platform_logo"
                                                type="text"
                                                value={data.settings[platformLogoIndex]?.value ?? ''}
                                                onChange={(e) => updateValue(platformLogoIndex, e.target.value)}
                                                placeholder="/images/logo.png"
                                                className="w-full text-xs font-mono"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${platformLogoIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Platform Favicon */}
                                    {platformFaviconIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="platform_favicon"
                                                value={t('settings.platform.general_settings.favicon_label', undefined, 'URL Favicon Platform')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.general_settings.favicon_desc', undefined, 'URL ikon favicon browser untuk domain central.')}
                                            </p>
                                            <TextInput
                                                id="platform_favicon"
                                                type="text"
                                                value={data.settings[platformFaviconIndex]?.value ?? ''}
                                                onChange={(e) => updateValue(platformFaviconIndex, e.target.value)}
                                                placeholder="/favicon.ico"
                                                className="w-full text-xs font-mono"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${platformFaviconIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Central Localization & Standards Card */}
                            {(defaultTimezoneIndex >= 0 || defaultLocaleIndex >= 0 || defaultCurrencyIndex >= 0) && (
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                                                <span className="material-symbols-outlined text-[20px]">language</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {t('settings.platform.general_settings.localization_title', undefined, 'Lokalisasi & Standar Format Sentral')}
                                                </h3>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {t(
                                                        'settings.platform.general_settings.localization_desc',
                                                        undefined,
                                                        'Pengaturan acuan zona waktu, bahasa bawaan, dan mata uang platform.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-3">
                                        {/* Default Timezone */}
                                        {defaultTimezoneIndex >= 0 && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="default_timezone"
                                                    value={t('settings.platform.general_settings.timezone_label', undefined, 'Zona Waktu Default (Timezone)')}
                                                />
                                                <p className="mb-2 text-[11px] text-slate-500">
                                                    {t('settings.platform.general_settings.timezone_desc', undefined, 'Zona waktu standar untuk workspace baru dan pencatatan riwayat sistem.')}
                                                </p>
                                                <select
                                                    id="default_timezone"
                                                    value={data.settings[defaultTimezoneIndex]?.value ?? 'Asia/Jakarta'}
                                                    onChange={(e) => updateValue(defaultTimezoneIndex, e.target.value)}
                                                    className="w-full rounded-2xl border-slate-200 text-xs shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                >
                                                    <option value="Asia/Jakarta">Asia/Jakarta (WIB - UTC+7)</option>
                                                    <option value="Asia/Makassar">Asia/Makassar (WITA - UTC+8)</option>
                                                    <option value="Asia/Jayapura">Asia/Jayapura (WIT - UTC+9)</option>
                                                    <option value="UTC">UTC (Universal Time)</option>
                                                </select>
                                                <InputError
                                                    message={(errors as Record<string, string>)[`settings.${defaultTimezoneIndex}.value`]}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}

                                        {/* Default Locale */}
                                        {defaultLocaleIndex >= 0 && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="default_locale"
                                                    value={t('settings.platform.general_settings.locale_label', undefined, 'Bahasa Default Sistem')}
                                                />
                                                <p className="mb-2 text-[11px] text-slate-500">
                                                    {t('settings.platform.general_settings.locale_desc', undefined, 'Bahasa bawaan antarmuka pengguna untuk workspace baru.')}
                                                </p>
                                                <select
                                                    id="default_locale"
                                                    value={data.settings[defaultLocaleIndex]?.value ?? 'id'}
                                                    onChange={(e) => updateValue(defaultLocaleIndex, e.target.value)}
                                                    className="w-full rounded-2xl border-slate-200 text-xs shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                >
                                                    <option value="id">Bahasa Indonesia (id)</option>
                                                    <option value="en">English (en)</option>
                                                </select>
                                                <InputError
                                                    message={(errors as Record<string, string>)[`settings.${defaultLocaleIndex}.value`]}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}

                                        {/* Default Currency */}
                                        {defaultCurrencyIndex >= 0 && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="default_currency"
                                                    value={t('settings.platform.general_settings.currency_label', undefined, 'Mata Uang Acuan Sistem')}
                                                />
                                                <p className="mb-2 text-[11px] text-slate-500">
                                                    {t('settings.platform.general_settings.currency_desc', undefined, 'Mata uang default untuk penagihan invoice platform dan biaya operasional.')}
                                                </p>
                                                <select
                                                    id="default_currency"
                                                    value={data.settings[defaultCurrencyIndex]?.value ?? 'IDR'}
                                                    onChange={(e) => updateValue(defaultCurrencyIndex, e.target.value)}
                                                    className="w-full rounded-2xl border-slate-200 text-xs shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                >
                                                    <option value="IDR">IDR (Rupiah Indonesia - Rp)</option>
                                                    <option value="USD">USD (US Dollar - $)</option>
                                                    <option value="SGD">SGD (Singapore Dollar - S$)</option>
                                                    <option value="MYR">MYR (Ringgit Malaysia - RM)</option>
                                                </select>
                                                <InputError
                                                    message={(errors as Record<string, string>)[`settings.${defaultCurrencyIndex}.value`]}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Legal Policies Card */}
                            {(termsUrlIndex >= 0 || privacyUrlIndex >= 0) && (
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xs">
                                                <span className="material-symbols-outlined text-[20px]">gavel</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {t('settings.platform.general_settings.legal_title', undefined, 'Kebijakan Hukum & Syarat Ketentuan')}
                                                </h3>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {t(
                                                        'settings.platform.general_settings.legal_desc',
                                                        undefined,
                                                        'Tautan ke dokumen legalitas resmi yang disematkan pada formulir pendaftaran tenant dan dokumen publik.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        {/* Terms URL */}
                                        {termsUrlIndex >= 0 && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="terms_url"
                                                    value={t('settings.platform.general_settings.terms_url_label', undefined, 'URL Syarat & Ketentuan (Terms of Service)')}
                                                />
                                                <p className="mb-2 text-[11px] text-slate-500">
                                                    {t('settings.platform.general_settings.terms_url_desc', undefined, 'Tautan ke dokumen syarat & ketentuan layanan.')}
                                                </p>
                                                <TextInput
                                                    id="terms_url"
                                                    type="url"
                                                    value={data.settings[termsUrlIndex]?.value ?? ''}
                                                    onChange={(e) => updateValue(termsUrlIndex, e.target.value)}
                                                    placeholder="https://seruwit.com/terms"
                                                    className="w-full text-xs font-mono"
                                                />
                                                <InputError
                                                    message={(errors as Record<string, string>)[`settings.${termsUrlIndex}.value`]}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}

                                        {/* Privacy URL */}
                                        {privacyUrlIndex >= 0 && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="privacy_url"
                                                    value={t('settings.platform.general_settings.privacy_url_label', undefined, 'URL Kebijakan Privasi (Privacy Policy)')}
                                                />
                                                <p className="mb-2 text-[11px] text-slate-500">
                                                    {t('settings.platform.general_settings.privacy_url_desc', undefined, 'Tautan ke dokumen kebijakan privasi dan perlindungan data pengguna.')}
                                                </p>
                                                <TextInput
                                                    id="privacy_url"
                                                    type="url"
                                                    value={data.settings[privacyUrlIndex]?.value ?? ''}
                                                    onChange={(e) => updateValue(privacyUrlIndex, e.target.value)}
                                                    placeholder="https://seruwit.com/privacy"
                                                    className="w-full text-xs font-mono"
                                                />
                                                <InputError
                                                    message={(errors as Record<string, string>)[`settings.${privacyUrlIndex}.value`]}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SPECIFIC VIEW: AI (ARTIFICIAL INTELLIGENCE) GROUP */}
                    {currentGroup === 'ai' && (
                        <div className="space-y-6">
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
                                            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs text-slate-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300 sm:col-span-2">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">✨</span>
                                                <span>{t('settings.platform.ai_features.modules.quick_fill', undefined, 'AI Smart Quick-Fill & Asisten Pengisian Spesifikasi Armada')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${aiFeaturesIndex}.value`]}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            {/* Dedicated AI Quick-Fill Switcher Card */}
                            {aiQuickFillIndex >= 0 && (
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-xs">
                                                <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.ai_quick_fill.label', undefined, 'Fitur AI Smart Quick-Fill (Asisten Armada)')}
                                                    </h3>
                                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                        {t('settings.platform.ai_quick_fill.badge', undefined, 'Vehicle Quick-Fill Switch')}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {t(
                                                        'settings.platform.ai_quick_fill.description',
                                                        undefined,
                                                        'Kontrol ketersediaan panel asisten AI Smart Quick-Fill di form penambahan armada seluruh tenant.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                isAiQuickFillEnabled && isAiEnabled
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isAiQuickFillEnabled && isAiEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                                                }`}
                                            />
                                            {isAiQuickFillEnabled && isAiEnabled
                                                ? t('settings.platform.ai_quick_fill.status_active', undefined, 'AKTIF DI TENANT')
                                                : t('settings.platform.ai_quick_fill.status_inactive', undefined, 'NONAKTIF DI TENANT')}
                                        </span>
                                    </div>

                                    {/* Toggle Bar */}
                                    <div className="mt-5">
                                        <div
                                            onClick={() => isAiEnabled && updateValue(aiQuickFillIndex, isAiQuickFillEnabled ? '0' : '1')}
                                            className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                                !isAiEnabled
                                                    ? 'cursor-not-allowed opacity-60 border-slate-200 bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/30'
                                                    : isAiQuickFillEnabled
                                                    ? 'cursor-pointer border-indigo-200 bg-gradient-to-r from-indigo-50/60 via-sky-50/40 to-white dark:border-indigo-900/60 dark:from-indigo-950/30 dark:via-sky-950/20 dark:to-slate-900'
                                                    : 'cursor-pointer border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/90'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white shadow-xs">
                                                    ✨
                                                </span>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {!isAiEnabled
                                                            ? t('settings.platform.ai_quick_fill.disabled_by_master_label', undefined, 'Dinonaktifkan oleh Master Switch AI')
                                                            : isAiQuickFillEnabled
                                                            ? t('settings.platform.ai_quick_fill.active_label', undefined, 'Panel Quick-Fill Muncul di Form Armada')
                                                            : t('settings.platform.ai_quick_fill.inactive_label', undefined, 'Panel Quick-Fill Disembunyikan dari Form Armada')}
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {!isAiEnabled
                                                            ? t('settings.platform.ai_quick_fill.disabled_by_master_desc', undefined, 'Aktifkan Master Switch AI terlebih dahulu untuk menggunakan fitur ini.')
                                                            : isAiQuickFillEnabled
                                                            ? t(
                                                                  'settings.platform.ai_quick_fill.active_desc',
                                                                  undefined,
                                                                  'Form pendaftaran kendaraan armada di seluruh tenant menampilkan panel asisten AI Smart Quick-Fill.',
                                                              )
                                                            : t(
                                                                  'settings.platform.ai_quick_fill.inactive_desc',
                                                                  undefined,
                                                                  'Panel asisten AI disembunyikan. Petugas tenant mengisi spesifikasi unit secara manual tanpa asisten AI.',
                                                              )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Reliable Animated Switch */}
                                            <div
                                                role="switch"
                                                aria-checked={isAiQuickFillEnabled && isAiEnabled}
                                                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                    !isAiEnabled
                                                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                                                        : isAiQuickFillEnabled
                                                        ? 'bg-indigo-600 cursor-pointer'
                                                        : 'bg-slate-300 dark:bg-slate-700 cursor-pointer'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                        isAiQuickFillEnabled && isAiEnabled ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${aiQuickFillIndex}.value`]}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            {/* Dedicated AI OCR Document Switcher Card */}
                            {aiOcrIndex >= 0 && (
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xs">
                                                <span className="material-symbols-outlined text-[20px]">document_scanner</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.ai_ocr.label', undefined, 'Fitur AI OCR Dokumen (KTP / SIM)')}
                                                    </h3>
                                                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                        {t('settings.platform.ai_ocr.badge', undefined, 'Tenant Scanner Switch')}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {t(
                                                        'settings.platform.ai_ocr.description',
                                                        undefined,
                                                        'Kontrol ketersediaan tombol & pemindai AI OCR dokumen KTP/SIM di form reservasi dan walk-in pelanggan seluruh tenant.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                isAiOcrEnabled && isAiEnabled
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isAiOcrEnabled && isAiEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                                                }`}
                                            />
                                            {isAiOcrEnabled && isAiEnabled
                                                ? t('settings.platform.ai_ocr.status_active', undefined, 'AKTIF DI TENANT')
                                                : t('settings.platform.ai_ocr.status_inactive', undefined, 'NONAKTIF DI TENANT')}
                                        </span>
                                    </div>

                                    {/* Toggle Bar */}
                                    <div className="mt-5">
                                        <div
                                            onClick={() => isAiEnabled && updateValue(aiOcrIndex, isAiOcrEnabled ? '0' : '1')}
                                            className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                                !isAiEnabled
                                                    ? 'cursor-not-allowed opacity-60 border-slate-200 bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/30'
                                                    : isAiOcrEnabled
                                                    ? 'cursor-pointer border-purple-200 bg-gradient-to-r from-purple-50/60 via-indigo-50/40 to-white dark:border-purple-900/60 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-slate-900'
                                                    : 'cursor-pointer border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800/90'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-sm text-white shadow-xs">
                                                    📸
                                                </span>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {!isAiEnabled
                                                            ? t('settings.platform.ai_ocr.disabled_by_master_label', undefined, 'Dinonaktifkan oleh Master Switch AI')
                                                            : isAiOcrEnabled
                                                            ? t('settings.platform.ai_ocr.active_label', undefined, 'Scanner OCR KTP & SIM Muncul di Tenant')
                                                            : t('settings.platform.ai_ocr.inactive_label', undefined, 'Scanner OCR KTP & SIM Disembunyikan dari Tenant')}
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {!isAiEnabled
                                                            ? t('settings.platform.ai_ocr.disabled_by_master_desc', undefined, 'Aktifkan Master Switch AI terlebih dahulu untuk menggunakan fitur ini.')
                                                            : isAiOcrEnabled
                                                            ? t(
                                                                  'settings.platform.ai_ocr.active_desc',
                                                                  undefined,
                                                                  'Form walk-in dan reservasi pelanggan di tenant menampilkan tombol pemindaian foto KTP/SIM otomatis.',
                                                              )
                                                            : t(
                                                                  'settings.platform.ai_ocr.inactive_desc',
                                                                  undefined,
                                                                  'Seluruh panel pemindai dan tombol Fast-Scan OCR dihilangkan dari halaman tenant. Petugas mengisi form secara manual.',
                                                              )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Reliable Animated Switch */}
                                            <div
                                                role="switch"
                                                aria-checked={isAiOcrEnabled && isAiEnabled}
                                                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                    !isAiEnabled
                                                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                                                        : isAiOcrEnabled
                                                        ? 'bg-purple-600 cursor-pointer'
                                                        : 'bg-slate-300 dark:bg-slate-700 cursor-pointer'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                        isAiOcrEnabled && isAiEnabled ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${aiOcrIndex}.value`]}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            {/* GOOGLE GEMINI CONFIGURATION CARD */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
                                            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {t('settings.platform.ai_credentials.gemini_title', undefined, 'Google Gemini AI Engine (Multimodal & Generation)')}
                                                </h3>
                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                    Google AI
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {t('settings.platform.ai_credentials.gemini_desc', undefined, 'Digunakan untuk AI Smart Quick-Fill armada, inspeksi foto kendaraan, dynamic pricing, dan analisis rental.')}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-bold sm:self-center ${
                                            hasGeminiApiKey || (geminiApiKeyIndex >= 0 && Boolean(data.settings[geminiApiKeyIndex]?.value))
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                hasGeminiApiKey || (geminiApiKeyIndex >= 0 && Boolean(data.settings[geminiApiKeyIndex]?.value))
                                                    ? 'bg-emerald-500'
                                                    : 'bg-amber-500'
                                            }`}
                                        />
                                        {hasGeminiApiKey || (geminiApiKeyIndex >= 0 && Boolean(data.settings[geminiApiKeyIndex]?.value))
                                            ? t('settings.platform.ai_credentials.configured_badge', undefined, 'Tersimpan & Aktif')
                                            : t('settings.platform.ai_credentials.not_configured_badge', undefined, 'Belum Dikonfigurasi')}
                                    </span>
                                </div>

                                {/* Gemini Inputs Grid */}
                                <div className="space-y-5">
                                    {/* Gemini API Key */}
                                    {geminiApiKeyIndex >= 0 && (
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <InputLabel
                                                    htmlFor="gemini_api_key"
                                                    value={t('settings.platform.ai_credentials.gemini_key_label', undefined, 'Google Gemini API Key')}
                                                />
                                                <a
                                                    href="https://aistudio.google.com/app/apikey"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                                >
                                                    Dapatkan Kunci API Google AI Studio
                                                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                                </a>
                                            </div>
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.ai_credentials.gemini_key_desc', undefined, 'Kunci API Google Gemini dari Google AI Studio. Nilai tersimpan di database dan menggantikan file .env.')}
                                            </p>
                                            <div className="relative">
                                                <TextInput
                                                    id="gemini_api_key"
                                                    type={showGeminiKey ? 'text' : 'password'}
                                                    value={data.settings[geminiApiKeyIndex]?.value}
                                                    onChange={(e) => updateValue(geminiApiKeyIndex, e.target.value)}
                                                    placeholder={
                                                        hasGeminiApiKey
                                                            ? t('settings.platform.ai_credentials.keep_existing', undefined, '•••••••••••••••• (Tersimpan di database, biarkan kosong jika tidak ingin mengubah)')
                                                            : 'AIzaSy...'
                                                    }
                                                    className="w-full pr-10 font-mono text-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {showGeminiKey ? 'visibility_off' : 'visibility'}
                                                    </span>
                                                </button>
                                            </div>
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${geminiApiKeyIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Gemini Model */}
                                    {geminiModelIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="gemini_model"
                                                value={t('settings.platform.ai_credentials.gemini_model_label', undefined, 'Model Google Gemini')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.ai_credentials.gemini_model_desc', undefined, 'Model Gemini yang aktif (contoh: gemini-2.5-flash, gemini-1.5-flash, gemini-2.5-pro).')}
                                            </p>
                                            <TextInput
                                                id="gemini_model"
                                                type="text"
                                                value={data.settings[geminiModelIndex]?.value}
                                                onChange={(e) => updateValue(geminiModelIndex, e.target.value)}
                                                placeholder="gemini-2.5-flash"
                                                className="w-full font-mono text-xs"
                                            />
                                            {/* Quick Model Presets */}
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                                <span className="text-[11px] text-slate-400">Preset Rekomendasi:</span>
                                                {[
                                                    { name: 'gemini-2.5-flash', tag: 'Default (Rekomendasi Cepat & Cerdas)' },
                                                    { name: 'gemini-1.5-flash', tag: 'Stabil' },
                                                    { name: 'gemini-2.5-pro', tag: 'Akurasi Ekstrem' },
                                                ].map((preset) => (
                                                    <button
                                                        key={preset.name}
                                                        type="button"
                                                        onClick={() => updateValue(geminiModelIndex, preset.name)}
                                                        className={`rounded-lg border px-2 py-0.5 text-[11px] transition-colors ${
                                                            data.settings[geminiModelIndex]?.value === preset.name
                                                                ? 'border-indigo-500 bg-indigo-50 font-bold text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300'
                                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {preset.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${geminiModelIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Gemini Base URL */}
                                    {geminiBaseUrlIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="gemini_base_url"
                                                value={t('settings.platform.ai_credentials.gemini_url_label', undefined, 'Base Endpoint Google Gemini')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.ai_credentials.gemini_url_desc', undefined, 'URL dasar Google Generative Language API.')}
                                            </p>
                                            <TextInput
                                                id="gemini_base_url"
                                                type="text"
                                                value={data.settings[geminiBaseUrlIndex]?.value}
                                                onChange={(e) => updateValue(geminiBaseUrlIndex, e.target.value)}
                                                placeholder="https://generativelanguage.googleapis.com/v1beta"
                                                className="w-full font-mono text-xs"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${geminiBaseUrlIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Test Connection Button & Result Alert */}
                                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                                        <SecondaryButton
                                            type="button"
                                            onClick={handleTestGemini}
                                            disabled={testingGemini}
                                            className="inline-flex items-center justify-center gap-2 text-xs"
                                        >
                                            {testingGemini ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                                    <span>{t('settings.platform.ai_credentials.testing', undefined, 'Menguji...')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[16px] text-blue-600">bolt</span>
                                                    <span>{t('settings.platform.ai_credentials.test_gemini', undefined, 'Uji Koneksi Gemini')}</span>
                                                </>
                                            )}
                                        </SecondaryButton>
                                        <span className="text-[11px] text-slate-400">
                                            Kirim prompt uji coba langsung ke API Gemini untuk memvalidasi kunci.
                                        </span>
                                    </div>

                                    {geminiTestResult && (
                                        <div
                                            className={`rounded-2xl border p-3.5 text-xs transition-all ${
                                                geminiTestResult.success
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="material-symbols-outlined shrink-0 text-[18px]">
                                                    {geminiTestResult.success ? 'check_circle' : 'error'}
                                                </span>
                                                <span>{geminiTestResult.message}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* GROQ CLOUD & OCR SCANNER CONFIGURATION CARD */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs">
                                            <span className="material-symbols-outlined text-[20px]">speed</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {t('settings.platform.ai_credentials.groq_title', undefined, 'Groq Cloud & Fast OCR Scanner (Fast LPU)')}
                                                </h3>
                                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                                    Groq LPU
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {t('settings.platform.ai_credentials.groq_desc', undefined, 'Digunakan untuk pemindaian OCR dokumen KTP/SIM pelanggan dengan inferensi ultra-cepat.')}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-bold sm:self-center ${
                                            hasGroqApiKey || (groqApiKeyIndex >= 0 && Boolean(data.settings[groqApiKeyIndex]?.value))
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                hasGroqApiKey || (groqApiKeyIndex >= 0 && Boolean(data.settings[groqApiKeyIndex]?.value))
                                                    ? 'bg-emerald-500'
                                                    : 'bg-amber-500'
                                            }`}
                                        />
                                        {hasGroqApiKey || (groqApiKeyIndex >= 0 && Boolean(data.settings[groqApiKeyIndex]?.value))
                                            ? t('settings.platform.ai_credentials.configured_badge', undefined, 'Tersimpan & Aktif')
                                            : t('settings.platform.ai_credentials.not_configured_badge', undefined, 'Belum Dikonfigurasi')}
                                    </span>
                                </div>

                                {/* Groq Inputs Grid */}
                                <div className="space-y-5">
                                    {/* Primary KYC Driver Selection */}
                                    {aiKycDriverIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                value={t('settings.platform.ai_credentials.kyc_driver_label', undefined, 'Penyedia Utama Scanner OCR Dokumen')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.ai_credentials.kyc_driver_desc', undefined, 'Pilih driver default untuk OCR KTP dan SIM pelanggan.')}
                                            </p>
                                            <div className="grid gap-2 sm:grid-cols-3">
                                                {[
                                                    { value: 'auto', label: 'Otomatis', desc: 'Prioritas Groq, fallback ke Gemini jika offline' },
                                                    { value: 'groq', label: 'Groq Cloud LPU', desc: 'Inferensi ultra cepat ~500ms' },
                                                    { value: 'gemini', label: 'Google Gemini Vision', desc: 'Akurasi pembacaan foto resolusi tinggi' },
                                                ].map((opt) => (
                                                    <div
                                                        key={opt.value}
                                                        onClick={() => updateValue(aiKycDriverIndex, opt.value)}
                                                        className={`cursor-pointer rounded-2xl border p-3 transition-all ${
                                                            (data.settings[aiKycDriverIndex]?.value || 'auto') === opt.value
                                                                ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500/30 dark:border-orange-500 dark:bg-orange-950/30'
                                                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                {opt.label}
                                                            </span>
                                                            {(data.settings[aiKycDriverIndex]?.value || 'auto') === opt.value && (
                                                                <span className="material-symbols-outlined text-[16px] text-orange-600">
                                                                    check_circle
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-[11px] text-slate-500">{opt.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${aiKycDriverIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Groq API Key */}
                                    {groqApiKeyIndex >= 0 && (
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <InputLabel
                                                    htmlFor="groq_api_key"
                                                    value={t('settings.platform.ai_credentials.groq_key_label', undefined, 'Groq Cloud API Key')}
                                                />
                                                <a
                                                    href="https://console.groq.com/keys"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                                                >
                                                    Dapatkan Kunci API Groq Console
                                                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                                </a>
                                            </div>
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.ai_credentials.groq_key_desc', undefined, 'Kunci API Groq Cloud dari console.groq.com. Nilai tersimpan di database dan menggantikan file .env.')}
                                            </p>
                                            <div className="relative">
                                                <TextInput
                                                    id="groq_api_key"
                                                    type={showGroqKey ? 'text' : 'password'}
                                                    value={data.settings[groqApiKeyIndex]?.value}
                                                    onChange={(e) => updateValue(groqApiKeyIndex, e.target.value)}
                                                    placeholder={
                                                        hasGroqApiKey
                                                            ? t('settings.platform.ai_credentials.keep_existing', undefined, '•••••••••••••••• (Tersimpan di database, biarkan kosong jika tidak ingin mengubah)')
                                                            : 'gsk_...'
                                                    }
                                                    className="w-full pr-10 font-mono text-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowGroqKey(!showGroqKey)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {showGroqKey ? 'visibility_off' : 'visibility'}
                                                    </span>
                                                </button>
                                            </div>
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${groqApiKeyIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Groq Model */}
                                    {groqModelIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="groq_model"
                                                value={t('settings.platform.ai_credentials.groq_model_label', undefined, 'Model Groq Cloud')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.ai_credentials.groq_model_desc', undefined, 'Model OCR Groq Cloud yang aktif (contoh: qwen/qwen3.6-27b, qwen/qwen3.8-27b, llama-3.3-70b-versatile).')}
                                            </p>
                                            <TextInput
                                                id="groq_model"
                                                type="text"
                                                value={data.settings[groqModelIndex]?.value}
                                                onChange={(e) => updateValue(groqModelIndex, e.target.value)}
                                                placeholder="qwen/qwen3.6-27b"
                                                className="w-full font-mono text-xs"
                                            />
                                            {/* Quick Model Presets */}
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                                <span className="text-[11px] text-slate-400">Preset Rekomendasi:</span>
                                                {[
                                                    { name: 'qwen/qwen3.6-27b', tag: 'Default (Rekomendasi OCR)' },
                                                    { name: 'qwen/qwen3.8-27b', tag: 'Versi Terbaru' },
                                                    { name: 'llama-3.3-70b-versatile', tag: 'Llama 70B' },
                                                ].map((preset) => (
                                                    <button
                                                        key={preset.name}
                                                        type="button"
                                                        onClick={() => updateValue(groqModelIndex, preset.name)}
                                                        className={`rounded-lg border px-2 py-0.5 text-[11px] transition-colors ${
                                                            data.settings[groqModelIndex]?.value === preset.name
                                                                ? 'border-orange-500 bg-orange-50 font-bold text-orange-700 dark:border-orange-400 dark:bg-orange-950 dark:text-orange-300'
                                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {preset.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${groqModelIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Groq Base URL */}
                                    {groqBaseUrlIndex >= 0 && (
                                        <div>
                                            <InputLabel
                                                htmlFor="groq_base_url"
                                                value={t('settings.platform.ai_credentials.groq_url_label', undefined, 'Base Endpoint Groq Cloud')}
                                            />
                                            <p className="mb-2 text-[11px] text-slate-500">
                                                {t('settings.platform.ai_credentials.groq_url_desc', undefined, 'URL API OpenAI-compatible dari Groq.')}
                                            </p>
                                            <TextInput
                                                id="groq_base_url"
                                                type="text"
                                                value={data.settings[groqBaseUrlIndex]?.value}
                                                onChange={(e) => updateValue(groqBaseUrlIndex, e.target.value)}
                                                placeholder="https://api.groq.com/openai/v1"
                                                className="w-full font-mono text-xs"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`settings.${groqBaseUrlIndex}.value`]}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Test Connection Button & Result Alert */}
                                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                                        <SecondaryButton
                                            type="button"
                                            onClick={handleTestGroq}
                                            disabled={testingGroq}
                                            className="inline-flex items-center justify-center gap-2 text-xs"
                                        >
                                            {testingGroq ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                                    <span>{t('settings.platform.ai_credentials.testing', undefined, 'Menguji...')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[16px] text-orange-600">bolt</span>
                                                    <span>{t('settings.platform.ai_credentials.test_groq', undefined, 'Uji Koneksi Groq')}</span>
                                                </>
                                            )}
                                        </SecondaryButton>
                                        <span className="text-[11px] text-slate-400">
                                            Kirim prompt uji coba langsung ke API Groq untuk memvalidasi kunci.
                                        </span>
                                    </div>

                                    {groqTestResult && (
                                        <div
                                            className={`rounded-2xl border p-3.5 text-xs transition-all ${
                                                groqTestResult.success
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="material-symbols-outlined shrink-0 text-[18px]">
                                                    {groqTestResult.success ? 'check_circle' : 'error'}
                                                </span>
                                                <span>{groqTestResult.message}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
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

                            {/* Business Model Selector */}
                            {businessModelIndex >= 0 && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                            {t('settings.platform.capacity.business_model_label', undefined, 'Model Interaksi Bisnis Armada')}
                                        </label>
                                        <p className="text-[11px] text-slate-500">
                                            {t('settings.platform.capacity.business_model_desc', undefined, 'Pilih mekanisme pendaftaran dan penagihan kapasitas kendaraan untuk seluruh tenant.')}
                                        </p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {/* Per-Vehicle Trial Model */}
                                        <div
                                            onClick={() => updateValue(businessModelIndex, 'per_vehicle_trial')}
                                            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                                                businessModel === 'per_vehicle_trial'
                                                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/30'
                                                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-base text-white shadow-xs">
                                                    🚀
                                                </span>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                            {t('settings.platform.capacity.model_trial_title', undefined, 'Per-Vehicle Free Trial')}
                                                        </span>
                                                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                            {t('settings.platform.capacity.model_trial_badge', undefined, 'Rekomendasi PLG')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                        {t('settings.platform.capacity.model_trial_desc', undefined, 'Pendaftaran armada bebas kuota. Setiap kendaraan baru otomatis mendapat masa uji coba 30 hari gratis sebelum wajib diperpanjang/dibayar.')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tenant Quota Model */}
                                        <div
                                            onClick={() => updateValue(businessModelIndex, 'tenant_quota')}
                                            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                                                businessModel === 'tenant_quota'
                                                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/30'
                                                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-base text-white shadow-xs dark:bg-slate-800">
                                                    🏢
                                                </span>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                            {t('settings.platform.capacity.model_quota_title', undefined, 'Tenant Quota & Upfront Credits')}
                                                        </span>
                                                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {t('settings.platform.capacity.model_quota_badge', undefined, 'Tradisional')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                        {t('settings.platform.capacity.model_quota_desc', undefined, 'Kendaraan dibatasi oleh kuota paket langganan (max_vehicles) dan wajib memiliki saldo kredit kapasitas sebelum unit dapat diaktifkan.')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${businessModelIndex}.value`]}
                                        className="mt-1.5"
                                    />
                                </div>
                            )}

                            {/* Trial-Specific Parameters (when per_vehicle_trial is selected) */}
                            {businessModel === 'per_vehicle_trial' && (
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                                            ⚙️ {t('settings.platform.capacity.trial_params_title', undefined, 'Parameter Uji Coba Kendaraan')}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {trialDurationDaysIndex >= 0 && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="capacity_vehicle_trial_duration_days"
                                                    value={t('settings.platform.capacity.trial_duration_label', undefined, 'Durasi Free Trial per Armada (Hari)')}
                                                    className="!text-xs !font-bold"
                                                />
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <TextInput
                                                        id="capacity_vehicle_trial_duration_days"
                                                        type="number"
                                                        className="block w-full !rounded-xl !py-2 text-xs font-semibold border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                        value={data.settings[trialDurationDaysIndex]?.value || '30'}
                                                        onChange={(e) => updateValue(trialDurationDaysIndex, e.target.value)}
                                                        required
                                                    />
                                                    <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                        {t('settings.platform.capacity.days_suffix', undefined, 'Hari')}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    {t('settings.platform.capacity.trial_duration_desc', undefined, 'Masa aktif gratis saat pertama kali kendaraan didaftarkan oleh tenant.')}
                                                </p>
                                                <InputError
                                                    message={(errors as Record<string, string>)[`settings.${trialDurationDaysIndex}.value`]}
                                                    className="mt-1.5"
                                                />
                                            </div>
                                        )}

                                        {maxTrialVehiclesIndex >= 0 && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="capacity_max_trial_vehicles_per_tenant"
                                                    value={t('settings.platform.capacity.max_trial_vehicles_label', undefined, 'Batas Maksimal Unit Free Trial per Tenant')}
                                                    className="!text-xs !font-bold"
                                                />
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <TextInput
                                                        id="capacity_max_trial_vehicles_per_tenant"
                                                        type="number"
                                                        min="0"
                                                        className="block w-full !rounded-xl !py-2 text-xs font-semibold border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                        value={data.settings[maxTrialVehiclesIndex]?.value || '5'}
                                                        onChange={(e) => updateValue(maxTrialVehiclesIndex, e.target.value)}
                                                        required
                                                    />
                                                    <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                        {t('settings.platform.capacity.units_suffix', undefined, 'Unit')}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    {t('settings.platform.capacity.max_trial_vehicles_desc', undefined, 'Jumlah maksimal unit kendaraan yang dapat menikmati masa uji coba gratis (isi 0 untuk tanpa batas / unlimited).')}
                                                </p>
                                                <InputError
                                                    message={(errors as Record<string, string>)[`settings.${maxTrialVehiclesIndex}.value`]}
                                                    className="mt-1.5"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        {preventDuplicatePlateIndex >= 0 && (
                                            <div>
                                                <InputLabel
                                                    value={t('settings.platform.capacity.anti_abuse_title', undefined, 'Proteksi Anti-Abuse Pelat Nomor')}
                                                    className="!text-xs !font-bold"
                                                />
                                                <div
                                                    onClick={() => updateValue(preventDuplicatePlateIndex, isPreventDuplicatePlate ? '0' : '1')}
                                                    className="mt-1.5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition-all dark:border-slate-800 dark:bg-slate-900"
                                                >
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                            {t('settings.platform.capacity.anti_abuse_label', undefined, 'Cegah Duplikasi Trial Pelat Nomor')}
                                                        </span>
                                                        <p className="text-[10px] text-slate-500">
                                                            {t('settings.platform.capacity.anti_abuse_desc', undefined, 'Pelat nomor yang sama tidak bisa di-reset trialnya jika dihapus lalu didaftarkan ulang.')}
                                                        </p>
                                                    </div>
                                                    <div
                                                        role="switch"
                                                        aria-checked={isPreventDuplicatePlate}
                                                        className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                            isPreventDuplicatePlate ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                isPreventDuplicatePlate ? 'translate-x-4' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                                <InputError
                                                    message={(errors as Record<string, string>)[`settings.${preventDuplicatePlateIndex}.value`]}
                                                    className="mt-1.5"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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

                            {/* Show/Hide Tiered Pricing Section on Tenant Dashboard Toggle */}
                            {showDashboardPricingIndex >= 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div
                                        onClick={() => updateValue(showDashboardPricingIndex, isShowDashboardPricing ? '0' : '1')}
                                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                            isShowDashboardPricing
                                                ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                                : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white shadow-sm">
                                                ⚡
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.capacity.show_dashboard_pricing_label', undefined, 'Tampilkan Section Tarif Berjenjang di Dashboard Tenant')}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            isShowDashboardPricing
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {isShowDashboardPricing ? 'TAMPIL' : 'DISEMBUNYIKAN'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {t(
                                                        'settings.platform.capacity.show_dashboard_pricing_desc',
                                                        undefined,
                                                        'Tampilkan atau sembunyikan section Paket & Harga per Kendaraan (Tarif Berjenjang Sesuai Skala Armada) pada halaman Dashboard seluruh tenant.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            role="switch"
                                            aria-checked={isShowDashboardPricing}
                                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                isShowDashboardPricing ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    isShowDashboardPricing ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${showDashboardPricingIndex}.value`]}
                                        className="mt-1.5"
                                    />
                                </div>
                            )}

                            {/* Show/Hide Vehicle Quota Section on Vehicles Page Toggle */}
                            {showVehicleQuotaSectionIndex >= 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div
                                        onClick={() => updateValue(showVehicleQuotaSectionIndex, isShowVehicleQuotaSection ? '0' : '1')}
                                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                            isShowVehicleQuotaSection
                                                ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                                : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white shadow-sm">
                                                📊
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {t('settings.platform.capacity.show_vehicle_quota_section_label', undefined, 'Tampilkan Bar/Gauge Kapasitas di Halaman Armada Kendaraan')}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            isShowVehicleQuotaSection
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {isShowVehicleQuotaSection ? 'TAMPIL' : 'DISEMBUNYIKAN'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {t(
                                                        'settings.platform.capacity.show_vehicle_quota_section_desc',
                                                        undefined,
                                                        'Tampilkan atau sembunyikan section info Kapasitas Unit Kendaraan Aktif (kuota trial, saldo kredit, dan progress bar) pada halaman /module/fleet/vehicles seluruh tenant.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            role="switch"
                                            aria-checked={isShowVehicleQuotaSection}
                                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                isShowVehicleQuotaSection ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    isShowVehicleQuotaSection ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    <InputError
                                        message={(errors as Record<string, string>)[`settings.${showVehicleQuotaSectionIndex}.value`]}
                                        className="mt-1.5"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* SPECIFIC VIEW: EMAIL (SMTP PLATFORM) GROUP */}
                    {currentGroup === 'email' && (
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {t('settings.platform.email.title', undefined, 'Server SMTP & Pengirim Platform (Root Mailer)')}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {t('settings.platform.email.description', undefined, 'Konfigurasi SMTP resmi platform untuk seluruh pengiriman email sistem, pendaftaran tenant, reset password, dan invoice tagihan central.')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => setShowTestEmailModal(true)}
                                        className="!rounded-xl !py-2 text-xs font-semibold shadow-xs"
                                    >
                                        <span className="material-symbols-outlined text-[16px] mr-1.5">send</span>
                                        {t('settings.platform.email.test_email_btn', undefined, 'Kirim Email Uji Coba')}
                                    </SecondaryButton>
                                </div>
                            </div>

                            {/* Status Pill Card */}
                            <div className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-medium ${
                                isSmtpConfigured
                                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300'
                                    : 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300'
                            }`}>
                                <span className="text-base">{isSmtpConfigured ? '🟢' : '🟡'}</span>
                                <p>
                                    {isSmtpConfigured
                                        ? t('settings.platform.email.status_configured', undefined, 'SMTP Platform Aktif — seluruh email central dan tenant default menggunakan konfigurasi ini.')
                                        : t('settings.platform.email.status_unconfigured', undefined, 'SMTP Platform Belum Lengkap — email keluar memakai driver bawaan environment.')}
                                </p>
                            </div>

                            {/* Server Host & Port */}
                            <div className="grid gap-5 sm:grid-cols-3">
                                {smtpHostIndex >= 0 && (
                                    <div className="sm:col-span-2">
                                        <InputLabel
                                            htmlFor="email_smtp_host"
                                            value={t('settings.platform.email.smtp_host_label', undefined, 'Host SMTP')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <TextInput
                                            id="email_smtp_host"
                                            type="text"
                                            placeholder="smtp.mailgun.org / smtp.gmail.com / mailpit"
                                            className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs font-mono border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                            value={data.settings[smtpHostIndex].value}
                                            onChange={(e) => updateValue(smtpHostIndex, e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t('settings.platform.email.smtp_host_desc', undefined, 'Alamat server SMTP penyedia layanan email.')}
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${smtpHostIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}

                                {smtpPortIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="email_smtp_port"
                                            value={t('settings.platform.email.smtp_port_label', undefined, 'Port SMTP')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <TextInput
                                            id="email_smtp_port"
                                            type="number"
                                            placeholder="587"
                                            className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs font-mono border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                            value={data.settings[smtpPortIndex].value}
                                            onChange={(e) => updateValue(smtpPortIndex, e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            587 (TLS), 465 (SSL), 25
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${smtpPortIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Encryption & Credentials */}
                            <div className="grid gap-5 sm:grid-cols-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {smtpEncryptionIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="email_smtp_encryption"
                                            value={t('settings.platform.email.smtp_encryption_label', undefined, 'Enkripsi Koneksi')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <select
                                            id="email_smtp_encryption"
                                            value={data.settings[smtpEncryptionIndex].value || 'tls'}
                                            onChange={(e) => updateValue(smtpEncryptionIndex, e.target.value)}
                                            className="mt-1.5 block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="tls">{t('settings.platform.email.encryption_tls', undefined, 'TLS (Direkomendasikan)')}</option>
                                            <option value="ssl">{t('settings.platform.email.encryption_ssl', undefined, 'SSL')}</option>
                                            <option value="none">{t('settings.platform.email.encryption_none', undefined, 'Tanpa Enkripsi')}</option>
                                        </select>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${smtpEncryptionIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}

                                {smtpUsernameIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="email_smtp_username"
                                            value={t('settings.platform.email.smtp_username_label', undefined, 'Username SMTP')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <TextInput
                                            id="email_smtp_username"
                                            type="text"
                                            placeholder="postmaster@yourdomain.com"
                                            className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs font-mono border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                            value={data.settings[smtpUsernameIndex].value}
                                            onChange={(e) => updateValue(smtpUsernameIndex, e.target.value)}
                                            autoComplete="off"
                                        />
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${smtpUsernameIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}

                                {smtpPasswordIndex >= 0 && (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <InputLabel
                                                htmlFor="email_smtp_password"
                                                value={t('settings.platform.email.smtp_password_label', undefined, 'Password SMTP')}
                                                className="!text-xs !font-bold !uppercase !tracking-wider"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                                            </button>
                                        </div>
                                        <TextInput
                                            id="email_smtp_password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder={hasSmtpPassword ? '••••••••' : 'Password / API Secret'}
                                            className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs font-mono border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                            value={data.settings[smtpPasswordIndex].value}
                                            onChange={(e) => updateValue(smtpPasswordIndex, e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            {t('settings.platform.email.smtp_password_hint', undefined, 'Kosongkan jika tidak ingin mengubah password.')}
                                        </p>
                                        <InputError
                                            message={(errors as Record<string, string>)[`settings.${smtpPasswordIndex}.value`]}
                                            className="mt-1.5"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Sender Identity */}
                            <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {emailFromAddressIndex >= 0 && (
                                    <div>
                                        <InputLabel
                                            htmlFor="email_from_address"
                                            value={t('settings.platform.email.from_address_label', undefined, 'Alamat Email Pengirim (From Address)')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <TextInput
                                            id="email_from_address"
                                            type="email"
                                            placeholder="noreply@seruwit.com"
                                            className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                            value={data.settings[emailFromAddressIndex].value}
                                            onChange={(e) => updateValue(emailFromAddressIndex, e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t('settings.platform.email.from_address_desc', undefined, 'Alamat email yang tertera sebagai pengirim resmi platform.')}
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
                                            value={t('settings.platform.email.from_name_label', undefined, 'Nama Pengirim Platform (From Name)')}
                                            className="!text-xs !font-bold !uppercase !tracking-wider"
                                        />
                                        <TextInput
                                            id="email_from_name"
                                            type="text"
                                            placeholder="Seruwit Platform"
                                            className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                            value={data.settings[emailFromNameIndex].value}
                                            onChange={(e) => updateValue(emailFromNameIndex, e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t('settings.platform.email.from_name_desc', undefined, 'Nama brand atau entitas yang tampil di inbox penerima.')}
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

                    {/* SPECIFIC VIEW: WHATSAPP CENTRAL GROUP */}
                    {currentGroup === 'whatsapp' && (
                        <CentralWhatsAppPanel
                            deviceStatus={deviceStatus}
                            sessionId={sessionId}
                            groupSettings={groupSettings}
                            formData={data}
                            updateValue={updateValue}
                            errors={errors as Record<string, string>}
                        />
                    )}

                    {/* GENERIC FALLBACK FOR OTHER GROUPS */}
                    {currentGroup !== 'general' && currentGroup !== 'ai' && currentGroup !== 'capacity' && currentGroup !== 'email' && currentGroup !== 'security' && currentGroup !== 'whatsapp' && (
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

                    {/* Sticky Bottom Action Bar */}
                    <div className="sticky bottom-4 z-40 flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                        <div className="flex items-center gap-2">
                            {isDirty ? (
                                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>Perubahan belum disimpan — klik tombol Simpan</span>
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('settings.platform.groups.' + currentGroup, undefined, formatGroupLabel(currentGroup))}
                                </span>
                            )}
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
                                className={`!rounded-xl px-6 py-2.5 text-xs font-bold shadow-md transition-all ${
                                    isDirty
                                        ? '!bg-gradient-to-r !from-indigo-600 !to-sky-600 !text-white ring-2 ring-indigo-500/30 shadow-indigo-500/20'
                                        : ''
                                }`}
                            >
                                {t('settings.platform.save', undefined, 'Simpan Pengaturan Platform')}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>

            {/* Test Email Modal */}
            <Modal show={showTestEmailModal} onClose={() => setShowTestEmailModal(false)} maxWidth="md">
                <form onSubmit={handleSendTestEmail} className="p-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                            <span className="material-symbols-outlined text-[22px]">outgoing_mail</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('settings.platform.email.test_email_modal_title', undefined, 'Uji Coba Pengiriman Email')}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {t('settings.platform.email.test_email_modal_desc', undefined, 'Kirim email uji coba untuk memverifikasi koneksi SMTP.')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="test_recipient"
                                value={t('settings.platform.email.test_email_recipient', undefined, 'Kirim ke Alamat Email')}
                                className="!text-xs !font-bold !uppercase !tracking-wider"
                            />
                            <TextInput
                                id="test_recipient"
                                type="email"
                                className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                value={testEmailForm.data.recipient}
                                onChange={(e) => testEmailForm.setData('recipient', e.target.value)}
                                placeholder="admin@example.com"
                                required
                            />
                            <InputError message={testEmailForm.errors.recipient} className="mt-1.5" />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowTestEmailModal(false)}
                            className="!rounded-xl text-xs"
                        >
                            {t('settings.platform.email.test_email_cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={testEmailForm.processing}
                            className="!rounded-xl text-xs"
                        >
                            {testEmailForm.processing
                                ? t('settings.platform.email.test_email_sending', undefined, 'Mengirim pesan…')
                                : t('settings.platform.email.test_email_submit', undefined, 'Kirim Uji Coba Sekarang')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
