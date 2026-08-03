import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../../MaintenanceNav';
import { formatCurrency } from '../../../../maintenanceUtils';

interface Summary {
    work_order_count: number;
    total_cost: number;
    labor_cost: number;
    parts_cost: number;
    avg_downtime_hours: number | null;
    compliance_pct: number | null;
}

interface VehicleRow {
    vehicle_id: number | null;
    name: string;
    plate_number: string | null;
    work_order_count: number;
    labor_cost: number;
    parts_cost: number;
    total_cost: number;
    downtime_hours: number;
}

interface CategoryRow {
    category_id: number | null;
    name: string;
    color: string | null;
    work_order_count: number;
    total_cost: number;
}

interface VendorRow {
    vendor_key: string;
    name: string;
    partner_id: number | null;
    work_order_count: number;
    total_cost: number;
}

interface MonthPoint {
    month: string;
    label: string;
    cost: number;
    work_order_count: number;
}

interface Analytics {
    summary: Summary;
    by_vehicle: VehicleRow[];
    by_category: CategoryRow[];
    by_vendor: VendorRow[];
    downtime: { avg_hours: number | null; total_hours: number; sample_count: number };
    compliance: { pct: number | null; on_time: number; total: number };
    monthly_costs: MonthPoint[];
}

interface Props {
    filters: { from: string; to: string };
    analytics: Analytics;
}

function Bar({ value, max }: { value: number; max: number }): JSX.Element {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="h-2 w-full rounded bg-gray-100">
            <div className="h-2 rounded bg-indigo-500" style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function Index({ filters, analytics }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('maintenance.analytics.index'), { from, to }, { preserveState: true, replace: true });
    };

    const maxVehicleCost = Math.max(1, ...analytics.by_vehicle.map((row) => row.total_cost));
    const maxCategoryCost = Math.max(1, ...analytics.by_category.map((row) => row.total_cost));
    const maxVendorCost = Math.max(1, ...analytics.by_vendor.map((row) => row.total_cost));
    const maxMonthly = Math.max(1, ...analytics.monthly_costs.map((row) => row.cost));

    const summaryCards = [
        {
            label: t('maintenance.analytics.total_cost'),
            value: formatCurrency(analytics.summary.total_cost, localeTag),
        },
        {
            label: t('maintenance.analytics.work_orders'),
            value: String(analytics.summary.work_order_count),
        },
        {
            label: t('maintenance.analytics.avg_downtime'),
            value: analytics.summary.avg_downtime_hours != null
                ? t('maintenance.analytics.hours_value', { value: analytics.summary.avg_downtime_hours })
                : '—',
        },
        {
            label: t('maintenance.analytics.compliance'),
            value: analytics.summary.compliance_pct != null
                ? `${analytics.summary.compliance_pct}%`
                : '—',
        },
    ];

    return (
        <DynamicLayout>
            <Head title={t('maintenance.analytics.head')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <MaintenanceNav />
                    <PageHeader
                        title={t('maintenance.analytics.head')}
                        description={t('maintenance.analytics.subtitle')}
                    />

                    <form onSubmit={submit} className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div>
                            <InputLabel htmlFor="from" value={t('maintenance.analytics.from')} />
                            <TextInput id="from" type="date" className="mt-1 block" value={from} onChange={(e) => setFrom(e.target.value)} />
                        </div>
                        <div>
                            <InputLabel htmlFor="to" value={t('maintenance.analytics.to')} />
                            <TextInput id="to" type="date" className="mt-1 block" value={to} onChange={(e) => setTo(e.target.value)} />
                        </div>
                        <PrimaryButton type="submit">{t('maintenance.analytics.apply')}</PrimaryButton>
                        <Link href={prefixedRoute('maintenance.schedules.index')} className="text-sm text-indigo-600 hover:text-indigo-800">
                            {t('maintenance.analytics.view_schedules')}
                        </Link>
                    </form>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {summaryCards.map((card) => (
                            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">{t('maintenance.analytics.labor_cost')}</p>
                            <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(analytics.summary.labor_cost, localeTag)}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">{t('maintenance.analytics.parts_cost')}</p>
                            <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(analytics.summary.parts_cost, localeTag)}</p>
                        </div>
                    </div>

                    {analytics.compliance.total > 0 && (
                        <p className="mt-3 text-sm text-gray-500">
                            {t('maintenance.analytics.compliance_detail', {
                                on_time: analytics.compliance.on_time,
                                total: analytics.compliance.total,
                            })}
                        </p>
                    )}

                    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-gray-900">{t('maintenance.analytics.by_vehicle')}</h3>
                        {analytics.by_vehicle.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('maintenance.analytics.empty')}</p>
                        ) : (
                            <div className="space-y-3">
                                {analytics.by_vehicle.map((row) => (
                                    <div key={row.vehicle_id ?? row.name}>
                                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-900">{row.name}</span>
                                                {row.plate_number && <span className="ml-2 text-gray-500">{row.plate_number}</span>}
                                            </div>
                                            <div className="text-right text-gray-700">
                                                <div className="font-medium">{formatCurrency(row.total_cost, localeTag)}</div>
                                                <div className="text-xs text-gray-500">
                                                    {row.work_order_count} WO · {row.downtime_hours}h
                                                </div>
                                            </div>
                                        </div>
                                        <Bar value={row.total_cost} max={maxVehicleCost} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-semibold text-gray-900">{t('maintenance.analytics.by_category')}</h3>
                            {analytics.by_category.length === 0 ? (
                                <p className="text-sm text-gray-500">{t('maintenance.analytics.empty')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {analytics.by_category.map((row) => (
                                        <div key={row.category_id ?? row.name}>
                                            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                                <span className="flex items-center gap-2 font-medium text-gray-900">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color ?? '#6B7280' }} />
                                                    {row.name}
                                                </span>
                                                <span className="text-gray-700">{formatCurrency(row.total_cost, localeTag)}</span>
                                            </div>
                                            <Bar value={row.total_cost} max={maxCategoryCost} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-semibold text-gray-900">{t('maintenance.analytics.by_vendor')}</h3>
                            {analytics.by_vendor.length === 0 ? (
                                <p className="text-sm text-gray-500">{t('maintenance.analytics.empty_vendors')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {analytics.by_vendor.map((row) => (
                                        <div key={row.vendor_key}>
                                            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                                <span className="font-medium text-gray-900">{row.name}</span>
                                                <span className="text-gray-700">{formatCurrency(row.total_cost, localeTag)}</span>
                                            </div>
                                            <Bar value={row.total_cost} max={maxVendorCost} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-gray-900">{t('maintenance.analytics.monthly')}</h3>
                        <div className="space-y-3">
                            {analytics.monthly_costs.map((row) => (
                                <div key={row.month}>
                                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                        <span className="text-gray-700">{row.label}</span>
                                        <span className="text-gray-900">{formatCurrency(row.cost, localeTag)} · {row.work_order_count}</span>
                                    </div>
                                    <Bar value={row.cost} max={maxMonthly} />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </DynamicLayout>
    );
}
