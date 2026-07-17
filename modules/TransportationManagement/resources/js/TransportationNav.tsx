import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';

const TABS = [
    { label: 'Trips', route: 'transportation.trips.index', pattern: 'transportation.trips.*' },
    { label: 'Schedules', route: 'transportation.schedules.index', pattern: 'transportation.schedules.*' },
    { label: 'Calendar', route: 'transportation.calendar.index', pattern: 'transportation.calendar.*' },
    { label: 'Reports', route: 'transportation.reports.index', pattern: 'transportation.reports.*' },
];

export default function TransportationNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();

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
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
