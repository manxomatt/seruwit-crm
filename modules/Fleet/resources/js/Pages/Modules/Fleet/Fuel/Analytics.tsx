import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import FleetNav from '../../../../FleetNav';

interface Summary {
    total_cost: number;
    total_liters: number;
    fill_count: number;
    avg_km_per_liter: number | null;
    anomaly_count: number;
    previous_total_cost: number;
}

interface MonthPoint {
    month: string;
    label: string;
    cost: number;
    liters: number;
}

interface TrendPoint {
    filled_at: string;
    km_per_liter: number | null;
    vehicle: string;
    plate_number: string;
}

interface RankingRow {
    vehicle_id: number;
    name: string;
    plate_number: string;
    type: string | null;
    avg_km_per_liter: number;
    fill_count: number;
    expected_km_per_liter: number | null;
    vs_expected_pct: number | null;
}

interface AnomalyRow {
    id: number;
    filled_at: string | null;
    liters: number;
    cost: number;
    km_per_liter: number | null;
    anomaly_flags: { code: string; message: string; severity?: string }[];
    vehicle: { id: number; name: string; plate_number: string } | null;
    driver: { id: number; name: string } | null;
}

interface DriverPerf {
    driver_id: number;
    driver_name: string;
    fill_count: number;
    avg_km_per_liter: number;
    vehicle_baseline: number | null;
    delta_pct: number | null;
}

interface Analytics {
    period: string;
    range: { start: string; end: string };
    summary: Summary;
    monthly_costs: MonthPoint[];
    efficiency_trend: TrendPoint[];
    fleet_ranking: RankingRow[];
    anomalies: AnomalyRow[];
    driver_performance: DriverPerf[];
}

interface Props {
    analytics: Analytics;
    vehicles: { id: number; name: string; plate_number: string }[];
    filters: { vehicle_id?: number | null; period: string };
}

const PERIOD_KEYS = ['month', 'quarter', 'year'] as const;

function costDelta(
    t: (key: string, params?: Record<string, string | number>) => string,
    current: number,
    previous: number,
): string {
    if (previous === 0) {
        return current === 0 ? t('fleet.analytics.same_previous') : t('fleet.analytics.no_baseline');
    }
    const pct = Math.round(((current - previous) / previous) * 1000) / 10;
    const sign = pct > 0 ? '+' : '';
    return t('fleet.analytics.vs_previous', { pct: `${sign}${pct}%` });
}

function BarChart({ points }: { points: MonthPoint[] }): JSX.Element {
    const max = Math.max(...points.map((p) => p.cost), 1);

    return (
        <div className="flex h-40 items-end gap-1.5">
            {points.map((point) => (
                <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div
                        className="w-full rounded-t bg-sky-500/80 transition-all"
                        style={{ height: `${Math.max(4, (point.cost / max) * 100)}%` }}
                        title={`${point.label}: ${formatMoney(point.cost)}`}
                    />
                    <span className="truncate text-[10px] text-gray-500">{point.label.split(' ')[0]}</span>
                </div>
            ))}
        </div>
    );
}

