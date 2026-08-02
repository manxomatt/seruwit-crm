import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import TrackingNav from '../../../TrackingNav';
import PageHeader from '@/Components/PageHeader';

interface Config {
    provider: string;
    base_url: string | null;
    auth_type: string;
    email: string | null;
    poll_enabled: boolean;
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
    hasPassword: boolean;
    hasToken: boolean;
    defaultBaseUrl: string | null;
    lastPolledAt: string | null;
    lastPollError: string | null;
    can: { update: boolean };
}

export default function Settings({ config, hasPassword, hasToken, defaultBaseUrl, lastPolledAt, lastPollError, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const { data, setData, patch, processing, errors } = useForm({
        provider: config.provider ?? 'traccar',
        base_url: config.base_url ?? '',
        auth_type: config.auth_type,
        email: config.email ?? '',
        password: '',
        token: '',
        poll_enabled: config.poll_enabled,
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('tracking.settings.update'), { preserveScroll: true });
    };

    const [testing, setTesting] = useState(false);

    const testConnection = () => {
        setTesting(true);
        router.post(prefixedRoute('tracking.settings.test'), {}, {
            preserveScroll: true,
            onFinish: () => setTesting(false),
        });
    };

    const isSkyTrack = data.provider === 'sky_track';
    const usesToken = !isSkyTrack && data.auth_type === 'token';

    const setProvider = (provider: string) => {
        setData({
            ...data,
            provider,
            auth_type: provider === 'sky_track'
                ? 'api_key'
                : (data.auth_type === 'api_key' ? 'basic' : data.auth_type),
            email: provider === 'sky_track' ? '' : data.email,
            password: provider === 'sky_track' ? '' : data.password,
            token: '',
        });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('tracking.title')} />}>
            <Head title={t('tracking.pages.settings.title')} />

            <TrackingNav />

            {lastPollError && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                    {t('tracking.pages.map.last_poll_failed', { error: lastPollError })}
                </div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div>
                            <InputLabel htmlFor="provider" value={t('tracking.fields.provider')} />
                            <Select
                                id="provider"
                                className="mt-1"
                                value={data.provider}
                                onChange={setProvider}
                                options={[
                                    { value: 'traccar', label: t('tracking.providers.traccar') },
                                    { value: 'sky_track', label: t('tracking.providers.sky_track') },
                                ]}
                            />
                            <InputError message={errors.provider} className="mt-2" />
                            <p className="mt-1 text-xs text-gray-500">
                                {isSkyTrack
                                    ? t('tracking.pages.settings.sky_track_hint')
                                    : t('tracking.pages.settings.traccar_hint')}
                            </p>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="base_url"
                                value={isSkyTrack ? t('tracking.fields.sky_track_url') : t('tracking.fields.base_url')}
                            />
                            <TextInput
                                id="base_url"
                                type="url"
                                className="mt-1 block w-full"
                                value={data.base_url}
                                onChange={(e) => setData('base_url', e.target.value)}
                                placeholder={isSkyTrack ? 'https://api.sky-track.example.com' : (defaultBaseUrl ?? 'https://gps.example.com')}
                                required={isSkyTrack}
                            />
                            <InputError message={errors.base_url} className="mt-2" />
                            {!isSkyTrack && defaultBaseUrl && (
                                <p className="mt-1 text-xs text-gray-500">Leave blank to use the default server: {defaultBaseUrl}</p>
                            )}
                        </div>

                        {isSkyTrack ? (
                            <div>
                                <InputLabel htmlFor="token" value={t('tracking.fields.api_key')} />
                                <TextInput
                                    id="token"
                                    type="password"
                                    className="mt-1 block w-full"
                                    value={data.token}
                                    onChange={(e) => setData('token', e.target.value)}
                                    placeholder={hasToken ? '•••••••• (unchanged)' : ''}
                                />
                                <InputError message={errors.token} className="mt-2" />
                                <p className="mt-1 text-xs text-gray-500">{t('tracking.pages.settings.api_key_hint')}</p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <InputLabel htmlFor="auth_type" value={t('tracking.fields.auth_type')} />
                                    <Select
                                        id="auth_type"
                                        className="mt-1"
                                        value={data.auth_type}
                                        onChange={(value) => setData('auth_type', value)}
                                        options={[
                                            { value: 'basic', label: t('tracking.auth_types.basic') },
                                            { value: 'token', label: t('tracking.auth_types.token') },
                                        ]}
                                    />
                                    <InputError message={errors.auth_type} className="mt-2" />
                                </div>

                                {usesToken ? (
                                    <div>
                                        <InputLabel htmlFor="token" value={t('tracking.fields.token')} />
                                        <TextInput
                                            id="token"
                                            type="password"
                                            className="mt-1 block w-full"
                                            value={data.token}
                                            onChange={(e) => setData('token', e.target.value)}
                                            placeholder={hasToken ? '•••••••• (unchanged)' : ''}
                                        />
                                        <InputError message={errors.token} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">Leave blank to keep the stored token.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="email" value={t('tracking.fields.email')} />
                                            <TextInput
                                                id="email"
                                                className="mt-1 block w-full"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="password" value={t('tracking.fields.password')} />
                                            <TextInput
                                                id="password"
                                                type="password"
                                                className="mt-1 block w-full"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder={hasPassword ? '•••••••• (unchanged)' : ''}
                                            />
                                            <InputError message={errors.password} className="mt-2" />
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
                                checked={data.poll_enabled}
                                onChange={(e) => setData('poll_enabled', e.target.checked)}
                            />
                            {t('tracking.fields.poll_enabled')}
                        </label>

                        <div className="space-y-4 border-t border-gray-200 pt-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={data.alerts_enabled}
                                    onChange={(e) => setData('alerts_enabled', e.target.checked)}
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
                                        value={data.alert_speed_kph}
                                        onChange={(e) => setData('alert_speed_kph', Number(e.target.value))}
                                    />
                                    <InputError message={errors.alert_speed_kph} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="alert_stale_minutes" value={t('tracking.fields.alert_stale_minutes')} />
                                    <TextInput
                                        id="alert_stale_minutes"
                                        type="number"
                                        min={5}
                                        className="mt-1 block w-full"
                                        value={data.alert_stale_minutes}
                                        onChange={(e) => setData('alert_stale_minutes', Number(e.target.value))}
                                    />
                                    <InputError message={errors.alert_stale_minutes} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="alert_idle_minutes" value={t('tracking.fields.alert_idle_minutes')} />
                                    <TextInput
                                        id="alert_idle_minutes"
                                        type="number"
                                        min={5}
                                        className="mt-1 block w-full"
                                        value={data.alert_idle_minutes}
                                        onChange={(e) => setData('alert_idle_minutes', Number(e.target.value))}
                                    />
                                    <InputError message={errors.alert_idle_minutes} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="alert_cooldown_minutes" value={t('tracking.fields.alert_cooldown_minutes')} />
                                    <TextInput
                                        id="alert_cooldown_minutes"
                                        type="number"
                                        min={5}
                                        className="mt-1 block w-full"
                                        value={data.alert_cooldown_minutes}
                                        onChange={(e) => setData('alert_cooldown_minutes', Number(e.target.value))}
                                    />
                                    <InputError message={errors.alert_cooldown_minutes} className="mt-2" />
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
                                    value={data.geofence_radius_m}
                                    onChange={(e) => setData('geofence_radius_m', Number(e.target.value))}
                                />
                                <InputError message={errors.geofence_radius_m} className="mt-2" />
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
                                    value={data.retention_days}
                                    onChange={(e) => setData('retention_days', Number(e.target.value))}
                                />
                                <InputError message={errors.retention_days} className="mt-2" />
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
                                    value={data.checkpoint_min_distance_m}
                                    onChange={(e) => setData('checkpoint_min_distance_m', Number(e.target.value))}
                                />
                                <InputError message={errors.checkpoint_min_distance_m} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="checkpoint_min_interval_minutes" value={t('tracking.fields.trail_every_minutes')} />
                                <TextInput
                                    id="checkpoint_min_interval_minutes"
                                    type="number"
                                    min={1}
                                    className="mt-1 block w-full"
                                    value={data.checkpoint_min_interval_minutes}
                                    onChange={(e) => setData('checkpoint_min_interval_minutes', Number(e.target.value))}
                                />
                                <InputError message={errors.checkpoint_min_interval_minutes} className="mt-2" />
                            </div>
                        </div>

                        {can.update && (
                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>{t('tracking.actions.save')}</PrimaryButton>
                                <SecondaryButton type="button" onClick={testConnection} disabled={testing}>
                                    {testing ? 'Testing...' : t('tracking.actions.test_connection')}
                                </SecondaryButton>
                                <span className="text-xs text-gray-500">Last poll: {lastPolledAt ?? 'never'}</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
