import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import TrackingNav from '../../../../TrackingNav';

interface RecentDevice {
    id: number;
    name: string;
    status: string | null;
    paired: boolean;
    vehicle: { id: number; name: string; plate_number: string } | null;
    last_speed_kph: number | null;
    last_recorded_at: string | null;
    tone: 'moving' | 'idle' | 'stale';
}

interface Board {
    devices: {
        total: number;
        paired: number;
        unpaired: number;
        with_fix: number;
        online: number;
        moving: number;
        idle: number;
        stale: number;
    };
    geofences: { available: boolean; active: number; total: number };
    activity: { positions_today: number };
    config: {
        configured: boolean;
        provider: string;
        poll_enabled: boolean;
        alerts_enabled: boolean;
        last_polled_at: string | null;
        last_poll_error: string | null;
    };
    recent: RecentDevice[];
}

interface Props {
    board: Board;
    can: { update: boolean; create: boolean };
}

type StatTone = 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' | 'slate';

const STAT_TONES: Record<StatTone, { card: string; icon: string; value: string; accent: string }> = {
    emerald: {
        card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
        icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
        value: 'text-emerald-900',
        accent: 'bg-emerald-500',
    },
    sky: {
        card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50',
        icon: 'bg-sky-500 text-white shadow-sky-500/30',
        value: 'text-sky-900',
        accent: 'bg-sky-500',
    },
    amber: {
        card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-900',
        accent: 'bg-amber-500',
    },
    violet: {
        card: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50',
        icon: 'bg-violet-500 text-white shadow-violet-500/30',
        value: 'text-violet-900',
        accent: 'bg-violet-500',
    },
    rose: {
        card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-900',
        accent: 'bg-rose-500',
    },
    slate: {
        card: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-gray-100',
        icon: 'bg-slate-500 text-white shadow-slate-500/30',
        value: 'text-slate-900',
        accent: 'bg-slate-500',
    },
};

function sharePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function IconSatellite(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.25 2.25 0 103.897 1.688M9.384 9.137l2.022.95M9.384 9.137l.897 2.022m4.022-3.897a3 3 0 105.196 3 3 3 0 00-5.196-3zm1.536.887l-1.536.887m0 0a2.25 2.25 0 01-3.897 1.688m3.897-1.688l-2.022.95m2.022-.95l-.897 2.022M12 15.75v3.75"
            />
        </svg>
    );
}

function IconMoving(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.74 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
        </svg>
    );
}

function IconIdle(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function IconStale(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
        </svg>
    );
}

function IconLink(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
        </svg>
    );
}

function IconArrow(): JSX.Element {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
    );
}

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
    href,
    progress,
    progressLabel,
}: {
    label: string;
    value: number | string;
    hint?: string;
    tone: StatTone;
    icon: JSX.Element;
    href?: string;
    progress?: number;
    progressLabel?: string;
}): JSX.Element {
    const styles = STAT_TONES[tone];
    const clamped = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));

    const body = (
        <>
            <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className={`mt-2 text-3xl font-bold tabular-nums ${styles.value}`}>{value}</p>
                    {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>
                    {icon}
                </div>
            </div>
            {clamped !== undefined && (
                <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-medium text-gray-500">
                        <span className="truncate">{progressLabel}</span>
                        <span className="tabular-nums">{clamped}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                        <div className={`h-full rounded-full ${styles.accent}`} style={{ width: `${clamped}%` }} />
                    </div>
                </div>
            )}
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                className={`relative block overflow-hidden rounded-xl border p-4 shadow-sm transition hover:shadow-md ${styles.card}`}
            >
                {body}
            </Link>
        );
    }

    return <div className={`relative overflow-hidden rounded-xl border p-4 shadow-sm ${styles.card}`}>{body}</div>;
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }): JSX.Element {
    return (
        <Link
            href={href}
            className="group flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md"
        >
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{title}</p>
                <p className="mt-1 text-xs text-gray-500">{description}</p>
            </div>
            <span className="mt-0.5 text-gray-300 transition group-hover:text-indigo-500">
                <IconArrow />
            </span>
        </Link>
    );
}

