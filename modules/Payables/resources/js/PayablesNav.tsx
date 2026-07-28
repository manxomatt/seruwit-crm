import FinanceNav from '@/Components/FinanceNav';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'payables.nav.bills', route: 'payables.bills.index', pattern: 'payables.bills.*' },
    { labelKey: 'payables.nav.payments', route: 'payables.payments.index', pattern: 'payables.payments.*' },
] as const;

export default function PayablesNav(): JSX.Element {
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
