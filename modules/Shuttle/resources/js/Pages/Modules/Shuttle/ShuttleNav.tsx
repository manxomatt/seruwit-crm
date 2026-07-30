import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    {
        key: 'dashboard',
        labelKey: 'shuttle.nav.dashboard',
        route: 'shuttle.dashboard',
        patterns: ['shuttle.dashboard'],
    },
    {
        key: 'corridors',
        labelKey: 'shuttle.nav.corridors',
        route: 'shuttle.corridors.index',
        patterns: ['shuttle.corridors.*'],
    },
    {
        key: 'schedules',
        labelKey: 'shuttle.nav.schedules',
        route: 'shuttle.schedules.index',
        patterns: ['shuttle.schedules.*'],
    },
    {
        key: 'departures',
        labelKey: 'shuttle.nav.departures',
        route: 'shuttle.departures.index',
        patterns: ['shuttle.departures.*'],
    },
    {
        key: 'bookings',
        labelKey: 'shuttle.nav.bookings',
        route: 'shuttle.bookings.index',
        patterns: ['shuttle.bookings.*'],
    },
] as const;

export default function ShuttleNav({ active }: { active?: (typeof TABS)[number]['key'] }) {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6 overflow-x-auto">
                {TABS.map((tab) => {
                    const isActive = active
                        ? active === tab.key
                        : tab.patterns.some((pattern) => isCurrentRoute(pattern));

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                                isActive
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
