import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link, usePage } from '@inertiajs/react';

interface TabItem {
    labelKey: string;
    fallbackLabel: string;
    route: string;
    pattern: string;
    icon: string;
    subFeatureKey?: string;
}

const TABS: Array<TabItem> = [
    { labelKey: 'fleet.nav.drivers', fallbackLabel: 'Daftar Pengemudi', route: 'fleet.drivers.index', pattern: 'fleet.drivers.*', icon: '👨‍✈️', subFeatureKey: 'fleet-drivers' },
];

export default function DriverNav(): JSX.Element {
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

        return route().has(name) || route().has(`central.${name}`);
    });

    return (
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <nav className="flex items-center gap-2">
                {tabs.map((tab) => {
                    const active = isCurrentRoute(tab.pattern);

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                active
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{t(tab.labelKey, undefined, tab.fallbackLabel)}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
