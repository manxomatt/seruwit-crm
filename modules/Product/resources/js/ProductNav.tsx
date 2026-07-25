import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'products.nav.products', route: 'products.index', patterns: ['products.index', 'products.show', 'products.create', 'products.edit'] },
    { labelKey: 'products.nav.principals', route: 'products.principals.index', patterns: ['products.principals.*'] },
    { labelKey: 'products.nav.brands', route: 'products.brands.index', patterns: ['products.brands.*'] },
    { labelKey: 'products.nav.product_types', route: 'products.product-types.index', patterns: ['products.product-types.*'] },
    { labelKey: 'products.nav.attributes', route: 'products.attributes.index', patterns: ['products.attributes.*'] },
    { labelKey: 'products.nav.tags', route: 'products.tags.index', patterns: ['products.tags.*'] },
] as const;

export default function ProductNav(): JSX.Element {
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
