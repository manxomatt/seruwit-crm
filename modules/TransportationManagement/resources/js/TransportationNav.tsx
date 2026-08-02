import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'transportation.nav.dashboard', route: 'transportation.dashboard', pattern: 'transportation.dashboard' },
    { labelKey: 'transportation.nav.trips', route: 'transportation.trips.index', pattern: 'transportation.trips.*' },
    { labelKey: 'transportation.nav.schedules', route: 'transportation.schedules.index', pattern: 'transportation.schedules.*' },
    { labelKey: 'transportation.nav.calendar', route: 'transportation.calendar.index', pattern: 'transportation.calendar.*' },
    { labelKey: 'transportation.nav.reports', route: 'transportation.reports.index', pattern: 'transportation.reports.*' },
] as const;

export default function TransportationNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
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
