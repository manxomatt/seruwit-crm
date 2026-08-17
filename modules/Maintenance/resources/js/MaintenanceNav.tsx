import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { icon: '📊', labelKey: 'maintenance.nav.dashboard', fallbackLabel: 'Dashboard', route: 'maintenance.index', pattern: 'maintenance.index' },
    { icon: '🛠️', labelKey: 'maintenance.nav.wip', fallbackLabel: 'WIP Board', route: 'maintenance.wip.index', pattern: 'maintenance.wip.*' },
    { icon: '📅', labelKey: 'maintenance.nav.calendar', fallbackLabel: 'Bay Calendar', route: 'maintenance.calendar.index', pattern: 'maintenance.calendar.*' },
    { icon: '📋', labelKey: 'maintenance.nav.work_orders', fallbackLabel: 'Work Orders', route: 'maintenance.work-orders.index', pattern: 'maintenance.work-orders.*' },
    { icon: '🏗️', labelKey: 'maintenance.nav.bays', fallbackLabel: 'Bays', route: 'maintenance.bays.index', pattern: 'maintenance.bays.*' },
    { icon: '⏱️', labelKey: 'maintenance.nav.schedules', fallbackLabel: 'PM Schedules', route: 'maintenance.schedules.index', pattern: 'maintenance.schedules.*' },
    { icon: '🏷️', labelKey: 'maintenance.nav.categories', fallbackLabel: 'Categories', route: 'maintenance.categories.index', pattern: 'maintenance.categories.*' },
    { icon: '📈', labelKey: 'maintenance.nav.analytics', fallbackLabel: 'Analytics', route: 'maintenance.analytics.index', pattern: 'maintenance.analytics.*' },
    { icon: '⚙️', labelKey: 'maintenance.nav.settings', fallbackLabel: 'Settings', route: 'maintenance.settings.edit', pattern: 'maintenance.settings.*' },
] as const;

export default function MaintenanceNav(): JSX.Element {
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
