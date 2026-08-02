import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type FinanceModule = 'accounting' | 'invoicing' | 'receivables' | 'payables' | 'billing';

interface FinanceLink {
    module: FinanceModule;
    route: string;
    pattern: string;
}

const FINANCE_LINKS: FinanceLink[] = [
    { module: 'accounting', route: 'accounting.dashboard', pattern: 'accounting.*' },
    { module: 'invoicing', route: 'invoicing.dashboard', pattern: 'invoicing.*' },
    { module: 'receivables', route: 'receivables.payments.index', pattern: 'receivables.*' },
    { module: 'payables', route: 'payables.bills.index', pattern: 'payables.*' },
    { module: 'billing', route: 'billing.charges.index', pattern: 'billing.*' },
];

function routeExists(routeName: string): boolean {
    try {
        route(routeName);
        return true;
    } catch {
        return false;
    }
}

/**
 * Cross-module switcher for the Finance group. Modules stay separate; this
 * only unifies discovery/navigation when the user can view more than one.
 */
export default function FinanceNav(): JSX.Element | null {
    const { prefixedRoute, isCurrentRoute, routePrefix } = useRoutePrefix();
    const { t } = useTrans();
    const page = usePage().props as { auth?: { user?: { permissions?: Record<string, string[]> } } };
    const permissions = page.auth?.user?.permissions ?? {};

    const items = useMemo(() => {
        return FINANCE_LINKS.filter((link) => {
            const actions = permissions[link.module];
            if (!actions?.includes('view')) {
                return false;
            }

            const absolute = `${routePrefix}.${link.route}`;

            return routeExists(absolute);
        });
    }, [permissions, routePrefix]);

    if (items.length < 2) {
        return null;
    }

    return (
        <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {t('menu_groups.finance')}
            </p>
            <nav className="flex flex-wrap gap-2" aria-label={t('finance.nav.aria')}>
                {items.map((link) => {
                    const active = isCurrentRoute(link.pattern);

                    return (
                        <Link
                            key={link.module}
                            href={prefixedRoute(link.route)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                active
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {t(`modules.${link.module}`)}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
