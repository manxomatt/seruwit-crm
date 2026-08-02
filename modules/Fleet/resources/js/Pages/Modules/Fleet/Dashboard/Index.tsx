import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import FleetNav from '../../../../FleetNav';
import PageHeader from '@/Components/PageHeader';

interface VehicleRow {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
    status: string;
    odometer_km: number;
    last_fuel_at: string | null;
    last_fuel_odometer: number | null;
    stnk_expires_at: string | null;
    kir_expires_at: string | null;
    stnk_status: string;
    kir_status: string;
}

interface PaginatedVehicles {
    data: VehicleRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Board {
    counts: { active: number; maintenance: number; inactive: number; total: number };
    drivers: { available: number; on_leave: number; inactive: number; total: number };
    expiring_docs: { expired: number; expiring_30: number; available: boolean };
    vehicles: PaginatedVehicles;
}

interface Props {
    board: Board;
}

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-amber-100 text-amber-800',
    inactive: 'bg-gray-100 text-gray-600',
};

const EXPIRY_STYLES: Record<string, string> = {
    valid: 'text-green-700',
    expiring_soon: 'text-amber-700',
    expired: 'text-red-700',
    unknown: 'text-gray-400',
};

type StatTone = 'emerald' | 'amber' | 'slate' | 'sky' | 'rose';

const STAT_TONES: Record<
    StatTone,
    {
        card: string;
        icon: string;
        value: string;
        bar: string;
        track: string;
        accent: string;
    }
> = {
    emerald: {
        card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
        icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
        value: 'text-emerald-900',
        bar: 'bg-emerald-500',
        track: 'bg-emerald-100',
        accent: 'bg-emerald-500',
    },
    amber: {
        card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-900',
        bar: 'bg-amber-500',
        track: 'bg-amber-100',
        accent: 'bg-amber-500',
    },
    slate: {
        card: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-gray-100',
        icon: 'bg-slate-500 text-white shadow-slate-500/30',
        value: 'text-slate-900',
        bar: 'bg-slate-500',
        track: 'bg-slate-200',
        accent: 'bg-slate-500',
    },
    sky: {
        card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50',
        icon: 'bg-sky-500 text-white shadow-sky-500/30',
        value: 'text-sky-900',
        bar: 'bg-sky-500',
        track: 'bg-sky-100',
        accent: 'bg-sky-500',
    },
    rose: {
        card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-900',
        bar: 'bg-rose-500',
        track: 'bg-rose-100',
        accent: 'bg-rose-500',
    },
};

function IconVehicle(): JSX.Element {
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

function IconWrench(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.751l-6.81 6.814a2.548 2.548 0 11-3.605-3.604l6.81-6.811c.68-.686.842-1.874.751-2.95a4.5 4.5 0 016.336-4.486l-3.086 3.086a1.5 1.5 0 002.121 2.121l3.086-3.086a4.48 4.48 0 011.23 2.68z"
            />
        </svg>
    );
}

function IconPause(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function IconUsers(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
        </svg>
    );
}

function IconDocument(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
        </svg>
    );
}

function sharePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
    progress,
    progressLabel,
    meta,
}: {
    label: string;
    value: number | string;
    hint?: string;
    tone: StatTone;
    icon: JSX.Element;
    progress?: number;
    progressLabel?: string;
    meta?: Array<{ label: string; value: number | string }>;
}): JSX.Element {
    const styles = STAT_TONES[tone];
    const clampedProgress = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));

    return (
        <div className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${styles.card}`}>
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
            {clampedProgress !== undefined && (
                <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-medium text-gray-500">
                        <span className="truncate">{progressLabel}</span>
                        <span className="tabular-nums">{clampedProgress}%</span>
                    </div>
                    <div className={`h-1.5 w-full overflow-hidden rounded-full ${styles.track}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
                            style={{ width: `${clampedProgress}%` }}
                        />
                    </div>
                </div>
            )}
            {meta && meta.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {meta.map((item) => (
                        <span
                            key={item.label}
                            className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-black/5"
                        >
                            <span className="tabular-nums text-gray-900">{item.value}</span>
                            <span>{item.label}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Index({ board }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { counts, drivers, expiring_docs, vehicles } = board;

    return (
        <DynamicLayout
            header={<PageHeader title={t('fleet.title')} />}
        >
            <Head title={t('fleet.dashboard.title')} />

            <FleetNav />

            <p className="mb-6 text-sm text-gray-600">{t('fleet.dashboard.subtitle')}</p>

            <div className={`mb-6 grid gap-4 sm:grid-cols-2 ${expiring_docs.available ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
                <StatCard
                    label={t('fleet.dashboard.active')}
                    value={counts.active}
                    hint={t('fleet.dashboard.of_vehicles', { total: counts.total })}
                    tone="emerald"
                    icon={<IconVehicle />}
                    progress={sharePercent(counts.active, counts.total)}
                    progressLabel={t('fleet.dashboard.share_label')}
                />
                <StatCard
                    label={t('fleet.dashboard.maintenance')}
                    value={counts.maintenance}
                    hint={
                        counts.maintenance > 0
                            ? t('fleet.dashboard.maintenance_hint')
                            : t('fleet.dashboard.maintenance_clear')
                    }
                    tone="amber"
                    icon={<IconWrench />}
                    progress={sharePercent(counts.maintenance, counts.total)}
                    progressLabel={t('fleet.dashboard.share_label')}
                />
                <StatCard
                    label={t('fleet.dashboard.inactive')}
                    value={counts.inactive}
                    hint={t('fleet.dashboard.inactive_hint')}
                    tone="slate"
                    icon={<IconPause />}
                    progress={sharePercent(counts.inactive, counts.total)}
                    progressLabel={t('fleet.dashboard.share_label')}
                />
                <StatCard
                    label={t('fleet.dashboard.drivers_available')}
                    value={drivers.available}
                    hint={t('fleet.dashboard.of_drivers', { total: drivers.total })}
                    tone="sky"
                    icon={<IconUsers />}
                    progress={sharePercent(drivers.available, drivers.total)}
                    progressLabel={t('fleet.dashboard.drivers_ready')}
                    meta={[
                        { label: t('fleet.dashboard.on_leave'), value: drivers.on_leave },
                        { label: t('fleet.dashboard.drivers_inactive'), value: drivers.inactive },
                    ]}
                />
                {expiring_docs.available && (
                    <StatCard
                        label={t('fleet.dashboard.docs_compliance')}
                        value={expiring_docs.expired + expiring_docs.expiring_30}
                        hint={
                            expiring_docs.expired + expiring_docs.expiring_30 === 0
                                ? t('fleet.dashboard.docs_clear')
                                : t('fleet.dashboard.docs_attention')
                        }
                        tone={expiring_docs.expired > 0 ? 'rose' : expiring_docs.expiring_30 > 0 ? 'amber' : 'emerald'}
                        icon={<IconDocument />}
                        meta={[
                            { label: t('fleet.dashboard.docs_expired'), value: expiring_docs.expired },
                            { label: t('fleet.dashboard.docs_expiring'), value: expiring_docs.expiring_30 },
                        ]}
                    />
                )}
            </div>

            {expiring_docs.available && (expiring_docs.expired > 0 || expiring_docs.expiring_30 > 0) && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm text-amber-900">
                    {t('fleet.dashboard.docs_alert', {
                        expired: expiring_docs.expired,
                        expiring: expiring_docs.expiring_30,
                    })}{' '}
                    <Link href={prefixedRoute('documents.index')} className="font-medium underline">
                        {t('fleet.dashboard.open_documents')}
                    </Link>
                </div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.vehicle')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.status')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.odometer')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.last_fuel')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.stnk')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.kir')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {vehicles.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                        {t('fleet.dashboard.empty')}
                                    </td>
                                </tr>
                            ) : (
                                vehicles.data.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                className="font-medium text-indigo-600 hover:underline"
                                            >
                                                {vehicle.name}
                                            </Link>
                                            <div className="text-xs text-gray-500">{vehicle.plate_number}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[vehicle.status] ?? STATUS_STYLES.inactive}`}>
                                                {t(`fleet.status.${vehicle.status}`, undefined, vehicle.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {vehicle.odometer_km.toLocaleString('id-ID')} km
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {vehicle.last_fuel_at
                                                ? new Date(vehicle.last_fuel_at).toLocaleDateString('id-ID')
                                                : '—'}
                                            {vehicle.last_fuel_odometer !== null && (
                                                <div className="text-xs text-gray-400">
                                                    @{vehicle.last_fuel_odometer.toLocaleString('id-ID')} km
                                                </div>
                                            )}
                                        </td>
                                        <td className={`px-4 py-3 text-sm ${EXPIRY_STYLES[vehicle.stnk_status]}`}>
                                            {vehicle.stnk_expires_at
                                                ? new Date(vehicle.stnk_expires_at).toLocaleDateString('id-ID')
                                                : '—'}
                                        </td>
                                        <td className={`px-4 py-3 text-sm ${EXPIRY_STYLES[vehicle.kir_status]}`}>
                                            {vehicle.kir_expires_at
                                                ? new Date(vehicle.kir_expires_at).toLocaleDateString('id-ID')
                                                : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {vehicles.last_page > 1 && (
                    <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (vehicles.current_page - 1) * vehicles.per_page + 1,
                                to: Math.min(vehicles.current_page * vehicles.per_page, vehicles.total),
                                total: vehicles.total,
                            })}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {vehicles.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                              : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 text-sm">
                <Link href={prefixedRoute('fleet.fuel.analytics')} className="font-medium text-indigo-600 hover:underline">
                    {t('fleet.dashboard.open_analytics')}
                </Link>
            </div>
        </DynamicLayout>
    );
}
