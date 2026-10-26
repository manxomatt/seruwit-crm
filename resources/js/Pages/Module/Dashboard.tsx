import DynamicLayout from '@/Layouts/DynamicLayout';
import DashboardOnboardingCTA, { type OnboardingOverview } from '@/Components/DashboardOnboardingCTA';
import SubscriptionPricingSection, { type SubscriptionOverview } from '@/Components/Dashboard/SubscriptionPricingSection';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';

interface RevenueKpi {
    value: number;
    delta: number | null;
    delta_label: string | null;
    direction: 'up' | 'down';
    action_url?: string | null;
}

interface OutstandingKpi {
    value: number;
    overdue_count: number;
    overdue_label: string | null;
    action_url?: string | null;
}

interface FleetUtilizationKpi {
    percent: number;
    in_use: number;
    total_active: number;
    idle_count: number;
    action_url?: string | null;
}

interface ComplianceDetail {
    type: string;
    severity: string;
    label: string;
}

interface ComplianceKpi {
    action_count: number;
    details: ComplianceDetail[];
    action_url?: string | null;
}

interface TopLevelKpis {
    revenue?: RevenueKpi;
    outstanding?: OutstandingKpi;
    fleet_utilization?: FleetUtilizationKpi;
    compliance?: ComplianceKpi;
}

interface RevenueLine {
    key: string;
    label: string;
    amount: number;
    percent: number;
}

interface InvoiceStatusSummary {
    draft: number;
    issued: number;
    paid: number;
    overdue: number;
}

interface RevenueChartPoint {
    month: string;
    amount: number;
}

interface FinanceBreakdown {
    revenue_by_line?: RevenueLine[];
    invoices?: InvoiceStatusSummary;
    revenue_chart?: RevenueChartPoint[];
}

interface UpcomingDeparture {
    id: number;
    time: string;
    route: string;
    seats_booked: number;
    seats_total: number;
    status: string;
    has_driver: boolean;
}

interface ShuttleBreakdown {
    total_trips_today: number;
    occupancy_percent: number;
    booked_seats: number;
    total_seats: number;
    upcoming_departures: UpcomingDeparture[];
}

interface RentalBreakdown {
    currently_rented: number;
    idle_ready: number;
    overdue_count: number;
}

interface LogisticsBreakdown {
    total_resi_today: number;
    in_transit: number;
    delivered_pod: number;
}

interface MaintenanceBreakdown {
    open_orders: number;
    in_progress: number;
    overdue_count: number;
    completed_period: number;
}

interface ModuleBreakdowns {
    shuttle?: ShuttleBreakdown;
    rental?: RentalBreakdown;
    logistics?: LogisticsBreakdown;
    maintenance?: MaintenanceBreakdown;
}

interface FleetGlobal {
    vehicles_active: number;
    vehicles_maintenance: number;
    drivers_ready: number;
    drivers_on_leave: number;
    fuel_liters: number;
}

interface OperationalAlert {
    module: string;
    type?: string;
    count?: number;
    severity: 'danger' | 'warning' | 'info';
    icon: string;
    title: string;
    message: string;
    action_url?: string | null;
    action_label?: string | null;
}

interface QuickAction {
    key: string;
    label: string;
    icon: string;
    route: string | null;
    permission: string;
}

interface CmsStats {
    posts?: { total: number; published: number; draft: number };
    pages?: { total: number; published: number; draft: number };
    media: { total: number; images: number; documents: number };
    carousels?: { total: number; active: number };
}

interface Activity {
    icon: string;
    type: string;
    description: string;
    time: string;
}

interface Post {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    created_at: string;
}

interface Page {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    created_at: string;
}

interface FilterOptions {
    periods: { key: string; label: string }[];
    modules: string[];
}

interface Props {
    user: { name: string; email: string; roles: string[] };
    primaryRole: { name: string; slug: string } | null;
    period: string;
    filters: FilterOptions;
    kpis: TopLevelKpis;
    finance: FinanceBreakdown;
    modules: ModuleBreakdowns;
    fleetGlobal: FleetGlobal;
    alerts: OperationalAlert[];
    quickActions: QuickAction[];
    stats: CmsStats;
    recentActivity: Activity[];
    recentPosts: Post[];
    recentPages: Page[];
    subscription: SubscriptionOverview | null;
    currencySymbol: string;
    onboarding?: OnboardingOverview;
    showQuickActions?: boolean;
}

function routeExists(routeName: string): boolean {
    return route().has(routeName) || route().has(`central.${routeName}`);
}

function resolveNamedRoute(routeName: string): string {
    if (route().has(routeName)) {
        return routeName;
    }
    const centralRouteName = `central.${routeName}`;
    if (route().has(centralRouteName)) {
        return centralRouteName;
    }
    return routeName;
}

const LINE_COLORS: Record<string, string> = {
    rental: 'bg-emerald-500',
    shuttle: 'bg-indigo-500',
    logistics: 'bg-amber-500',
    other: 'bg-slate-400',
};

const ALERT_STYLES: Record<string, { bg: string; border: string; text: string; subtext: string; iconBg: string; iconColor: string; btn: string }> = {
    danger: {
        bg: 'bg-rose-50/90 dark:bg-rose-950/30',
        border: 'border-rose-200 dark:border-rose-900/50',
        text: 'text-rose-950 dark:text-rose-200',
        subtext: 'text-rose-800/90 dark:text-rose-300/80',
        iconBg: 'bg-rose-100 dark:bg-rose-900/60',
        iconColor: 'text-rose-600 dark:text-rose-300',
        btn: 'bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500 dark:hover:bg-rose-600',
    },
    warning: {
        bg: 'bg-amber-50/90 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-900/50',
        text: 'text-amber-950 dark:text-amber-200',
        subtext: 'text-amber-800/90 dark:text-amber-300/80',
        iconBg: 'bg-amber-100 dark:bg-amber-900/60',
        iconColor: 'text-amber-600 dark:text-amber-300',
        btn: 'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600',
    },
    info: {
        bg: 'bg-blue-50/90 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-900/50',
        text: 'text-blue-950 dark:text-blue-200',
        subtext: 'text-blue-800/90 dark:text-blue-300/80',
        iconBg: 'bg-blue-100 dark:bg-blue-900/60',
        iconColor: 'text-blue-600 dark:text-blue-300',
        btn: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600',
    },
};

