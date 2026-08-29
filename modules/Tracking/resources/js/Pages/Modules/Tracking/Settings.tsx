import DynamicLayout from '@/Layouts/DynamicLayout';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import TrackingNav from '../../../TrackingNav';

interface Source {
    id: number;
    name: string;
    provider: string;
    base_url: string | null;
    auth_type: string;
    email: string | null;
    poll_enabled: boolean;
    configured: boolean;
    has_password: boolean;
    has_token: boolean;
    last_polled_at: string | null;
    last_poll_error: string | null;
    devices_count: number;
    paired_devices_count: number;
}

interface Config {
    alerts_enabled: boolean;
    alert_speed_kph: number;
    alert_stale_minutes: number;
    alert_idle_minutes: number;
    alert_cooldown_minutes: number;
    geofence_radius_m: number;
    checkpoint_min_distance_m: number;
    checkpoint_min_interval_minutes: number;
    retention_days: number;
}

interface Props {
    config: Config;
    sources: Source[];
    defaultBaseUrl: string | null;
    maxSources: number;
    can: { update: boolean; create: boolean; delete: boolean };
}

type SettingsTab = 'sources' | 'general';

const PROVIDER_OPTIONS = [
    { value: 'traccar', labelKey: 'tracking.providers.traccar' },
    { value: 'sky_track', labelKey: 'tracking.providers.sky_track' },
    { value: 'gps_server', labelKey: 'tracking.providers.gps_server' },
] as const;

function isApiKeyProvider(provider: string): boolean {
    return provider === 'sky_track' || provider === 'gps_server';
}

