import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS: Array<{ icon: string; labelKey: string; fallbackLabel: string; route: string; pattern: string }> = [
    { icon: '📊', labelKey: 'rental.nav.dashboard', fallbackLabel: 'Dashboard', route: 'rental.dashboard', pattern: 'rental.dashboard' },
    { icon: '📋', labelKey: 'rental.nav.bookings', fallbackLabel: 'Bookings', route: 'rental.index', pattern: 'rental.index' },
    { icon: '📅', labelKey: 'rental.nav.calendar', fallbackLabel: 'Calendar', route: 'rental.calendar.index', pattern: 'rental.calendar.*' },
    { icon: '🚗', labelKey: 'rental.nav.availability', fallbackLabel: 'Availability', route: 'rental.availability.index', pattern: 'rental.availability.*' },
    { icon: '💰', labelKey: 'rental.nav.rates', fallbackLabel: 'Tariff Rates', route: 'rental.rates.index', pattern: 'rental.rates.*' },
    { icon: '⚙️', labelKey: 'rental.nav.settings', fallbackLabel: 'Settings', route: 'rental.settings.index', pattern: 'rental.settings.*' },
];

export default function RentalNav(): JSX.Element {
    const { routePrefix, prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    const tabs = TABS.filter((tab) => {
        const name = `${routePrefix}.${tab.route}`;

        return route().has(name) || route().has(`central.${name}`);
    });

    return (
        <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 shadow-sm overflow-x-auto">
            <nav className="flex items-center gap-1.5 min-w-max">
                {tabs.map((tab) => {
                    const active = isCurrentRoute(tab.pattern);
                    const label = t(tab.labelKey, undefined, tab.fallbackLabel);

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                                active
                                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                        >
                            <span className="text-sm">{tab.icon}</span>
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
