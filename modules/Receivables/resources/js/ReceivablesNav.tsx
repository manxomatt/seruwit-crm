import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';

export default function ReceivablesNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();

    const linkClass = (pattern: string): string =>
        `whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
            isCurrentRoute(pattern)
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`;

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
                <Link href={prefixedRoute('receivables.payments.index')} className={linkClass('receivables.payments.*')}>
                    Payments
                </Link>
                <Link href={prefixedRoute('receivables.aging.index')} className={linkClass('receivables.aging.*')}>
                    Aging
                </Link>
                <Link href={prefixedRoute('receivables.credit.index')} className={linkClass('receivables.credit.*')}>
                    Credit Limits
                </Link>
            </nav>
        </div>
    );
}