const DEPARTURE_STATUS_BADGE: Record<string, string> = {
    ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    locked: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    optimized: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    boarding: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    in_transit: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
};

const ACTIVITY_ICONS: Record<string, { bg: string; color: string; svg: JSX.Element }> = {
    order: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/40',
        color: 'text-emerald-600 dark:text-emerald-400',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
        ),
    },
    trip: {
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        color: 'text-blue-600 dark:text-blue-400',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
            </svg>
        ),
    },
    rental: {
        bg: 'bg-teal-100 dark:bg-teal-900/40',
        color: 'text-teal-600 dark:text-teal-400',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
            </svg>
        ),
    },
    shuttle: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/40',
        color: 'text-indigo-600 dark:text-indigo-400',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
    },
    invoice: {
        bg: 'bg-amber-100 dark:bg-amber-900/40',
        color: 'text-amber-600 dark:text-amber-400',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
    },
    maintenance: {
        bg: 'bg-purple-100 dark:bg-purple-900/40',
        color: 'text-purple-600 dark:text-purple-400',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.115A1.61 1.61 0 015 10.654V6.69a1.61 1.61 0 011.036-1.401l5.384-3.115a1.61 1.61 0 011.16 0l5.384 3.115A1.61 1.61 0 0119 6.69v3.965a1.61 1.61 0 01-1.036 1.401l-5.384 3.115a1.61 1.61 0 01-1.16 0z" />
            </svg>
        ),
    },
};

const QUICK_ACTION_ICONS: Record<string, JSX.Element> = {
    car: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
        </svg>
    ),
    ticket: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
    ),
    package: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
    ),
    'file-invoice': (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    truck: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
        </svg>
    ),
    wrench: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.06-3.02.816l-7.79 7.79a2.25 2.25 0 01-3.182-3.182l7.79-7.79c.756-.756.907-1.944.816-3.02A4.5 4.5 0 0117.25 2.25h1.5a.75.75 0 01.75.75v1.5a.75.75 0 00.75.75h1.5a.75.75 0 01.75.75v1.5z" />
        </svg>
    ),
    'user-plus': (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
        </svg>
    ),
};

let dashboardCurrencySymbol = 'Rp';

function formatCurrency(value: number, localeTag: string): string {
    const grouped = new Intl.NumberFormat(localeTag === 'id' ? 'id-ID' : 'en-US', {
        maximumFractionDigits: 0,
    }).format(value);

    return `${dashboardCurrencySymbol} ${grouped}`;
}

function formatNumber(value: number, localeTag: string): string {
    return new Intl.NumberFormat(localeTag === 'id' ? 'id-ID' : 'en-US').format(value);
}

