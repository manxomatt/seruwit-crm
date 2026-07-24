import DynamicLayout from '@/Layouts/DynamicLayout';
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

const PERIOD_OPTIONS = [
    { key: 'today', label: 'Hari ini' },
    { key: 'week', label: 'Minggu ini' },
    { key: 'month', label: 'Bulan ini' },
] as const;

const BUCKET_LABELS: Record<string, string> = {
    current: 'Current',
    '1_30': '1–30',
    '31_60': '31–60',
    '61_90': '61–90',
    '90_plus': '90+',
};

function deltaText(current: number | null, previous: number | null, unit = 'pp'): string | null {
    if (current === null || previous === null) {
        return null;
    }
    const diff = Math.round((current - previous) * 10) / 10;
    if (diff === 0) {
        return `Sama vs periode lalu`;
    }
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff}${unit} vs periode lalu`;
}

function KpiCard({
    title,
    value,
    subtitle,
    delta,
    unavailable,
}: {
    title: string;
    value: string;
    subtitle?: string;
    delta?: string | null;
    unavailable?: boolean;
}): JSX.Element {
    return (
        <div className={`rounded-lg border bg-white p-5 ${unavailable ? 'border-dashed border-gray-200 opacity-70' : 'border-gray-200'}`}>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
            {unavailable ? (
                <p className="mt-3 text-sm text-gray-400">Modul sumber belum terpasang</p>
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
    const { otd, fleet_utilization: fleet, aging_ar: aging, inventory_turnover: inventory, revenue_per_route: revenue } = metrics;

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Dashboard Eksekutif</h2>
                        <p className="text-sm text-gray-500">OTD · utilisasi armada · aging AR · turnover · revenue per rute</p>
                    </div>
                    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                        {PERIOD_OPTIONS.map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => router.get(route('module.bi.dashboard'), { period: option.key }, { preserveState: true })}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                    period === option.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            }
        >
            <Head title="Dashboard Eksekutif" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <KpiCard
                            title="OTD Rate"
                            unavailable={!otd}
                            value={otd?.rate !== null && otd?.rate !== undefined ? `${otd.rate}%` : '—'}
                            subtitle={otd ? `${otd.on_time}/${otd.with_sla} on-time · ${otd.delivered} delivered` : undefined}
                            delta={otd ? deltaText(otd.rate, otd.previous_rate) : null}
                        />
                        <KpiCard
                            title="Fleet Utilization"
                            unavailable={!fleet}
                            value={fleet?.rate !== null && fleet?.rate !== undefined ? `${fleet.rate}%` : '—'}
                            subtitle={
                                fleet
                                    ? fleet.note ?? `${fleet.trip_days} trip-days / ${fleet.capacity_days} capacity`
                                    : undefined
                            }
                            delta={fleet ? deltaText(fleet.rate, fleet.previous_rate) : null}
                        />
                        <KpiCard
                            title="Aging AR (Overdue)"
                            unavailable={!aging}
                            value={aging ? formatMoney(aging.overdue_amount) : '—'}
                            subtitle={aging ? `${aging.overdue_count} invoice · outstanding ${formatMoney(aging.outstanding)}` : undefined}
                        />
                        <KpiCard
                            title="Inventory Turnover"
                            unavailable={!inventory}
                            value={inventory?.turnover !== null && inventory?.turnover !== undefined ? `${inventory.turnover}×` : '—'}
                            subtitle={inventory ? `COGS ${formatMoney(inventory.cogs)} / stock ${formatMoney(inventory.inventory_value)}` : undefined}
                            delta={inventory ? deltaText(inventory.turnover, inventory.previous_turnover, '×') : null}
                        />
                        <KpiCard
                            title="Revenue / Route"
                            unavailable={!revenue}
                            value={revenue?.average !== null && revenue?.average !== undefined ? formatMoney(revenue.average) : '—'}
                            subtitle={
                                revenue
                                    ? `${revenue.route_count} rute · total ${formatMoney(revenue.total_revenue)}`
                                    : undefined
                            }
                            delta={revenue ? deltaText(revenue.average, revenue.previous_average, '') : null}
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Section title="AR Aging Buckets">
                            {!aging ? (
                                <p className="text-sm text-gray-500">Pasang modul Receivables & Invoicing untuk melihat aging.</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(aging.buckets).map(([key, value]) => (
                                        <Bar
                                            key={key}
                                            label={BUCKET_LABELS[key] ?? key}
                                            value={value}
                                            max={Math.max(...Object.values(aging.buckets), 1)}
                                            tone={key === 'current' ? 'green' : key === '90_plus' ? 'red' : key.startsWith('6') || key.startsWith('9') ? 'amber' : 'indigo'}
                                        />
                                    ))}
                                </div>
                            )}
                        </Section>

                        <Section title="Delivery Performance">
                            {!otd ? (
                                <p className="text-sm text-gray-500">Pasang modul Orders untuk OTD.</p>
                            ) : otd.with_sla === 0 ? (
                                <p className="text-sm text-gray-500">
                                    Belum ada DO delivered dengan <code className="text-xs">promised_at</code> di periode ini.
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-semibold tabular-nums text-green-600">{otd.on_time}</p>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">On time</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold tabular-nums text-red-600">{otd.late}</p>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Late</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold tabular-nums text-gray-800">{otd.delivered}</p>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Delivered</p>
                                    </div>
                                </div>
                            )}
                        </Section>

                        <Section title="Fleet Snapshot">
                            {!fleet ? (
                                <p className="text-sm text-gray-500">Pasang modul Fleet untuk utilisasi.</p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Kendaraan aktif</span>
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

                        <Section title="Inventory">
                            {!inventory ? (
                                <p className="text-sm text-gray-500">Pasang Inventory & Products untuk turnover.</p>
                            ) : (
                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500">COGS (periode)</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">{formatMoney(inventory.cogs)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Nilai stok saat ini</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">{formatMoney(inventory.inventory_value)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Qty keluar</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">{inventory.out_qty.toLocaleString('id-ID')}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Turnover</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">
                                            {inventory.turnover !== null ? `${inventory.turnover}×` : '—'}
                                        </dd>
                                    </div>
                                </dl>
                            )}
                        </Section>
                    </div>

                    <Section title="Top Revenue per Route">
                        {!revenue ? (
                            <p className="text-sm text-gray-500">Pasang modul Routing untuk revenue per rute.</p>
                        ) : !revenue.billing_available ? (
                            <p className="text-sm text-gray-500">
                                Routing tersedia, tapi Billing belum terpasang — revenue charge tidak dapat dihitung.
                            </p>
                        ) : revenue.routes.length === 0 ? (
                            <p className="text-sm text-gray-500">Belum ada route plan applied di periode ini.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Plan</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Tanggal</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Kendaraan</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Stops</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Km</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {revenue.routes.map((row) => (
                                            <tr key={row.route_id}>
                                                <td className="px-3 py-2 font-medium text-gray-900">{row.plan_code}</td>
                                                <td className="px-3 py-2 text-gray-600">
                                                    {row.planned_date
                                                        ? new Date(row.planned_date).toLocaleDateString('id-ID')
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-gray-600">{row.vehicle ?? '—'}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{row.stops}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{row.distance_km.toLocaleString('id-ID')}</td>
                                                <td className="px-3 py-2 text-right font-medium tabular-nums">{formatMoney(row.revenue)}</td>
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
