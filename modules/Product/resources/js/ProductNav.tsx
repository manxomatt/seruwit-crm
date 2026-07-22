import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';

const TABS = [
    { label: 'Products', route: 'products.index', patterns: ['products.index', 'products.show', 'products.create', 'products.edit'] },
    { label: 'Principals', route: 'products.principals.index', patterns: ['products.principals.*'] },
    { label: 'Brands', route: 'products.brands.index', patterns: ['products.brands.*'] },
    { label: 'Tipe Produk', route: 'products.product-types.index', patterns: ['products.product-types.*'] },
];

export default function ProductNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();

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
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
