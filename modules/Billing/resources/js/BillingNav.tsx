import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'billing.nav.invoices', route: 'billing.invoices.create', pattern: 'billing.invoices.*' },
    { labelKey: 'billing.nav.charges', route: 'billing.charges.index', pattern: 'billing.charges.*' },
    { labelKey: 'billing.nav.tariffs', route: 'billing.tariffs.index', pattern: 'billing.tariffs.*' },
    { labelKey: 'billing.nav.allowances', route: 'billing.allowances.index', pattern: 'billing.allowances.*' },
] as const;

export default function BillingNav(): JSX.Element {
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
