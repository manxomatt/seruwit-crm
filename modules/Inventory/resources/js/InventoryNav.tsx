import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';

const TABS = [
    { label: 'Warehouses', route: 'inventory.warehouses.index', pattern: 'inventory.warehouses.*' },
    { label: 'Stock Levels', route: 'inventory.stock-levels.index', pattern: 'inventory.stock-levels.*' },
    { label: 'Stock Movements', route: 'inventory.stock-movements.index', pattern: 'inventory.stock-movements.*' },
    { label: 'Stock Opnames', route: 'inventory.stock-opnames.index', pattern: 'inventory.stock-opnames.*' },
];

export default function InventoryNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();

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
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
