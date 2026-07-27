import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    {
        labelKey: 'rental.nav.list',
        route: 'rental.index',
        patterns: ['rental.index', 'rental.create', 'rental.show', 'rental.edit'],
    },
    { labelKey: 'rental.nav.rates', route: 'rental.rates.index', patterns: ['rental.rates.*'] },
] as const;

export default function RentalNav(): JSX.Element {
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