function toneBadge(
    tone: RecentDevice['tone'],
    t: (key: string, params?: Record<string, string | number>, fallback?: string) => string,
): { label: string; classes: string } {
    switch (tone) {
        case 'moving':
            return { label: t('tracking.dashboard.tone_moving'), classes: 'bg-emerald-100 text-emerald-800' };
        case 'idle':
            return { label: t('tracking.dashboard.tone_idle'), classes: 'bg-amber-100 text-amber-800' };
        default:
            return { label: t('tracking.dashboard.tone_stale'), classes: 'bg-slate-100 text-slate-700' };
    }
}

export default function Index({ board, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const { devices, geofences, activity, config, recent } = board;

    const pollHealthy = config.configured && config.poll_enabled && !config.last_poll_error;
    const needsSetup = !config.configured || devices.unpaired > 0 || !!config.last_poll_error;

    const formatWhen = (value: string | null): string => {
        if (!value) {
            return '—';
        }

        return new Date(value).toLocaleString(localeTag, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('tracking.title')}
                    actions={
                        <Link href={prefixedRoute('tracking.map')}>
                            <PrimaryButton>{t('tracking.dashboard.open_map')}</PrimaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('tracking.dashboard.title')} />

            <TrackingNav />

            <p className="mb-6 text-sm text-gray-600">{t('tracking.dashboard.subtitle')}</p>

            <div
                className={`mb-6 rounded-xl border px-4 py-3 ${
                    pollHealthy && !needsSetup
                        ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900'
                        : config.last_poll_error
                          ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 text-rose-950'
                          : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950'
                }`}
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold">
                            {!config.configured
                                ? t('tracking.dashboard.banner_setup')
                                : config.last_poll_error
                                  ? t('tracking.dashboard.banner_error')
                                  : !config.poll_enabled
                                    ? t('tracking.dashboard.banner_paused')
                                    : devices.unpaired > 0
                                      ? t('tracking.dashboard.banner_unpaired')
                                      : t('tracking.dashboard.banner_ok')}
                        </p>
                        <p className="mt-0.5 text-sm opacity-90">
                            {config.last_poll_error
                                ? config.last_poll_error
                                : t('tracking.dashboard.banner_hint', {
                                      paired: devices.paired,
                                      total: devices.total,
                                  })}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                        <span className="rounded-md bg-white/70 px-2 py-1 ring-1 ring-black/5">
                            {t(`tracking.providers.${config.provider}`, undefined, config.provider)}
                        </span>
                        <span className="rounded-md bg-white/70 px-2 py-1 ring-1 ring-black/5">
                            {config.poll_enabled
                                ? t('tracking.dashboard.poll_on')
                                : t('tracking.dashboard.poll_off')}
                        </span>
                        {config.last_polled_at && (
                            <span className="rounded-md bg-white/70 px-2 py-1 ring-1 ring-black/5">
                                {t('tracking.dashboard.last_poll')}: {formatWhen(config.last_polled_at)}
                            </span>
                        )}
                    </div>
                </div>
                {(!config.configured || config.last_poll_error) && can.update && (
                    <div className="mt-3">
                        <Link
                            href={prefixedRoute('tracking.settings.edit')}
                            className="text-sm font-medium underline underline-offset-2"
                        >
                            {t('tracking.dashboard.open_settings')}
                        </Link>
                    </div>
                )}
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    label={t('tracking.dashboard.paired')}
                    value={devices.paired}
                    hint={t('tracking.dashboard.of_devices', { total: devices.total })}
                    tone="sky"
                    icon={<IconLink />}
                    href={prefixedRoute('tracking.devices.index')}
                    progress={sharePercent(devices.paired, devices.total)}
                    progressLabel={t('tracking.dashboard.paired_share')}
                />
                <StatCard
                    label={t('tracking.dashboard.moving')}
                    value={devices.moving}
                    hint={t('tracking.dashboard.moving_hint')}
                    tone="emerald"
                    icon={<IconMoving />}
                    href={prefixedRoute('tracking.map')}
                    progress={sharePercent(devices.moving, devices.with_fix)}
                    progressLabel={t('tracking.dashboard.of_live')}
                />
                <StatCard
                    label={t('tracking.dashboard.idle')}
                    value={devices.idle}
                    hint={t('tracking.dashboard.idle_hint')}
                    tone="amber"
                    icon={<IconIdle />}
                    href={prefixedRoute('tracking.map')}
                />
                <StatCard
                    label={t('tracking.dashboard.stale')}
                    value={devices.stale}
                    hint={t('tracking.dashboard.stale_hint')}
                    tone={devices.stale > 0 ? 'rose' : 'slate'}
                    icon={<IconStale />}
                    href={prefixedRoute('tracking.devices.index')}
                />
                <StatCard
                    label={t('tracking.dashboard.online')}
                    value={devices.online}
                    hint={t('tracking.dashboard.positions_today', { count: activity.positions_today })}
                    tone="violet"
                    icon={<IconSatellite />}
                />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('tracking.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('tracking.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('tracking.devices.index')}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                            {t('tracking.dashboard.view_devices')}
                        </Link>
                    </div>

                    {recent.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <p className="text-sm font-medium text-gray-800">{t('tracking.dashboard.empty_devices')}</p>
                            <p className="mt-1 text-xs text-gray-500">{t('tracking.dashboard.empty_devices_hint')}</p>
                            {can.create && (
                                <Link
                                    href={prefixedRoute('tracking.devices.index')}
                                    className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
                                >
                                    {t('tracking.actions.sync')}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('tracking.fields.device')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('tracking.fields.vehicle')}
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('tracking.dashboard.speed')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('tracking.dashboard.last_fix')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('tracking.fields.status')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {recent.map((device) => {
                                        const badge = toneBadge(device.tone, t);

                                        return (
                                            <tr key={device.id} className="hover:bg-gray-50/80">
                                                <td className="px-5 py-3 font-medium text-gray-900">{device.name}</td>
                                                <td className="px-5 py-3 text-gray-700">
                                                    {device.vehicle ? (
                                                        <>
                                                            <div>{device.vehicle.name}</div>
                                                            <div className="text-xs text-gray-400">{device.vehicle.plate_number}</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-amber-700">{t('tracking.status.unpaired')}</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right tabular-nums text-gray-700">
                                                    {device.last_speed_kph !== null
                                                        ? `${device.last_speed_kph.toLocaleString(localeTag)} km/h`
                                                        : '—'}
                                                </td>
                                                <td className="px-5 py-3 tabular-nums text-gray-600">
                                                    {formatWhen(device.last_recorded_at)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('tracking.dashboard.quick_actions')}</h3>
                        <div className="space-y-3">
                            <QuickLink
                                href={prefixedRoute('tracking.map')}
                                title={t('tracking.nav.map')}
                                description={t('tracking.dashboard.quick_map')}
                            />
                            <QuickLink
                                href={prefixedRoute('tracking.history')}
                                title={t('tracking.nav.history')}
                                description={t('tracking.dashboard.quick_history')}
                            />
                            <QuickLink
                                href={prefixedRoute('tracking.devices.index')}
                                title={t('tracking.nav.devices')}
                                description={t('tracking.dashboard.quick_devices')}
                            />
                            <QuickLink
                                href={prefixedRoute('tracking.geofences.index')}
                                title={t('tracking.nav.geofences')}
                                description={t('tracking.dashboard.quick_geofences')}
                            />
                            <QuickLink
                                href={prefixedRoute('tracking.settings.edit')}
                                title={t('tracking.nav.settings')}
                                description={t('tracking.dashboard.quick_settings')}
                            />
                        </div>
                    </div>

                    {geofences.available && (
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {t('tracking.dashboard.geofences')}
                            </p>
                            <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{geofences.active}</p>
                            <p className="mt-1 text-xs text-gray-500">
                                {t('tracking.dashboard.of_geofences', { total: geofences.total })}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                                {config.alerts_enabled
                                    ? t('tracking.dashboard.alerts_on')
                                    : t('tracking.dashboard.alerts_off')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
