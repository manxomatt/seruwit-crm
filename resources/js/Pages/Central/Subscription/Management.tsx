import { Link, router } from '@inertiajs/react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'

interface PaymentOrder {
    id: number
    type: string
    status: string
    amount: number
    created_at: string
}

interface Props {
    tenant: {
        id: string
        name: string
    }
    subscription: {
        id: number
        subscribed_vehicles: number
        current_vehicle_count: number
        status: string
        starts_at: string
        ends_at: string
        renewal_date?: string
        next_renewal_date?: string
        auto_renew: boolean
        subscription_type: string
        monthly_cost: number
        skip_next_renewal?: boolean
        renewal_attempts?: number
        plan?: {
            name: string
            pricing_model: 'fixed' | 'payg'
        }
    }
    payment_orders: PaymentOrder[]
}

export default function Management({ tenant, subscription, payment_orders }: Props) {
    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
            expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
        }
        return styles[status as keyof typeof styles] || styles.active
    }

    const getPaymentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            activate: 'Activation',
            upgrade: 'Upgrade',
            renewal: 'Renewal',
        }
        return labels[type] || type
    }

    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'text-yellow-600 dark:text-yellow-400',
            confirmed: 'text-green-600 dark:text-green-400',
            rejected: 'text-red-600 dark:text-red-400',
            expired: 'text-gray-600 dark:text-gray-400',
        }
        return colors[status] || colors.pending
    }

    const handleToggleAutoRenew = () => {
        router.patch(`/subscriptions/${tenant.id}/toggle-auto-renew`, {}, {
            onSuccess: () => {
                // Auto-reload page
                window.location.reload()
            },
        })
    }

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel this subscription? Your workspace will be suspended.')) {
            router.post(`/subscriptions/${tenant.id}/cancel`)
        }
    }

    return (
        <DynamicLayout header={<PageHeader title="Subscription Management" />}>
            <div className="mx-auto max-w-4xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Subscription Management
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Workspace: <span className="font-semibold">{tenant.name}</span>
                    </p>
                </div>

                {/* Active Subscription */}
                <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Active Subscription
                            </h2>
                            <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(subscription.status)}`}>
                                {subscription.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {subscription.plan?.name || 'N/A'}
                                    </p>
                                    {subscription.plan && (
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                            subscription.plan.pricing_model === 'payg'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                        }`}>
                                            {subscription.plan.pricing_model === 'payg' ? 'PAYG' : 'Fixed'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle Quota</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {subscription.subscribed_vehicles} vehicles
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Currently Using</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {subscription.current_vehicle_count} vehicles
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    Rp {(subscription.monthly_cost / 1000).toLocaleString('id-ID')}k
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Billing Period Start</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{subscription.starts_at}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Billing Period End</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{subscription.ends_at}</p>
                                </div>
                                {subscription.renewal_date && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Next Renewal Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{subscription.renewal_date}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Auto-Renewal</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${subscription.auto_renew ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {subscription.auto_renew ? '✓ Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Usage Progress */}
                        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Vehicle Usage
                            </p>
                            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                                <div
                                    className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                                    style={{
                                        width: `${(subscription.current_vehicle_count / subscription.subscribed_vehicles) * 100}%`,
                                    }}
                                ></div>
                            </div>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {subscription.current_vehicle_count} of {subscription.subscribed_vehicles} vehicles
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={`/subscriptions/${tenant.id}/upgrade`}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                Upgrade Quota
                            </Link>
                            <button
                                onClick={handleToggleAutoRenew}
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                    subscription.auto_renew
                                        ? 'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20'
                                        : 'border border-green-300 text-green-600 hover:bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-900/20'
                                }`}
                            >
                                {subscription.auto_renew ? 'Disable Auto-Renewal' : 'Enable Auto-Renewal'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                </div>

                {/* Renewal Status */}
                {subscription.next_renewal_date && (
                    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Renewal Status
                            </h2>
                            <Link
                                href={`/subscriptions/${tenant.id}/renewal-history`}
                                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                                View Full History →
                            </Link>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Next Renewal</p>
                                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                                    {subscription.next_renewal_date}
                                </p>
                            </div>

                            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Renewal Attempts</p>
                                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                                    {subscription.renewal_attempts || 0}
                                </p>
                            </div>
                        </div>

                        {subscription.skip_next_renewal && (
                            <div className="mt-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                                    ⏸️ Next Renewal Skipped
                                </p>
                                <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
                                    Your subscription will expire on {subscription.ends_at} without automatic renewal.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment History */}
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Payment History
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {payment_orders.length > 0 ? (
                                    payment_orders.map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                {getPaymentTypeLabel(order.type)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {order.created_at}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                Rp {(order.amount / 1000).toLocaleString('id-ID')}k
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={getPaymentStatusColor(order.status)}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                                            No payment history
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
