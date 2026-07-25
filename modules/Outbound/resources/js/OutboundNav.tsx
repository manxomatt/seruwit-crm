import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

export default function OutboundNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();
    const active = isCurrentRoute('outbound.*');

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
                <Link
                    href={prefixedRoute('outbound.pick-lists.index')}
                    className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                        active
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                    {t('outbound.nav.pick_lists')}
                </Link>
            </nav>
        </div>
    );
}
