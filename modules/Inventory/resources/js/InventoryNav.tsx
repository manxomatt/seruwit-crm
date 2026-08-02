import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'inventory.nav.dashboard', route: 'inventory.dashboard', pattern: 'inventory.dashboard' },
    { labelKey: 'inventory.nav.warehouses', route: 'inventory.warehouses.index', pattern: 'inventory.warehouses.*' },
    { labelKey: 'inventory.nav.stock_levels', route: 'inventory.stock-levels.index', pattern: 'inventory.stock-levels.*' },
    { labelKey: 'inventory.nav.stock_movements', route: 'inventory.stock-movements.index', pattern: 'inventory.stock-movements.*' },
    { labelKey: 'inventory.nav.putaway', route: 'inventory.putaway.index', pattern: 'inventory.putaway.*' },
    { labelKey: 'inventory.nav.expiry_report', route: 'inventory.expiry-report.index', pattern: 'inventory.expiry-report.*' },
    { labelKey: 'inventory.nav.stock_opnames', route: 'inventory.stock-opnames.index', pattern: 'inventory.stock-opnames.*' },
] as const;

export default function InventoryNav(): JSX.Element {
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
