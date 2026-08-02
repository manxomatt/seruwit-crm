import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import RentalNav from '../../../../RentalNav';
import PageHeader from '@/Components/PageHeader';

interface RentalRow {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    is_overdue: boolean;
    total_amount: number;
    vehicle: { id: number; name: string; plate_number: string } | null;
    partner: { id: number; name: string; code: string } | null;
}

interface Board {
    counts: {
        draft: number;
        confirmed: number;
        active: number;
        returned: number;
        completed: number;
        overdue: number;
        ending_soon: number;
        unsettled_deposits: number;
    };
    utilisation: {
        percent: number;
        on_rent: number;
        fleet_active: number;
        idle: number;
    };
    kpis?: {
        adr: number;
        revpac: number;
        overdue_rate: number;
        damage_rate: number;
        rental_days_mtd: number;
        closed_mtd: number;
        damaged_mtd: number;
    };
    revenue: {
        mtd: number;
        by_type: Array<{ type: string; total: number; count: number }>;
        by_partner: Array<{ partner_id: number; name: string; total: number; count: number }>;
        by_vehicle: Array<{ vehicle_id: number; name: string; plate_number: string; total: number; count: number }>;
    };
    overdue: RentalRow[];
    ending_soon: RentalRow[];
    idle_vehicles: Array<{ id: number; name: string; plate_number: string; type: string | null }>;
    compliance: {
        documents: { available: boolean; expired: number; expiring_30: number };
        maintenance: { available: boolean; overdue_work_orders: number; due_schedules: number };
        invoicing: { available: boolean; unsettled_deposits: number };
    };
}

interface Props {
    board: Board;
    exportUrl: string;
}

const money = (value: number) => 'Rp ' + value.toLocaleString('id-ID');

