import DynamicLayout from '@/Layouts/DynamicLayout';
import DashboardOnboardingCTA, { type OnboardingOverview } from '@/Components/DashboardOnboardingCTA';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface RevenueKpi {
    value: number;
    delta: number | null;
    delta_label: string | null;
    direction: 'up' | 'down';
}

interface OutstandingKpi {
    value: number;
    overdue_count: number;
    overdue_label: string | null;
}

interface FleetUtilizationKpi {
    percent: number;
    in_use: number;
    total_active: number;
    idle_count: number;
}

interface ComplianceDetail {
    type: string;
    severity: string;
    label: string;
}

interface ComplianceKpi {
    action_count: number;
    details: ComplianceDetail[];
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

interface ModuleBreakdowns {
    shuttle?: ShuttleBreakdown;
    rental?: RentalBreakdown;
    logistics?: LogisticsBreakdown;
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
    severity: 'danger' | 'warning' | 'info';
    icon: string;
    title: string;
    message: string;
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

interface SubscriptionTierRow {
    id: number;
    name: string;
    min_vehicles: number;
    max_vehicles: number;
    price_per_vehicle: number;
}

interface SubscriptionOverview {
    subscription_type: string | null;
    vehicle_count: number;
    is_billed_quota: boolean;
    active_tier_id: number | null;
    price_per_vehicle: number | null;
    monthly_estimate: number | null;
    currency_symbol: string;
    tiers: SubscriptionTierRow[];
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
    other: 'bg-gray-400',
};

const ALERT_STYLES: Record<string, { bg: string; border: string; text: string; iconBg: string; iconColor: string; dot: string }> = {
    danger: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        dot: 'bg-red-500',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        dot: 'bg-amber-500',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        dot: 'bg-blue-500',
    },
};

const DEPARTURE_STATUS_BADGE: Record<string, string> = {
    ready: 'bg-green-100 text-green-700',
    locked: 'bg-gray-100 text-gray-700',
    optimized: 'bg-indigo-100 text-indigo-700',
    boarding: 'bg-blue-100 text-blue-700',
    in_transit: 'bg-amber-100 text-amber-700',
};

const ACTIVITY_ICONS: Record<string, { bg: string; color: string; svg: JSX.Element }> = {
    order: {
        bg: 'bg-green-100',
        color: 'text-green-600',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
        ),
    },
    trip: {
        bg: 'bg-blue-100',
        color: 'text-blue-600',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
            </svg>
        ),
    },
    rental: {
        bg: 'bg-emerald-100',
        color: 'text-emerald-600',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
            </svg>
        ),
    },
    shuttle: {
        bg: 'bg-indigo-100',
        color: 'text-indigo-600',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
            </svg>
        ),
    },
    invoice: {
        bg: 'bg-amber-100',
        color: 'text-amber-600',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
    },
    maintenance: {
        bg: 'bg-red-100',
        color: 'text-red-600',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.115A1.61 1.61 0 015 10.654V6.69a1.61 1.61 0 011.036-1.401l5.384-3.115a1.61 1.61 0 011.16 0l5.384 3.115A1.61 1.61 0 0119 6.69v3.965a1.61 1.61 0 01-1.036 1.401l-5.384 3.115a1.61 1.61 0 01-1.16 0z" />
            </svg>
        ),
    },
};

const QUICK_ACTION_ICONS: Record<string, JSX.Element> = {
    car: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
        </svg>
    ),
    ticket: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
    ),
    package: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
    ),
    'file-invoice': (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
};

// The workspace's configured currency symbol (ecommerce.currency_symbol), set
// once from props at render time so the module-level formatCurrency can prefix
// it without threading the symbol through every call site.
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

