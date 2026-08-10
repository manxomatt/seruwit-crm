import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'orders.nav.dashboard', route: 'orders.dashboard', patterns: ['orders.dashboard'] },
    {
        labelKey: 'orders.nav.orders',
        route: 'orders.index',
        patterns: ['orders.index', 'orders.create', 'orders.show', 'orders.edit', 'orders.items.*', 'orders.surat-jalan', 'orders.confirm', 'orders.cancel', 'orders.assign-trip', 'orders.batch-assign-trip', 'orders.unassign-trip'],
    },
    { labelKey: 'orders.nav.settings', route: 'orders.settings.edit', patterns: ['orders.settings.*'] },
] as const;

export default function OrdersNav(): JSX.Element {
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
