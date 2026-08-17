import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatDate } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import FleetNav from '../../../../FleetNav';
import PageHeader from '@/Components/PageHeader';

interface LogRow {
    id: number;
    filled_at: string;
    liters: string;
    cost: string;
    odometer_km: number | null;
    distance_since_last_km: number | null;
    km_per_liter: string | number | null;
    liters_per_100km: string | number | null;
    odometer_source: string | null;
    anomaly_flags: { code: string; message: string; severity: string }[] | null;
    vehicle: { id: number; name: string; plate_number: string } | null;
    driver: { id: number; name: string } | null;
}

interface PaginatedLogs {
    data: LogRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    logs: PaginatedLogs;
    vehicles: { id: number; name: string; plate_number: string }[];
    filters: { vehicle_id?: number | null; anomalies_only?: boolean };
}

export default function Index({ logs, vehicles, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    return (
        <DynamicLayout
            header={<PageHeader title={t('fleet.title', undefined, 'Fleet Management')} subtitle={t('fleet.fuel.subtitle', undefined, 'Fuel log registry and anomaly detection')} />}
        >
            <Head title={t('fleet.fuel.title', undefined, 'Fuel Logs')} />

            <FleetNav />

            <div className="space-y-6">
                {/* Filters Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="min-w-[16rem]">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                {t('fleet.fuel.vehicle', undefined, 'Vehicle Filter')}
                            </label>
                            <Select
                                className="w-full text-xs !rounded-2xl border-slate-200 dark:border-slate-800"
                                value={filters.vehicle_id ? String(filters.vehicle_id) : ''}
                                onChange={(value) =>
                                    router.get(prefixedRoute('fleet.fuel.index'), {
                                        vehicle_id: value || undefined,
                                        anomalies_only: filters.anomalies_only || undefined,
                                    })
                                }
                                placeholder={t('fleet.fuel.all_vehicles', undefined, 'All Vehicles')}
                                options={[
                                    { value: '', label: t('fleet.fuel.all_vehicles', undefined, 'All Vehicles') },
                                    ...vehicles.map((v) => ({
                                        value: String(v.id),
                                        label: `${v.name} (${v.plate_number})`,
                                    })),
                                ]}
                            />
                        </div>

                        <label className="flex items-center gap-2 mt-5 sm:mt-0 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={Boolean(filters.anomalies_only)}
                                onChange={(e) =>
                                    router.get(prefixedRoute('fleet.fuel.index'), {
                                        vehicle_id: filters.vehicle_id || undefined,
                                        anomalies_only: e.target.checked || undefined,
                                    })
                                }
                                className="h-4 w-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>⚠️ {t('fleet.fuel.anomalies_only', undefined, 'Show Anomalies Only')}</span>
                        </label>
                    </div>

                    <Link
                        href={prefixedRoute('fleet.fuel.analytics')}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition shadow-sm"
                    >
                        📈 {t('fleet.dashboard.open_analytics', undefined, 'Fuel Analytics')}
                    </Link>
                </div>

                {/* Fuel Logs Table */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5 text-left">{t('fleet.fuel.date', undefined, 'Date')}</th>
                                    <th className="px-5 py-3.5 text-left">{t('fleet.fuel.vehicle', undefined, 'Vehicle')}</th>
                                    <th className="px-5 py-3.5 text-left">{t('fleet.fuel.liters', undefined, 'Refuel Details')}</th>
                                    <th className="px-5 py-3.5 text-right">Distance (Δ km)</th>
                                    <th className="px-5 py-3.5 text-right">{t('fleet.fuel.km_l', undefined, 'Efficiency (km/L)')}</th>
                                    <th className="px-5 py-3.5 text-left">{t('fleet.fuel.flags', undefined, 'Anomaly Flags')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                            {t('fleet.fuel.empty', undefined, 'No fuel logs recorded.')}
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => {
                                        const hasAnomalies = Boolean(log.anomaly_flags?.length);

                                        return (
                                            <tr
                                                key={log.id}
                                                className={`transition-colors ${
                                                    hasAnomalies
                                                        ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70'
                                                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                                                }`}
                                            >
                                                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                    {formatDate(log.filled_at, localeTag)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {log.vehicle ? (
                                                        <div>
                                                            <Link
                                                                href={prefixedRoute('fleet.vehicles.show', log.vehicle.id)}
                                                                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                            >
                                                                {log.vehicle.name}
                                                            </Link>
                                                            <div className="inline-block mt-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                                                                {log.vehicle.plate_number}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {log.liters} L
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-slate-500">
                                                        Rp {Number(log.cost).toLocaleString('id-ID')}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    {log.distance_since_last_km !== null ? `${log.distance_since_last_km} km` : '—'}
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <div className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                                        {log.km_per_liter ? `${log.km_per_liter} km/L` : '—'}
                                                    </div>
                                                    {log.odometer_source && (
                                                        <span className="inline-block mt-0.5 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono uppercase text-slate-500">
                                                            {log.odometer_source}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {hasAnomalies ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {log.anomaly_flags?.map((f, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center gap-1 rounded-xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300/60 dark:border-amber-800/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200"
                                                                >
                                                                    ⚠️ {f.code.replaceAll('_', ' ')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                                            ✓ Normal
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-semibold text-slate-500">
                                {t('common.showing_results', {
                                    from: (logs.current_page - 1) * logs.per_page + 1,
                                    to: Math.min(logs.current_page * logs.per_page, logs.total),
                                    total: logs.total,
                                }, `Showing ${(logs.current_page - 1) * logs.per_page + 1} to ${Math.min(logs.current_page * logs.per_page, logs.total)} of ${logs.total}`)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {logs.links.map((link, index) => (
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
            </div>
        </DynamicLayout>
    );
}
