import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const TABS = [
    { labelKey: 'promotions.nav.programs', route: 'promotions.programs.index', pattern: 'promotions.programs.*' },
    { labelKey: 'promotions.nav.realizations', route: 'promotions.realizations.index', pattern: 'promotions.realizations.*' },
] as const;

export default function PromotionsNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
                {TABS.map((tab) => (
                    <Link
                        key={tab.route}
                        href={prefixedRoute(tab.route)}
                        className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                            isCurrentRoute(tab.pattern)
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        {t(tab.labelKey)}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
