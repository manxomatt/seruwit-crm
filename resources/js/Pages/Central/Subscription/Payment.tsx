import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'
import { router } from '@inertiajs/react'

interface Props {
    tenant: {
        id: string
        name: string
    }
    plan: {
        id: number
        name: string
        pricing_model: 'fixed' | 'payg'
    }
    vehicles_quota: number
    billing_interval: string
    pricing: {
        vehicle_count: number
        tier_name: string
        price_per_vehicle: number
        total_price: number
        discount_percent: number
    }
    tier?: any
}

export default function Payment({ tenant, plan, vehicles_quota, billing_interval, pricing, tier }: Props) {
    const handleConfirmPayment = () => {
        router.post(`/subscriptions/${tenant.id}`, {
            plan_id: plan.id,
            vehicles_quota,
            billing_interval,
            payment_method: 'manual_transfer',
        })
    }

    const getPeriodText = () => {
        if (billing_interval === 'year') {
            return 'for 12 months (you save 2 months!)'
        }
        return 'for 1 month'
    }

    return (
        <DynamicLayout header={<PageHeader title="Payment Confirmation" />}>
            <div className="mx-auto max-w-2xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Payment Confirmation
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Workspace: <span className="font-semibold">{tenant.name}</span>
                    </p>
                </div>

                {/* Order Summary */}
                <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div>
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Order Summary
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {plan.name}
                                    </span>
                                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                        plan.pricing_model === 'payg'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                    }`}>
                                        {plan.pricing_model === 'payg' ? 'PAYG' : 'Fixed'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Vehicle Quota:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {vehicles_quota} vehicles
                                </span>
                            </div>

                            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Pricing Tier:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {pricing.tier_name}
                                </span>
                            </div>

                            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Price per Vehicle:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    Rp {(pricing.price_per_vehicle / 1000).toLocaleString('id-ID')}k{plan.pricing_model === 'payg' ? '/month' : ''}
                                </span>
                            </div>

                            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Billing Period:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {getPeriodText()}
                                </span>
                            </div>

                            {pricing.discount_percent > 0 && (
                                <div className="flex justify-between rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                        {plan.pricing_model === 'payg' ? 'Tier Discount' : 'Volume Discount'}:
                                    </span>
                                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                        -{pricing.discount_percent}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-700">
                        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                            Total Amount Due
                        </div>
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                            Rp {(pricing.total_price / 1000).toLocaleString('id-ID')}k
                        </div>
                        {plan.pricing_model === 'payg' && (
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                {billing_interval === 'year' ? 'Annual billing (10 months charged)' : 'Monthly billing'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Instructions */}
                <div className="mt-6 space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div>
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Payment Instructions
                        </h2>

                        <div className="space-y-4">
                            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                                <p className="text-sm text-blue-900 dark:text-blue-200">
                                    <span className="font-semibold">Payment Method:</span> Bank Transfer
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Transfer Details:
                                </p>
                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Bank:</span>
                                        <span>BNI</span>
                                    </div>
                                    <div className="flex gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Account:</span>
                                        <span className="font-mono">PT. Seruwit Indonesia</span>
                                    </div>
                                    <div className="flex gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Number:</span>
                                        <span className="font-mono">1234567890</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/30 dark:bg-yellow-900/20">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <span className="font-semibold">Important:</span> After transfer, you have 7 days to confirm payment. Use the reference code below.
                                </p>
                            </div>

                            <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                                <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Reference Code (use as payment note):
                                </p>
                                <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                                    SERU-{tenant.id}-{Date.now().toString().slice(-6).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 className="mb-3 font-medium text-gray-900 dark:text-white">Next Steps</h3>
                        <div className="space-y-3">
                            {[
                                { num: '1', text: 'Transfer the amount to the account above' },
                                { num: '2', text: 'Wait for bank confirmation (usually 1-2 hours)' },
                                { num: '3', text: 'We verify and activate your subscription' },
                                { num: '4', text: 'Start managing your fleet!' },
                            ].map(step => (
                                <div key={step.num} className="flex gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-700">
                                        <span className="text-sm font-bold">{step.num}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                                        {step.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Edit Order
                    </button>
                    <button
                        onClick={handleConfirmPayment}
                        className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    >
                        I've Completed Payment
                    </button>
                </div>

                {/* Support */}
                <div className="mt-8 rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Having issues? <a href="mailto:support@seruwit.com" className="font-medium text-blue-600 hover:underline dark:text-blue-400">Contact support</a>
                    </p>
                </div>
            </div>
        </DynamicLayout>
    )
}
