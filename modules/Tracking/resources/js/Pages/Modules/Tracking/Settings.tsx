import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import TrackingNav from '../../../TrackingNav';

interface Config {
    base_url: string | null;
    auth_type: string;
    email: string | null;
    poll_enabled: boolean;
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

    const { data, setData, patch, processing, errors } = useForm({
        base_url: config.base_url ?? '',
        auth_type: config.auth_type,
        email: config.email ?? '',
        password: '',
        token: '',
        poll_enabled: config.poll_enabled,
        geofence_radius_m: config.geofence_radius_m,
        checkpoint_min_distance_m: config.checkpoint_min_distance_m,
        checkpoint_min_interval_minutes: config.checkpoint_min_interval_minutes,
        retention_days: config.retention_days,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('tracking.settings.update'), { preserveScroll: true });
    };

    const testConnection = () => {
        router.post(prefixedRoute('tracking.settings.test'), {}, { preserveScroll: true });
    };

    const usesToken = data.auth_type === 'token';

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Tracking</h2>}>
            <Head title="Tracking Settings" />

            <TrackingNav />

            {lastPollError && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                    Last poll failed: {lastPollError}
                </div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div>
                            <InputLabel htmlFor="base_url" value="Traccar server URL" />
                            <TextInput
                                id="base_url"
                                type="url"
                                className="mt-1 block w-full"
                                value={data.base_url}
                                onChange={(e) => setData('base_url', e.target.value)}
                                placeholder={defaultBaseUrl ?? 'https://gps.example.com'}
                            />
                            <InputError message={errors.base_url} className="mt-2" />
                            {defaultBaseUrl && (
                                <p className="mt-1 text-xs text-gray-500">Leave blank to use the default server: {defaultBaseUrl}</p>
                            )}
                        </div>

                        <div>
                            <InputLabel htmlFor="auth_type" value="Authentication" />
                            <Select
                                id="auth_type"
                                className="mt-1"
                                value={data.auth_type}
                                onChange={(value) => setData('auth_type', value)}
                                options={[
                                    { value: 'basic', label: 'Email & password' },
                                    { value: 'token', label: 'API token' },
                                ]}
                            />
                            <InputError message={errors.auth_type} className="mt-2" />
                        </div>

                        {usesToken ? (
                            <div>
                                <InputLabel htmlFor="token" value="API token" />
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
                                    <InputLabel htmlFor="email" value="Traccar user" />
                                    <TextInput
                                        id="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="password" value="Password" />
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

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={data.poll_enabled}
                                onChange={(e) => setData('poll_enabled', e.target.checked)}
                            />
                            Pull positions every minute
                        </label>

                        <div className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="geofence_radius_m" value="Arrival radius (m)" />
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
                                <InputLabel htmlFor="retention_days" value="Keep raw positions (days)" />
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
                                <InputLabel htmlFor="checkpoint_min_distance_m" value="Trail point every (m)" />
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
                                <InputLabel htmlFor="checkpoint_min_interval_minutes" value="…or every (minutes)" />
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
                                <PrimaryButton disabled={processing}>Save Settings</PrimaryButton>
                                <SecondaryButton type="button" onClick={testConnection}>Test connection</SecondaryButton>
                                <span className="text-xs text-gray-500">Last poll: {lastPolledAt ?? 'never'}</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}
