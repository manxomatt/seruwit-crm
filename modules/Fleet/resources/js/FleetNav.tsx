import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { icon: '📊', labelKey: 'fleet.nav.dashboard', fallbackLabel: 'Dashboard', route: 'fleet.dashboard', pattern: 'fleet.dashboard' },
    { icon: '🏢', labelKey: 'fleet.nav.bases', fallbackLabel: 'Fleet Bases', route: 'fleet.bases.index', pattern: 'fleet.bases.*' },
    { icon: '🚗', labelKey: 'fleet.nav.vehicles', fallbackLabel: 'Vehicles', route: 'fleet.vehicles.index', pattern: 'fleet.vehicles.*' },
    { icon: '👨‍✈️', labelKey: 'fleet.nav.drivers', fallbackLabel: 'Drivers', route: 'fleet.drivers.index', pattern: 'fleet.drivers.*' },
    { icon: '⛽', labelKey: 'fleet.nav.fuel', fallbackLabel: 'Fuel Logs', route: 'fleet.fuel.index', pattern: 'fleet.fuel.index' },
    { icon: '📈', labelKey: 'fleet.nav.analytics', fallbackLabel: 'Analytics', route: 'fleet.fuel.analytics', pattern: 'fleet.fuel.analytics' },
] as const;

export default function FleetNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 shadow-sm overflow-x-auto">
            <nav className="flex items-center gap-1.5 min-w-max">
                {TABS.map((tab) => {
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
