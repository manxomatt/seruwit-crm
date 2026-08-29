import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS: Array<{ icon: string; labelKey: string; fallbackLabel: string; route: string; pattern: string }> = [
    { icon: '📊', labelKey: 'tracking.nav.dashboard', fallbackLabel: 'Dashboard', route: 'tracking.dashboard', pattern: 'tracking.dashboard' },
    { icon: '🗺️', labelKey: 'tracking.nav.map', fallbackLabel: 'Live Map', route: 'tracking.map', pattern: 'tracking.map' },
    { icon: '📜', labelKey: 'tracking.nav.history', fallbackLabel: 'Route History', route: 'tracking.history', pattern: 'tracking.history' },
    { icon: '⭕', labelKey: 'tracking.nav.geofences', fallbackLabel: 'Geofences', route: 'tracking.geofences.index', pattern: 'tracking.geofences.*' },
    { icon: '📱', labelKey: 'tracking.nav.devices', fallbackLabel: 'GPS Devices', route: 'tracking.devices.index', pattern: 'tracking.devices.*' },
    { icon: '⚙️', labelKey: 'tracking.nav.settings', fallbackLabel: 'Settings', route: 'tracking.settings.edit', pattern: 'tracking.settings.*' },
];

export default function TrackingNav(): JSX.Element {
    const { routePrefix, prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    const tabs = TABS.filter((tab) => {
        const name = `${routePrefix}.${tab.route}`;

        return route().has(name) || route().has(`central.${name}`);
    });

    return (
        <div className="mb-6 flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
            <nav className="flex items-center gap-1.5 overflow-x-auto" aria-label={t('tracking.nav.aria', undefined, 'Navigasi Tracking')}>
                {tabs.map((tab) => {
                    const active = isCurrentRoute(tab.pattern);
                    const label = t(tab.labelKey, undefined, tab.fallbackLabel);

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                                active
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