export default function Settings({ config, sources, defaultBaseUrl, maxSources, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [activeTab, setActiveTab] = useState<SettingsTab>('sources');
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [editingSource, setEditingSource] = useState<Source | null>(null);
    const [testingSourceId, setTestingSourceId] = useState<number | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const configForm = useForm({
        alerts_enabled: config.alerts_enabled ?? true,
        alert_speed_kph: config.alert_speed_kph ?? 80,
        alert_stale_minutes: config.alert_stale_minutes ?? 15,
        alert_idle_minutes: config.alert_idle_minutes ?? 30,
        alert_cooldown_minutes: config.alert_cooldown_minutes ?? 30,
        geofence_radius_m: config.geofence_radius_m,
        checkpoint_min_distance_m: config.checkpoint_min_distance_m,
        checkpoint_min_interval_minutes: config.checkpoint_min_interval_minutes,
        retention_days: config.retention_days,
    });

    const sourceForm = useForm({
        name: '',
        provider: 'traccar',
        base_url: '',
        auth_type: 'basic',
        email: '',
        password: '',
        token: '',
        poll_enabled: true,
    });

    const submitConfig: FormEventHandler = (e) => {
        e.preventDefault();
        configForm.patch(prefixedRoute('tracking.settings.update'), { preserveScroll: true });
    };

    const openCreateSource = () => {
        setEditingSource(null);
        setShowPassword(false);
        sourceForm.clearErrors();
        sourceForm.setData({
            name: '',
            provider: 'traccar',
            base_url: defaultBaseUrl ?? '',
            auth_type: 'basic',
            email: '',
            password: '',
            token: '',
            poll_enabled: true,
        });
        setShowSourceModal(true);
    };

    const openEditSource = (source: Source) => {
        setEditingSource(source);
        setShowPassword(false);
        sourceForm.clearErrors();
        sourceForm.setData({
            name: source.name,
            provider: source.provider,
            base_url: source.base_url ?? '',
            auth_type: source.auth_type,
            email: source.email ?? '',
            password: '',
            token: '',
            poll_enabled: source.poll_enabled,
        });
        setShowSourceModal(true);
    };

    const submitSource: FormEventHandler = (e) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowSourceModal(false);
                setEditingSource(null);
                sourceForm.reset();
            },
        };

        if (editingSource) {
            sourceForm.patch(prefixedRoute('tracking.settings.sources.update', editingSource.id), options);
        } else {
            sourceForm.post(prefixedRoute('tracking.settings.sources.store'), options);
        }
    };

    const testSource = (source: Source) => {
        setTestingSourceId(source.id);
        router.post(prefixedRoute('tracking.settings.sources.test', source.id), {}, {
            preserveScroll: true,
            onFinish: () => setTestingSourceId(null),
        });
    };

    const deleteSource = (source: Source) => {
        router.delete(prefixedRoute('tracking.settings.sources.destroy', source.id), { preserveScroll: true });
    };

    const setProvider = (provider: string) => {
        const nextUsesApiKey = isApiKeyProvider(provider);

        let defaultUrl = '';
        if (provider === 'sky_track') {
            defaultUrl = 'https://api.sky-track.example.com';
        } else if (provider === 'gps_server') {
            defaultUrl = 'https://gsi-tracking.com';
        } else if (defaultBaseUrl) {
            defaultUrl = defaultBaseUrl;
        }

        sourceForm.setData({
            ...sourceForm.data,
            provider,
            base_url: defaultUrl,
            auth_type: nextUsesApiKey
                ? 'api_key'
                : (sourceForm.data.auth_type === 'api_key' ? 'basic' : sourceForm.data.auth_type),
            email: nextUsesApiKey ? '' : sourceForm.data.email,
            password: nextUsesApiKey ? '' : sourceForm.data.password,
            token: '',
        });
    };

    const provider = sourceForm.data.provider;
    const usesApiKey = isApiKeyProvider(provider);
    const usesToken = !usesApiKey && sourceForm.data.auth_type === 'token';
    const isSkyTrack = provider === 'sky_track';
    const isGpsServer = provider === 'gps_server';
    const editingHasToken = editingSource?.has_token ?? false;
    const editingHasPassword = editingSource?.has_password ?? false;
    const canAddSource = can.create && sources.length < maxSources;

    const providerHint = () => {
        if (isSkyTrack) {
            return t('tracking.pages.settings.sky_track_hint');
        }

        if (isGpsServer) {
            return t('tracking.pages.settings.gps_server_hint');
        }

        return t('tracking.pages.settings.traccar_hint');
    };

    const baseUrlLabel = () => {
        if (isSkyTrack) {
            return t('tracking.fields.sky_track_url');
        }

        if (isGpsServer) {
            return t('tracking.fields.gps_server_url');
        }

        return t('tracking.fields.base_url');
    };

    const baseUrlPlaceholder = () => {
        if (isSkyTrack) {
            return 'https://api.sky-track.example.com';
        }

        if (isGpsServer) {
            return 'https://gsi-tracking.com';
        }

        return defaultBaseUrl ?? 'https://gps.example.com';
    };

    const apiKeyHint = () => {
        if (isGpsServer) {
            return t('tracking.pages.settings.gps_server_api_key_hint');
        }

        if (isSkyTrack) {
            return t('tracking.pages.settings.sky_track_api_key_hint');
        }

        return t('tracking.pages.settings.api_key_hint');
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('tracking.title', undefined, 'Tracking')}
                    description={t('tracking.pages.settings.title', undefined, 'Pengaturan Tracking & Sumber GPS')}
                />
            }
        >
            <Head title={t('tracking.pages.settings.title')} />

            <TrackingNav />

            {/* Tab Pill Switcher */}
            <div className="mb-6 inline-flex rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
                {(['sources', 'general'] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === tab
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {t(tab === 'sources' ? 'tracking.nav.sources' : 'tracking.nav.general')}
                    </button>
                ))}
            </div>

            {/* TAB 1: SOURCES */}
            {activeTab === 'sources' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {t('tracking.nav.sources', undefined, 'Sumber Data GPS')}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Hubungkan server GPS Traccar, Sky Track, atau platform telemetri lainnya.
                            </p>
                        </div>
                        {canAddSource && (
                            <button
                                type="button"
                                onClick={openCreateSource}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                            >
                                <span>➕</span>
                                <span>{t('tracking.actions.add_source', undefined, 'Tambah Sumber GPS')}</span>
                            </button>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        {sources.length === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-2xl mb-3">
                                    📡
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {t('tracking.pages.settings.empty_sources', undefined, 'Belum ada sumber GPS terhubung')}
                                </h4>
                                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                                    Tambahkan koneksi provider GPS untuk mulai menyinkronkan posisi dan data armada kendaraan.
                                </p>
                                {canAddSource && (
                                    <button
                                        type="button"
                                        onClick={openCreateSource}
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                                    >
                                        <span>{t('tracking.actions.add_source', undefined, 'Tambah Sumber GPS')}</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {sources.map((source) => (
                                    <li key={source.id} className="flex flex-wrap items-start justify-between gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-base">
                                                    {source.provider === 'sky_track' ? '🛰️' : source.provider === 'gps_server' ? '🌐' : '📡'}
                                                </span>
                                                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{source.name}</p>
                                                <span className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {source.provider ? t(`tracking.providers.${source.provider}`, undefined, source.provider) : '-'}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded-xl px-2.5 py-0.5 text-xs font-bold border ${
                                                        source.configured
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50'
                                                    }`}
                                                >
                                                    {source.configured
                                                        ? t('tracking.pages.settings.configured')
                                                        : t('tracking.pages.settings.not_configured')}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded-xl px-2.5 py-0.5 text-xs font-bold border ${
                                                        source.poll_enabled
                                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {source.poll_enabled
                                                        ? t('tracking.dashboard.poll_on')
                                                        : t('tracking.dashboard.poll_off')}
                                                </span>
                                            </div>

                                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-medium">
                                                    📊 {t('tracking.pages.settings.source_devices', {
                                                        total: source.devices_count,
                                                        paired: source.paired_devices_count,
                                                    })}
                                                </span>
                                                {source.base_url && (
                                                    <span className="font-mono text-[11px] text-slate-400">
                                                        🔗 {source.base_url}
                                                    </span>
                                                )}
                                                {source.last_polled_at && (
                                                    <span>
                                                        ⏱️ {t('tracking.dashboard.last_poll')}: {source.last_polled_at}
                                                    </span>
                                                )}
                                            </div>

                                            {source.last_poll_error && (
                                                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200/60 dark:border-rose-800/50">
                                                    ⚠️ {t('tracking.pages.map.last_poll_failed', { error: source.last_poll_error })}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {can.update && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditSource(source)}
                                                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                                    >
                                                        ✏️ {t('common.edit')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => testSource(source)}
                                                        disabled={testingSourceId === source.id}
                                                        className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition disabled:opacity-50"
                                                    >
                                                        {testingSourceId === source.id
                                                            ? `⏳ ${t('common.loading')}`
                                                            : `🔌 ${t('tracking.actions.test_connection')}`}
                                                    </button>
                                                </>
                                            )}
                                            {can.delete && (
                                                <button
                                                    type="button"
                                                    onClick={() => deleteSource(source)}
                                                    className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition"
                                                >
                                                    🗑️ {t('common.delete')}
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: GENERAL SETTINGS */}
            {activeTab === 'general' && (
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <form onSubmit={submitConfig} className="max-w-3xl space-y-6">
                        <div className="space-y-4">
                            <label className="flex items-center gap-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 shadow-xs focus:ring-indigo-500"
                                    checked={configForm.data.alerts_enabled}
                                    onChange={(e) => configForm.setData('alerts_enabled', e.target.checked)}
                                />
                                <span>{t('tracking.fields.alerts_enabled')}</span>
                            </label>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="alert_speed_kph" value={t('tracking.fields.alert_speed_kph')} />
                                    <TextInput
                                        id="alert_speed_kph"
                                        type="number"
                                        min={20}
                                        className="mt-1 block w-full !rounded-xl"
                                        value={configForm.data.alert_speed_kph}
                                        onChange={(e) => configForm.setData('alert_speed_kph', Number(e.target.value))}
                                    />
                                    <InputError message={configForm.errors.alert_speed_kph} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="alert_stale_minutes" value={t('tracking.fields.alert_stale_minutes')} />
                                    <TextInput
                                        id="alert_stale_minutes"
                                        type="number"
                                        min={5}
                                        className="mt-1 block w-full !rounded-xl"
                                        value={configForm.data.alert_stale_minutes}
                                        onChange={(e) => configForm.setData('alert_stale_minutes', Number(e.target.value))}
                                    />
                                    <InputError message={configForm.errors.alert_stale_minutes} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="alert_idle_minutes" value={t('tracking.fields.alert_idle_minutes')} />
                                    <TextInput
                                        id="alert_idle_minutes"
                                        type="number"
                                        min={5}
                                        className="mt-1 block w-full !rounded-xl"
                                        value={configForm.data.alert_idle_minutes}
                                        onChange={(e) => configForm.setData('alert_idle_minutes', Number(e.target.value))}
                                    />
                                    <InputError message={configForm.errors.alert_idle_minutes} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="alert_cooldown_minutes" value={t('tracking.fields.alert_cooldown_minutes')} />
                                    <TextInput
                                        id="alert_cooldown_minutes"
                                        type="number"
                                        min={5}
                                        className="mt-1 block w-full !rounded-xl"
                                        value={configForm.data.alert_cooldown_minutes}
                                        onChange={(e) => configForm.setData('alert_cooldown_minutes', Number(e.target.value))}
                                    />
                                    <InputError message={configForm.errors.alert_cooldown_minutes} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 border-t border-slate-100 dark:border-slate-800 pt-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="geofence_radius_m" value={t('tracking.fields.geofence_radius_m')} />
                                <TextInput
                                    id="geofence_radius_m"
                                    type="number"
                                    min={20}
                                    className="mt-1 block w-full !rounded-xl"
                                    value={configForm.data.geofence_radius_m}
                                    onChange={(e) => configForm.setData('geofence_radius_m', Number(e.target.value))}
                                />
                                <InputError message={configForm.errors.geofence_radius_m} className="mt-2" />
                                <p className="mt-1 text-xs text-slate-400">
                                    How close a vehicle must get before a stop is marked as arrived.
                                </p>
                            </div>
                            <div>
                                <InputLabel htmlFor="retention_days" value={t('tracking.fields.retain_positions_days')} />
                                <TextInput
                                    id="retention_days"
                                    type="number"
                                    min={1}
                                    className="mt-1 block w-full !rounded-xl"
                                    value={configForm.data.retention_days}
                                    onChange={(e) => configForm.setData('retention_days', Number(e.target.value))}
                                />
                                <InputError message={configForm.errors.retention_days} className="mt-2" />
                                <p className="mt-1 text-xs text-slate-400">
                                    Trip route trails are kept permanently regardless of this.
                                </p>
                            </div>
                            <div>
                                <InputLabel htmlFor="checkpoint_min_distance_m" value={t('tracking.fields.trail_every_m')} />
                                <TextInput
                                    id="checkpoint_min_distance_m"
                                    type="number"
                                    min={20}
                                    className="mt-1 block w-full !rounded-xl"
                                    value={configForm.data.checkpoint_min_distance_m}
                                    onChange={(e) => configForm.setData('checkpoint_min_distance_m', Number(e.target.value))}
                                />
                                <InputError message={configForm.errors.checkpoint_min_distance_m} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="checkpoint_min_interval_minutes" value={t('tracking.fields.trail_every_minutes')} />
                                <TextInput
                                    id="checkpoint_min_interval_minutes"
                                    type="number"
                                    min={1}
                                    className="mt-1 block w-full !rounded-xl"
                                    value={configForm.data.checkpoint_min_interval_minutes}
                                    onChange={(e) => configForm.setData('checkpoint_min_interval_minutes', Number(e.target.value))}
                                />
                                <InputError message={configForm.errors.checkpoint_min_interval_minutes} className="mt-2" />
                            </div>
                        </div>

                        {can.update && (
                            <div className="pt-2">
                                <PrimaryButton disabled={configForm.processing} className="!rounded-xl px-5 py-2.5 font-bold">
                                    {t('tracking.actions.save')}
                                </PrimaryButton>
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* ── MODAL: TAMBAH / EDIT SUMBER GPS (MODERN & INTUITIF) ─────────── */}
            <Modal show={showSourceModal} onClose={() => setShowSourceModal(false)} maxWidth="2xl">
                <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
                    {/* Header Banner with Glow */}
                    <div className="relative border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-6 py-6 text-white">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl ring-1 ring-indigo-400/30">
                                    {provider === 'sky_track' ? '🛰️' : provider === 'gps_server' ? '🌐' : '📡'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-white">
                                        {editingSource
                                            ? t('tracking.pages.settings.modal.edit_title', undefined, 'Edit Konfigurasi Sumber GPS')
                                            : t('tracking.pages.settings.modal.create_title', undefined, 'Hubungkan Sumber GPS Baru')}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-300/90 leading-relaxed">
                                        {t('tracking.pages.settings.modal.subtitle', undefined, 'Tentukan provider GPS, alamat server, dan kredensial akses untuk sinkronisasi data armada.')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSourceModal(false)}
                                className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-slate-300 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <form onSubmit={submitSource} className="space-y-5 p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {/* 1. Provider Visual Selector Cards */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {t('tracking.pages.settings.modal.provider_select_label', undefined, 'Pilih Platform / Provider GPS')}
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {[
                                    {
                                        value: 'traccar',
                                        name: 'Traccar (Generic)',
                                        icon: '📡',
                                        badge: 'Open-Source / Cloud',
                                        desc: 'Server Traccar standar',
                                    },
                                    {
                                        value: 'sky_track',
                                        name: 'Sky Track',
                                        icon: '🛰️',
                                        badge: 'API Gateway',
                                        desc: 'Integrasi API Sky Track',
                                    },
                                    {
                                        value: 'gps_server',
                                        name: 'GPS-Server',
                                        icon: '🌐',
                                        badge: 'gsi-tracking API',
                                        desc: 'Platform GPS-Server API',
                                    },
                                ].map((item) => {
                                    const isSelected = provider === item.value;
                                    const isDisabled = editingSource !== null && editingSource.provider !== item.value;

                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            disabled={editingSource !== null}
                                            onClick={() => setProvider(item.value)}
                                            className={`relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500 text-slate-900 dark:text-white shadow-xs'
                                                    : isDisabled
                                                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 opacity-40 cursor-not-allowed text-slate-400'
                                                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xl">{item.icon}</span>
                                                <span className={`h-3 w-3 rounded-full border-2 ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'}`} />
                                            </div>
                                            <div className="mt-2.5">
                                                <p className="text-xs font-black leading-tight">{item.name}</p>
                                                <p className="mt-0.5 text-[10px] text-slate-400 truncate">{item.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={sourceForm.errors.provider} className="mt-1" />
                            {editingSource !== null && (
                                <p className="text-[11px] text-slate-400 italic">
                                    💡 Provider tidak dapat diubah setelah dibuat.
                                </p>
                            )}
                        </div>

                        {/* 2. Source Name & Server Base URL */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-4 space-y-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    <span>🏷️</span>
                                    <span>{t('tracking.fields.source_name', undefined, 'Nama Sumber GPS')} *</span>
                                </label>
                                <TextInput
                                    id="source_name"
                                    className="w-full !rounded-xl !py-2 text-xs"
                                    value={sourceForm.data.name}
                                    onChange={(e) => sourceForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Server GPS Traccar Pool Utama"
                                    required
                                />
                                <InputError message={sourceForm.errors.name} className="mt-1" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span>🌐</span>
                                        <span>{baseUrlLabel()} *</span>
                                    </label>
                                    {!usesApiKey && defaultBaseUrl && sourceForm.data.base_url !== defaultBaseUrl && (
                                        <button
                                            type="button"
                                            onClick={() => sourceForm.setData('base_url', defaultBaseUrl)}
                                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            Gunakan URL Bawaan
                                        </button>
                                    )}
                                </div>
                                <TextInput
                                    id="source_base_url"
                                    type="url"
                                    className="w-full !rounded-xl !py-2 text-xs font-mono"
                                    value={sourceForm.data.base_url}
                                    onChange={(e) => sourceForm.setData('base_url', e.target.value)}
                                    placeholder={baseUrlPlaceholder()}
                                    required={usesApiKey}
                                />
                                <InputError message={sourceForm.errors.base_url} className="mt-1" />
                                <p className="mt-1 text-[11px] text-slate-400">{providerHint()}</p>
                            </div>
                        </div>

                        {/* 3. Credentials & Auth Details */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>🔐</span>
                                    <span>{t('tracking.pages.settings.modal.connection_details', undefined, 'Kredensial & Autentikasi')}</span>
                                </label>

                                {!usesApiKey && (
                                    <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-0.5 text-[11px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => sourceForm.setData('auth_type', 'basic')}
                                            className={`rounded-lg px-2.5 py-1 transition ${
                                                sourceForm.data.auth_type === 'basic'
                                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            Email & Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => sourceForm.setData('auth_type', 'token')}
                                            className={`rounded-lg px-2.5 py-1 transition ${
                                                sourceForm.data.auth_type === 'token'
                                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            API Token
                                        </button>
                                    </div>
                                )}
                            </div>

                            {usesApiKey ? (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {t('tracking.fields.api_key', undefined, 'API Key')} *
                                    </label>
                                    <div className="relative">
                                        <TextInput
                                            id="source_token"
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full !rounded-xl !py-2 text-xs font-mono pr-10"
                                            value={sourceForm.data.token}
                                            onChange={(e) => sourceForm.setData('token', e.target.value)}
                                            placeholder={editingHasToken ? '•••••••• (tersimpan tidak berubah)' : 'Masukkan API Key provider'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    <InputError message={sourceForm.errors.token} className="mt-1" />
                                    <p className="mt-1 text-[11px] text-slate-400">{apiKeyHint()}</p>
                                </div>
                            ) : usesToken ? (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {t('tracking.fields.token', undefined, 'Traccar API Token')} *
                                    </label>
                                    <div className="relative">
                                        <TextInput
                                            id="source_token"
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full !rounded-xl !py-2 text-xs font-mono pr-10"
                                            value={sourceForm.data.token}
                                            onChange={(e) => sourceForm.setData('token', e.target.value)}
                                            placeholder={editingHasToken ? '•••••••• (tersimpan tidak berubah)' : 'Masukkan API Token Traccar'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    <InputError message={sourceForm.errors.token} className="mt-1" />
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        {editingHasToken ? 'Kosongkan jika tidak ingin mengubah token yang tersimpan.' : 'Token dapat dibuat dari menu Akun pada dashboard server Traccar.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                            {t('tracking.fields.email', undefined, 'Email / User Traccar')}
                                        </label>
                                        <TextInput
                                            id="source_email"
                                            type="email"
                                            className="w-full !rounded-xl !py-2 text-xs"
                                            value={sourceForm.data.email}
                                            onChange={(e) => sourceForm.setData('email', e.target.value)}
                                            placeholder="admin@traccar.org"
                                        />
                                        <InputError message={sourceForm.errors.email} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                            {t('tracking.fields.password', undefined, 'Password Traccar')}
                                        </label>
                                        <div className="relative">
                                            <TextInput
                                                id="source_password"
                                                type={showPassword ? 'text' : 'password'}
                                                className="w-full !rounded-xl !py-2 text-xs pr-10"
                                                value={sourceForm.data.password}
                                                onChange={(e) => sourceForm.setData('password', e.target.value)}
                                                placeholder={editingHasPassword ? '•••••••• (tersimpan)' : 'Password user'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                        <InputError message={sourceForm.errors.password} className="mt-1" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Interactive Toggle: Auto-Polling */}
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-lg">
                                    🔄
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {t('tracking.pages.settings.modal.poll_title', undefined, 'Polling Otomatis Setiap Menit')}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {t('tracking.pages.settings.modal.poll_desc', undefined, 'Tarik posisi koordinat dan kecepatan GPS secara berkala di background.')}
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={sourceForm.data.poll_enabled}
                                    onChange={(e) => sourceForm.setData('poll_enabled', e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-indigo-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-focus:outline-hidden dark:bg-slate-700" />
                            </label>
                        </div>

                        {/* 5. Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowSourceModal(false)}
                                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                            >
                                {t('common.cancel', undefined, 'Batal')}
                            </button>
                            <button
                                type="submit"
                                disabled={sourceForm.processing}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
                            >
                                {sourceForm.processing ? (
                                    <>
                                        <span>⏳</span>
                                        <span>{t('common.loading', undefined, 'Menyimpan…')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✓</span>
                                        <span>{editingSource ? t('common.save', undefined, 'Simpan Perubahan') : t('common.create', undefined, 'Simpan & Hubungkan')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DynamicLayout>
    );
}

