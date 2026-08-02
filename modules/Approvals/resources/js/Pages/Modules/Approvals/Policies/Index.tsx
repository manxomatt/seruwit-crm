import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ApprovalsNav from '../../../../ApprovalsNav';
import PageHeader from '@/Components/PageHeader';

interface Policy {
    id: number;
    key: string;
    name: string;
    trigger_type: string;
    is_active: boolean;
    levels_count: number;
    pending_requests_count: number;
}

interface PaginatedPolicies {
    data: Policy[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    policies: PaginatedPolicies;
    triggers: Record<string, { label: string }>;
    can: { create: boolean; update: boolean; delete: boolean };
}

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

export default function Index({ policies, triggers, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const openDeleteDialog = (policy: Policy): void => {
        setPolicyToDelete(policy);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = (): void => {
        setShowDeleteDialog(false);
        setPolicyToDelete(null);
    };

    const confirmDelete = (): void => {
        if (!policyToDelete) {
            return;
        }

        setProcessing(true);
        router.delete(prefixedRoute('approvals.policies.destroy', policyToDelete.id), {
            onFinish: () => {
                setProcessing(false);
                closeDeleteDialog();
            },
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('approvals.policies.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('approvals.policies.create')}>
                            <PrimaryButton>{t('approvals.policies.new')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('approvals.policies.head')} />

            <ApprovalsNav />

            <p className="mb-6 text-sm text-gray-600">{t('approvals.policies.subtitle')}</p>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('approvals.policies.columns.name')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('approvals.policies.columns.trigger')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('approvals.policies.columns.levels')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('approvals.policies.columns.status')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('common.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {policies.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                    {t('approvals.policies.empty')}
                                </td>
                            </tr>
                        ) : (
                            policies.data.map((policy) => (
                                <tr key={policy.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{policy.name}</div>
                                        <div className="text-xs text-gray-500">{policy.key}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {triggers[policy.trigger_type]?.label ?? policy.trigger_type}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{policy.levels_count}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                                                policy.is_active
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {policy.is_active
                                                ? t('approvals.policies.active')
                                                : t('approvals.policies.inactive')}
                                        </span>
                                        {policy.pending_requests_count > 0 && (
                                            <span className="ml-2 text-xs text-amber-700">
                                                {t('approvals.policies.pending_count', {
                                                    count: policy.pending_requests_count,
                                                })}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {can.update && (
                                                <Link
                                                    href={prefixedRoute('approvals.policies.edit', policy.id)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title={t('common.edit')}
                                                >
                                                    <PencilIcon />
                                                </Link>
                                            )}
                                            {can.delete && (
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteDialog(policy)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title={t('common.delete')}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {policies.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (policies.current_page - 1) * policies.per_page + 1,
                                to: Math.min(policies.current_page * policies.per_page, policies.total),
                                total: policies.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {policies.links.map((link, index) => (
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

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                message={
                    policyToDelete
                        ? t('approvals.policies.delete_confirm', { name: policyToDelete.name })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}
