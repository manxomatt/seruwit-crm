import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'maintenance.nav.dashboard', route: 'maintenance.index', pattern: 'maintenance.index' },
    { labelKey: 'maintenance.nav.wip', route: 'maintenance.wip.index', pattern: 'maintenance.wip.*' },
    { labelKey: 'maintenance.nav.calendar', route: 'maintenance.calendar.index', pattern: 'maintenance.calendar.*' },
    { labelKey: 'maintenance.nav.work_orders', route: 'maintenance.work-orders.index', pattern: 'maintenance.work-orders.*' },
    { labelKey: 'maintenance.nav.bays', route: 'maintenance.bays.index', pattern: 'maintenance.bays.*' },
    { labelKey: 'maintenance.nav.schedules', route: 'maintenance.schedules.index', pattern: 'maintenance.schedules.*' },
    { labelKey: 'maintenance.nav.categories', route: 'maintenance.categories.index', pattern: 'maintenance.categories.*' },
    { labelKey: 'maintenance.nav.analytics', route: 'maintenance.analytics.index', pattern: 'maintenance.analytics.*' },
    { labelKey: 'maintenance.nav.settings', route: 'maintenance.settings.edit', pattern: 'maintenance.settings.*' },
] as const;

export default function MaintenanceNav(): JSX.Element {
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
                            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${active
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
