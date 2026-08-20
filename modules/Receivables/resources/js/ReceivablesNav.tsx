import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'receivables.nav.dashboard', route: 'receivables.dashboard', pattern: 'receivables.dashboard', icon: '📊' },
    { labelKey: 'receivables.nav.payments', route: 'receivables.payments.index', pattern: 'receivables.payments.*', icon: '💳' },
    { labelKey: 'receivables.nav.aging', route: 'receivables.aging.index', pattern: 'receivables.aging.*', icon: '⏳' },
    { labelKey: 'receivables.nav.credit_limits', route: 'receivables.credit.index', pattern: 'receivables.credit.*', icon: '🛡️' },
    { labelKey: 'receivables.nav.gateway', route: 'receivables.gateway.edit', pattern: 'receivables.gateway.*', icon: '⚙️' },
] as const;

export default function ReceivablesNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
            <nav className="flex items-center gap-1.5 overflow-x-auto" aria-label={t('receivables.title')}>
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
