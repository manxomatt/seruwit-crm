import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    {
        labelKey: 'sales.nav.dashboard',
        route: 'sales.dashboard',
        patterns: ['sales.dashboard'],
    },
    {
        labelKey: 'sales.nav.sales_orders',
        route: 'sales.sales-orders.index',
        patterns: ['sales.sales-orders.*', 'sales.gin.*', 'sales.returns.*'],
    },
    {
        labelKey: 'sales.nav.price_lists',
        route: 'sales.price-lists.index',
        patterns: ['sales.price-lists.*'],
    },
] as const;

export default function SalesNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
                {TABS.map((tab) => {
                    const active = tab.patterns.some((p) => isCurrentRoute(p));
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
