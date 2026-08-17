import DynamicLayout from '@/Layouts/DynamicLayout';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

interface PendingPayment {
    id: number;
    order_number: string;
    tenant_id: string;
    tenant_name: string;
    plan_name: string;
    amount: number;
    payment_method: string;
    proof_url: string | null;
    created_at: string;
}

interface RecentTenant {
    id: string;
    name: string;
    status: string;
    domain: string | null;
    full_url: string | null;
    created_at: string;
    is_on_trial: boolean;
    trial_ends_at: string | null;
}

interface PlanDistributionItem {
    id: number;
    name: string;
    code: string;
    price: number;
    tenant_count: number;
}

interface GrowthMonth {
    month: string;
    count: number;
}

interface TopModule {
    key: string;
    label: string;
    count: number;
}

interface Props {
    kpis: {
        total_tenants: number;
        active_tenants: number;
        on_trial_tenants: number;
        suspended_tenants: number;
        total_revenue: number;
        mrr: number;
        pending_payments_count: number;
        active_modules_count: number;
        total_modules_count: number;
    };
    pendingPaymentOrders: PendingPayment[];
    recentTenants: RecentTenant[];
    planDistribution: PlanDistributionItem[];
    growthMonths: GrowthMonth[];
    moduleStats: {
        total: number;
        active: number;
        disabled: number;
        topInstalled: TopModule[];
    };
}

