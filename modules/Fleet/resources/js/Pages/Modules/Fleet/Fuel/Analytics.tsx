import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import FleetNav from '../../../../FleetNav';
import PageHeader from '@/Components/PageHeader';

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
    t: (key: string, replace?: Record<string, string | number>, fallback?: string) => string,
    current: number,
    previous: number,
): string {
    if (!previous || previous <= 0) {
        return t('fleet.analytics.no_previous_cost', undefined, 'No previous period comparison');
    }
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 100);
    if (diff > 0) {
        return t('fleet.analytics.cost_increased', { pct }, `+${pct}% vs previous period`);
    }
    if (diff < 0) {
        return t('fleet.analytics.cost_decreased', { pct: Math.abs(pct) }, `${pct}% vs previous period`);
    }
    return t('fleet.analytics.cost_same', undefined, 'Same as previous period');
}

function BarChart({ points }: { points: MonthPoint[] }): JSX.Element {
    const max = Math.max(...points.map((p) => p.cost), 1);

    return (
        <div className="flex h-44 items-end gap-2 pt-4">
            {points.map((point) => (
                <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 h-full justify-end">
                    <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-sky-600 to-cyan-400 dark:from-sky-500 dark:to-cyan-300 transition-all hover:opacity-90 shadow-sm"
                        style={{ height: `${Math.max(6, (point.cost / max) * 100)}%` }}
                        title={`${point.label}: ${formatMoney(point.cost)}`}
                    />
                    <span className="truncate text-[10px] font-bold text-slate-400">{point.label.split(' ')[0]}</span>
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
        month: t('fleet.analytics.period_month', undefined, 'Month'),
        quarter: t('fleet.analytics.period_quarter', undefined, 'Quarter'),
        year: t('fleet.analytics.period_year', undefined, 'Year'),
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
        <DynamicLayout
            header={<PageHeader title={t('fleet.title', undefined, 'Fleet Management')} subtitle={t('fleet.analytics.subtitle', undefined, 'Fuel cost analysis, efficiency trends, and driver benchmarks')} />}
        >
            <Head title={t('fleet.analytics.title', undefined, 'Fuel Analytics')} />

            <FleetNav />

            <div className="space-y-6">
                {/* Control Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="min-w-[16rem]">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                {t('fleet.analytics.vehicle', undefined, 'Vehicle')}
                            </label>
                            <Select
                                className="w-full text-xs !rounded-2xl border-slate-200 dark:border-slate-800"
                                value={filters.vehicle_id ? String(filters.vehicle_id) : ''}
                                onChange={(value) => reload({ vehicle_id: value || undefined })}
                                placeholder={t('fleet.analytics.all_vehicles', undefined, 'All Vehicles')}
                                options={vehicles.map((v) => ({
                                    value: String(v.id),
                                    label: `${v.name} (${v.plate_number})`,
                                }))}
                            />
                        </div>

                        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mt-4 sm:mt-0">
                            {PERIOD_KEYS.map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => reload({ period: key })}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        filters.period === key
                                            ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                >
                                    {periodLabels[key]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Link
                        href={prefixedRoute('fleet.fuel.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {t('fleet.analytics.fuel_history', undefined, 'View Fuel Registry')}
                    </Link>
                </div>

                {/* Top Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                {t('fleet.analytics.fuel_cost', undefined, 'Total Fuel Cost')}
                            </span>
                            <span className="text-lg">💰</span>
                        </div>
                        <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                            {formatMoney(summary.total_cost)}
                        </p>
                        <p className="mt-1.5 text-xs font-semibold text-slate-500">
                            {costDelta(t, summary.total_cost, summary.previous_total_cost)}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                {t('fleet.analytics.liters', undefined, 'Liters Filled')}
                            </span>
                            <span className="text-lg">⛽</span>
                        </div>
                        <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                            {summary.total_liters.toLocaleString('id-ID')} L
                        </p>
                        <p className="mt-1.5 text-xs font-semibold text-slate-500">
                            {summary.fill_count} {t('fleet.analytics.fills', undefined, 'Refuel Entries')}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                {t('fleet.analytics.avg_kml', undefined, 'Fleet Avg km/L')}
                            </span>
                            <span className="text-lg">📊</span>
                        </div>
                        <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {summary.avg_km_per_liter !== null ? `${summary.avg_km_per_liter} km/L` : '—'}
                        </p>
                        <p className="mt-1.5 text-xs font-semibold text-slate-500">Overall fuel efficiency</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                {t('fleet.analytics.anomaly', undefined, 'Anomalies Flagged')}
                            </span>
                            <span className="text-lg">⚠️</span>
                        </div>
                        <p className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                            {summary.anomaly_count}
                        </p>
                        <p className="mt-1.5 text-xs font-semibold text-slate-500">Suspicious refuel entries</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>📈</span> {t('fleet.analytics.cost_12m', undefined, 'Monthly Fuel Spend (12 Months)')}
                        </h3>
                        <BarChart points={monthly_costs} />
                    </section>

                    <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>⚡</span> {t('fleet.analytics.trend_kml', undefined, 'Recent Efficiency Trend (km/L)')}
                        </h3>
                        {efficiency_trend.length === 0 ? (
                            <p className="text-xs font-semibold text-slate-400 py-10 text-center">{t('fleet.analytics.no_kml', undefined, 'No efficiency trend data available.')}</p>
                        ) : (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                {efficiency_trend.map((point, index) => (
                                    <div key={`${point.filled_at}-${index}`}>
                                        <div className="mb-1 flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <span>
                                                {point.filled_at ? new Date(point.filled_at).toLocaleDateString('id-ID') : '—'}
                                                <span className="font-normal text-slate-400"> · {point.plate_number}</span>
                                            </span>
                                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                                {point.km_per_liter !== null ? `${point.km_per_liter} km/L` : '—'}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
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

                {/* Fleet Ranking Table */}
                <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>🏆</span> {t('fleet.analytics.ranking', undefined, 'Vehicle Fuel Efficiency Ranking')}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">#</th>
                                    <th className="px-5 py-3 text-left">Vehicle</th>
                                    <th className="px-5 py-3 text-right">Avg km/L</th>
                                    <th className="px-5 py-3 text-right">Fills</th>
                                    <th className="px-5 py-3 text-right">vs Expected</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                {fleet_ranking.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                            No ranking data available.
                                        </td>
                                    </tr>
                                ) : (
                                    fleet_ranking.map((row, idx) => (
                                        <tr key={row.vehicle_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                            <td className="px-5 py-3.5 font-bold text-slate-400">#{idx + 1}</td>
                                            <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                                                {row.name} <span className="font-mono text-slate-400">({row.plate_number})</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                                {row.avg_km_per_liter} km/L
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                                                {row.fill_count}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold">
                                                {row.vs_expected_pct !== null ? (
                                                    <span className={row.vs_expected_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                        {row.vs_expected_pct >= 0 ? `+${row.vs_expected_pct}%` : `${row.vs_expected_pct}%`}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </DynamicLayout>
    );
}
