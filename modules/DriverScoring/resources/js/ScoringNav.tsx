import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    {
        labelKey: 'scoring.nav.leaderboard',
        route: 'scoring.leaderboard',
        patterns: ['scoring.leaderboard', 'scoring.drivers.*'],
    },
    { labelKey: 'scoring.nav.events', route: 'scoring.events.index', patterns: ['scoring.events.*'] },
    { labelKey: 'scoring.nav.incentives', route: 'scoring.incentives.index', patterns: ['scoring.incentives.*', 'scoring.awards.*'] },
    { labelKey: 'scoring.nav.settings', route: 'scoring.settings.edit', patterns: ['scoring.settings.*'] },
] as const;

export default function ScoringNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6 overflow-x-auto">
                {TABS.map((tab) => {
                    const active = tab.patterns.some((pattern) => isCurrentRoute(pattern));
                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
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