function StatCard({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'danger' | 'warn' }): JSX.Element {
    const valueClass =
        tone === 'danger' ? 'text-red-700' : tone === 'warn' ? 'text-amber-700' : 'text-gray-900';

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
            <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

function RentalTable({ rows, empty }: { rows: RentalRow[]; empty: string }): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    if (rows.length === 0) {
        return <p className="px-4 py-8 text-center text-sm text-gray-500">{empty}</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.code')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.vehicle')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.customer')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.end_date')}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('rental.dashboard.amount')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <Link href={prefixedRoute('rental.show', row.id)} className="font-mono font-medium text-indigo-600 hover:underline">
                                    {row.code}
                                </Link>
                                {row.is_overdue && (
                                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                                        {t('rental.status.overdue')}
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                {row.vehicle ? (
                                    <>
                                        <div>{row.vehicle.name}</div>
                                        <div className="text-xs text-gray-500">{row.vehicle.plate_number}</div>
                                    </>
                                ) : (
                                    '—'
                                )}
                            </td>
                            <td className="px-4 py-3">{row.partner?.name ?? '—'}</td>
                            <td className="px-4 py-3 tabular-nums">{row.end_date}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{money(row.total_amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function Index({ board, exportUrl }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { counts, utilisation, revenue, overdue, ending_soon, idle_vehicles, compliance, kpis } = board;

    const exportHref = (type: string) => `${exportUrl}?type=${encodeURIComponent(type)}`;

    return (
        <DynamicLayout header={<PageHeader title={t('rental.title')} />}>
            <Head title={t('rental.dashboard.title')} />

            <RentalNav />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <p className="text-sm text-gray-600">{t('rental.dashboard.subtitle')}</p>
                <div className="flex flex-wrap gap-2">
                    <a href={exportHref('overdue')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        {t('rental.dashboard.export_overdue')}
                    </a>
                    <a href={exportHref('ending_soon')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        {t('rental.dashboard.export_ending_soon')}
                    </a>
                    <a href={exportHref('revenue_mtd')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        {t('rental.dashboard.export_revenue')}
                    </a>
                    <a href={exportHref('idle')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        {t('rental.dashboard.export_idle')}
                    </a>
                </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('rental.dashboard.active')}
                    value={counts.active}
                    hint={t('rental.dashboard.confirmed_hint', { count: counts.confirmed })}
                />
                <StatCard
                    label={t('rental.dashboard.utilisation')}
                    value={`${utilisation.percent}%`}
                    hint={t('rental.dashboard.utilisation_hint', {
                        on_rent: utilisation.on_rent,
                        fleet: utilisation.fleet_active,
                    })}
                />
                <StatCard label={t('rental.dashboard.revenue_mtd')} value={money(revenue.mtd)} />
                <StatCard
                    label={t('rental.dashboard.overdue')}
                    value={counts.overdue}
                    tone={counts.overdue > 0 ? 'danger' : undefined}
                    hint={t('rental.dashboard.ending_soon_hint', { count: counts.ending_soon })}
                />
            </div>

            {kpis && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label={t('rental.dashboard.kpi_adr')}
                        value={money(kpis.adr)}
                        hint={t('rental.dashboard.kpi_adr_hint', { days: kpis.rental_days_mtd })}
                    />
                    <StatCard
                        label={t('rental.dashboard.kpi_revpac')}
                        value={money(kpis.revpac)}
                        hint={t('rental.dashboard.kpi_revpac_hint', { fleet: utilisation.fleet_active })}
                    />
                    <StatCard
                        label={t('rental.dashboard.kpi_overdue_rate')}
                        value={`${kpis.overdue_rate}%`}
                        tone={kpis.overdue_rate > 0 ? 'warn' : undefined}
                        hint={t('rental.dashboard.kpi_overdue_rate_hint')}
                    />
                    <StatCard
                        label={t('rental.dashboard.kpi_damage_rate')}
                        value={`${kpis.damage_rate}%`}
                        tone={kpis.damage_rate > 0 ? 'warn' : undefined}
                        hint={t('rental.dashboard.kpi_damage_rate_hint', {
                            damaged: kpis.damaged_mtd,
                            closed: kpis.closed_mtd,
                        })}
                    />
                </div>
            )}

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label={t('rental.dashboard.idle_units')} value={utilisation.idle} />
                <StatCard
                    label={t('rental.dashboard.unsettled_deposits')}
                    value={counts.unsettled_deposits}
                    tone={counts.unsettled_deposits > 0 ? 'warn' : undefined}
                />
                <StatCard label={t('rental.dashboard.returned')} value={counts.returned} />
                <StatCard label={t('rental.dashboard.completed')} value={counts.completed} />
            </div>

            {(compliance.documents.available && (compliance.documents.expired > 0 || compliance.documents.expiring_30 > 0)) && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {t('rental.dashboard.docs_alert', {
                        expired: compliance.documents.expired,
                        expiring: compliance.documents.expiring_30,
                    })}{' '}
                    <Link href={prefixedRoute('documents.index')} className="font-medium underline">
                        {t('rental.dashboard.open_documents')}
                    </Link>
                </div>
            )}

            {compliance.maintenance.available &&
                (compliance.maintenance.overdue_work_orders > 0 || compliance.maintenance.due_schedules > 0) && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {t('rental.dashboard.maintenance_alert', {
                            overdue: compliance.maintenance.overdue_work_orders,
                            due: compliance.maintenance.due_schedules,
                        })}{' '}
                        <Link href={prefixedRoute('maintenance.schedules.index')} className="font-medium underline">
                            {t('rental.dashboard.open_maintenance')}
                        </Link>
                    </div>
                )}

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-800">{t('rental.dashboard.overdue_list')}</h3>
                    </div>
                    <RentalTable rows={overdue} empty={t('rental.dashboard.overdue_empty')} />
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-800">{t('rental.dashboard.ending_soon_list')}</h3>
                    </div>
                    <RentalTable rows={ending_soon} empty={t('rental.dashboard.ending_soon_empty')} />
                </div>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-800">{t('rental.dashboard.revenue_by_type')}</h3>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {revenue.by_type.length === 0 ? (
                            <li className="px-4 py-6 text-center text-sm text-gray-500">{t('rental.dashboard.reports_empty')}</li>
                        ) : (
                            revenue.by_type.map((row) => (
                                <li key={row.type} className="flex items-center justify-between px-4 py-3 text-sm">
                                    <span>
                                        {row.type}
                                        <span className="ml-2 text-xs text-gray-400">×{row.count}</span>
                                    </span>
                                    <span className="tabular-nums font-medium">{money(row.total)}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-800">{t('rental.dashboard.revenue_by_partner')}</h3>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {revenue.by_partner.length === 0 ? (
                            <li className="px-4 py-6 text-center text-sm text-gray-500">{t('rental.dashboard.reports_empty')}</li>
                        ) : (
                            revenue.by_partner.map((row) => (
                                <li key={row.partner_id} className="flex items-center justify-between px-4 py-3 text-sm">
                                    <span>
                                        {row.name}
                                        <span className="ml-2 text-xs text-gray-400">×{row.count}</span>
                                    </span>
                                    <span className="tabular-nums font-medium">{money(row.total)}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-800">{t('rental.dashboard.revenue_by_vehicle')}</h3>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {revenue.by_vehicle.length === 0 ? (
                            <li className="px-4 py-6 text-center text-sm text-gray-500">{t('rental.dashboard.reports_empty')}</li>
                        ) : (
                            revenue.by_vehicle.map((row) => (
                                <li key={row.vehicle_id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                                    <span className="min-w-0">
                                        <span className="block truncate">{row.name}</span>
                                        <span className="text-xs text-gray-400">{row.plate_number} · ×{row.count}</span>
                                    </span>
                                    <span className="shrink-0 tabular-nums font-medium">{money(row.total)}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-800">{t('rental.dashboard.idle_list')}</h3>
                    <Link href={prefixedRoute('rental.availability.index')} className="text-sm font-medium text-indigo-600 hover:underline">
                        {t('rental.dashboard.open_availability')}
                    </Link>
                </div>
                {idle_vehicles.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-500">{t('rental.dashboard.idle_empty')}</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {idle_vehicles.map((vehicle) => (
                            <li key={vehicle.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                <div>
                                    <p className="font-medium text-gray-900">{vehicle.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {vehicle.plate_number}
                                        {vehicle.type ? ` · ${vehicle.type}` : ''}
                                    </p>
                                </div>
                                    <Link
                                    href={prefixedRoute('rental.create')}
                                    className="text-indigo-600 hover:underline"
                                >
                                    {t('rental.dashboard.book_now')}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </DynamicLayout>
    );
}
