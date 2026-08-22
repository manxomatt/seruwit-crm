import { Link, router } from '@inertiajs/react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'

interface RenewalRecord {
    id: number
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    renewal_date: string
    processed_at?: string
    failure_reason?: string
    attempt_count: number
}

interface Props {
    tenant: {
        id: string
        name: string
    }
    subscription: {
        id: number
        plan_id: number
        auto_renew: boolean
        next_renewal_date?: string
        skip_next_renewal: boolean
        renewal_attempts: number
        days_until_renewal: number
        is_renewal_overdue: boolean
    }
    renewal_history: RenewalRecord[]
}

export default function RenewalHistory({
    tenant,
    subscription,
    renewal_history,
}: Props) {
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
            processing:
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
            completed:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
            cancelled:
                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
        }
        return styles[status] || styles.pending
    }

    const handleProcessRenewal = () => {
        router.post(`/subscriptions/${tenant.id}/renewal/process`, {}, {
            onSuccess: () => {
                window.location.reload()
            },
        })
    }

    const handleSkipRenewal = () => {
        if (
            confirm(
                'Are you sure you want to skip the next renewal? Your subscription will expire after the current period ends.'
            )
        ) {
            router.post(`/subscriptions/${tenant.id}/renewal/skip`, {})
        }
    }

    const handleEnableRenewal = () => {
        router.post(`/subscriptions/${tenant.id}/renewal/enable`, {})
    }

    return (
        <DynamicLayout header={<PageHeader title="Renewal History" />}>
            <div className="mx-auto max-w-4xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Renewal History & Management
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Workspace: <span className="font-semibold">{tenant.name}</span>
                    </p>
                </div>

                {/* Upcoming Renewal Status */}
                <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Upcoming Renewal
                    </h2>

                    {subscription.next_renewal_date ? (
                        <div className="space-y-4">
                            {subscription.is_renewal_overdue && (
                                <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                                        ⚠️ Renewal Overdue
                                    </p>
                                    <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                                        Your subscription renewal is overdue. Please process the renewal
                                        immediately to maintain your service.
                                    </p>
                                </div>
                            )}

                            {subscription.skip_next_renewal && (
                                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                        ℹ️ Renewal Skipped
                                    </p>
                                    <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                                        You have skipped the next renewal. Your subscription will expire on{' '}
                                        <span className="font-semibold">{subscription.next_renewal_date}</span>.
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Next Renewal Date
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                                        {subscription.next_renewal_date}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Days Until Renewal
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                                        {Math.max(0, subscription.days_until_renewal)} days
                                    </p>
                                </div>

                                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Auto-Renewal Status
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                                        {subscription.auto_renew ? '✓ Enabled' : 'Disabled'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
                                {subscription.auto_renew ? (
                                    <>
                                        <button
                                            onClick={handleProcessRenewal}
                                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                        >
                                            Process Renewal Now
                                        </button>
                                        <button
                                            onClick={handleSkipRenewal}
                                            className="rounded-lg border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-50 dark:border-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                        >
                                            Skip Next Renewal
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleEnableRenewal}
                                        className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-900/20"
                                    >
                                        Enable Renewal
                                    </button>
                                )}

                                <Link
                                    href={`/subscriptions/${tenant.id}/management`}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Back to Management
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                No upcoming renewal scheduled. Please subscribe first.
                            </p>
                        </div>
                    )}
                </div>

                {/* Renewal History */}
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Renewal History
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Renewal Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Processed
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Attempts
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {renewal_history.length > 0 ? (
                                    renewal_history.map((renewal) => (
                                        <tr key={renewal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {renewal.renewal_date}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(
                                                        renewal.status
                                                    )}`}
                                                >
                                                    {renewal.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {renewal.processed_at || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {renewal.attempt_count}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                                            No renewal history yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    )
}