// PAYG tier prices follow the workspace's configured currency symbol
// (ecommerce.currency_symbol), not the UI locale, so the symbol is prefixed to
// a plainly-grouped number rather than using locale-based currency formatting.
function formatMoney(value: number, symbol: string, localeTag: string): string {
    return `${symbol} ${formatNumber(Math.round(value), localeTag)}`;
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
    children,
}: {
    title: string;
    subtitle?: string;
    action?: { label: string; href: string };
    children: React.ReactNode;
}): JSX.Element {
    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
                </div>
                {action && (
                    <Link
                        href={action.href}
                        className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-800"
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
}: {
    label: string;
    value: React.ReactNode;
    subValue?: React.ReactNode;
    icon: JSX.Element;
    accent?: 'emerald' | 'red' | 'indigo' | 'amber';
    footer?: React.ReactNode;
}): JSX.Element {
    const tintClasses = {
        emerald: 'from-emerald-50/80 dark:from-emerald-950/20',
        red: 'from-rose-50/80 dark:from-rose-950/20',
        indigo: 'from-indigo-50/80 dark:from-indigo-950/20',
        amber: 'from-amber-50/80 dark:from-amber-950/20',
    } as const;
    const iconClasses = {
        emerald: 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
        red: 'bg-rose-100/70 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
        indigo: 'bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
        amber: 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    } as const;
    const accentTextClasses = {
        emerald: 'text-emerald-600 dark:text-emerald-400',
        red: 'text-rose-600 dark:text-rose-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
        amber: 'text-amber-600 dark:text-amber-400',
    } as const;

    return (
        <div
            className={`group relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-br ${tintClasses[accent]} to-white to-60% dark:to-slate-900 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
                    <div className="mt-2.5 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
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
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClasses[accent]} transition-transform duration-300 group-hover:scale-105`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function MiniStat({
    label,
    value,
    unit,
    subLabel,
    danger,
}: {
    label: string;
    value: string | number;
    unit?: string;
    subLabel?: string;
    danger?: boolean;
}): JSX.Element {
    return (
        <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs font-medium text-gray-500">{label}</div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className={`text-xl font-bold tabular-nums ${danger ? 'text-red-600' : 'text-gray-900'}`}>
                    {value}
                </span>
                {unit && <span className="text-xs text-gray-400">{unit}</span>}
            </div>
            {subLabel && <div className="mt-1 text-xs text-gray-400">{subLabel}</div>}
        </div>
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
}: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    dashboardCurrencySymbol = currencySymbol;
    const [activeContentTab, setActiveContentTab] = useState<'posts' | 'pages'>('posts');

    const hasKpis = !!(kpis.revenue || kpis.outstanding || kpis.fleet_utilization || kpis.compliance);
    const hasFinance = !!(finance.revenue_by_line || finance.invoices);
    const hasFleetGlobal = Object.keys(fleetGlobal).length > 0;
    const hasCms = !!(stats.posts || stats.pages || stats.carousels);
    const hasModulesData = !!(modules.shuttle || modules.rental || modules.logistics);
    const showAttention = alerts.length > 0 || quickActions.length > 0;

    const changePeriod = (key: string) => {
        router.get(route('module.dashboard'), { period: key }, { preserveState: true, preserveScroll: true });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('dashboard.greeting.morning');
        if (hour < 18) return t('dashboard.greeting.afternoon');
        return t('dashboard.greeting.evening');
    };

    const dashboardTitle = primaryRole
        ? t('dashboard.title_with_role', { role: primaryRole.name })
        : t('dashboard.title');

    return (
        <DynamicLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{dashboardTitle}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 p-1 ring-1 ring-gray-200">
                            <div className="pl-2 text-xs font-medium text-gray-500">
                                {t('dashboard.filters.period')}
                            </div>
                            {filters.periods.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => changePeriod(opt.key)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${period === opt.key
                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-600 hover:text-gray-900'
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
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 py-8 text-white shadow-lg">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/60">{getGreeting()}</p>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight">{user.name}</h1>
                            {primaryRole && (
                                <p className="mt-1.5 text-sm text-white/70">
                                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium ring-1 ring-white/20">
                                        {primaryRole.name}
                                    </span>
                                    <span className="ml-2">&middot; {user.roles.join(', ')}</span>
                                </p>
                            )}
                        </div>
                        {quickActions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {quickActions.map((qa) => (
                                    qa.route ? (
                                        <Link
                                            key={qa.key}
                                            href={qa.route}
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-white/90 hover:shadow-md active:scale-[0.98]"
                                        >
                                            <span className="text-indigo-600">
                                                {QUICK_ACTION_ICONS[qa.icon] ?? QUICK_ACTION_ICONS.package}
                                            </span>
                                            {qa.label}
                                        </Link>
                                    ) : (
                                        <span
                                            key={qa.key}
                                            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white/70"
                                        >
                                            <span>{QUICK_ACTION_ICONS[qa.icon] ?? QUICK_ACTION_ICONS.package}</span>
                                            {qa.label}
                                        </span>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DashboardOnboardingCTA onboarding={onboarding} />

                {hasKpis && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {kpis.revenue && (
                            <KpiCard
                                label={t('dashboard.kpi.revenue')}
                                value={formatCurrency(kpis.revenue.value, localeTag)}
                                accent="emerald"
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
                                subValue={kpis.outstanding.overdue_count > 0
                                    ? <span className="font-semibold text-rose-600 dark:text-rose-400">{kpis.outstanding.overdue_label}</span>
                                    : undefined}
                                accent="red"
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                }
                            />
                        )}
                        {kpis.fleet_utilization && (
                            <KpiCard
                                label={t('dashboard.kpi.fleet_utilization')}
                                value={`${kpis.fleet_utilization.percent}%`}
                                subValue={
                                    <>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                            {kpis.fleet_utilization.in_use}/{kpis.fleet_utilization.total_active}
                                        </span>
                                        <span>{t('dashboard.kpi.unit_in_use', {
                                            in_use: kpis.fleet_utilization.in_use,
                                            total_active: kpis.fleet_utilization.total_active,
                                        })}</span>
                                    </>
                                }
                                accent="indigo"
                                footer={
                                    <span>{t('dashboard.kpi.idle_ready', { count: kpis.fleet_utilization.idle_count })}</span>
                                }
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" />
                                    </svg>
                                }
                            />
                        )}
                        {kpis.compliance && (
                            <KpiCard
                                label={t('dashboard.kpi.compliance')}
                                value={kpis.compliance.action_count}
                                subValue={
                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                        {t('dashboard.kpi.action_needed', { count: kpis.compliance.action_count })}
                                    </span>
                                }
                                accent="amber"
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                    </svg>
                                }
                            />
                        )}
                    </div>
                )}

                {hasFinance && (
                    <SectionCard
                        title={t('dashboard.sections.finance_invoice')}
                        subtitle={t('dashboard.sections.revenue_per_line') + ' & ' + t('dashboard.sections.invoice_status')}
                    >
                        <div className="grid gap-8 lg:grid-cols-5">
                            {finance.revenue_by_line && finance.revenue_by_line.length > 0 && (
                                <div className="space-y-4 lg:col-span-3">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        {t('dashboard.sections.revenue_per_line')}
                                    </h4>
                                    <div className="space-y-4">
                                        {finance.revenue_by_line.map((line) => (
                                            <div key={line.key}>
                                                <div className="mb-1.5 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${LINE_COLORS[line.key] ?? 'bg-gray-500'}`} />
                                                        <span className="font-medium text-gray-700">{line.label}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-bold tabular-nums text-gray-900">
                                                            {formatCurrency(line.amount, localeTag)}
                                                        </span>
                                                        <span className="text-xs font-semibold tabular-nums text-gray-500">
                                                            {line.percent}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className={`h-full rounded-full ${LINE_COLORS[line.key] ?? 'bg-gray-500'} transition-all`}
                                                        style={{ width: `${Math.max(line.percent, 0)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {finance.revenue_chart && finance.revenue_chart.length > 0 && (
                                        <div className="mt-6 border-t border-gray-100 pt-6">
                                            <div className="mb-3 flex items-end gap-2" style={{ height: 140 }}>
                                                {finance.revenue_chart.map((d, i) => {
                                                    const maxAmount = Math.max(...finance.revenue_chart!.map((x) => x.amount), 1);
                                                    const height = (d.amount / maxAmount) * 110;
                                                    return (
                                                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                                                            <div className="text-[10px] font-medium tabular-nums text-gray-500">
                                                                {formatCurrency(d.amount, localeTag).replace(/[A-Za-z$.,\s]/g, '').length > 4
                                                                    ? Math.round(d.amount / 1_000_000) + 'M'
                                                                    : formatCurrency(d.amount, localeTag).replace(/Rp|\.|USD|\$/g, '').slice(0, 5)}
                                                            </div>
                                                            <div
                                                                className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all hover:from-indigo-600 hover:to-indigo-500"
                                                                style={{ height: `${Math.max(height, 4)}px` }}
                                                            />
                                                            <div className="text-[11px] font-medium text-gray-600">{d.month}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {finance.invoices && (
                                <div className="lg:col-span-2">
                                    <h4 className="mb-4 text-sm font-semibold text-gray-900">
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
                                        />
                                        <MiniStat
                                            label={t('dashboard.invoice_status_summary.paid')}
                                            value={finance.invoices.paid}
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

                {hasModulesData && (
                    <div className="grid gap-6 xl:grid-cols-3">
                        {modules.shuttle && (
                            <SectionCard
                                title={t('dashboard.sections.shuttle_ops')}
                                action={routeExists('module.shuttle.departures.index')
                                    ? { label: t('dashboard.actions.view_all'), href: route(resolveNamedRoute('module.shuttle.departures.index')) }
                                    : undefined}
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
                                    />
                                </div>
                                {modules.shuttle.upcoming_departures.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            {t('dashboard.sections.upcoming_departures')}
                                        </div>
                                        <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
                                            {modules.shuttle.upcoming_departures.map((dep) => (
                                                <div key={dep.id} className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold tabular-nums text-indigo-700 ring-1 ring-indigo-100">
                                                            {dep.time}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm font-semibold text-gray-900">
                                                                {dep.route}
                                                            </div>
                                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                                                </svg>
                                                                <span className="tabular-nums">
                                                                    {dep.seats_booked}/{dep.seats_total} {t('dashboard.shuttle.seat_unit')}
                                                                </span>
                                                                {!dep.has_driver && (
                                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                                                        ! No Driver
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${DEPARTURE_STATUS_BADGE[dep.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                        {t(`dashboard.departure_status.${dep.status}`, { defaultValue: dep.status })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </SectionCard>
                        )}

                        {modules.rental && (
                            <SectionCard
                                title={t('dashboard.sections.rental')}
                                subtitle={t('dashboard.sections.rental_status')}
                                action={routeExists('module.rental.index')
                                    ? { label: t('dashboard.actions.manage'), href: route(resolveNamedRoute('module.rental.index')) }
                                    : undefined}
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    <MiniStat
                                        label={t('dashboard.rental_unit.currently_rented')}
                                        value={modules.rental.currently_rented}
                                        unit={t('dashboard.rental_unit.unit_vehicles')}
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
                                        { label: t('dashboard.rental_unit.overdue'), count: modules.rental.overdue_count, color: 'bg-red-500' },
                                    ].map((item) => {
                                        const total = modules.rental!.currently_rented + modules.rental!.idle_ready + modules.rental!.overdue_count;
                                        return (
                                            <div key={item.label}>
                                                <div className="mb-1 flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                                        <span className="font-medium text-gray-600">{item.label}</span>
                                                    </span>
                                                    <span className="font-semibold tabular-nums text-gray-900">{item.count}</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className={`h-full rounded-full ${item.color}`}
                                                        style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </SectionCard>
                        )}

                        {modules.logistics && (
                            <SectionCard
                                title={t('dashboard.sections.logistics')}
                                subtitle={t('dashboard.sections.logistics_status')}
                                action={routeExists('module.orders.index')
                                    ? { label: t('dashboard.actions.view_all'), href: route(resolveNamedRoute('module.orders.index')) }
                                    : undefined}
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
                                    />
                                    <MiniStat
                                        label={t('dashboard.logistics_unit.delivered_pod')}
                                        value={modules.logistics.delivered_pod}
                                        unit={t('dashboard.logistics_unit.unit_shipments')}
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
                                                        <span className="font-medium text-gray-600">{item.label}</span>
                                                    </span>
                                                    <span className="font-semibold tabular-nums text-gray-900">{item.count}</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className={`h-full rounded-full ${item.color}`}
                                                        style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </SectionCard>
                        )}
                    </div>
                )}

                {hasFleetGlobal && (
                    <SectionCard
                        title={t('dashboard.sections.fleet_global')}
                        action={routeExists('module.fleet.vehicles.index')
                            ? { label: t('dashboard.actions.manage'), href: route(resolveNamedRoute('module.fleet.vehicles.index')) }
                            : undefined}
                    >
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            <MiniStat
                                label={t('dashboard.fleet_global.active')}
                                value={fleetGlobal.vehicles_active}
                                unit={t('dashboard.fleet_global.unit_vehicles')}
                                subLabel=""
                            />
                            <MiniStat
                                label={t('dashboard.fleet_global.maintenance')}
                                value={fleetGlobal.vehicles_maintenance}
                                unit={t('dashboard.fleet_global.unit_vehicles')}
                            />
                            <MiniStat
                                label={t('dashboard.fleet_global.drivers_ready')}
                                value={fleetGlobal.drivers_ready}
                                unit={t('dashboard.fleet_global.unit_people')}
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

                {showAttention && (
                    <div className="grid gap-6 lg:grid-cols-5">
                        {alerts.length > 0 && (
                            <div className="lg:col-span-3">
                                <SectionCard
                                    title={t('dashboard.sections.operational_alerts')}
                                    subtitle={`${alerts.length} ${t('dashboard.kpi.action_needed', { count: alerts.length }).toLowerCase()}`}
                                >
                                    <div className="space-y-3">
                                        {alerts.map((alert, i) => {
                                            const style = ALERT_STYLES[alert.severity] ?? ALERT_STYLES.info;
                                            return (
                                                <div
                                                    key={`${alert.module}-${i}`}
                                                    className={`flex items-start gap-4 rounded-xl border ${style.border} ${style.bg} p-4 transition-all hover:shadow-sm`}
                                                >
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconColor}`}>
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className={`text-sm font-semibold ${style.text}`}>
                                                            {alert.title}
                                                        </div>
                                                        <div className="mt-0.5 text-sm text-gray-700/90">
                                                            {alert.message}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {recentActivity.length > 0 && (
                            <div className="lg:col-span-2">
                                <SectionCard title={t('dashboard.sections.recent_activity')}>
                                    <div className="max-h-[400px] space-y-0.5 overflow-y-auto -mx-2">
                                        {recentActivity.map((act, i) => {
                                            const iconSet = ACTIVITY_ICONS[act.type] ?? ACTIVITY_ICONS.order;
                                            return (
                                                <div key={i} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-gray-50">
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconSet.bg} ${iconSet.color}`}>
                                                        {iconSet.svg}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm text-gray-900 leading-snug">{act.description}</p>
                                                        <p className="mt-0.5 text-xs text-gray-400 tabular-nums">
                                                            {formatRelativeTime(act.time, t, localeTag)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SectionCard>
                            </div>
                        )}
                    </div>
                )}

                {hasCms && (
                    <div className="space-y-6">
                        <div className="border-t border-gray-200 pt-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                {t('dashboard.sections.content')}
                            </h3>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.posts && (
                                <Link
                                    href={route('module.posts.index')}
                                    className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <p className="text-sm text-gray-500">{t('dashboard.content_stats.posts')}</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{stats.posts.total}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">
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
                                    className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <p className="text-sm text-gray-500">{t('dashboard.content_stats.pages')}</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{stats.pages.total}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {t('dashboard.content_stats.published_draft', {
                                            published: stats.pages.published,
                                            draft: stats.pages.draft,
                                        })}
                                    </p>
                                </Link>
                            )}
                            <Link
                                href={route('module.media.index')}
                                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <p className="text-sm text-gray-500">{t('dashboard.content_stats.media')}</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{stats.media.total}</p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    {t('dashboard.content_stats.media_detail', {
                                        images: stats.media.images,
                                        documents: stats.media.documents,
                                    })}
                                </p>
                            </Link>
                            {stats.carousels && (
                                <Link
                                    href={route('module.carousels.index')}
                                    className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <p className="text-sm text-gray-500">{t('dashboard.content_stats.carousels')}</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{stats.carousels.total}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {t('dashboard.content_stats.active_count', { count: stats.carousels.active })}
                                    </p>
                                </Link>
                            )}
                        </div>

                        {subscription && subscription.tiers.length > 0 && (
                            <SectionCard
                                title={t('dashboard.subscription.title')}
                                subtitle={t('dashboard.subscription.subtitle')}
                            >
                                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:ring-indigo-900">
                                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                                            {t('dashboard.subscription.current_tier')}
                                        </p>
                                        <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                                            {subscription.tiers.find((ti) => ti.id === subscription.active_tier_id)?.name
                                                ?? t('dashboard.subscription.no_tier')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {t('dashboard.subscription.per_vehicle')}
                                        </p>
                                        <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">
                                            {subscription.price_per_vehicle != null
                                                ? formatMoney(subscription.price_per_vehicle, subscription.currency_symbol, localeTag)
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {t('dashboard.subscription.monthly_estimate')}
                                        </p>
                                        <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">
                                            {subscription.monthly_estimate != null
                                                ? formatMoney(subscription.monthly_estimate, subscription.currency_symbol, localeTag)
                                                : '—'}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            {formatNumber(subscription.vehicle_count, localeTag)} {t('dashboard.subscription.vehicles')}
                                            {' · '}
                                            {subscription.is_billed_quota
                                                ? t('dashboard.subscription.billed_quota_note')
                                                : t('dashboard.subscription.projected_note')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {subscription.tiers.map((tier) => {
                                        const active = tier.id === subscription.active_tier_id;
                                        return (
                                            <div
                                                key={tier.id}
                                                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${active
                                                    ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500/30 dark:bg-indigo-950/30'
                                                    : 'border-slate-200 dark:border-slate-700'
                                                    }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                                                        {tier.name}
                                                        {active && (
                                                            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                                {t('dashboard.subscription.your_tier')}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatNumber(tier.min_vehicles, localeTag)}–
                                                        {tier.max_vehicles >= 100000
                                                            ? t('dashboard.subscription.unlimited')
                                                            : formatNumber(tier.max_vehicles, localeTag)}{' '}
                                                        {t('dashboard.subscription.vehicles')}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">
                                                    {formatMoney(tier.price_per_vehicle, subscription.currency_symbol, localeTag)}
                                                    <span className="text-xs font-normal text-slate-400">
                                                        {t('dashboard.subscription.per_vehicle')}
                                                    </span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </SectionCard>
                        )}

                        {(recentPosts.length > 0 || recentPages.length > 0) && (
                            <SectionCard title={t('dashboard.sections.recent_content')}>
                                <div className="mb-4 inline-flex items-center gap-1 rounded-xl bg-gray-50 p-1 ring-1 ring-gray-200">
                                    {stats.posts && (
                                        <button
                                            onClick={() => setActiveContentTab('posts')}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeContentTab === 'posts'
                                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                                : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            {t('dashboard.content_tabs.posts')}
                                        </button>
                                    )}
                                    {stats.pages && (
                                        <button
                                            onClick={() => setActiveContentTab('pages')}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeContentTab === 'pages'
                                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                                : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                        >
                                            {t('dashboard.content_tabs.pages')}
                                        </button>
                                    )}
                                </div>
                                <div className="divide-y divide-gray-100 -mx-2">
                                    {(activeContentTab === 'posts' ? recentPosts : recentPages).map((item) => (
                                        <Link
                                            key={item.id}
                                            href={route(
                                                activeContentTab === 'posts' ? 'module.posts.edit' : 'module.pages.edit',
                                                item.id,
                                            )}
                                            className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-gray-50"
                                        >
                                            <span className="truncate text-sm font-medium text-gray-900">
                                                {item.title}
                                            </span>
                                            <span
                                                className={`ml-2 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_published
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
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
