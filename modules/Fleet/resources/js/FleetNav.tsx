import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link, usePage } from '@inertiajs/react';

interface TabItem {
    icon: string;
    labelKey: string;
    fallbackLabel: string;
    route: string;
    pattern: string;
    subFeatureKey?: string;
}

const TABS: Array<TabItem> = [
    { icon: '📊', labelKey: 'fleet.nav.dashboard', fallbackLabel: 'Dashboard', route: 'fleet.dashboard', pattern: 'fleet.dashboard' },
    { icon: '🏢', labelKey: 'fleet.nav.bases', fallbackLabel: 'Fleet Bases', route: 'fleet.bases.index', pattern: 'fleet.bases.*' },
    { icon: '🚗', labelKey: 'fleet.nav.vehicles', fallbackLabel: 'Vehicles', route: 'fleet.vehicles.index', pattern: 'fleet.vehicles.*' },
    { icon: '🤝', labelKey: 'fleet.nav.settlements', fallbackLabel: 'Bagi Hasil Investor', route: 'fleet.settlements.index', pattern: 'fleet.settlements.*', subFeatureKey: 'fleet-settlements' },
    { icon: '🛡️', labelKey: 'fleet.nav.compliance', fallbackLabel: 'Kepatuhan & Pajak', route: 'fleet.compliance.index', pattern: 'fleet.compliance.*', subFeatureKey: 'document-compliance' },
    { icon: '👨‍✈️', labelKey: 'fleet.nav.drivers', fallbackLabel: 'Drivers', route: 'fleet.drivers.index', pattern: 'fleet.drivers.*', subFeatureKey: 'fleet-drivers' },
    { icon: '⛽', labelKey: 'fleet.nav.fuel', fallbackLabel: 'Fuel Logs', route: 'fleet.fuel.index', pattern: 'fleet.fuel.index', subFeatureKey: 'fleet-fuel' },
    { icon: '📈', labelKey: 'fleet.nav.analytics', fallbackLabel: 'Analytics', route: 'fleet.fuel.analytics', pattern: 'fleet.fuel.analytics', subFeatureKey: 'fleet-fuel' },
];

export default function FleetNav(): JSX.Element {
    const { routePrefix, prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { disabledSubFeatures = [] } = usePage().props as {
        disabledSubFeatures?: string[];
    };

    const tabs = TABS.filter((tab) => {
        if (tab.subFeatureKey && disabledSubFeatures.includes(tab.subFeatureKey)) {
            return false;
        }

        const name = `${routePrefix}.${tab.route}`;
        const hasRoute = route().has(name) || route().has(`central.${name}`);

        return hasRoute;
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
