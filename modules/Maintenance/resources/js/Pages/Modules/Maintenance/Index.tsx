import DynamicLayout from '@/Layouts/DynamicLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../MaintenanceNav';
import {
    WorkOrder,
    getStatusBadge,
    getPriorityBadge,
    formatDate,
    formatCurrency,
} from '../../../maintenanceUtils';
import PageHeader from '@/Components/PageHeader';

interface Summary {
    draft: number;
    pending: number;
    approved: number;
    in_progress: number;
    overdue: number;
    schedules_due: number;
    completed_this_month: number;
    total_cost_this_month: number;
}

interface Props {
    summary: Summary;
    recentWorkOrders: WorkOrder[];
    can: { create: boolean; update: boolean; delete: boolean; approve: boolean };
}

export default function Index({ summary, recentWorkOrders, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const summaryCards = [
        {
            label: t('maintenance.dashboard.in_progress', undefined, 'In Progress'),
            value: summary.in_progress,
            icon: '🛠️',
            bg: 'border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 dark:from-indigo-950/40 dark:to-slate-900',
            textColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            label: t('maintenance.dashboard.awaiting_approval', undefined, 'Awaiting Approval'),
            value: summary.pending + summary.approved,
            icon: '⏳',
            bg: 'border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 dark:from-amber-950/40 dark:to-slate-900',
            textColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: t('maintenance.dashboard.overdue', undefined, 'Overdue WOs'),
            value: summary.overdue,
            icon: '⚠️',
            bg: 'border-rose-200/80 bg-gradient-to-br from-rose-50/80 via-white to-red-50/50 dark:from-rose-950/40 dark:to-slate-900',
            textColor: 'text-rose-600 dark:text-rose-400',
        },
        {
            label: t('maintenance.dashboard.schedules_due', undefined, 'PM Schedules Due'),
            value: summary.schedules_due,
            icon: '⏱️',
            bg: 'border-orange-200/80 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/50 dark:from-orange-950/40 dark:to-slate-900',
            textColor: 'text-orange-600 dark:text-orange-400',
        },
        {
            label: t('maintenance.dashboard.completed_month', undefined, 'Completed (Month)'),
            value: summary.completed_this_month,
            icon: '✓',
            bg: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-emerald-950/40 dark:to-slate-900',
            textColor: 'text-emerald-600 dark:text-emerald-400',
        },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('maintenance.dashboard.head', undefined, 'Maintenance Overview')}
                    subtitle="Workshop shop floor operations, active work orders, and preventive service tracking"
                    actions={can.create && (
                        <Link href={prefixedRoute('maintenance.work-orders.create')}>
                            <PrimaryButton className="!rounded-2xl shadow-sm text-xs">
                                ➕ {t('maintenance.dashboard.new_wo', undefined, 'Create Work Order')}
                            </PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('maintenance.title', undefined, 'Maintenance Dashboard')} />

            <MaintenanceNav />

            <div className="space-y-6">
                {/* Top KPI Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {summaryCards.map((card) => (
                        <div
                            key={card.label}
                            className={`flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${card.bg} border-slate-200/80 dark:border-slate-800`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    {card.label}
                                </span>
                                <span className="text-base">{card.icon}</span>
                            </div>
                            <p className={`text-3xl font-black tracking-tight tabular-nums ${card.textColor}`}>
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Financial Spend Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-indigo-200/60 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/90 via-white to-blue-50/80 dark:from-indigo-950/60 dark:to-slate-900 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-sm">
                            💳
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                                {t('maintenance.dashboard.cost_month', undefined, 'Maintenance Spend (This Month)')}
                            </span>
                            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                                {formatCurrency(summary.total_cost_this_month, localeTag)}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={prefixedRoute('maintenance.analytics.index')}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
                    >
                        📈 {t('maintenance.dashboard.view_all', undefined, 'View Cost Analytics')} ➔
                    </Link>
                </div>

                {/* Active Work Orders Feed */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {t('maintenance.dashboard.active_orders', undefined, 'Active Work Orders')}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Real-time status of work orders currently on the shop floor</p>
                        </div>
                        <Link
                            href={prefixedRoute('maintenance.work-orders.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            {t('maintenance.dashboard.view_all', undefined, 'View All Work Orders')} ➔
                        </Link>
                    </div>

                    {recentWorkOrders.length === 0 ? (
                        <div className="py-14 text-center text-slate-400">
                            <span className="text-3xl">🛠️</span>
                            <p className="mt-2 text-xs font-semibold">
                                {t('maintenance.dashboard.empty_active', undefined, 'No active work orders at the moment.')}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {recentWorkOrders.map((wo) => {
                                const statusBadge = getStatusBadge(wo.status, t);
                                const priorityBadge = getPriorityBadge(wo.priority, t);
                                return (
                                    <Link
                                        key={wo.id}
                                        href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                        className="flex items-center gap-4 p-5 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                                    >
                                        <div
                                            className="h-3.5 w-3.5 flex-shrink-0 rounded-full shadow-sm"
                                            style={{ backgroundColor: wo.category?.color ?? '#6B7280' }}
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-mono text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                                                    {wo.reference_number}
                                                </span>
                                                <span className={`rounded-xl px-2.5 py-0.5 text-[10px] font-extrabold border ${statusBadge.classes}`}>
                                                    {statusBadge.label}
                                                </span>
                                                <span className={`rounded-xl px-2.5 py-0.5 text-[10px] font-extrabold border ${priorityBadge.classes}`}>
                                                    {priorityBadge.label}
                                                </span>
                                            </div>
                                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{wo.title}</p>
                                            <p className="text-xs font-medium text-slate-400 mt-0.5">
                                                🚗 {wo.vehicle?.name} · <span className="font-mono">{wo.vehicle?.plate_number}</span>
                                            </p>
                                        </div>

                                        <div className="flex-shrink-0 text-right">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                📅 {formatDate(wo.scheduled_date, localeTag)}
                                            </p>
                                            {wo.estimated_cost && (
                                                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                    {formatCurrency(wo.estimated_cost, localeTag)}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
