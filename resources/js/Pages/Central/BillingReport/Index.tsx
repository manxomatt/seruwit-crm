import { Link, router } from '@inertiajs/react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'

interface BillingReport {
    id: number
    month_year: string
    total_amount: number
    vehicle_count: number
    billing_interval: string
    status: 'pending' | 'billed' | 'paid'
    billed_at?: string
    paid_at?: string
}

interface Props {
    tenant: {
        id: string
        name: string
    }
    subscription: {
        id: number
        subscribed_vehicles: number
    }
    billing_reports: BillingReport[]
    summary: {
        pending: number
        billed: number
        paid: number
        total_pending_amount: number
        total_billed_amount: number
        total_paid_amount: number
    }
    average_monthly_spend: number
}

export default function BillingReportIndex({
    tenant,
    subscription,
    billing_reports,
    summary,
    average_monthly_spend,
}: Props) {
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
            billed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
            paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
        }
        return styles[status] || styles.pending
    }

    const handleExportCsv = () => {
        window.location.href = `/billing-reports/${tenant.id}/export/csv`
    }

    return (
        <DynamicLayout header={<PageHeader title="Billing Reports" />}>
            <div className="mx-auto max-w-6xl px-4 py-12">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Billing Reports
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Workspace: <span className="font-semibold">{tenant.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleExportCsv}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                        📥 Export CSV
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending Bills</p>
                        <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                            {summary.pending}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            Rp {(summary.total_pending_amount / 1000).toLocaleString('id-ID')}k
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Billed</p>
                        <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {summary.billed}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            Rp {(summary.total_billed_amount / 1000).toLocaleString('id-ID')}k
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                        <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                            {summary.paid}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            Rp {(summary.total_paid_amount / 1000).toLocaleString('id-ID')}k
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Monthly Spend</p>
                        <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                            Rp {(average_monthly_spend / 1000).toLocaleString('id-ID')}k
                        </p>
                    </div>
                </div>

                {/* Billing Reports Table */}
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Billing History
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Vehicles
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Interval
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {billing_reports.length > 0 ? (
                                    billing_reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {report.month_year}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                Rp {(report.total_amount / 1000).toLocaleString('id-ID')}k
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {report.vehicle_count} vehicles
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {report.billing_interval === 'month' ? 'Monthly' : 'Annual'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(report.status)}`}
                                                >
                                                    {report.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <Link
                                                    href={`/billing-reports/${tenant.id}/${report.month_year.split('-')[0]}/${report.month_year.split('-')[1]}`}
                                                    className="text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                                            No billing reports yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-6">
                    <Link
                        href={`/subscriptions/${tenant.id}/management`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                        ← Back to Subscription Management
                    </Link>
                </div>
            </div>
        </DynamicLayout>
    )
}
