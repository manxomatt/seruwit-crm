import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import FleetNav from '../../../../FleetNav';
import PageHeader from '@/Components/PageHeader';
import FleetOnboardingHero, { FleetSetupCounts, FleetSetupPermissions } from '../../../../Components/FleetOnboardingHero';

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
    bases?: { active: number; inactive: number; total: number };
    counts: { active: number; maintenance: number; inactive: number; total: number };
    drivers: { available: number; on_leave: number; inactive: number; total: number };
    expiring_docs: { expired: number; expiring_30: number; available: boolean };
    vehicles: PaginatedVehicles;
}

interface Props {
    board: Board;
    can?: FleetSetupPermissions;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    active: { label: 'Active', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    maintenance: { label: 'Maintenance', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    inactive: { label: 'Inactive', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
};

const EXPIRY_CONFIG: Record<string, { label: string; badge: string }> = {
    valid: { label: 'Valid', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60' },
    expiring_soon: { label: 'Expiring Soon', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60' },
    expired: { label: 'Expired', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60' },
    unknown: { label: 'Unknown', badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
};

function sharePercent(part: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

type StatTone = 'emerald' | 'amber' | 'slate' | 'sky' | 'rose';

const STAT_TONES: Record<
    StatTone,
    {
        card: string;
        iconBg: string;
        iconText: string;
        value: string;
        bar: string;
        track: string;
    }
> = {
    emerald: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        value: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
        track: 'bg-emerald-100 dark:bg-emerald-950',
    },
    amber: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        iconBg: 'bg-amber-50 dark:bg-amber-950/50',
        iconText: 'text-amber-600 dark:text-amber-400',
        value: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
        track: 'bg-amber-100 dark:bg-amber-950',
    },
    slate: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        iconBg: 'bg-slate-100 dark:bg-slate-800',
        iconText: 'text-slate-600 dark:text-slate-400',
        value: 'text-slate-900 dark:text-white',
        bar: 'bg-slate-500',
        track: 'bg-slate-200 dark:bg-slate-800',
    },
    sky: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        iconBg: 'bg-sky-50 dark:bg-sky-950/50',
        iconText: 'text-sky-600 dark:text-sky-400',
        value: 'text-sky-600 dark:text-sky-400',
        bar: 'bg-sky-500',
        track: 'bg-sky-100 dark:bg-sky-950',
    },
    rose: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        iconBg: 'bg-rose-50 dark:bg-rose-950/50',
        iconText: 'text-rose-600 dark:text-rose-400',
        value: 'text-rose-600 dark:text-rose-400',
        bar: 'bg-rose-500',
        track: 'bg-rose-100 dark:bg-rose-950',
    },
};

interface StatCardProps {
    label: string;
    value: number;
    hint?: string;
    tone: StatTone;
    icon: string;
    progress?: number;
    progressLabel?: string;
    meta?: Array<{ label: string; value: number }>;
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
}: StatCardProps): JSX.Element {
    const styles = STAT_TONES[tone];
    const clampedProgress = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

    return (
        <div className={`flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md ${styles.card}`}>
            <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${styles.iconBg} ${styles.iconText}`}>
                        {icon}
                    </div>
                </div>
                <p className={`text-3xl font-black tracking-tight tabular-nums ${styles.value}`}>{value}</p>
                {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            </div>

            {clampedProgress !== undefined && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-400">
                        <span className="truncate">{progressLabel}</span>
                        <span className="tabular-nums text-slate-700 dark:text-slate-300">{clampedProgress}%</span>
                    </div>
                    <div className={`h-2 w-full overflow-hidden rounded-full ${styles.track}`}>
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
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                        >
                            <span className="tabular-nums font-black text-slate-900 dark:text-white">{item.value}</span>
                            <span>{item.label}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Index({ board, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { bases, counts, drivers, expiring_docs, vehicles } = board;

    const setupCounts: FleetSetupCounts = {
        bases: bases?.total ?? 0,
        vehicles: counts.total,
        drivers: drivers.total,
    };

    const isZeroState = setupCounts.bases === 0 && setupCounts.vehicles === 0 && setupCounts.drivers === 0;
    const isPartialSetup = !isZeroState && (setupCounts.bases === 0 || setupCounts.vehicles === 0 || setupCounts.drivers === 0);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('fleet.title', undefined, 'Fleet Management')}
                    subtitle={t('fleet.dashboard.subtitle', undefined, 'Vehicle status board and operational overview')}
                    actions={
                        !isZeroState && can?.create_vehicle !== false ? (
                            <Link
                                href={prefixedRoute('fleet.vehicles.create')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                            >
                                <span>{t('fleet.vehicles.add', undefined, 'Tambah Kendaraan')}</span>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('fleet.dashboard.title', undefined, 'Fleet Dashboard')} />

            <FleetNav />

            <div className="space-y-6">
                {isZeroState ? (
                    <FleetOnboardingHero counts={setupCounts} can={can} mode="full" />
                ) : (
                    <>
                        {isPartialSetup && (
                            <FleetOnboardingHero counts={setupCounts} can={can} mode="banner" />
                        )}

                        {/* Stat Grid */}
                        <div className={`grid gap-4 sm:grid-cols-2 ${expiring_docs.available ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
                            <StatCard
                                label={t('fleet.dashboard.active', undefined, 'Active')}
                                value={counts.active}
                                hint={t('fleet.dashboard.of_vehicles', { total: counts.total }, `${counts.active} of ${counts.total} vehicles`)}
                                tone="emerald"
                                icon="🚗"
                                progress={sharePercent(counts.active, counts.total)}
                                progressLabel={t('fleet.dashboard.share_label', undefined, 'Active Share')}
                            />
                            <StatCard
                                label={t('fleet.dashboard.maintenance', undefined, 'Maintenance')}
                                value={counts.maintenance}
                                hint={
                                    counts.maintenance > 0
                                        ? t('fleet.dashboard.maintenance_hint', undefined, 'Needs service attention')
                                        : t('fleet.dashboard.maintenance_clear', undefined, 'All units operational')
                                }
                                tone="amber"
                                icon="🛠️"
                                progress={sharePercent(counts.maintenance, counts.total)}
                                progressLabel={t('fleet.dashboard.share_label', undefined, 'In Maintenance')}
                            />
                            <StatCard
                                label={t('fleet.dashboard.inactive', undefined, 'Inactive')}
                                value={counts.inactive}
                                hint={t('fleet.dashboard.inactive_hint', undefined, 'Parked or unassigned')}
                                tone="slate"
                                icon="⏸️"
                                progress={sharePercent(counts.inactive, counts.total)}
                                progressLabel={t('fleet.dashboard.share_label', undefined, 'Inactive Share')}
                            />
                            <StatCard
                                label={t('fleet.dashboard.drivers_available', undefined, 'Drivers Ready')}
                                value={drivers.available}
                                hint={t('fleet.dashboard.of_drivers', { total: drivers.total }, `${drivers.available} of ${drivers.total} drivers`)}
                                tone="sky"
                                icon="👨‍✈️"
                                progress={sharePercent(drivers.available, drivers.total)}
                                progressLabel={t('fleet.dashboard.drivers_ready', undefined, 'Ready Rate')}
                                meta={[
                                    { label: t('fleet.dashboard.on_leave', undefined, 'On Leave'), value: drivers.on_leave },
                                    { label: t('fleet.dashboard.drivers_inactive', undefined, 'Inactive'), value: drivers.inactive },
                                ]}
                            />
                            {expiring_docs.available && (
                                <StatCard
                                    label={t('fleet.dashboard.docs_compliance', undefined, 'Docs Expiring')}
                                    value={expiring_docs.expired + expiring_docs.expiring_30}
                                    hint={
                                        expiring_docs.expired + expiring_docs.expiring_30 === 0
                                            ? t('fleet.dashboard.docs_clear', undefined, 'All docs valid')
                                            : t('fleet.dashboard.docs_attention', undefined, 'Requires renewal')
                                    }
                                    tone={expiring_docs.expired > 0 ? 'rose' : expiring_docs.expiring_30 > 0 ? 'amber' : 'emerald'}
                                    icon="📜"
                                    meta={[
                                        { label: t('fleet.dashboard.docs_expired', undefined, 'Expired'), value: expiring_docs.expired },
                                        { label: t('fleet.dashboard.docs_expiring', undefined, 'In 30 Days'), value: expiring_docs.expiring_30 },
                                    ]}
                                />
                            )}
                        </div>

                        {/* Expiry Alert Banner */}
                        {expiring_docs.available && (expiring_docs.expired > 0 || expiring_docs.expiring_30 > 0) && (
                            <div className="flex items-center justify-between gap-4 rounded-3xl border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/50 p-4 text-xs font-semibold text-amber-900 dark:text-amber-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">⚠️</span>
                                    <span>
                                        {t('fleet.dashboard.docs_alert', {
                                            expired: expiring_docs.expired,
                                            expiring: expiring_docs.expiring_30,
                                        }, `${expiring_docs.expired} expired and ${expiring_docs.expiring_30} expiring soon`)}
                                    </span>
                                </div>
                                <Link
                                    href={prefixedRoute('documents.index')}
                                    className="inline-flex items-center gap-1 rounded-xl bg-amber-600 text-white px-3 py-1.5 font-bold hover:bg-amber-700 transition"
                                >
                                    {t('fleet.dashboard.open_documents', undefined, 'Manage Docs')} ➔
                                </Link>
                            </div>
                        )}

                        {/* Fleet Overview Table */}
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Armada & Vehicle Status Board</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Real-time status, odometer, fuel logs, and STNK/KIR compliance</p>
                                </div>
                                <Link
                                    href={prefixedRoute('fleet.vehicles.index')}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    View All Vehicles ➔
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3.5 text-left">{t('fleet.dashboard.vehicle', undefined, 'Vehicle')}</th>
                                            <th className="px-5 py-3.5 text-left">{t('fleet.dashboard.status', undefined, 'Status')}</th>
                                            <th className="px-5 py-3.5 text-right">{t('fleet.dashboard.odometer', undefined, 'Odometer')}</th>
                                            <th className="px-5 py-3.5 text-left">{t('fleet.dashboard.last_fuel', undefined, 'Last Fuel Refuel')}</th>
                                            <th className="px-5 py-3.5 text-left">{t('fleet.dashboard.stnk', undefined, 'STNK Date')}</th>
                                            <th className="px-5 py-3.5 text-left">{t('fleet.dashboard.kir', undefined, 'KIR Date')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                        {vehicles.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-16 text-center">
                                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-2xl text-indigo-600 dark:text-indigo-400 mb-3 shadow-2xs">
                                                            🚗
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                            {t('fleet.dashboard.empty', undefined, 'Belum ada unit kendaraan terdaftar.')}
                                                        </h4>
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            Daftarkan unit kendaraan armada Anda untuk mulai memantau status operasional, odometer, dan kepatuhan dokumen STNK/KIR.
                                                        </p>
                                                        {can?.create_vehicle !== false && (
                                                            <Link
                                                                href={prefixedRoute('fleet.vehicles.create')}
                                                                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                                                            >
                                                                <span>{t('fleet.vehicles.add', undefined, 'Tambah Kendaraan')}</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                    vehicles.data.map((vehicle) => {
                                        const statusCfg = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.inactive;
                                        const stnkCfg = EXPIRY_CONFIG[vehicle.stnk_status] || EXPIRY_CONFIG.unknown;
                                        const kirCfg = EXPIRY_CONFIG[vehicle.kir_status] || EXPIRY_CONFIG.unknown;

                                        return (
                                            <tr key={vehicle.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                            🚗
                                                        </div>
                                                        <div>
                                                            <Link
                                                                href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                            >
                                                                {vehicle.name}
                                                            </Link>
                                                            <div className="inline-block mt-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                                                                {vehicle.plate_number}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-extrabold ${statusCfg.bg} ${statusCfg.text}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                                        {t(`fleet.status.${vehicle.status}`, undefined, vehicle.status)}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    {vehicle.odometer_km.toLocaleString('id-ID')} km
                                                </td>

                                                <td className="px-5 py-4">
                                                    {vehicle.last_fuel_at ? (
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-slate-200">
                                                                {new Date(vehicle.last_fuel_at).toLocaleDateString('id-ID')}
                                                            </div>
                                                            {vehicle.last_fuel_odometer !== null && (
                                                                <div className="text-[10px] font-mono text-slate-400">
                                                                    @{vehicle.last_fuel_odometer.toLocaleString('id-ID')} km
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {vehicle.stnk_expires_at ? new Date(vehicle.stnk_expires_at).toLocaleDateString('id-ID') : '—'}
                                                        </span>
                                                        <span className={`inline-self-start rounded-lg border px-2 py-0.5 text-[9px] font-extrabold ${stnkCfg.badge}`}>
                                                            {stnkCfg.label}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {vehicle.kir_expires_at ? new Date(vehicle.kir_expires_at).toLocaleDateString('id-ID') : '—'}
                                                        </span>
                                                        <span className={`inline-self-start rounded-lg border px-2 py-0.5 text-[9px] font-extrabold ${kirCfg.badge}`}>
                                                            {kirCfg.label}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {vehicles.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-semibold text-slate-500">
                                {t('common.showing_results', {
                                    from: (vehicles.current_page - 1) * vehicles.per_page + 1,
                                    to: Math.min(vehicles.current_page * vehicles.per_page, vehicles.total),
                                    total: vehicles.total,
                                }, `Showing ${(vehicles.current_page - 1) * vehicles.per_page + 1} to ${Math.min(vehicles.current_page * vehicles.per_page, vehicles.total)} of ${vehicles.total}`)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {vehicles.links.map((link, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                                            link.active
                                                ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
                                                : link.url
                                                  ? 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                                                  : 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                </>
                )}
            </div>
        </DynamicLayout>
    );
}