function formatRelativeTime(
    iso: string,
    t: (key: string, params?: Record<string, string | number>) => string,
    localeTag: string,
): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return t('dashboard.time.just_now');
    if (minutes < 60) return t('dashboard.time.minutes_ago', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('dashboard.time.hours_ago', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('dashboard.time.days_ago', { count: days });
    return new Date(iso).toLocaleDateString(localeTag === 'id' ? 'id-ID' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function SectionCard({
    title,
    subtitle,
    action,
    badge,
    headerExtra,
    children,
    className = '',
}: {
    title: string;
    subtitle?: string;
    action?: { label: string; href: string };
    badge?: React.ReactNode;
    headerExtra?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}): JSX.Element {
    return (
        <section className={`overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all ${className}`}>
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4.5">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
                        {badge}
                    </div>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
                </div>
                {headerExtra && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {headerExtra}
                    </div>
                )}
                {action && !headerExtra && (
                    <Link
                        href={action.href}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                        {action.label}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                )}
            </header>
            <div className="p-6">{children}</div>
        </section>
    );
}

function KpiCard({
    label,
    value,
    subValue,
    icon,
    accent = 'indigo',
    footer,
    href,
}: {
    label: string;
    value: React.ReactNode;
    subValue?: React.ReactNode;
    icon: JSX.Element;
    accent?: 'emerald' | 'red' | 'indigo' | 'amber';
    footer?: React.ReactNode;
    href?: string | null;
}): JSX.Element {
    const tintClasses = {
        emerald: 'from-emerald-50/80 dark:from-emerald-950/25 hover:border-emerald-300 dark:hover:border-emerald-800',
        red: 'from-rose-50/80 dark:from-rose-950/25 hover:border-rose-300 dark:hover:border-rose-800',
        indigo: 'from-indigo-50/80 dark:from-indigo-950/25 hover:border-indigo-300 dark:hover:border-indigo-800',
        amber: 'from-amber-50/80 dark:from-amber-950/25 hover:border-amber-300 dark:hover:border-amber-800',
    } as const;
    const iconClasses = {
        emerald: 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300',
        red: 'bg-rose-100/80 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300',
        indigo: 'bg-indigo-100/80 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300',
        amber: 'bg-amber-100/80 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300',
    } as const;
    const accentTextClasses = {
        emerald: 'text-emerald-600 dark:text-emerald-400',
        red: 'text-rose-600 dark:text-rose-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
        amber: 'text-amber-600 dark:text-amber-400',
    } as const;

    const content = (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
                <div className="mt-2 text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
                    {value}
                </div>
                {subValue && (
                    <div className="mt-1.5 flex items-baseline gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {subValue}
                    </div>
                )}
                {footer && (
                    <div className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${accentTextClasses[accent]}`}>
                        {footer}
                    </div>
                )}
            </div>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClasses[accent]} transition-transform duration-300 group-hover:scale-105 shadow-xs`}>
                {icon}
            </div>
        </div>
    );

    const baseClass = `group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br ${tintClasses[accent]} to-white to-60% dark:to-slate-900 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md block`;

    if (href) {
        return (
            <Link href={href} className={baseClass}>
                {content}
            </Link>
        );
    }

    return <div className={baseClass}>{content}</div>;
}

function MiniStat({
    label,
    value,
    unit,
    subLabel,
    danger,
    warning,
    success,
    icon,
}: {
    label: string;
    value: string | number;
    unit?: string;
    subLabel?: string;
    danger?: boolean;
    warning?: boolean;
    success?: boolean;
    icon?: React.ReactNode;
}): JSX.Element {
    const textColor = danger
        ? 'text-rose-600 dark:text-rose-400'
        : warning
        ? 'text-amber-600 dark:text-amber-400'
        : success
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-slate-900 dark:text-white';

    return (
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/50 p-4 transition-colors">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
                {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight ${textColor}`}>
                    {value}
                </span>
                {unit && <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{unit}</span>}
            </div>
            {subLabel && <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{subLabel}</div>}
        </div>
    );
}

interface AlertGroup {
    module: string;
    items: OperationalAlert[];
    highestSeverity: 'danger' | 'warning' | 'info';
    totalCount: number;
    primaryActionUrl: string | null;
    primaryActionLabel: string;
}

const MODULE_ALERT_CONFIG: Record<
    string,
    {
        name: string;
        tagLabel: string;
        icon: (cls?: string) => JSX.Element;
        style: {
            border: string;
            bg: string;
            iconBg: string;
            badgeBg: string;
            btn: string;
        };
        summary: (count: number) => string;
        actionLabel: string;
        actionRouteName?: string;
    }
> = {
    fleet: {
        name: 'Armada & Dokumen',
        tagLabel: 'Armada',
        icon: (cls = 'h-5 w-5') => (
            <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
            </svg>
        ),
        style: {
            border: 'border-amber-200/90 dark:border-amber-900/50',
            bg: 'bg-amber-50/40 dark:bg-amber-950/20',
            iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
            badgeBg: 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 ring-1 ring-amber-500/20',
            btn: 'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600',
        },
        summary: (count: number) => `${count} armada memerlukan perpanjangan pajak STNK / kepatuhan berkala`,
        actionLabel: 'Kelola Armada',
        actionRouteName: 'module.fleet.vehicles.index',
    },
    maintenance: {
        name: 'Pemeliharaan & Servis',
        tagLabel: 'Maintenance',
        icon: (cls = 'h-5 w-5') => (
            <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.06-3.02.816l-7.79 7.79a2.25 2.25 0 01-3.182-3.182l7.79-7.79c.756-.756.907-1.944.816-3.02A4.5 4.5 0 0117.25 2.25h1.5a.75.75 0 01.75.75v1.5a.75.75 0 00.75.75h1.5a.75.75 0 01.75.75v1.5z" />
            </svg>
        ),
        style: {
            border: 'border-blue-200/90 dark:border-blue-900/50',
            bg: 'bg-blue-50/40 dark:bg-blue-950/20',
            iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
            badgeBg: 'bg-blue-100/90 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 ring-1 ring-blue-500/20',
            btn: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600',
        },
        summary: (count: number) => `${count} work order servis telah melewati estimasi pengerjaan (overdue)`,
        actionLabel: 'Buka Servis',
        actionRouteName: 'module.maintenance.work-orders.index',
    },
    rental: {
        name: 'Rental & Sewa Unit',
        tagLabel: 'Rental',
        icon: (cls = 'h-5 w-5') => (
            <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
        ),
        style: {
            border: 'border-rose-200/90 dark:border-rose-900/50',
            bg: 'bg-rose-50/40 dark:bg-rose-950/20',
            iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
            badgeBg: 'bg-rose-100/90 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 ring-1 ring-rose-500/20',
            btn: 'bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500 dark:hover:bg-rose-600',
        },
        summary: (count: number) => `${count} unit reservasi sewa terlambat dikembalikan dari jadwal`,
        actionLabel: 'Lihat Rental',
        actionRouteName: 'module.rental.index',
    },
    shuttle: {
        name: 'Travel & Shuttle',
        tagLabel: 'Shuttle',
        icon: (cls = 'h-5 w-5') => (
            <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
        ),
        style: {
            border: 'border-indigo-200/90 dark:border-indigo-900/50',
            bg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
            iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
            badgeBg: 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 ring-1 ring-indigo-500/20',
            btn: 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600',
        },
        summary: (count: number) => `${count} jadwal keberangkatan belum memiliki penugasan sopir`,
        actionLabel: 'Tugaskan Sopir',
        actionRouteName: 'module.shuttle.departures.index',
    },
    invoicing: {
        name: 'Keuangan & Tagihan',
        tagLabel: 'Invoice',
        icon: (cls = 'h-5 w-5') => (
            <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
        style: {
            border: 'border-rose-200/90 dark:border-rose-900/50',
            bg: 'bg-rose-50/40 dark:bg-rose-950/20',
            iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
            badgeBg: 'bg-rose-100/90 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 ring-1 ring-rose-500/20',
            btn: 'bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500 dark:hover:bg-rose-600',
        },
        summary: (count: number) => `${count} invoice tagihan pelanggan telah melewati masa jatuh tempo`,
        actionLabel: 'Buka Invoice',
        actionRouteName: 'module.invoicing.invoices.index',
    },
};

function getModuleAlertConfig(moduleKey: string) {
    if (MODULE_ALERT_CONFIG[moduleKey]) {
        return MODULE_ALERT_CONFIG[moduleKey];
    }
    const cap = moduleKey ? moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1) : 'Umum';
    return {
        name: cap,
        tagLabel: cap,
        icon: (cls = 'h-5 w-5') => (
            <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        ),
        style: {
            border: 'border-slate-200/90 dark:border-slate-800',
            bg: 'bg-slate-50/50 dark:bg-slate-900/20',
            iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 ring-1 ring-slate-500/20',
            btn: 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600',
        },
        summary: (count: number) => `${count} kasus operasional memerlukan tindakan`,
        actionLabel: 'Tindak Lanjuti',
        actionRouteName: undefined,
    };
}

const SEVERITY_BADGE_STYLE: Record<string, { label: string; badge: string; dot: string }> = {
    danger: {
        label: 'Mendesak',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 ring-1 ring-rose-500/20',
        dot: 'bg-rose-500',
    },
    warning: {
        label: 'Penting',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 ring-1 ring-amber-500/20',
        dot: 'bg-amber-500',
    },
    info: {
        label: 'Perlu Cek',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 ring-1 ring-blue-500/20',
        dot: 'bg-blue-500',
    },
};

function AttentionCenterSection({ alerts }: { alerts: OperationalAlert[] }): JSX.Element {
    const { t } = useTrans();
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const groupedAlerts = useMemo<AlertGroup[]>(() => {
        const map = new Map<string, OperationalAlert[]>();
        alerts.forEach((alert) => {
            const mod = alert.module || 'general';
            if (!map.has(mod)) {
                map.set(mod, []);
            }
            map.get(mod)!.push(alert);
        });

        return Array.from(map.entries()).map(([moduleKey, items]) => {
            const hasDanger = items.some((it) => it.severity === 'danger');
            const hasWarning = items.some((it) => it.severity === 'warning');
            const highestSeverity: 'danger' | 'warning' | 'info' = hasDanger
                ? 'danger'
                : hasWarning
                ? 'warning'
                : 'info';

            const config = getModuleAlertConfig(moduleKey);
            const fallbackUrl = config.actionRouteName && routeExists(config.actionRouteName)
                ? route(resolveNamedRoute(config.actionRouteName))
                : null;

            const firstItemWithUrl = items.find((it) => it.action_url);
            const primaryActionUrl = firstItemWithUrl?.action_url ?? fallbackUrl;
            const primaryActionLabel = config.actionLabel;

            return {
                module: moduleKey,
                items,
                highestSeverity,
                totalCount: items.length,
                primaryActionUrl,
                primaryActionLabel,
            };
        });
    }, [alerts]);

    if (alerts.length === 0) {
        return (
            <div className="flex items-center gap-3.5 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 px-6 py-4 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                        {t('dashboard.alerts.all_operational_good', undefined, 'Semua Operasional Berjalan Lancar')}
                    </h3>
                    <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-300/70">
                        {t('dashboard.alerts.all_operational_good_desc', undefined, 'Tidak ada unit sewa overdue, jadwal tanpa supir, atau dokumen pajak yang membutuhkan tindakan mendesak saat ini.')}
                    </p>
                </div>
            </div>
        );
    }

    const allExpanded = groupedAlerts.length > 0 && groupedAlerts.every((g) => !!expandedModules[g.module]);

    const toggleAll = () => {
        if (allExpanded) {
            setExpandedModules({});
        } else {
            const next: Record<string, boolean> = {};
            groupedAlerts.forEach((g) => {
                next[g.module] = true;
            });
            setExpandedModules(next);
        }
    };

    const toggleGroup = (moduleKey: string) => {
        setExpandedModules((prev) => ({
            ...prev,
            [moduleKey]: !prev[moduleKey],
        }));
    };

    const visibleGroups = activeFilter === 'all'
        ? groupedAlerts
        : groupedAlerts.filter((g) => g.module === activeFilter);

    return (
        <SectionCard
            title={t('dashboard.sections.attention_center', undefined, 'Pusat Perhatian & Aksi Mendesak')}
            badge={
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-black text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {alerts.length} Perlu Tindakan
                </span>
            }
            headerExtra={
                <div className="flex flex-wrap items-center gap-2">
                    {groupedAlerts.length > 1 && (
                        <div className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setActiveFilter('all')}
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                    activeFilter === 'all'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Semua ({alerts.length})
                            </button>
                            {groupedAlerts.map((g) => {
                                const cfg = getModuleAlertConfig(g.module);
                                return (
                                    <button
                                        key={g.module}
                                        type="button"
                                        onClick={() => setActiveFilter(g.module)}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                            activeFilter === g.module
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {cfg.tagLabel} ({g.totalCount})
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span>
                            {allExpanded
                                ? t('dashboard.alerts.collapse_all', undefined, 'Ringkas Semua')
                                : t('dashboard.alerts.expand_all', undefined, 'Buka Semua Rincian')}
                        </span>
                    </button>
                </div>
            }
        >
            <div className={`grid gap-4 ${visibleGroups.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'}`}>
                {visibleGroups.map((group) => {
                    const config = getModuleAlertConfig(group.module);
                    const isExpanded = !!expandedModules[group.module];
                    const severityInfo = SEVERITY_BADGE_STYLE[group.highestSeverity] ?? SEVERITY_BADGE_STYLE.warning;
                    const groupActionUrl = group.primaryActionUrl;
                    const groupActionLabel = group.primaryActionLabel;

                    return (
                        <div
                            key={group.module}
                            className={`flex flex-col justify-between rounded-2xl border ${config.style.border} ${config.style.bg} p-4.5 sm:p-5 transition-all hover:shadow-xs`}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-2xs ${config.style.iconBg}`}>
                                            {config.icon('h-5 w-5')}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {config.name}
                                                </h4>
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${severityInfo.badge}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${severityInfo.dot} animate-pulse`} />
                                                    {group.totalCount} Perlu Tindakan
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                                                {config.summary(group.totalCount)}
                                            </p>
                                        </div>
                                    </div>

                                    {groupActionUrl && (
                                        <Link
                                            href={groupActionUrl}
                                            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${config.style.btn} shadow-xs transition-transform active:scale-95 shrink-0`}
                                        >
                                            <span>{groupActionLabel}</span>
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.module)}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors"
                                >
                                    <span>
                                        {isExpanded
                                            ? t('dashboard.alerts.hide_cases', undefined, 'Sembunyikan Rincian')
                                            : t('dashboard.alerts.view_cases', { count: group.totalCount }, `Lihat ${group.totalCount} Kasus`)}
                                    </span>
                                    <svg
                                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {groupActionUrl && (
                                    <Link
                                        href={groupActionUrl}
                                        className={`sm:hidden inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold ${config.style.btn} shadow-xs`}
                                    >
                                        <span>{groupActionLabel}</span>
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </Link>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="mt-3 space-y-2 border-t border-slate-200/60 dark:border-slate-800/80 pt-3">
                                    {group.items.map((item, idx) => {
                                        const cleanTitle = item.title.replace(/^\[.*?\]\s*/, '');
                                        return (
                                            <div
                                                key={`${item.module}-${idx}`}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/70 p-3 px-3.5 transition-colors hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                            {cleanTitle}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-3.5">
                                                        {item.message}
                                                    </p>
                                                </div>
                                                {item.action_url && (
                                                    <Link
                                                        href={item.action_url}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 pl-3.5 sm:pl-0 self-start sm:self-center shrink-0 transition-colors"
                                                    >
                                                        <span>{item.action_label ?? t('dashboard.kpi.view_details', undefined, 'Periksa →')}</span>
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                        </svg>
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </SectionCard>
    );
}

export default function Dashboard({
    user,
    primaryRole,
    period,
    filters,
    kpis,
    finance,
    modules,
    fleetGlobal,
    alerts,
    quickActions,
    stats,
    recentActivity,
    recentPosts,
    recentPages,
    subscription,
    currencySymbol,
    onboarding,
    showQuickActions = true,
}: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    dashboardCurrencySymbol = currencySymbol;
    const [activeContentTab, setActiveContentTab] = useState<'posts' | 'pages'>('posts');

    const hasKpis = !!(kpis.revenue || kpis.outstanding || kpis.fleet_utilization || kpis.compliance);
    const hasFinance = !!(finance.revenue_by_line || finance.invoices);
    const hasFleetGlobal = Object.keys(fleetGlobal).length > 0;
    const hasCms = !!(stats.posts || stats.pages || stats.carousels);
    const hasModulesData = !!(modules.shuttle || modules.rental || modules.logistics || modules.maintenance);

    const changePeriod = (key: string) => {
        router.get(route('module.dashboard'), { period: key }, { preserveState: true, preserveScroll: true });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('dashboard.greeting.morning');
        if (hour < 18) return t('dashboard.greeting.afternoon');
        return t('dashboard.greeting.evening');
    };

    const todayFormatted = useMemo(() => {
        return new Date().toLocaleDateString(localeTag === 'id' ? 'id-ID' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, [localeTag]);

    const dashboardTitle = primaryRole
        ? t('dashboard.title_with_role', { role: primaryRole.name })
        : t('dashboard.title');

    return (
        <DynamicLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-slate-800 dark:text-white">{dashboardTitle}</h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{todayFormatted}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-2xl bg-white dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                            <span className="px-2.5 text-xs font-semibold text-slate-400 dark:text-slate-400">
                                {t('dashboard.filters.period')}:
                            </span>
                            {filters.periods.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => changePeriod(opt.key)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        period === opt.key
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={dashboardTitle} />

            <div className="space-y-8">
                {/* Executive Welcome Hero Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-indigo-900/40 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg">
                    {/* Background Soft Ambient Lights */}
                    <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-500/15 to-indigo-500/15 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-white/15 backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                {todayFormatted}
                            </span>
                            {primaryRole && (
                                <span className="inline-flex items-center rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-300 ring-1 ring-indigo-400/30">
                                    {primaryRole.name}
                                </span>
                            )}
                        </div>
                        <h1 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">{user.name}</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                            {alerts.length > 0
                                ? `${alerts.length} item operasional memerlukan tindak lanjut Anda hari ini.`
                                : t('dashboard.alerts.all_operational_good_desc', undefined, 'Semua armada dan operasional Anda terpantau siap dan berjalan lancar.')}
                        </p>
                    </div>
                </div>

                {/* Dedicated Quick Actions Section */}
                {showQuickActions && quickActions.length > 0 && (
                    <SectionCard
                        title={t('dashboard.sections.quick_actions', undefined, 'Aksi Cepat Operasional')}
                    >
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                            {quickActions.map((qa) =>
                                qa.route ? (
                                    <Link
                                        key={qa.key}
                                        href={qa.route}
                                        className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100/80 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 transition-transform group-hover:scale-110 shadow-xs">
                                            {QUICK_ACTION_ICONS[qa.icon] ?? QUICK_ACTION_ICONS.package}
                                        </div>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
                                            {qa.label}
                                        </span>
                                    </Link>
                                ) : (
                                    <div
                                        key={qa.key}
                                        className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/40 p-4 text-center opacity-50 cursor-not-allowed"
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                            {QUICK_ACTION_ICONS[qa.icon] ?? QUICK_ACTION_ICONS.package}
                                        </div>
                                        <span className="text-xs font-medium text-slate-400 line-clamp-2">
                                            {qa.label}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </SectionCard>
                )}

                {/* Onboarding Guide (Shown when fleet or contacts need initial setup) */}
                <DashboardOnboardingCTA onboarding={onboarding} />

                {/* Attention Center & Operational Alerts (Consolidated / Grouped by Module) */}
                <AttentionCenterSection alerts={alerts} />

                {/* Top-Level Executive KPI Cards */}
                {hasKpis && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {kpis.revenue && (
                            <KpiCard
                                label={t('dashboard.kpi.revenue')}
                                value={formatCurrency(kpis.revenue.value, localeTag)}
                                accent="emerald"
                                href={kpis.revenue.action_url}
                                icon={
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                                footer={kpis.revenue.delta_label ? (
                                    <>
                                        <svg className={`h-3.5 w-3.5 ${kpis.revenue.direction === 'up' ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3l7.5 7.5m-15 6L12 9l7.5 7.5" />
                                        </svg>
                                        <span>{kpis.revenue.delta_label}</span>
                                    </>
                                ) : undefined}
                            />
                        )}
                        {kpis.outstanding && (
                            <KpiCard
                                label={t('dashboard.kpi.outstanding')}
                                value={formatCurrency(kpis.outstanding.value, localeTag)}
                                href={kpis.outstanding.action_url}
                                subValue={kpis.outstanding.overdue_count > 0 ? (
                                    <span className="font-bold text-rose-600 dark:text-rose-400">
                                        {kpis.outstanding.overdue_label}
                                    </span>
                                ) : undefined}
                                accent="red"
                                icon={
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                }
                                footer={kpis.outstanding.action_url ? (
                                    <span>{t('dashboard.actions.manage_invoices', undefined, 'Kelola Tagihan →')}</span>
                                ) : undefined}
                            />
                        )}
                        {kpis.fleet_utilization && (
                            <KpiCard
                                label={t('dashboard.kpi.fleet_utilization')}
                                value={`${kpis.fleet_utilization.percent}%`}
                                href={kpis.fleet_utilization.action_url}
                                subValue={
                                    <>
                                        <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                            {kpis.fleet_utilization.in_use}/{kpis.fleet_utilization.total_active}
                                        </span>
                                        <span>
                                            {t('dashboard.kpi.unit_in_use', {
                                                in_use: kpis.fleet_utilization.in_use,
                                                total_active: kpis.fleet_utilization.total_active,
                                            })}
                                        </span>
                                    </>
                                }
                                accent="indigo"
                                footer={
                                    <span>{t('dashboard.kpi.idle_ready', { count: kpis.fleet_utilization.idle_count })}</span>
                                }
                                icon={
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
                                    </svg>
                                }
                            />
                        )}
                        {kpis.compliance && (
                            <KpiCard
                                label={t('dashboard.kpi.compliance')}
                                value={kpis.compliance.action_count}
                                href={kpis.compliance.action_url}
                                subValue={
                                    <span className="font-bold text-amber-600 dark:text-amber-400">
                                        {t('dashboard.kpi.action_needed', { count: kpis.compliance.action_count })}
                                    </span>
                                }
                                accent="amber"
                                icon={
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                    </svg>
                                }
                                footer={kpis.compliance.details[0]?.label}
                            />
                        )}
                    </div>
                )}

                {/* Active Vertical Modules (Adaptive Grid) */}
                {hasModulesData && (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {/* Shuttle / Travel Module */}
                        {modules.shuttle && (
                            <SectionCard
                                title={t('dashboard.sections.shuttle_ops')}
                                action={
                                    routeExists('module.shuttle.departures.index')
                                        ? { label: t('dashboard.actions.view_all'), href: route(resolveNamedRoute('module.shuttle.departures.index')) }
                                        : undefined
                                }
                            >
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <MiniStat
                                        label={t('dashboard.shuttle.total_trips_today')}
                                        value={modules.shuttle.total_trips_today}
                                        unit={t('dashboard.shuttle.total_trips_unit')}
                                    />
                                    <MiniStat
                                        label={t('dashboard.shuttle.occupancy_label')}
                                        value={`${modules.shuttle.occupancy_percent}%`}
                                        subLabel={t('dashboard.shuttle.occupancy_detail', {
                                            booked: modules.shuttle.booked_seats,
                                            total: modules.shuttle.total_seats,
                                        })}
                                        success={modules.shuttle.occupancy_percent >= 70}
                                        warning={modules.shuttle.occupancy_percent < 70 && modules.shuttle.occupancy_percent >= 40}
                                    />
                                </div>
                                {modules.shuttle.upcoming_departures.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            {t('dashboard.sections.upcoming_departures')}
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                                            {modules.shuttle.upcoming_departures.map((dep) => (
                                                <div key={dep.id} className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800/40">
                                                            {dep.time}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                                                {dep.route}
                                                            </div>
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                <span className="tabular-nums">
                                                                    {dep.seats_booked}/{dep.seats_total} {t('dashboard.shuttle.seat_unit')}
                                                                </span>
                                                                {!dep.has_driver && (
                                                                    <span className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                                                        ! No Driver
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${DEPARTURE_STATUS_BADGE[dep.status] ?? 'bg-slate-100 text-slate-700'}`}>
                                                        {t(`dashboard.departure_status.${dep.status}`, { defaultValue: dep.status })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </SectionCard>
                        )}

                        {/* Rental Module */}
                        {modules.rental && (
                            <SectionCard
                                title={t('dashboard.sections.rental')}
                                action={
                                    routeExists('module.rental.index')
                                        ? { label: t('dashboard.actions.manage'), href: route(resolveNamedRoute('module.rental.index')) }
                                        : undefined
                                }
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    <MiniStat
                                        label={t('dashboard.rental_unit.currently_rented')}
                                        value={modules.rental.currently_rented}
                                        unit={t('dashboard.rental_unit.unit_vehicles')}
                                        success={modules.rental.currently_rented > 0}
                                    />
                                    <MiniStat
                                        label={t('dashboard.rental_unit.idle_ready')}
                                        value={modules.rental.idle_ready}
                                        unit={t('dashboard.rental_unit.unit_vehicles')}
                                    />
                                    <MiniStat
                                        label={t('dashboard.rental_unit.overdue')}
                                        value={modules.rental.overdue_count}
                                        unit={t('dashboard.rental_unit.unit_vehicles')}
                                        danger={modules.rental.overdue_count > 0}
                                    />
                                </div>
                                <div className="mt-5 space-y-3">
                                    {[
                                        { label: t('dashboard.rental_unit.currently_rented'), count: modules.rental.currently_rented, color: 'bg-emerald-500' },
                                        { label: t('dashboard.rental_unit.idle_ready'), count: modules.rental.idle_ready, color: 'bg-indigo-500' },
                                        { label: t('dashboard.rental_unit.overdue'), count: modules.rental.overdue_count, color: 'bg-rose-500' },
                                    ].map((item) => {
                                        const total = modules.rental!.currently_rented + modules.rental!.idle_ready + modules.rental!.overdue_count;
                                        return (
                                            <div key={item.label}>
                                                <div className="mb-1 flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                                        <span className="font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                                                    </span>
                                                    <span className="font-bold tabular-nums text-slate-900 dark:text-white">{item.count}</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                                                        style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </SectionCard>
                        )}

                        {/* Logistics Module */}
                        {modules.logistics && (
                            <SectionCard
                                title={t('dashboard.sections.logistics')}
                                action={
                                    routeExists('module.orders.index')
                                        ? { label: t('dashboard.actions.view_all'), href: route(resolveNamedRoute('module.orders.index')) }
                                        : undefined
                                }
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    <MiniStat
                                        label={t('dashboard.logistics_unit.total_resi_today')}
                                        value={modules.logistics.total_resi_today}
                                        unit={t('dashboard.logistics_unit.unit_shipments')}
                                    />
                                    <MiniStat
                                        label={t('dashboard.logistics_unit.in_transit')}
                                        value={modules.logistics.in_transit}
                                        unit={t('dashboard.logistics_unit.unit_shipments')}
                                        warning={modules.logistics.in_transit > 0}
                                    />
                                    <MiniStat
                                        label={t('dashboard.logistics_unit.delivered_pod')}
                                        value={modules.logistics.delivered_pod}
                                        unit={t('dashboard.logistics_unit.unit_shipments')}
                                        success={modules.logistics.delivered_pod > 0}
                                    />
                                </div>
                                <div className="mt-5 space-y-3">
                                    {[
                                        { label: t('dashboard.logistics_unit.in_transit'), count: modules.logistics.in_transit, color: 'bg-amber-500' },
                                        { label: t('dashboard.logistics_unit.delivered_pod'), count: modules.logistics.delivered_pod, color: 'bg-emerald-500' },
                                    ].map((item) => {
                                        const total = modules.logistics!.in_transit + modules.logistics!.delivered_pod;
                                        return (
                                            <div key={item.label}>
                                                <div className="mb-1 flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                                        <span className="font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                                                    </span>
                                                    <span className="font-bold tabular-nums text-slate-900 dark:text-white">{item.count}</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                                                        style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </SectionCard>
                        )}

                        {/* Maintenance & Servis Module */}
                        {modules.maintenance && (
                            <SectionCard
                                title={t('dashboard.sections.maintenance', undefined, 'Modul: Servis & Bengkel')}
                                action={
                                    routeExists('module.maintenance.work-orders.index')
                                        ? { label: t('dashboard.actions.manage'), href: route(resolveNamedRoute('module.maintenance.work-orders.index')) }
                                        : undefined
                                }
                            >
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <MiniStat
                                        label={t('dashboard.maintenance.open_orders', undefined, 'WO Aktif')}
                                        value={modules.maintenance.open_orders}
                                        unit={t('dashboard.maintenance.unit_orders', undefined, 'WO')}
                                    />
                                    <MiniStat
                                        label={t('dashboard.maintenance.in_progress', undefined, 'Dikerjakan')}
                                        value={modules.maintenance.in_progress}
                                        unit={t('dashboard.maintenance.unit_orders', undefined, 'WO')}
                                        warning={modules.maintenance.in_progress > 0}
                                    />
                                    <MiniStat
                                        label={t('dashboard.maintenance.overdue', undefined, 'Overdue')}
                                        value={modules.maintenance.overdue_count}
                                        unit={t('dashboard.maintenance.unit_orders', undefined, 'WO')}
                                        danger={modules.maintenance.overdue_count > 0}
                                    />
                                    <MiniStat
                                        label={t('dashboard.maintenance.completed_period', undefined, 'Selesai')}
                                        value={modules.maintenance.completed_period}
                                        unit={t('dashboard.maintenance.unit_orders', undefined, 'WO')}
                                        success={modules.maintenance.completed_period > 0}
                                    />
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        Perawatan rutin menjaga unit tetap prima & prima disewa
                                    </span>
                                    {routeExists('module.maintenance.work-orders.create') && (
                                        <Link
                                            href={route(resolveNamedRoute('module.maintenance.work-orders.create'))}
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            + Catat Servis
                                        </Link>
                                    )}
                                </div>
                            </SectionCard>
                        )}
                    </div>
                )}

                {/* Global Fleet Monitoring Card */}
                {hasFleetGlobal && (
                    <SectionCard
                        title={t('dashboard.sections.fleet_global')}
                        action={
                            routeExists('module.fleet.vehicles.index')
                                ? { label: t('dashboard.actions.manage'), href: route(resolveNamedRoute('module.fleet.vehicles.index')) }
                                : undefined
                        }
                    >
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            <MiniStat
                                label={t('dashboard.fleet_global.active')}
                                value={fleetGlobal.vehicles_active}
                                unit={t('dashboard.fleet_global.unit_vehicles')}
                                success={fleetGlobal.vehicles_active > 0}
                            />
                            <MiniStat
                                label={t('dashboard.fleet_global.maintenance')}
                                value={fleetGlobal.vehicles_maintenance}
                                unit={t('dashboard.fleet_global.unit_vehicles')}
                                warning={fleetGlobal.vehicles_maintenance > 0}
                            />
                            <MiniStat
                                label={t('dashboard.fleet_global.drivers_ready')}
                                value={fleetGlobal.drivers_ready}
                                unit={t('dashboard.fleet_global.unit_people')}
                                success={fleetGlobal.drivers_ready > 0}
                            />
                            <MiniStat
                                label={t('dashboard.fleet_global.drivers_leave')}
                                value={fleetGlobal.drivers_on_leave}
                                unit={t('dashboard.fleet_global.unit_people')}
                            />
                            <MiniStat
                                label={t('dashboard.fleet_global.fuel_consumption')}
                                value={formatNumber(fleetGlobal.fuel_liters, localeTag)}
                                unit={t('dashboard.fleet_global.unit_liters')}
                            />
                        </div>
                    </SectionCard>
                )}

                {/* Finance & Invoices Performance */}
                {hasFinance && (
                    <SectionCard
                        title={t('dashboard.sections.finance_invoice')}
                        action={
                            routeExists('module.invoicing.invoices.index')
                                ? { label: t('dashboard.actions.manage_invoices'), href: route(resolveNamedRoute('module.invoicing.invoices.index')) }
                                : undefined
                        }
                    >
                        <div className="grid gap-8 lg:grid-cols-5">
                            {finance.revenue_by_line && finance.revenue_by_line.length > 0 && (
                                <div className="space-y-4 lg:col-span-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {t('dashboard.sections.revenue_per_line')}
                                    </h4>
                                    <div className="space-y-3.5">
                                        {finance.revenue_by_line.map((line) => (
                                            <div key={line.key}>
                                                <div className="mb-1.5 flex items-center justify-between text-xs sm:text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${LINE_COLORS[line.key] ?? 'bg-slate-400'}`} />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{line.label}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                                                            {formatCurrency(line.amount, localeTag)}
                                                        </span>
                                                        <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                                                            {line.percent}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className={`h-full rounded-full ${LINE_COLORS[line.key] ?? 'bg-slate-500'} transition-all duration-500`}
                                                        style={{ width: `${Math.max(line.percent, 0)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 6-Month Revenue Bar Chart */}
                                    {finance.revenue_chart && finance.revenue_chart.length > 0 && (
                                        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                                            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                {t('dashboard.sections.monthly_revenue', undefined, 'Tren Revenue 6 Bulan')}
                                            </div>
                                            <div className="flex items-end gap-2 sm:gap-3" style={{ height: 140 }}>
                                                {finance.revenue_chart.map((d, i) => {
                                                    const maxAmount = Math.max(...finance.revenue_chart!.map((x) => x.amount), 1);
                                                    const height = (d.amount / maxAmount) * 110;
                                                    return (
                                                        <div key={i} className="flex flex-1 flex-col items-center gap-1 group">
                                                            <div className="text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-400 opacity-80 group-hover:opacity-100">
                                                                {d.amount >= 1_000_000
                                                                    ? `${(d.amount / 1_000_000).toFixed(1)}M`
                                                                    : d.amount >= 1_000
                                                                    ? `${Math.round(d.amount / 1_000)}k`
                                                                    : d.amount}
                                                            </div>
                                                            <div
                                                                className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-700 dark:to-indigo-500 transition-all duration-300 group-hover:from-indigo-500 group-hover:to-indigo-300 shadow-xs"
                                                                style={{ height: `${Math.max(height, 6)}px` }}
                                                            />
                                                            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{d.month}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Invoice Summary Status */}
                            {finance.invoices && (
                                <div className="lg:col-span-2">
                                    <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {t('dashboard.sections.invoice_status')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <MiniStat
                                            label={t('dashboard.invoice_status_summary.draft')}
                                            value={finance.invoices.draft}
                                        />
                                        <MiniStat
                                            label={t('dashboard.invoice_status_summary.issued')}
                                            value={finance.invoices.issued}
                                            warning={finance.invoices.issued > 0}
                                        />
                                        <MiniStat
                                            label={t('dashboard.invoice_status_summary.paid')}
                                            value={finance.invoices.paid}
                                            success={finance.invoices.paid > 0}
                                        />
                                        <MiniStat
                                            label={t('dashboard.invoice_status_summary.overdue')}
                                            value={finance.invoices.overdue}
                                            danger={finance.invoices.overdue > 0}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                )}

                {/* Recent Activity Timeline */}
                {recentActivity.length > 0 && (
                    <SectionCard
                        title={t('dashboard.sections.recent_activity')}
                    >
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 -mx-3">
                            {recentActivity.map((act, i) => {
                                const iconSet = ACTIVITY_ICONS[act.type] ?? ACTIVITY_ICONS.order;
                                return (
                                    <div key={i} className="flex items-center gap-3.5 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors">
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconSet.bg} ${iconSet.color}`}>
                                            {iconSet.svg}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                                                {act.description}
                                            </p>
                                            <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                                                {formatRelativeTime(act.time, t, localeTag)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                )}

                {/* Tenant PAYG Subscription & Fleet Quota Section (Always visible to tenant owner, independent of CMS!) */}
                {subscription && subscription.tiers.length > 0 && (
                    <div className="pt-2">
                        <SubscriptionPricingSection subscription={subscription} />
                    </div>
                )}

                {/* Website & Content CMS Management (Separated at bottom if active) */}
                {hasCms && (
                    <div className="space-y-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                {t('dashboard.sections.content')}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Kelola artikel blog, landing page, dan aset media website tenant Anda
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.posts && (
                                <Link
                                    href={route('module.posts.index')}
                                    className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('dashboard.content_stats.posts')}</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.posts.total}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {t('dashboard.content_stats.published_draft', {
                                            published: stats.posts.published,
                                            draft: stats.posts.draft,
                                        })}
                                    </p>
                                </Link>
                            )}
                            {stats.pages && (
                                <Link
                                    href={route('module.pages.index')}
                                    className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('dashboard.content_stats.pages')}</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.pages.total}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {t('dashboard.content_stats.published_draft', {
                                            published: stats.pages.published,
                                            draft: stats.pages.draft,
                                        })}
                                    </p>
                                </Link>
                            )}
                            <Link
                                href={route('module.media.index')}
                                className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('dashboard.content_stats.media')}</p>
                                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.media.total}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {t('dashboard.content_stats.media_detail', {
                                        images: stats.media.images,
                                        documents: stats.media.documents,
                                    })}
                                </p>
                            </Link>
                            {stats.carousels && (
                                <Link
                                    href={route('module.carousels.index')}
                                    className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('dashboard.content_stats.carousels')}</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.carousels.total}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {t('dashboard.content_stats.active_count', { count: stats.carousels.active })}
                                    </p>
                                </Link>
                            )}
                        </div>

                        {(recentPosts.length > 0 || recentPages.length > 0) && (
                            <SectionCard title={t('dashboard.sections.recent_content')}>
                                <div className="mb-4 inline-flex items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
                                    {stats.posts && (
                                        <button
                                            onClick={() => setActiveContentTab('posts')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                activeContentTab === 'posts'
                                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {t('dashboard.content_tabs.posts')}
                                        </button>
                                    )}
                                    {stats.pages && (
                                        <button
                                            onClick={() => setActiveContentTab('pages')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                activeContentTab === 'pages'
                                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {t('dashboard.content_tabs.pages')}
                                        </button>
                                    )}
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 -mx-3">
                                    {(activeContentTab === 'posts' ? recentPosts : recentPages).map((item) => (
                                        <Link
                                            key={item.id}
                                            href={route(
                                                activeContentTab === 'posts' ? 'module.posts.edit' : 'module.pages.edit',
                                                item.id,
                                            )}
                                            className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <span className="truncate text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                                {item.title}
                                            </span>
                                            <span
                                                className={`ml-2 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                    item.is_published
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                }`}
                                            >
                                                {item.is_published
                                                    ? t('dashboard.status_labels.published')
                                                    : t('dashboard.status_labels.draft')}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
