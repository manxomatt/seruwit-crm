import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    {
        icon: '🏆',
        labelKey: 'scoring.nav.leaderboard',
        fallbackLabel: 'Leaderboard',
        route: 'scoring.leaderboard',
        patterns: ['scoring.leaderboard', 'scoring.drivers.*'],
    },
    {
        icon: '⚠️',
        labelKey: 'scoring.nav.events',
        fallbackLabel: 'Events',
        route: 'scoring.events.index',
        patterns: ['scoring.events.*'],
    },
    {
        icon: '🎁',
        labelKey: 'scoring.nav.incentives',
        fallbackLabel: 'Insentif',
        route: 'scoring.incentives.index',
        patterns: ['scoring.incentives.*', 'scoring.awards.*'],
    },
    {
        icon: '⚙️',
        labelKey: 'scoring.nav.settings',
        fallbackLabel: 'Pengaturan',
        route: 'scoring.settings.edit',
        patterns: ['scoring.settings.*'],
    },
] as const;

export default function ScoringNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
            <nav className="flex items-center gap-1.5 overflow-x-auto" aria-label={t('scoring.nav.aria', undefined, 'Navigasi Driver Scoring')}>
                {TABS.map((tab) => {
                    const active = tab.patterns.some((pattern) => isCurrentRoute(pattern));
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