export default function Analytics({ analytics, vehicles, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { summary, monthly_costs, efficiency_trend, fleet_ranking, anomalies, driver_performance } = analytics;
    const maxKm = Math.max(...efficiency_trend.map((p) => p.km_per_liter ?? 0), 1);

    const periodLabels: Record<(typeof PERIOD_KEYS)[number], string> = {
        month: t('fleet.analytics.period_month'),
        quarter: t('fleet.analytics.period_quarter'),
        year: t('fleet.analytics.period_year'),
    };

    const reload = (patch: Record<string, string | number | undefined>) => {
        router.get(
            prefixedRoute('fleet.fuel.analytics'),
            {
                vehicle_id: filters.vehicle_id || undefined,
                period: filters.period,
                ...patch,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('fleet.analytics.title')}</h2>}>
            <Head title={t('fleet.analytics.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <FleetNav />
                    <p className="text-sm text-gray-600">{t('fleet.analytics.subtitle')}</p>

                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="block text-xs text-gray-500">{t('fleet.analytics.vehicle')}</label>
                            <Select
                                className="mt-0.5 min-w-[14rem]"
                                value={filters.vehicle_id ? String(filters.vehicle_id) : ''}
                                onChange={(value) => reload({ vehicle_id: value || undefined })}
                                placeholder={t('fleet.analytics.all_vehicles')}
                                options={vehicles.map((v) => ({
                                    value: String(v.id),
                                    label: `${v.name} (${v.plate_number})`,
                                }))}
                            />
                        </div>
                        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                            {PERIOD_KEYS.map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => reload({ period: key })}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                                        filters.period === key
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {periodLabels[key]}
                                </button>
                            ))}
                        </div>
                        <Link href={prefixedRoute('fleet.fuel.index')} className="pb-2 text-sm text-indigo-600 hover:underline">
                            {t('fleet.analytics.fuel_history')}
                        </Link>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-500">{t('fleet.analytics.fuel_cost')}</p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(summary.total_cost)}</p>
                            <p className="mt-1 text-xs text-gray-500">{costDelta(t, summary.total_cost, summary.previous_total_cost)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-500">{t('fleet.analytics.liters')}</p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums">
                                {summary.total_liters.toLocaleString('id-ID')} L
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {summary.fill_count} {t('fleet.analytics.fills')}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-500">{t('fleet.analytics.avg_kml')}</p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums">
                                {summary.avg_km_per_liter !== null ? summary.avg_km_per_liter : '—'}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-xs uppercase tracking-wider text-gray-500">{t('fleet.analytics.anomaly')}</p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-700">{summary.anomaly_count}</p>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="rounded-lg border border-gray-200 bg-white p-5">
                            <h3 className="mb-4 text-sm font-semibold text-gray-800">{t('fleet.analytics.cost_12m')}</h3>
                            <BarChart points={monthly_costs} />
                        </section>

                        <section className="rounded-lg border border-gray-200 bg-white p-5">
                            <h3 className="mb-4 text-sm font-semibold text-gray-800">{t('fleet.analytics.trend_kml')}</h3>
                            {efficiency_trend.length === 0 ? (
                                <p className="text-sm text-gray-500">{t('fleet.analytics.no_kml')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {efficiency_trend.map((point, index) => (
                                        <div key={`${point.filled_at}-${index}`}>
                                            <div className="mb-0.5 flex justify-between text-xs text-gray-600">
                                                <span>
                                                    {point.filled_at
                                                        ? new Date(point.filled_at).toLocaleDateString('id-ID')
                                                        : '—'}
                                                    <span className="text-gray-400"> · {point.plate_number}</span>
                                                </span>
                                                <span className="font-medium tabular-nums">
                                                    {point.km_per_liter !== null ? `${point.km_per_liter} km/L` : '—'}
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded bg-gray-100">
                                                <div
                                                    className="h-full rounded bg-indigo-500"
                                                    style={{
                                                        width: `${((point.km_per_liter ?? 0) / maxKm) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <section className="rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-5 py-3">
                            <h3 className="text-sm font-semibold text-gray-800">{t('fleet.analytics.ranking')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.vehicle')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.avg_kml')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.vs_expected')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.fills')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {fleet_ranking.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                {t('fleet.analytics.no_ranking')}
                                            </td>
                                        </tr>
                                    ) : (
                                        fleet_ranking.map((row, index) => (
                                            <tr key={row.vehicle_id}>
                                                <td className="px-4 py-3 tabular-nums text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={prefixedRoute('fleet.vehicles.show', row.vehicle_id)}
                                                        className="font-medium text-indigo-600 hover:underline"
                                                    >
                                                        {row.name}
                                                    </Link>
                                                    <div className="text-xs text-gray-500">{row.plate_number}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                                    {row.avg_km_per_liter}
                                                </td>
                                                <td
                                                    className={`px-4 py-3 text-right tabular-nums ${
                                                        row.vs_expected_pct === null
                                                            ? 'text-gray-400'
                                                            : row.vs_expected_pct >= 0
                                                              ? 'text-green-700'
                                                              : 'text-red-700'
                                                    }`}
                                                >
                                                    {row.vs_expected_pct === null
                                                        ? '—'
                                                        : `${row.vs_expected_pct > 0 ? '+' : ''}${row.vs_expected_pct}%`}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">{row.fill_count}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-5 py-3">
                            <h3 className="text-sm font-semibold text-gray-800">{t('fleet.analytics.driver_perf')}</h3>
                            <p className="text-xs text-gray-500">{t('fleet.analytics.driver_perf_help')}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.driver')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.avg_kml')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.baseline')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.delta')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.fills')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {driver_performance.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                {t('fleet.analytics.no_driver_perf')}
                                            </td>
                                        </tr>
                                    ) : (
                                        driver_performance.map((row) => (
                                            <tr key={row.driver_id}>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={prefixedRoute('fleet.drivers.show', row.driver_id)}
                                                        className="font-medium text-indigo-600 hover:underline"
                                                    >
                                                        {row.driver_name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                                    {row.avg_km_per_liter}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                                                    {row.vehicle_baseline ?? '—'}
                                                </td>
                                                <td
                                                    className={`px-4 py-3 text-right tabular-nums ${
                                                        row.delta_pct === null
                                                            ? 'text-gray-400'
                                                            : row.delta_pct >= 0
                                                              ? 'text-green-700'
                                                              : 'text-red-700'
                                                    }`}
                                                >
                                                    {row.delta_pct === null
                                                        ? '—'
                                                        : `${row.delta_pct > 0 ? '+' : ''}${row.delta_pct}%`}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">{row.fill_count}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-5 py-3">
                            <h3 className="text-sm font-semibold text-gray-800">{t('fleet.analytics.anomaly_history')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.date')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.vehicle')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.driver')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.liters')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.analytics.flags')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {anomalies.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                {t('fleet.analytics.no_anomalies')}
                                            </td>
                                        </tr>
                                    ) : (
                                        anomalies.map((row) => (
                                            <tr key={row.id} className="bg-amber-50/40">
                                                <td className="px-4 py-3">
                                                    {row.filled_at
                                                        ? new Date(row.filled_at).toLocaleDateString('id-ID')
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.vehicle ? (
                                                        <Link
                                                            href={prefixedRoute('fleet.vehicles.show', row.vehicle.id)}
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            {row.vehicle.plate_number}
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{row.driver?.name ?? '—'}</td>
                                                <td className="px-4 py-3 text-right tabular-nums">{row.liters}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {row.anomaly_flags.map((flag) => (
                                                            <span
                                                                key={flag.code}
                                                                title={flag.message}
                                                                className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900"
                                                            >
                                                                {flag.code.replaceAll('_', ' ')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </DynamicLayout>
    );
}
