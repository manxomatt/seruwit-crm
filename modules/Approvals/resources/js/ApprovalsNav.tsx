import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';

export default function ApprovalsNav(): JSX.Element {
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
                <Link href={prefixedRoute('approvals.requests.index')} className={linkClass('approvals.requests.*')}>
                    Inbox
                </Link>
                <Link href={prefixedRoute('approvals.policies.index')} className={linkClass('approvals.policies.*')}>
                    Policies
                </Link>
            </nav>
        </div>
    );
}
