import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS: Array<{ labelKey: string; route: string; pattern: string }> = [
    { labelKey: 'tracking.nav.dashboard', route: 'tracking.dashboard', pattern: 'tracking.dashboard' },
    { labelKey: 'tracking.nav.map', route: 'tracking.map', pattern: 'tracking.map' },
    { labelKey: 'tracking.nav.history', route: 'tracking.history', pattern: 'tracking.history' },
    { labelKey: 'tracking.nav.geofences', route: 'tracking.geofences.index', pattern: 'tracking.geofences.*' },
    { labelKey: 'tracking.nav.devices', route: 'tracking.devices.index', pattern: 'tracking.devices.*' },
    { labelKey: 'tracking.nav.settings', route: 'tracking.settings.edit', pattern: 'tracking.settings.*' },
];

export default function TrackingNav(): JSX.Element {
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
