import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS: Array<{ labelKey: string; route: string; patterns: string[] }> = [
    { labelKey: 'partners.nav.dashboard', route: 'partners.dashboard', patterns: ['partners.dashboard'] },
    {
        labelKey: 'partners.nav.list',
        route: 'partners.index',
        patterns: ['partners.index', 'partners.create', 'partners.show', 'partners.edit'],
    },
    { labelKey: 'partners.nav.industries', route: 'partners.industries.index', patterns: ['partners.industries.*'] },
    { labelKey: 'partners.nav.locations', route: 'partners.locations.index', patterns: ['partners.locations.*'] },
];

export default function PartnersNav(): JSX.Element {
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
