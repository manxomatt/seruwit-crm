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
        <div className="mb-6 flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
            <nav className="flex items-center gap-1.5 overflow-x-auto" aria-label={t('partners.title')}>
                {TABS.map((tab) => {
                    const active = tab.patterns.some((pattern) => isCurrentRoute(pattern));

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
                            <span>{t(tab.labelKey)}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
