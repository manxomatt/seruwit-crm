import FinanceNav from '@/Components/FinanceNav';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'receivables.nav.payments', route: 'receivables.payments.index', pattern: 'receivables.payments.*' },
    { labelKey: 'receivables.nav.aging', route: 'receivables.aging.index', pattern: 'receivables.aging.*' },
    { labelKey: 'receivables.nav.credit_limits', route: 'receivables.credit.index', pattern: 'receivables.credit.*' },
    { labelKey: 'receivables.nav.gateway', route: 'receivables.gateway.edit', pattern: 'receivables.gateway.*' },
] as const;

export default function ReceivablesNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <>
            <FinanceNav />
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
        </>
    );
}
