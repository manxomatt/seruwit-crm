import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Stats {
    posts?: { total: number; published: number; draft: number };
    pages?: { total: number; published: number; draft: number };
    media: { total: number; images: number; documents: number };
    carousels?: { total: number; active: number };
}

interface TripStats {
    active: number;
    previous_active: number;
    period: { total: number; completed: number };
}

interface OrderStats {
    by_status: Record<string, number>;
    total: number;
    period_total: number;
    previous_period_total: number;
}

interface FleetStats {
    vehicles: Record<string, number>;
    vehicles_total: number;
    drivers: Record<string, number>;
    drivers_total: number;
    fuel: { liters: number; cost: number };
}

interface InvoiceStatusDetail {
    count: number;
    amount: number;
}

interface InvoiceStats {
    by_status: Record<string, InvoiceStatusDetail>;
    overdue: { count: number; amount: number };
}

interface RevenuePoint {
    month: string;
    amount: number;
}

interface TopPartner {
    name: string;
    revenue: number;
}

interface Logistics {
    trips?: TripStats;
    orders?: OrderStats;
    fleet?: FleetStats;
    partners?: { total: number; customers: number; suppliers: number };
    invoices?: InvoiceStats;
    revenue?: RevenuePoint[];
    top_partners?: TopPartner[];
}

