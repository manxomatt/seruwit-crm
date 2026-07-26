import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'fleet.nav.dashboard', route: 'fleet.dashboard', pattern: 'fleet.dashboard' },
    { labelKey: 'fleet.nav.vehicles', route: 'fleet.vehicles.index', pattern: 'fleet.vehicles.*' },
    { labelKey: 'fleet.nav.drivers', route: 'fleet.drivers.index', pattern: 'fleet.drivers.*' },
    { labelKey: 'fleet.nav.fuel', route: 'fleet.fuel.index', pattern: 'fleet.fuel.index' },
    { labelKey: 'fleet.nav.analytics', route: 'fleet.fuel.analytics', pattern: 'fleet.fuel.analytics' },
] as const;

export default function FleetNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6 overflow-x-auto">
                {TABS.map((tab) => {
                    const active = isCurrentRoute(tab.pattern);
                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                                active
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            {t(tab.labelKey)}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
