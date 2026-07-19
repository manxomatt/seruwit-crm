import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';

const TABS = [
    { label: 'Dashboard', route: 'maintenance.index', pattern: 'maintenance.index' },
    { label: 'Work Orders', route: 'maintenance.work-orders.index', pattern: 'maintenance.work-orders.*' },
    { label: 'Jadwal', route: 'maintenance.schedules.index', pattern: 'maintenance.schedules.*' },
    { label: 'Kategori', route: 'maintenance.categories.index', pattern: 'maintenance.categories.*' },
];

export default function MaintenanceNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();

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
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