interface Alert {
    type: string;
    severity: 'danger' | 'warning' | 'info';
    message: string;
    count: number;
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

interface Props {
    user: { name: string; email: string; roles: string[] };
    primaryRole: { name: string; slug: string } | null;
    stats: Stats;
    logistics: Logistics;
    alerts: Alert[];
    recentActivity: Activity[];
    recentPosts: Post[];
    recentPages: Page[];
    period: string;
}

function formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `Rp ${Math.round(value / 1_000_000_000)}M`;
    if (value >= 1_000_000) return `Rp ${Math.round(value / 1_000_000)}jt`;
    if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}rb`;
    return `Rp ${value}`;
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return new Date(iso).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
}

function deltaLabel(current: number, previous: number, periodLabel: string): { text: string; direction: 'up' | 'down' | 'neutral' } {
    const diff = current - previous;
    if (diff === 0) return { text: `Sama dengan ${periodLabel}`, direction: 'neutral' };
    const sign = diff > 0 ? '+' : '';
    return {
        text: `${sign}${diff} dari ${periodLabel}`,
        direction: diff > 0 ? 'up' : 'down',
    };
}

const PERIOD_OPTIONS = [
    { key: 'today', label: 'Hari ini', deltaLabel: 'kemarin' },
    { key: 'week', label: 'Minggu ini', deltaLabel: 'minggu lalu' },
    { key: 'month', label: 'Bulan ini', deltaLabel: 'bulan lalu' },
] as const;

const ORDER_STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-400',
    confirmed: 'bg-blue-500',
    assigned: 'bg-indigo-500',
    in_transit: 'bg-amber-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    assigned: 'Assigned',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const VEHICLE_STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-500',
    maintenance: 'bg-amber-500',
    inactive: 'bg-gray-400',
};

const VEHICLE_STATUS_LABELS: Record<string, string> = {
    active: 'Aktif',
    maintenance: 'Maintenance',
    inactive: 'Nonaktif',
};

const ALERT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
    danger: { bg: 'bg-red-50 ring-red-200', text: 'text-red-800', icon: 'text-red-600' },
    warning: { bg: 'bg-amber-50 ring-amber-200', text: 'text-amber-800', icon: 'text-amber-600' },
    info: { bg: 'bg-blue-50 ring-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
};

const ALERT_ICONS: Record<string, JSX.Element> = {
    danger: (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    ),
    warning: (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    info: (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.115A1.61 1.61 0 015 10.654V6.69a1.61 1.61 0 011.036-1.401l5.384-3.115a1.61 1.61 0 011.16 0l5.384 3.115A1.61 1.61 0 0119 6.69v3.965a1.61 1.61 0 01-1.036 1.401l-5.384 3.115a1.61 1.61 0 01-1.16 0z" />
        </svg>
    ),
};

const ACTIVITY_ICONS: Record<string, { bg: string; color: string; svg: JSX.Element }> = {
    order: {
        bg: 'bg-green-100',
        color: 'text-green-600',
        svg: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function KpiCard({ label, value, icon, delta }: {
    label: string;
    value: string | number;
    icon: JSX.Element;
    delta?: { text: string; direction: 'up' | 'down' | 'neutral' };
}): JSX.Element {
    const dirColors = { up: 'text-green-600', down: 'text-red-600', neutral: 'text-gray-500' };
    return (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                {icon}
                <span>{label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{value}</div>
            {delta && <div className={`mt-1 text-xs tabular-nums ${dirColors[delta.direction]}`}>{delta.text}</div>}
        </div>
    );
}

function StatusBar({ items, total }: { items: { key: string; count: number; color: string; label: string }[]; total: number }): JSX.Element {
    return (
        <div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-gray-100">
                {items.map((item) => (
                    item.count > 0 && (
                        <span
                            key={item.key}
                            className={`block rounded-full ${item.color}`}
                            style={{ width: `${(item.count / total) * 100}%` }}
                        />
                    )
                ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {items.map((item) => (
                    <span key={item.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className={`inline-block h-2 w-2 rounded-sm ${item.color}`} />
                        {item.label} {item.count}
                    </span>
                ))}
            </div>
        </div>
    );
}

function SectionCard({ title, action, children }: { title: string; action?: { label: string; href: string }; children: React.ReactNode }): JSX.Element {
    return (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {action && (
                    <Link href={action.href} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                        {action.label} &rarr;
                    </Link>
                )}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function Dashboard({ user, primaryRole, stats, logistics, alerts, recentActivity, recentPosts, recentPages, period }: Props): JSX.Element {
    const { auth } = usePage().props as any;
    const permissions = auth.user?.permissions || {};
    const permissionModules = Object.keys(permissions);

    const hasLogistics = !!(logistics.trips || logistics.orders || logistics.fleet || logistics.invoices);
    const currentPeriod = PERIOD_OPTIONS.find((p) => p.key === period) ?? PERIOD_OPTIONS[1];

    const [activeContentTab, setActiveContentTab] = useState<'posts' | 'pages'>('posts');

    const changePeriod = (key: string) => {
        router.get(route('module.dashboard'), { period: key }, { preserveState: true, preserveScroll: true });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 18) return 'Selamat Siang';
        return 'Selamat Malam';
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {primaryRole ? `Dashboard ${primaryRole.name}` : 'Dashboard'}
                    </h2>
                    {hasLogistics && (
                        <div className="flex rounded-lg bg-gray-100 p-0.5">
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => changePeriod(opt.key)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        period === opt.key
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            }
        >
            <Head title={primaryRole ? `Dashboard ${primaryRole.name}` : 'Dashboard'} />

            <div className="space-y-6">
                {/* Welcome banner */}
                <div className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-white">
                    <p className="text-sm text-white/60">{getGreeting()}</p>
                    <h1 className="mt-1 text-xl font-bold">{user.name}</h1>
                    {primaryRole && (
                        <p className="mt-0.5 text-sm text-white/70">
                            {primaryRole.name} &middot; {user.roles.join(', ')}
                        </p>
                    )}
                </div>

                {/* === LOGISTICS SECTION === */}
                {hasLogistics && (
                    <>
                        {/* KPI cards */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {logistics.trips && (
                                <KpiCard
                                    label="Trip aktif"
                                    value={logistics.trips.active}
                                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 00-.879-2.121l-2.122-2.121A3 3 0 0016.5 8.25H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v7.875" /></svg>}
                                    delta={deltaLabel(logistics.trips.active, logistics.trips.previous_active, currentPeriod.deltaLabel)}
                                />
                            )}
                            {logistics.orders && (
                                <KpiCard
                                    label="Delivery order"
                                    value={logistics.orders.period_total}
                                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>}
                                    delta={deltaLabel(logistics.orders.period_total, logistics.orders.previous_period_total, currentPeriod.deltaLabel)}
                                />
                            )}
                            {logistics.invoices && (() => {
                                const paid = logistics.invoices.by_status?.paid;
                                const paidAmount = paid?.amount ?? 0;
                                return (
                                    <KpiCard
                                        label="Revenue"
                                        value={formatCurrency(paidAmount)}
                                        icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    />
                                );
                            })()}
                            {logistics.invoices && (
                                <KpiCard
                                    label="Outstanding"
                                    value={formatCurrency(logistics.invoices.by_status?.issued?.amount ?? 0)}
                                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
                                    delta={logistics.invoices.overdue.count > 0
                                        ? { text: `${logistics.invoices.overdue.count} overdue`, direction: 'down' }
                                        : undefined}
                                />
                            )}
                        </div>

                        {/* Row: orders status + alerts */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {logistics.orders && (
                                <SectionCard
                                    title="Status delivery order"
                                    action={{ label: 'Lihat semua', href: route('module.orders.index') }}
                                >
                                    <StatusBar
                                        total={logistics.orders.total || 1}
                                        items={Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => ({
                                            key,
                                            count: logistics.orders!.by_status[key] ?? 0,
                                            color: ORDER_STATUS_COLORS[key],
                                            label,
                                        }))}
                                    />
                                </SectionCard>
                            )}

                            {alerts.length > 0 && (
                                <SectionCard title="Peringatan">
                                    <div className="flex flex-col gap-2">
                                        {alerts.map((alert) => {
                                            const style = ALERT_STYLES[alert.severity] ?? ALERT_STYLES.info;
                                            return (
                                                <div
                                                    key={alert.type}
                                                    className={`flex items-start gap-2.5 rounded-lg p-3 text-sm ring-1 ${style.bg} ${style.text}`}
                                                >
                                                    <span className={style.icon}>{ALERT_ICONS[alert.severity]}</span>
                                                    <span>{alert.message}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SectionCard>
                            )}
                        </div>

                        {/* Row: revenue chart + fleet */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {logistics.revenue && logistics.revenue.length > 0 && (
                                <SectionCard title="Revenue bulanan">
                                    <RevenueChart data={logistics.revenue} />
                                </SectionCard>
                            )}

                            {logistics.fleet && (
                                <SectionCard
                                    title="Fleet"
                                    action={{ label: 'Kelola', href: route('module.fleet.vehicles.index') }}
                                >
                                    <div className="grid grid-cols-2 gap-2">
                                        <MiniStat label="Kendaraan aktif" value={logistics.fleet.vehicles.active ?? 0} unit={`/ ${logistics.fleet.vehicles_total}`} />
                                        <MiniStat label="Driver tersedia" value={logistics.fleet.drivers.available ?? 0} unit={`/ ${logistics.fleet.drivers_total}`} />
                                        <MiniStat label="Dalam maintenance" value={logistics.fleet.vehicles.maintenance ?? 0} unit="kendaraan" />
                                        <MiniStat label="BBM periode ini" value={logistics.fleet.fuel.liters.toLocaleString('id-ID')} unit="liter" />
                                    </div>
                                    <div className="mt-3">
                                        <StatusBar
                                            total={logistics.fleet.vehicles_total || 1}
                                            items={Object.entries(VEHICLE_STATUS_LABELS).map(([key, label]) => ({
                                                key,
                                                count: logistics.fleet!.vehicles[key] ?? 0,
                                                color: VEHICLE_STATUS_COLORS[key],
                                                label,
                                            }))}
                                        />
                                    </div>
                                </SectionCard>
                            )}
                        </div>

                        {/* Row: top partners + activity */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {logistics.top_partners && logistics.top_partners.length > 0 && (
                                <SectionCard
                                    title="Top partner (revenue)"
                                    action={{ label: 'Semua partner', href: route('module.partners.index') }}
                                >
                                    <div className="divide-y divide-gray-100">
                                        {logistics.top_partners.map((p, i) => (
                                            <div key={i} className="flex items-center gap-3 py-2 text-sm">
                                                <span className="w-5 text-center text-xs text-gray-400 tabular-nums">{i + 1}</span>
                                                <span className="flex-1 truncate text-gray-900">{p.name}</span>
                                                <span className="tabular-nums text-gray-500">{formatCurrency(p.revenue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            )}

                            {recentActivity.length > 0 && (
                                <SectionCard title="Aktivitas terbaru">
                                    <div className="divide-y divide-gray-100">
                                        {recentActivity.map((act, i) => {
                                            const iconSet = ACTIVITY_ICONS[act.type] ?? ACTIVITY_ICONS.order;
                                            return (
                                                <div key={i} className="flex items-start gap-3 py-2.5">
                                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconSet.bg} ${iconSet.color}`}>
                                                        {iconSet.svg}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm text-gray-900">{act.description}</p>
                                                        <p className="text-xs text-gray-400">{formatRelativeTime(act.time)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SectionCard>
                            )}
                        </div>

                        {/* Invoice summary */}
                        {logistics.invoices && (
                            <SectionCard
                                title="Invoice"
                                action={{ label: 'Kelola invoice', href: route('module.invoicing.invoices.index') }}
                            >
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <MiniStat label="Draft" value={logistics.invoices.by_status?.draft?.count ?? 0} />
                                    <MiniStat label="Issued" value={logistics.invoices.by_status?.issued?.count ?? 0} unit={formatCurrency(logistics.invoices.by_status?.issued?.amount ?? 0)} />
                                    <MiniStat label="Paid" value={logistics.invoices.by_status?.paid?.count ?? 0} unit={formatCurrency(logistics.invoices.by_status?.paid?.amount ?? 0)} />
                                    <MiniStat
                                        label="Overdue"
                                        value={logistics.invoices.overdue.count}
                                        unit={logistics.invoices.overdue.count > 0 ? formatCurrency(logistics.invoices.overdue.amount) : undefined}
                                        danger={logistics.invoices.overdue.count > 0}
                                    />
                                </div>
                            </SectionCard>
                        )}
                    </>
                )}

                {/* === CMS SECTION === */}
                {(stats.posts || stats.pages || stats.carousels) && (
                    <>
                        {hasLogistics && (
                            <div className="border-t border-gray-200 pt-2">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Konten</h3>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.posts && (
                                <Link href={route('module.posts.index')} className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md">
                                    <p className="text-sm text-gray-500">Postingan</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.posts.total}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">{stats.posts.published} terbit, {stats.posts.draft} draft</p>
                                </Link>
                            )}
                            {stats.pages && (
                                <Link href={route('module.pages.index')} className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md">
                                    <p className="text-sm text-gray-500">Halaman</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.pages.total}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">{stats.pages.published} terbit, {stats.pages.draft} draft</p>
                                </Link>
                            )}
                            <Link href={route('module.media.index')} className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md">
                                <p className="text-sm text-gray-500">Media</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{stats.media.total}</p>
                                <p className="mt-0.5 text-xs text-gray-400">{stats.media.images} gambar, {stats.media.documents} dokumen</p>
                            </Link>
                            {stats.carousels && (
                                <Link href={route('module.carousels.index')} className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md">
                                    <p className="text-sm text-gray-500">Carousel</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">{stats.carousels.total}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">{stats.carousels.active} aktif</p>
                                </Link>
                            )}
                        </div>

                        {/* Recent content */}
                        {(recentPosts.length > 0 || recentPages.length > 0) && (
                            <SectionCard title="Konten terbaru">
                                <div className="mb-3 flex gap-1">
                                    {stats.posts && (
                                        <button
                                            onClick={() => setActiveContentTab('posts')}
                                            className={`rounded-md px-3 py-1 text-xs font-medium transition ${activeContentTab === 'posts' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Postingan
                                        </button>
                                    )}
                                    {stats.pages && (
                                        <button
                                            onClick={() => setActiveContentTab('pages')}
                                            className={`rounded-md px-3 py-1 text-xs font-medium transition ${activeContentTab === 'pages' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Halaman
                                        </button>
                                    )}
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {(activeContentTab === 'posts' ? recentPosts : recentPages).map((item) => (
                                        <Link
                                            key={item.id}
                                            href={route(activeContentTab === 'posts' ? 'module.posts.edit' : 'module.pages.edit', item.id)}
                                            className="flex items-center justify-between py-2.5 text-sm hover:bg-gray-50 -mx-2 px-2 rounded"
                                        >
                                            <span className="truncate text-gray-900">{item.title}</span>
                                            <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {item.is_published ? 'Terbit' : 'Draft'}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </>
                )}

                {/* Permissions overview */}
                {permissionModules.length > 0 && (
                    <SectionCard title="Izin akses Anda">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {permissionModules.map((mod) => (
                                <div key={mod} className="rounded-lg border border-gray-200 p-3">
                                    <h4 className="text-sm font-medium capitalize text-gray-800">{mod.replace('-', ' ')}</h4>
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {permissions[mod].map((action: string) => (
                                            <span key={action} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                                                {action}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </DynamicLayout>
    );
}

function MiniStat({ label, value, unit, danger }: { label: string; value: string | number; unit?: string; danger?: boolean }): JSX.Element {
    return (
        <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className={`text-lg font-bold tabular-nums ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</span>
                {unit && <span className="text-xs text-gray-400">{unit}</span>}
            </div>
        </div>
    );
}

function RevenueChart({ data }: { data: RevenuePoint[] }): JSX.Element {
    const maxAmount = Math.max(...data.map((d) => d.amount), 1);
    return (
        <div>
            <div className="flex items-end gap-2" style={{ height: 160 }}>
                {data.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-xs tabular-nums text-gray-400">{formatCurrency(d.amount)}</span>
                        <div
                            className="w-full rounded-t bg-indigo-500 transition-all"
                            style={{ height: `${(d.amount / maxAmount) * 120}px`, minHeight: 4 }}
                        />
                        <span className="text-xs text-gray-500">{d.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
