import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import ApprovalsNav from '../../../../ApprovalsNav';

interface Policy {
    id: number;
    key: string;
    name: string;
    trigger_type: string;
    is_active: boolean;
    levels_count: number;
    pending_requests_count: number;
}

interface Props {
    policies: Policy[];
    triggers: Record<string, { label: string }>;
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ policies, triggers, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Approval Policies</h2>
                    {can.create && (
                        <Link href={prefixedRoute('approvals.policies.create')}>
                            <PrimaryButton>New Policy</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Approval Policies" />
            <div className="py-6">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ApprovalsNav />
                    <p className="text-sm text-gray-600">
                        Konfigurasi alur multi-level tanpa koding: diskon, credit limit, PO besar, order di luar SLA.
                    </p>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Trigger</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Levels</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {policies.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            Belum ada policy. Buat satu untuk mulai.
                                        </td>
                                    </tr>
                                ) : (
                                    policies.map((policy) => (
                                        <tr key={policy.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{policy.name}</div>
                                                <div className="text-xs text-gray-500">{policy.key}</div>
                                            </td>
                                            <td className="px-4 py-3">{triggers[policy.trigger_type]?.label ?? policy.trigger_type}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{policy.levels_count}</td>
                                            <td className="px-4 py-3">
                                                {policy.is_active ? (
                                                    <span className="text-green-700">Active</span>
                                                ) : (
                                                    <span className="text-gray-500">Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {can.update && (
                                                    <Link
                                                        href={prefixedRoute('approvals.policies.edit', policy.id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                )}
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
