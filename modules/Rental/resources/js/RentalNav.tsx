import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link, usePage } from '@inertiajs/react';

interface TabItem {
    icon: string;
    labelKey: string;
    fallbackLabel: string;
    route: string;
    pattern: string;
    permissionAction?: string;
}

const TABS: Array<TabItem> = [
    { icon: '📊', labelKey: 'rental.nav.dashboard', fallbackLabel: 'Dashboard', route: 'rental.dashboard', pattern: 'rental.dashboard', permissionAction: 'view' },
    { icon: '📋', labelKey: 'rental.nav.bookings', fallbackLabel: 'Bookings', route: 'rental.index', pattern: 'rental.index', permissionAction: 'view' },
    { icon: '📅', labelKey: 'rental.nav.calendar', fallbackLabel: 'Calendar', route: 'rental.calendar.index', pattern: 'rental.calendar.*', permissionAction: 'view' },
    { icon: '🚗', labelKey: 'rental.nav.availability', fallbackLabel: 'Availability', route: 'rental.availability.index', pattern: 'rental.availability.*', permissionAction: 'view' },
    { icon: '💰', labelKey: 'rental.nav.rates', fallbackLabel: 'Tariff Rates', route: 'rental.rates.index', pattern: 'rental.rates.*', permissionAction: 'rates' },
    { icon: '⚙️', labelKey: 'rental.nav.settings', fallbackLabel: 'Settings', route: 'rental.settings.index', pattern: 'rental.settings.*', permissionAction: 'settings' },
];

export default function RentalNav(): JSX.Element {
    const { routePrefix, prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { auth } = usePage().props as {
        auth?: {
            user?: {
                is_admin?: boolean;
                permissions?: Record<string, string[]>;
            };
        };
    };

    const tabs = TABS.filter((tab) => {
        const name = `${routePrefix}.${tab.route}`;
        const hasRoute = route().has(name) || route().has(`central.${name}`);
        if (!hasRoute) {
            return false;
        }

        if (auth?.user?.is_admin) {
            return true;
        }

        if (tab.permissionAction) {
            const rentalPerms = auth?.user?.permissions?.rental || [];
            return rentalPerms.includes(tab.permissionAction);
        }

        return true;
    });

    return (
        <div className="mb-6 flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
            <nav className="flex items-center gap-1.5 overflow-x-auto">
                {tabs.map((tab) => {
                    const active = isCurrentRoute(tab.pattern);
                    const label = t(tab.labelKey, undefined, tab.fallbackLabel);

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                                active
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
