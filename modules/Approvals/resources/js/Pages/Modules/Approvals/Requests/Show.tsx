import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ApprovalsNav from '../../../../ApprovalsNav';

interface Props {
    approvalRequest: {
        id: number;
        code: string;
        trigger_type: string;
        status: string;
        current_level: number;
        payload: Record<string, unknown> | null;
        policy: {
            name: string;
            levels: Array<{ level: number; name: string; approver_type: string; approver_value: string }>;
        };
        requester: { id: number; name: string } | null;
        actions: Array<{
            id: number;
            level: number;
            action: string;
            note: string | null;
            actor: { id: number; name: string } | null;
            created_at: string;
        }>;
        subject_type: string;
        subject_id: number;
    };
    triggers: Record<string, { label: string }>;
    canDecide: boolean;
}

export default function Show({ approvalRequest, triggers, canDecide }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [note, setNote] = useState('');

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-800">{approvalRequest.code}</h2>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize">
                            {approvalRequest.status}
                        </span>
                    </div>
                    <Link href={prefixedRoute('approvals.requests.index')}>
                        <SecondaryButton>Back</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={approvalRequest.code} />
            <div className="py-6">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ApprovalsNav />

                    <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-gray-500">Policy</p>
                            <p className="font-medium">{approvalRequest.policy.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Trigger</p>
                            <p className="font-medium">
                                {triggers[approvalRequest.trigger_type]?.label ?? approvalRequest.trigger_type}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Current level</p>
                            <p className="font-medium">{approvalRequest.current_level}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Requested by</p>
                            <p className="font-medium">{approvalRequest.requester?.name ?? '—'}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500">Subject</p>
                            <p className="font-mono text-sm">
                                {approvalRequest.subject_type} #{approvalRequest.subject_id}
                            </p>
                        </div>
                        {approvalRequest.payload && (
                            <div className="sm:col-span-2">
                                <p className="text-xs text-gray-500">Payload</p>
                                <pre className="mt-1 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
                                    {JSON.stringify(approvalRequest.payload, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-gray-900">Levels</h3>
                        <ul className="mt-3 space-y-2 text-sm">
                            {approvalRequest.policy.levels.map((level) => (
                                <li
                                    key={level.level}
                                    className={`rounded border px-3 py-2 ${
                                        level.level === approvalRequest.current_level && approvalRequest.status === 'pending'
                                            ? 'border-indigo-300 bg-indigo-50'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    L{level.level} · {level.name} · {level.approver_type}:{level.approver_value}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {approvalRequest.actions.length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                            <h3 className="text-sm font-semibold text-gray-900">History</h3>
                            <ul className="mt-3 space-y-2 text-sm">
                                {approvalRequest.actions.map((action) => (
                                    <li key={action.id} className="border-b border-gray-100 pb-2">
                                        <span className="font-medium capitalize">{action.action}</span> by{' '}
                                        {action.actor?.name ?? '—'} (L{action.level})
                                        {action.note ? <span className="block text-gray-500">{action.note}</span> : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {canDecide && (
                        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
                            <TextInput
                                className="w-full"
                                placeholder="Catatan (opsional)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <PrimaryButton
                                    onClick={() =>
                                        router.post(prefixedRoute('approvals.requests.approve', approvalRequest.id), {
                                            note: note || null,
                                        })
                                    }
                                >
                                    Approve
                                </PrimaryButton>
                                <DangerButton
                                    onClick={() =>
                                        router.post(prefixedRoute('approvals.requests.reject', approvalRequest.id), {
                                            note: note || null,
                                        })
                                    }
                                >
                                    Reject
                                </DangerButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
