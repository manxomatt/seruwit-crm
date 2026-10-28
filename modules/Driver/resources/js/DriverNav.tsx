import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link, usePage } from '@inertiajs/react';

interface TabItem {
    labelKey: string;
    fallbackLabel: string;
    route: string;
    pattern: string;
    icon: string;
}

const TABS: Array<TabItem> = [
    {
        labelKey: 'driver.nav.list',
        fallbackLabel: 'Daftar Pengemudi',
        route: 'drivers.index',
        pattern: 'drivers.*',
        icon: '👨‍✈️',
    },
];

export default function DriverNav(): JSX.Element {
    const { routePrefix, prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    const resolveRouteName = (baseRoute: string): string => {
        const standard = `${routePrefix}.${baseRoute}`;
        if (route().has(standard) || route().has(`central.${standard}`)) {
            return baseRoute;
        }

        // Fallback for fleet.drivers.*
        if (baseRoute === 'drivers.index') {
            return 'fleet.drivers.index';
        }

        return baseRoute;
    };

    return (
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <nav className="flex items-center gap-2">
                {TABS.map((tab) => {
                    const resolvedRoute = resolveRouteName(tab.route);
                    const active = isCurrentRoute(tab.pattern) || isCurrentRoute('fleet.drivers.*');

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(resolvedRoute)}
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
