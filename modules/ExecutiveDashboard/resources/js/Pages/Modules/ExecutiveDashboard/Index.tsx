import DynamicLayout from '@/Layouts/DynamicLayout';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, router } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface OtdMetric {
    rate: number | null;
    on_time: number;
    with_sla: number;
    late: number;
    delivered: number;
    previous_rate: number | null;
    available: boolean;
}

interface FleetMetric {
    rate: number | null;
    active_vehicles: number;
    vehicles_total: number;
    trip_days: number;
    capacity_days: number;
    previous_rate: number | null;
    available: boolean;
    note?: string;
}

interface AgingMetric {
    buckets: Record<string, number>;
    overdue_count: number;
    overdue_amount: number;
    outstanding: number;
    available: boolean;
}

interface InventoryMetric {
    turnover: number | null;
    cogs: number;
    inventory_value: number;
    out_qty: number;
    previous_turnover: number | null;
    available: boolean;
}

interface RouteRow {
    route_id: number;
    plan_code: string;
    planned_date: string | null;
    vehicle: string | null;
    stops: number;
    distance_km: number;
    revenue: number;
}

interface RevenueMetric {
    average: number | null;
    total_revenue: number;
    route_count: number;
    previous_average: number | null;
    routes: RouteRow[];
    billing_available: boolean;
    available: boolean;
}

interface Metrics {
    otd: OtdMetric | null;
    fleet_utilization: FleetMetric | null;
    aging_ar: AgingMetric | null;
    inventory_turnover: InventoryMetric | null;
    revenue_per_route: RevenueMetric | null;
}

interface Props {
    period: string;
    metrics: Metrics;
    range: { start: string; end: string };
}

const PERIOD_KEYS = ['today', 'week', 'month'] as const;

