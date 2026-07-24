import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';

export default function PurchasingNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const active = isCurrentRoute('purchasing.*');

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
                <Link
                    href={prefixedRoute('purchasing.purchase-orders.index')}
                    className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                        active
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                    Purchase Orders
                </Link>
            </nav>
        </div>
    );
}
