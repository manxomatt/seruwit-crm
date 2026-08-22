import { Link } from '@inertiajs/react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'

interface Props {
    tenant: {
        id: string
        name: string
    }
    subscription: {
        id: number
        subscribed_vehicles: number
    }
    billing_report: {
        id: number
        year: number
        month: number
        month_year: string
        total_amount: number
        vehicle_cost: number
        vehicle_count: number
        billing_interval: string
        status: 'pending' | 'billed' | 'paid'
        billed_at?: string
        paid_at?: string
    }
}

export default function BillingReportShow({
    tenant,
    subscription,
    billing_report,
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

    const formatCurrency = (amount: number) => {
        return `Rp ${(amount / 1000).toLocaleString('id-ID')}k`
    }

    const handleDownloadPDF = () => {
        // TODO: Implement PDF generation
        alert('PDF download coming soon')
    }

    return (
        <DynamicLayout header={<PageHeader title="Billing Report Details" />}>
            <div className="mx-auto max-w-4xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Billing Report - {billing_report.month_year}
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Workspace: <span className="font-semibold">{tenant.name}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <span
                                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(billing_report.status)}`}
                            >
                                {billing_report.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Report Card */}
                <div className="mb-8 rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
                    {/* Amount Highlight */}
                    <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount Due</p>
                        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(billing_report.total_amount)}
                        </p>
                    </div>

                    {/* Billing Details */}
                    <div className="mb-8 grid gap-6 sm:grid-cols-2">
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Billing Period</p>
                            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                                {new Date(billing_report.year, billing_report.month - 1).toLocaleString('default', {
                                    year: 'numeric',
                                    month: 'long',
                                })}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Billing Interval</p>
                            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                                {billing_report.billing_interval === 'month' ? 'Monthly' : 'Annual'}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle Count</p>
                            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                                {billing_report.vehicle_count} vehicles
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Cost per Vehicle</p>
                            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(billing_report.vehicle_cost / billing_report.vehicle_count)}
                            </p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="mb-8 border-t border-gray-200 pt-6 dark:border-gray-700">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Cost Breakdown
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    {billing_report.vehicle_count} vehicles × {formatCurrency(billing_report.vehicle_cost / billing_report.vehicle_count)}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(billing_report.vehicle_cost)}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                                <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(billing_report.total_amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {billing_report.billed_at && (
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Billed On</p>
                                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                        {billing_report.billed_at}
                                    </p>
                                </div>
                            )}

                            {billing_report.paid_at && (
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Paid On</p>
                                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                        {billing_report.paid_at}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-8 flex flex-wrap gap-3">
                    <button
                        onClick={handleDownloadPDF}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                        📥 Download PDF
                    </button>

                    <Link
                        href={`/billing-reports/${tenant.id}`}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        ← Back to Reports
                    </Link>

                    <Link
                        href={`/subscriptions/${tenant.id}/management`}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        → Go to Subscription
                    </Link>
                </div>

                {/* Info Box */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                        <span className="font-semibold">ℹ️ Note:</span> This is your billing statement for the specified period. For
                        questions about your bill, please contact our support team.
                    </p>
                </div>
            </div>
        </DynamicLayout>
    )
}
