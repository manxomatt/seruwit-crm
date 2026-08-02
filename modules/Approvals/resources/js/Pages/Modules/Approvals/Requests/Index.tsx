import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { formatDateDmY } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import ApprovalsNav from '../../../../ApprovalsNav';
import PageHeader from '@/Components/PageHeader';

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

interface PaginatedRequests {
    data: ApprovalRequestRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    requests: PaginatedRequests;
    triggers: Record<string, { label: string }>;
    filters: { status?: string | null; trigger_type?: string | null };
    pending_count: number;
    can: { decide: boolean; create: boolean };
}

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'pending':
            return 'bg-amber-100 text-amber-800';
        case 'approved':
            return 'bg-emerald-100 text-emerald-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        case 'cancelled':
            return 'bg-gray-100 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-600';
    }
}

export default function Index({ requests, triggers, filters, pending_count, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const applyFilters = (overrides: { status?: string; trigger_type?: string }): void => {
        router.get(
            prefixedRoute('approvals.requests.index'),
            {
                status: overrides.status !== undefined ? overrides.status || undefined : filters.status || undefined,
                trigger_type:
                    overrides.trigger_type !== undefined
                        ? overrides.trigger_type || undefined
                        : filters.trigger_type || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('approvals.inbox.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('approvals.policies.create')}>
                            <PrimaryButton>{t('approvals.inbox.new_policy')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('approvals.inbox.head')} />

            <ApprovalsNav />

            {pending_count > 0 && (
                <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-lg">
                    {t('approvals.inbox.pending_banner', { count: pending_count })}
                </div>
            )}

            <div className="mb-6 flex flex-wrap gap-3">
                <Select
                    className="min-w-[12rem]"
                    value={filters.status ?? ''}
                    onChange={(value) => applyFilters({ status: value })}
                    placeholder={t('approvals.status.all')}
                    searchable={false}
                    options={[
                        { value: '', label: t('approvals.status.all') },
                        { value: 'pending', label: t('approvals.status.pending') },
                        { value: 'approved', label: t('approvals.status.approved') },
                        { value: 'rejected', label: t('approvals.status.rejected') },
                        { value: 'cancelled', label: t('approvals.status.cancelled') },
                    ]}
                />
                <Select
                    className="min-w-[14rem]"
                    value={filters.trigger_type || ''}
                    onChange={(value) => applyFilters({ trigger_type: value })}
                    placeholder={t('approvals.inbox.all_triggers')}
                    searchable={false}
                    options={[
                        { value: '', label: t('approvals.inbox.all_triggers') },
                        ...Object.entries(triggers).map(([key, meta]) => ({
                            value: key,
                            label: meta.label,
                        })),
                    ]}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
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
                                {t('approvals.inbox.columns.date')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('approvals.inbox.columns.status')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('common.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
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
                                    <td className="px-4 py-3 text-gray-700">{row.policy.name}</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {triggers[row.trigger_type]?.label ?? row.trigger_type}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-700">{row.current_level}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.requester?.name ?? '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                        {formatDateDmY(row.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                                        >
                                            {t(`approvals.status.${row.status}`, undefined, row.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={prefixedRoute('approvals.requests.show', row.id)}
                                            className="inline-flex text-gray-600 hover:text-gray-900"
                                            title={t('common.view')}
                                        >
                                            <EyeIcon />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {requests.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (requests.current_page - 1) * requests.per_page + 1,
                                to: Math.min(requests.current_page * requests.per_page, requests.total),
                                total: requests.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {requests.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                              : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
