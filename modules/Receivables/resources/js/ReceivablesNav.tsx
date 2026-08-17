import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'receivables.nav.dashboard', route: 'receivables.dashboard', pattern: 'receivables.dashboard' },
    { labelKey: 'receivables.nav.payments', route: 'receivables.payments.index', pattern: 'receivables.payments.*' },
    { labelKey: 'receivables.nav.aging', route: 'receivables.aging.index', pattern: 'receivables.aging.*' },
    { labelKey: 'receivables.nav.credit_limits', route: 'receivables.credit.index', pattern: 'receivables.credit.*' },
    { labelKey: 'receivables.nav.gateway', route: 'receivables.gateway.edit', pattern: 'receivables.gateway.*' },
] as const;

export default function ReceivablesNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
            <nav className="flex flex-wrap items-center gap-1.5" aria-label={t('receivables.title')}>
                {TABS.map((tab) => {
                    const active = isCurrentRoute(tab.pattern);

                    return (
                        <Link
                            key={tab.route}
                            href={prefixedRoute(tab.route)}
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                active
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
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
