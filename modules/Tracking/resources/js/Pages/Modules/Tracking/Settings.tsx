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
        sourceForm.clearErrors();
        sourceForm.setData({
            name: '',
            provider: 'traccar',
            base_url: '',
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

        sourceForm.setData({
            ...sourceForm.data,
            provider,
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

    const providerOptions = PROVIDER_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
    }));

    return (
        <DynamicLayout header={<PageHeader title={t('tracking.title')} />}>
            <Head title={t('tracking.pages.settings.title')} />

            <TrackingNav />

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    {(['sources', 'general'] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                                activeTab === tab
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            {t(tab === 'sources' ? 'tracking.nav.sources' : 'tracking.nav.general')}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'sources' && (
                <>
                    {canAddSource && (
                        <div className="mb-4 flex justify-end">
                            <PrimaryButton type="button" onClick={openCreateSource}>
                                {t('tracking.actions.add_source')}
                            </PrimaryButton>
                        </div>
                    )}

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        {sources.length === 0 ? (
                            <p className="p-6 text-sm text-gray-500">{t('tracking.pages.settings.empty_sources')}</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {sources.map((source) => (
                                    <li key={source.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-gray-900">{source.name}</p>
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                    {t(`tracking.providers.${source.provider}`, undefined, source.provider)}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        source.configured
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {source.configured
                                                        ? t('tracking.pages.settings.configured')
                                                        : t('tracking.pages.settings.not_configured')}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        source.poll_enabled
                                                            ? 'bg-indigo-100 text-indigo-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {source.poll_enabled
                                                        ? t('tracking.dashboard.poll_on')
                                                        : t('tracking.dashboard.poll_off')}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-gray-500">
                                                {t('tracking.pages.settings.source_devices', {
                                                    total: source.devices_count,
                                                    paired: source.paired_devices_count,
                                                })}
                                            </p>

                                            {source.last_polled_at && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {t('tracking.dashboard.last_poll')}: {source.last_polled_at}
                                                </p>
                                            )}

                                            {source.last_poll_error && (
                                                <p className="mt-2 text-xs text-red-700">
                                                    {t('tracking.pages.map.last_poll_failed', { error: source.last_poll_error })}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {can.update && (
                                                <>
                                                    <SecondaryButton type="button" onClick={() => openEditSource(source)}>
                                                        {t('common.edit')}
                                                    </SecondaryButton>
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() => testSource(source)}
                                                        disabled={testingSourceId === source.id}
                                                    >
                                                        {testingSourceId === source.id
                                                            ? t('common.loading')
                                                            : t('tracking.actions.test_connection')}
                                                    </SecondaryButton>
                                                </>
                                            )}
                                            {can.delete && (
                                                <DangerButton type="button" onClick={() => deleteSource(source)}>
                                                    {t('common.delete')}
                                                </DangerButton>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'general' && (
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <form onSubmit={submitConfig} className="max-w-2xl space-y-6">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                        checked={configForm.data.alerts_enabled}
                                        onChange={(e) => configForm.setData('alerts_enabled', e.target.checked)}
                                    />
                                    {t('tracking.fields.alerts_enabled')}
                                </label>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="alert_speed_kph" value={t('tracking.fields.alert_speed_kph')} />
                                        <TextInput
                                            id="alert_speed_kph"
                                            type="number"
                                            min={20}
                                            className="mt-1 block w-full"
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
                                            className="mt-1 block w-full"
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
                                            className="mt-1 block w-full"
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
                                            className="mt-1 block w-full"
                                            value={configForm.data.alert_cooldown_minutes}
                                            onChange={(e) => configForm.setData('alert_cooldown_minutes', Number(e.target.value))}
                                        />
                                        <InputError message={configForm.errors.alert_cooldown_minutes} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="geofence_radius_m" value={t('tracking.fields.geofence_radius_m')} />
                                    <TextInput
                                        id="geofence_radius_m"
                                        type="number"
                                        min={20}
                                        className="mt-1 block w-full"
                                        value={configForm.data.geofence_radius_m}
                                        onChange={(e) => configForm.setData('geofence_radius_m', Number(e.target.value))}
                                    />
                                    <InputError message={configForm.errors.geofence_radius_m} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500">
                                        How close a vehicle must get before a stop is marked as arrived.
                                    </p>
                                </div>
                                <div>
                                    <InputLabel htmlFor="retention_days" value={t('tracking.fields.retain_positions_days')} />
                                    <TextInput
                                        id="retention_days"
                                        type="number"
                                        min={1}
                                        className="mt-1 block w-full"
                                        value={configForm.data.retention_days}
                                        onChange={(e) => configForm.setData('retention_days', Number(e.target.value))}
                                    />
                                    <InputError message={configForm.errors.retention_days} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Trip route trails are kept permanently regardless of this.
                                    </p>
                                </div>
                                <div>
                                    <InputLabel htmlFor="checkpoint_min_distance_m" value={t('tracking.fields.trail_every_m')} />
                                    <TextInput
                                        id="checkpoint_min_distance_m"
                                        type="number"
                                        min={20}
                                        className="mt-1 block w-full"
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
                                        className="mt-1 block w-full"
                                        value={configForm.data.checkpoint_min_interval_minutes}
                                        onChange={(e) => configForm.setData('checkpoint_min_interval_minutes', Number(e.target.value))}
                                    />
                                    <InputError message={configForm.errors.checkpoint_min_interval_minutes} className="mt-2" />
                                </div>
                            </div>

                            {can.update && (
                                <PrimaryButton disabled={configForm.processing}>{t('tracking.actions.save')}</PrimaryButton>
                            )}
                        </form>
                    </div>
                </div>
            )}

            <Modal show={showSourceModal} onClose={() => setShowSourceModal(false)} maxWidth="2xl">
                <form onSubmit={submitSource} className="space-y-4 p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        {editingSource
                            ? t('tracking.pages.settings.edit_source')
                            : t('tracking.pages.settings.create_source')}
                    </h3>

                    <div>
                        <InputLabel htmlFor="source_name" value={t('tracking.fields.source_name')} />
                        <TextInput
                            id="source_name"
                            className="mt-1 block w-full"
                            value={sourceForm.data.name}
                            onChange={(e) => sourceForm.setData('name', e.target.value)}
                            required
                        />
                        <InputError message={sourceForm.errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="source_provider" value={t('tracking.fields.provider')} />
                        <Select
                            id="source_provider"
                            className="mt-1"
                            value={sourceForm.data.provider}
                            onChange={setProvider}
                            disabled={editingSource !== null}
                            options={providerOptions}
                        />
                        <InputError message={sourceForm.errors.provider} className="mt-2" />
                        <p className="mt-1 text-xs text-gray-500">{providerHint()}</p>
                    </div>

                    <div>
                        <InputLabel htmlFor="source_base_url" value={baseUrlLabel()} />
                        <TextInput
                            id="source_base_url"
                            type="url"
                            className="mt-1 block w-full"
                            value={sourceForm.data.base_url}
                            onChange={(e) => sourceForm.setData('base_url', e.target.value)}
                            placeholder={baseUrlPlaceholder()}
                            required={usesApiKey}
                        />
                        <InputError message={sourceForm.errors.base_url} className="mt-2" />
                        {!usesApiKey && defaultBaseUrl && (
                            <p className="mt-1 text-xs text-gray-500">
                                Leave blank to use the default server: {defaultBaseUrl}
                            </p>
                        )}
                    </div>

                    {usesApiKey ? (
                        <div>
                            <InputLabel htmlFor="source_token" value={t('tracking.fields.api_key')} />
                            <TextInput
                                id="source_token"
                                type="password"
                                className="mt-1 block w-full"
                                value={sourceForm.data.token}
                                onChange={(e) => sourceForm.setData('token', e.target.value)}
                                placeholder={editingHasToken ? '•••••••• (unchanged)' : ''}
                            />
                            <InputError message={sourceForm.errors.token} className="mt-2" />
                            <p className="mt-1 text-xs text-gray-500">{apiKeyHint()}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <InputLabel htmlFor="source_auth_type" value={t('tracking.fields.auth_type')} />
                                <Select
                                    id="source_auth_type"
                                    className="mt-1"
                                    value={sourceForm.data.auth_type}
                                    onChange={(value) => sourceForm.setData('auth_type', value)}
                                    options={[
                                        { value: 'basic', label: t('tracking.auth_types.basic') },
                                        { value: 'token', label: t('tracking.auth_types.token') },
                                    ]}
                                />
                                <InputError message={sourceForm.errors.auth_type} className="mt-2" />
                            </div>

                            {usesToken ? (
                                <div>
                                    <InputLabel htmlFor="source_token" value={t('tracking.fields.token')} />
                                    <TextInput
                                        id="source_token"
                                        type="password"
                                        className="mt-1 block w-full"
                                        value={sourceForm.data.token}
                                        onChange={(e) => sourceForm.setData('token', e.target.value)}
                                        placeholder={editingHasToken ? '•••••••• (unchanged)' : ''}
                                    />
                                    <InputError message={sourceForm.errors.token} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500">Leave blank to keep the stored token.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="source_email" value={t('tracking.fields.email')} />
                                        <TextInput
                                            id="source_email"
                                            className="mt-1 block w-full"
                                            value={sourceForm.data.email}
                                            onChange={(e) => sourceForm.setData('email', e.target.value)}
                                        />
                                        <InputError message={sourceForm.errors.email} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="source_password" value={t('tracking.fields.password')} />
                                        <TextInput
                                            id="source_password"
                                            type="password"
                                            className="mt-1 block w-full"
                                            value={sourceForm.data.password}
                                            onChange={(e) => sourceForm.setData('password', e.target.value)}
                                            placeholder={editingHasPassword ? '•••••••• (unchanged)' : ''}
                                        />
                                        <InputError message={sourceForm.errors.password} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">Leave blank to keep the stored password.</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                            checked={sourceForm.data.poll_enabled}
                            onChange={(e) => sourceForm.setData('poll_enabled', e.target.checked)}
                        />
                        {t('tracking.fields.poll_enabled')}
                    </label>

                    <div className="flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowSourceModal(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={sourceForm.processing}>
                            {editingSource ? t('common.save') : t('common.create')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
