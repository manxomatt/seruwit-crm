import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';
import ApprovalsNav from '../../../../ApprovalsNav';

interface ApprovalRequestRow {
    id: number;
    code: string;
    trigger_type: string;
    status: string;
    current_level: number;
    created_at: string;
    policy: { id: number; name: string; trigger_type: string };
    requester: { id: number; name: string } | null;
}

interface Props {
    requests: { data: ApprovalRequestRow[] };
    triggers: Record<string, { label: string }>;
    filters: { status?: string; trigger_type?: string };
    pending_count: number;
    can: { decide: boolean; create: boolean };
}

const STATUS_FILTERS = ['pending', 'approved', 'rejected', ''] as const;

export default function Index({ requests, triggers, filters, pending_count, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const statusLabel = (status: string): string => {
        if (!status) {
            return t('approvals.status.all');
        }

        return t(`approvals.status.${status}`, undefined, status);
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">{t('approvals.inbox.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('approvals.policies.create')}>
                            <PrimaryButton>{t('approvals.inbox.new_policy')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('approvals.inbox.head')} />
            <div className="py-6">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ApprovalsNav />

                    {pending_count > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            {t('approvals.inbox.pending_banner', { count: pending_count })}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((status) => (
                            <button
                                key={status || 'all'}
                                type="button"
                                onClick={() =>
                                    router.get(prefixedRoute('approvals.requests.index'), {
                                        status: status || undefined,
                                        trigger_type: filters.trigger_type,
                                    })
                                }
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    (filters.status || '') === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {statusLabel(status)}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('approvals.inbox.columns.code')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('approvals.inbox.columns.policy')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('approvals.inbox.columns.trigger')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('approvals.inbox.columns.level')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('approvals.inbox.columns.by')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('approvals.inbox.columns.status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                            {t('approvals.inbox.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    requests.data.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('approvals.requests.show', row.id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {row.code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{row.policy.name}</td>
                                            <td className="px-4 py-3">{triggers[row.trigger_type]?.label ?? row.trigger_type}</td>
                                            <td className="px-4 py-3 tabular-nums">{row.current_level}</td>
                                            <td className="px-4 py-3">{row.requester?.name ?? '—'}</td>
                                            <td className="px-4 py-3 capitalize">
                                                {t(`approvals.status.${row.status}`, undefined, row.status)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