export default function AdminDashboard({
    kpis,
    pendingPaymentOrders,
    recentTenants,
    planDistribution,
    growthMonths,
    moduleStats,
}: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(localeTag === 'id' ? 'id-ID' : 'en-US', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const maxGrowth = Math.max(...growthMonths.map((g) => g.count), 1);
    const totalPlanTenants = planDistribution.reduce((acc, p) => acc + p.tenant_count, 0) || 1;

    return (
        <DynamicLayout>
            <Head title={t('central.dashboard.title', undefined, 'Central SaaS Dashboard')} />

            <div className="space-y-8 pb-12">
                {/* Hero Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl shadow-indigo-950/20 border border-slate-800">
                    <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="absolute right-1/3 -bottom-12 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-indigo-300 backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                {t('central.dashboard.badge', undefined, 'SaaS Platform Command Center')}
                            </div>
                            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                {t('central.dashboard.title', undefined, 'Central SaaS Dashboard')}
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-300">
                                {t('central.dashboard.subtitle', undefined, 'Real-time monitoring and governance for workspace tenants, subscription revenue, platform plans, and module health.')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={route('module.tenants.create')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 hover:shadow-indigo-500/35 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_business</span>
                                {t('central.dashboard.provision_tenant', undefined, 'Provision Tenant')}
                            </Link>

                            <Link
                                href={route('module.plans.index')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-[18px]">card_membership</span>
                                {t('central.dashboard.manage_plans', undefined, 'Manage Plans')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* MRR Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {t('central.dashboard.kpi.mrr', undefined, 'Estimated MRR (30d)')}
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {formatCurrency(kpis.mrr)}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>{t('central.dashboard.kpi.total', undefined, 'Total')}: {formatCurrency(kpis.total_revenue)}</span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    {t('central.dashboard.kpi.active_billing', undefined, 'Active Billing')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Total Workspaces Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {t('central.dashboard.kpi.workspaces', undefined, 'Workspaces / Tenants')}
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <span className="material-symbols-outlined">domain</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {kpis.total_tenants}
                                </span>
                                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    {kpis.active_tenants} {t('central.dashboard.kpi.active', undefined, 'Active')}
                                </span>
                            </div>
                            <div className="mt-2.5 flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                    {kpis.on_trial_tenants} {t('central.dashboard.kpi.trial', undefined, 'Trial')}
                                </span>
                                <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                    {kpis.suspended_tenants} {t('central.dashboard.kpi.suspended', undefined, 'Suspended')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pending Payments Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {t('central.dashboard.kpi.pending_approvals', undefined, 'Pending Approvals')}
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                <span className="material-symbols-outlined">pending_actions</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {kpis.pending_payments_count}
                                </span>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {t('central.dashboard.kpi.orders_awaiting', undefined, 'Orders awaiting proof review')}
                                </span>
                            </div>
                            <div className="mt-2.5">
                                <Link
                                    href={route('module.payment-orders.index')}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    {t('central.dashboard.kpi.review_orders', undefined, 'Review All Payment Orders →')}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Module Registry Health Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {t('central.dashboard.kpi.platform_modules', undefined, 'Platform Modules')}
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                                <span className="material-symbols-outlined">widgets</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {kpis.active_modules_count} / {kpis.total_modules_count}
                                </span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    {t('central.dashboard.kpi.active_platform', undefined, 'Active Platform')}
                                </span>
                            </div>
                            <div className="mt-2.5">
                                <Link
                                    href={route('module.registry.index')}
                                    className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                                >
                                    {t('central.dashboard.kpi.open_registry', undefined, 'Open Module Registry →')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid: Charts & Analytics */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Growth & Signup Bar Visualization */}
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                                    {t('central.dashboard.growth.title', undefined, 'Tenant Growth Trend')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('central.dashboard.growth.subtitle', undefined, 'New tenant registrations per month (last 6 months)')}
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                <span className="material-symbols-outlined text-[16px]">show_chart</span>
                                {t('central.dashboard.growth.rate', undefined, 'Registration Rate')}
                            </span>
                        </div>

                        <div className="flex items-end justify-between gap-3 pt-6 pb-2 h-52">
                            {growthMonths.map((g, idx) => {
                                const heightPercent = Math.max(Math.round((g.count / maxGrowth) * 100), 8);
                                return (
                                    <div key={idx} className="flex flex-1 flex-col items-center gap-2 h-full justify-end group">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {g.count}
                                        </div>
                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className="w-full max-w-[48px] rounded-xl bg-gradient-to-t from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 transition-all duration-300 group-hover:brightness-110"
                                        />
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">
                                            {g.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Plan Distribution Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                                {t('central.dashboard.plans.title', undefined, 'Subscription Plans')}
                            </h3>
                            <Link
                                href={route('module.plans.index')}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                            >
                                {t('central.dashboard.plans.edit', undefined, 'Edit Plans')}
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {planDistribution.map((plan) => {
                                const percentage = Math.round((plan.tenant_count / totalPlanTenants) * 100);
                                return (
                                    <div key={plan.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                {plan.name}
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                {t('central.dashboard.plans.tenants_count', { count: plan.tenant_count, percentage }, `${plan.tenant_count} tenants (${percentage}%)`)}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                style={{ width: `${percentage}%` }}
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Section: Pending Approvals & Recent Tenant Activity */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Pending Payment Orders Quick Review */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                                    {t('central.dashboard.payments.title', undefined, 'Pending Payment Confirmation')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('central.dashboard.payments.subtitle', undefined, 'Manual transfer proofs needing verification')}
                                </p>
                            </div>
                            <Link
                                href={route('module.payment-orders.index')}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                            >
                                {t('central.dashboard.payments.view_all', undefined, 'View All →')}
                            </Link>
                        </div>

                        {pendingPaymentOrders.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">
                                    check_circle
                                </span>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {t('central.dashboard.payments.empty', undefined, 'All clear! No pending payment confirmations.')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingPaymentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                                                    {order.tenant_name}
                                                </span>
                                                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                    {order.plan_name}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {order.order_number} &bull; {formatCurrency(order.amount)} &bull; {order.created_at}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {order.proof_url && (
                                                <button
                                                    onClick={() => setSelectedProof(order.proof_url)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                    {t('central.dashboard.payments.proof', undefined, 'Proof')}
                                                </button>
                                            )}
                                            <Link
                                                href={route('module.payment-orders.show', order.id)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                                            >
                                                {t('central.dashboard.payments.process', undefined, 'Process')}
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Tenant Registrations */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                                    {t('central.dashboard.tenants.title', undefined, 'Recent Workspaces')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('central.dashboard.tenants.subtitle', undefined, 'Newly provisioned tenant environments')}
                                </p>
                            </div>
                            <Link
                                href={route('module.tenants.index')}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                            >
                                {t('central.dashboard.tenants.view_all', undefined, 'View All Tenants →')}
                            </Link>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentTenants.map((tenant) => (
                                <div key={tenant.id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate font-semibold text-sm text-slate-900 dark:text-white">
                                                {tenant.name}
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                    tenant.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                                }`}
                                            >
                                                {tenant.status}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {tenant.domain ?? t('central.dashboard.tenants.no_domain', undefined, 'No Domain')} &bull; {t('central.dashboard.tenants.created', { date: tenant.created_at }, `Created ${tenant.created_at}`)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={route('module.tenants.show', tenant.id)}
                                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            {t('central.dashboard.tenants.details', undefined, 'Details')}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Modules & Quick Command Shortcuts */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Top Installed Modules */}
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                                {t('central.dashboard.top_modules.title', undefined, 'Most Installed Modules Across Tenants')}
                            </h3>
                            <Link
                                href={route('module.registry.index')}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                            >
                                {t('central.dashboard.top_modules.registry', undefined, 'Module Registry →')}
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {moduleStats.topInstalled.map((mod) => (
                                <div
                                    key={mod.key}
                                    className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                                            {mod.label}
                                        </span>
                                        <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                            {t('central.dashboard.top_modules.installs', { count: mod.count }, `${mod.count} installs`)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {t('central.dashboard.top_modules.key', { key: mod.key }, `Key: ${mod.key}`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Platform Control Shortcuts */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">
                            {t('central.dashboard.shortcuts.title', undefined, 'Control Plane Shortcuts')}
                        </h3>

                        <div className="grid grid-cols-1 gap-2.5">
                            <Link
                                href={route('module.tenants.index')}
                                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-slate-800 transition-all hover:bg-indigo-50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                    <span className="material-symbols-outlined text-[20px]">domain</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-sm">
                                        {t('central.dashboard.shortcuts.tenants_title', undefined, 'Tenant Workspaces')}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {t('central.dashboard.shortcuts.tenants_desc', undefined, 'Provision & suspend tenants')}
                                    </div>
                                </div>
                            </Link>

                            <Link
                                href={route('module.plans.index')}
                                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-slate-800 transition-all hover:bg-indigo-50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                    <span className="material-symbols-outlined text-[20px]">card_membership</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-sm">
                                        {t('central.dashboard.shortcuts.plans_title', undefined, 'Subscription Plans')}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {t('central.dashboard.shortcuts.plans_desc', undefined, 'Configure tiers & entitlement')}
                                    </div>
                                </div>
                            </Link>

                            <Link
                                href={route('module.registry.index')}
                                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-slate-800 transition-all hover:bg-indigo-50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    <span className="material-symbols-outlined text-[20px]">toggle_on</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-sm">
                                        {t('central.dashboard.shortcuts.registry_title', undefined, 'Module Kill-Switch')}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {t('central.dashboard.shortcuts.registry_desc', undefined, 'Global module registry control')}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Proof Modal */}
            {selectedProof && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {t('central.dashboard.modal.proof_title', undefined, 'Payment Proof Attachment')}
                            </h4>
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="mt-4 overflow-auto max-h-[70vh] text-center">
                            <img src={selectedProof} alt="Payment Proof" className="inline-block max-w-full rounded-lg" />
                        </div>
                    </div>
                </div>
            )}
        </DynamicLayout>
    );
}
