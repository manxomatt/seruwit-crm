import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS: Array<{ labelKey: string; route: string; patterns: string[]; icon: string }> = [
    { labelKey: 'partners.nav.dashboard', route: 'partners.dashboard', patterns: ['partners.dashboard'], icon: '📊' },
    {
        labelKey: 'partners.nav.list',
        route: 'partners.index',
        patterns: ['partners.index', 'partners.create', 'partners.show', 'partners.edit'],
        icon: '👥',
    },
    { labelKey: 'partners.nav.types', route: 'partners.types.index', patterns: ['partners.types.*'], icon: '🏷️' },
    { labelKey: 'partners.nav.industries', route: 'partners.industries.index', patterns: ['partners.industries.*'], icon: '🏢' },
    { labelKey: 'partners.nav.locations', route: 'partners.locations.index', patterns: ['partners.locations.*'], icon: '📍' },
];

export default function PartnersNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 overflow-x-auto pb-1">
            <nav className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/90 p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
                {TABS.map((tab) => {
                    const active = tab.patterns.some((pattern) => isCurrentRoute(pattern));

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                active
                                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            <span className="text-sm">{tab.icon}</span>
                            <span>{t(tab.labelKey)}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
