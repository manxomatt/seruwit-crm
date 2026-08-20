import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'billing.nav.dashboard', route: 'billing.dashboard', pattern: 'billing.dashboard', icon: '📊' },
    { labelKey: 'billing.nav.invoices', route: 'billing.invoices.create', pattern: 'billing.invoices.*', icon: '🧾' },
    { labelKey: 'billing.nav.charges', route: 'billing.charges.index', pattern: 'billing.charges.*', icon: '⚡' },
    { labelKey: 'billing.nav.tariffs', route: 'billing.tariffs.index', pattern: 'billing.tariffs.*', icon: '🏷️' },
    { labelKey: 'billing.nav.allowances', route: 'billing.allowances.index', pattern: 'billing.allowances.*', icon: '💰' },
] as const;

export default function BillingNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
            <nav className="flex items-center gap-1.5 overflow-x-auto" aria-label={t('billing.title')}>
                {TABS.map((tab) => {
                    const active = isCurrentRoute(tab.pattern);

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                                active
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{t(tab.labelKey)}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