function KpiCard({
    title,
    value,
    subtitle,
    delta,
    unavailable,
    unavailableLabel,
}: {
    title: string;
    value: string;
    subtitle?: string;
    delta?: string | null;
    unavailable?: boolean;
    unavailableLabel: string;
}): JSX.Element {
    return (
        <div
            className={`rounded-lg border bg-white p-5 ${unavailable ? 'border-dashed border-gray-200 opacity-70' : 'border-gray-200'}`}
        >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
            {unavailable ? (
                <p className="mt-3 text-sm text-gray-400">{unavailableLabel}</p>
            ) : (
                <>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-gray-900">{value}</p>
                    {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
                    {delta && <p className="mt-2 text-xs text-gray-500">{delta}</p>}
                </>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
    return (
        <section className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

function Bar({ label, value, max, tone = 'indigo' }: { label: string; value: number; max: number; tone?: string }): JSX.Element {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    const tones: Record<string, string> = {
        indigo: 'bg-indigo-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
        green: 'bg-green-500',
        slate: 'bg-slate-400',
    };

    return (
        <div>
            <div className="mb-1 flex justify-between text-xs text-gray-600">
                <span>{label}</span>
                <span className="tabular-nums">{formatMoney(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-gray-100">
                <div className={`h-full rounded ${tones[tone] ?? tones.indigo}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function Index({ period, metrics }: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const { otd, fleet_utilization: fleet, aging_ar: aging, inventory_turnover: inventory, revenue_per_route: revenue } =
        metrics;

    const deltaText = (current: number | null, previous: number | null, unit = 'pp'): string | null => {
        if (current === null || previous === null) {
            return null;
        }

        const diff = Math.round((current - previous) * 10) / 10;

        if (diff === 0) {
            return t('bi.delta.same');
        }

        const sign = diff > 0 ? '+' : '';

        return t('bi.delta.change', { sign, diff, unit });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{t('bi.title')}</h2>
                        <p className="text-sm text-gray-500">{t('bi.subtitle')}</p>
                    </div>
                    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                        {PERIOD_KEYS.map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() =>
                                    router.get(route('module.bi.dashboard'), { period: key }, { preserveState: true })
                                }
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                    period === key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {t(`bi.periods.${key}`)}
                            </button>
                        ))}
                    </div>
                </div>
            }
        >
            <Head title={t('bi.title')} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <KpiCard
                            title={t('bi.kpis.otd')}
                            unavailable={!otd}
                            unavailableLabel={t('bi.unavailable')}
                            value={otd?.rate !== null && otd?.rate !== undefined ? `${otd.rate}%` : '—'}
                            subtitle={
                                otd
                                    ? t('bi.kpis.otd_subtitle', {
                                          on_time: otd.on_time,
                                          with_sla: otd.with_sla,
                                          delivered: otd.delivered,
                                      })
                                    : undefined
                            }
                            delta={otd ? deltaText(otd.rate, otd.previous_rate) : null}
                        />
                        <KpiCard
                            title={t('bi.kpis.fleet')}
                            unavailable={!fleet}
                            unavailableLabel={t('bi.unavailable')}
                            value={fleet?.rate !== null && fleet?.rate !== undefined ? `${fleet.rate}%` : '—'}
                            subtitle={
                                fleet
                                    ? (fleet.note ??
                                      t('bi.kpis.fleet_subtitle', {
                                          trip_days: fleet.trip_days,
                                          capacity_days: fleet.capacity_days,
                                      }))
                                    : undefined
                            }
                            delta={fleet ? deltaText(fleet.rate, fleet.previous_rate) : null}
                        />
                        <KpiCard
                            title={t('bi.kpis.aging')}
                            unavailable={!aging}
                            unavailableLabel={t('bi.unavailable')}
                            value={aging ? formatMoney(aging.overdue_amount) : '—'}
                            subtitle={
                                aging
                                    ? t('bi.kpis.aging_subtitle', {
                                          count: aging.overdue_count,
                                          amount: formatMoney(aging.outstanding),
                                      })
                                    : undefined
                            }
                        />
                        <KpiCard
                            title={t('bi.kpis.inventory')}
                            unavailable={!inventory}
                            unavailableLabel={t('bi.unavailable')}
                            value={
                                inventory?.turnover !== null && inventory?.turnover !== undefined
                                    ? `${inventory.turnover}×`
                                    : '—'
                            }
                            subtitle={
                                inventory
                                    ? t('bi.kpis.inventory_subtitle', {
                                          cogs: formatMoney(inventory.cogs),
                                          stock: formatMoney(inventory.inventory_value),
                                      })
                                    : undefined
                            }
                            delta={inventory ? deltaText(inventory.turnover, inventory.previous_turnover, '×') : null}
                        />
                        <KpiCard
                            title={t('bi.kpis.revenue')}
                            unavailable={!revenue}
                            unavailableLabel={t('bi.unavailable')}
                            value={
                                revenue?.average !== null && revenue?.average !== undefined
                                    ? formatMoney(revenue.average)
                                    : '—'
                            }
                            subtitle={
                                revenue
                                    ? t('bi.kpis.revenue_subtitle', {
                                          count: revenue.route_count,
                                          total: formatMoney(revenue.total_revenue),
                                      })
                                    : undefined
                            }
                            delta={revenue ? deltaText(revenue.average, revenue.previous_average, '') : null}
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Section title={t('bi.sections.aging')}>
                            {!aging ? (
                                <p className="text-sm text-gray-500">{t('bi.sections.aging_unavailable')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(aging.buckets).map(([key, value]) => (
                                        <Bar
                                            key={key}
                                            label={t(`bi.buckets.${key}`, undefined, key)}
                                            value={value}
                                            max={Math.max(...Object.values(aging.buckets), 1)}
                                            tone={
                                                key === 'current'
                                                    ? 'green'
                                                    : key === '90_plus'
                                                      ? 'red'
                                                      : key.startsWith('6') || key.startsWith('9')
                                                        ? 'amber'
                                                        : 'indigo'
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </Section>

                        <Section title={t('bi.sections.delivery')}>
                            {!otd ? (
                                <p className="text-sm text-gray-500">{t('bi.sections.delivery_unavailable')}</p>
                            ) : otd.with_sla === 0 ? (
                                <p className="text-sm text-gray-500">{t('bi.sections.delivery_empty')}</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-semibold tabular-nums text-green-600">{otd.on_time}</p>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">
                                            {t('bi.sections.on_time')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold tabular-nums text-red-600">{otd.late}</p>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">
                                            {t('bi.sections.late')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold tabular-nums text-gray-800">{otd.delivered}</p>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">
                                            {t('bi.sections.delivered')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Section>

                        <Section title={t('bi.sections.fleet')}>
                            {!fleet ? (
                                <p className="text-sm text-gray-500">{t('bi.sections.fleet_unavailable')}</p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{t('bi.sections.active_vehicles')}</span>
                                        <span className="font-medium tabular-nums">
                                            {fleet.active_vehicles} / {fleet.vehicles_total}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded bg-gray-100">
                                        <div
                                            className="h-full rounded bg-indigo-500"
                                            style={{
                                                width: `${fleet.vehicles_total > 0 ? (fleet.active_vehicles / fleet.vehicles_total) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                    {fleet.note && <p className="text-xs text-amber-700">{fleet.note}</p>}
                                </div>
                            )}
                        </Section>

                        <Section title={t('bi.sections.inventory')}>
                            {!inventory ? (
                                <p className="text-sm text-gray-500">{t('bi.sections.inventory_unavailable')}</p>
                            ) : (
                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500">{t('bi.sections.cogs')}</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">{formatMoney(inventory.cogs)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">{t('bi.sections.stock_value')}</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">
                                            {formatMoney(inventory.inventory_value)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">{t('bi.sections.out_qty')}</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">
                                            {inventory.out_qty.toLocaleString(localeTag)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">{t('bi.sections.turnover')}</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">
                                            {inventory.turnover !== null ? `${inventory.turnover}×` : '—'}
                                        </dd>
                                    </div>
                                </dl>
                            )}
                        </Section>
                    </div>

                    <Section title={t('bi.sections.revenue')}>
                        {!revenue ? (
                            <p className="text-sm text-gray-500">{t('bi.sections.revenue_unavailable')}</p>
                        ) : !revenue.billing_available ? (
                            <p className="text-sm text-gray-500">{t('bi.sections.revenue_no_billing')}</p>
                        ) : revenue.routes.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('bi.sections.revenue_empty')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                                                {t('bi.table.plan')}
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                                                {t('bi.table.date')}
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                                                {t('bi.table.vehicle')}
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                                                {t('bi.table.stops')}
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                                                {t('bi.table.km')}
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                                                {t('bi.table.revenue')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {revenue.routes.map((row) => (
                                            <tr key={row.route_id}>
                                                <td className="px-3 py-2 font-medium text-gray-900">{row.plan_code}</td>
                                                <td className="px-3 py-2 text-gray-600">
                                                    {row.planned_date
                                                        ? new Date(row.planned_date).toLocaleDateString(localeTag)
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-gray-600">{row.vehicle ?? '—'}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{row.stops}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {row.distance_km.toLocaleString(localeTag)}
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium tabular-nums">
                                                    {formatMoney(row.revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Section>
                </div>
            </div>
        </DynamicLayout>
    );
}
