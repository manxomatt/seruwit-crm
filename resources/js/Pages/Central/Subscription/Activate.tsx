import { Form } from '@inertiajs/react'
import { useState } from 'react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'
import { SubscriptionTier } from '@/types'

interface Props {
    tenant: {
        id: string
        name: string
        status: string
    }
    tiers: SubscriptionTier[]
    subscription?: any
    trial_ends_at?: string
    days_until_expiry?: number
    is_on_trial: boolean
}

export default function Activate({ tenant, tiers, trial_ends_at, days_until_expiry, is_on_trial }: Props) {
    const [vehicleQuota, setVehicleQuota] = useState(1)
    const [billingInterval, setBillingInterval] = useState('month')

    // Find applicable tier
    const tier = tiers.find(t => vehicleQuota >= t.min_vehicles && vehicleQuota <= t.max_vehicles)
    const monthlyPrice = tier ? vehicleQuota * tier.price_per_vehicle : 0
    const annualPrice = monthlyPrice * 10 // 10 months = 2 months discount

    const getDiscountPercent = () => {
        if (!tier) return 0
        if (tier.price_per_vehicle >= 20000) return 0
        return Math.round((1 - (tier.price_per_vehicle / 20000)) * 100)
    }

    return (
        <DynamicLayout header={<PageHeader title="Activate Your Subscription" />}>
            <div className="mx-auto max-w-4xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Activate Your Subscription
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Workspace: <span className="font-semibold">{tenant.name}</span>
                    </p>
                </div>

                {/* Trial Info Banner */}
                {is_on_trial && (
                    <div className="mb-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            ⏳ Trial Period Active
                        </p>
                        <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                            Your trial expires in <span className="font-semibold">{days_until_expiry} days</span> ({trial_ends_at})
                        </p>
                    </div>
                )}

                <Form action={`/subscriptions/${tenant.id}`} method="post">
                    {({ processing, errors }) => (
                        <div className="space-y-8">
                            {/* Step 1: Vehicle Quota */}
                            <div>
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                                    Step 1: Select Vehicle Quota
                                </h2>
                                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            How many vehicles do you want to manage?
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                name="vehicles_quota_slider"
                                                min="1"
                                                max="200"
                                                value={vehicleQuota}
                                                onChange={(e) => setVehicleQuota(parseInt(e.target.value))}
                                                className="flex-1"
                                            />
                                            <input
                                                type="number"
                                                name="vehicles_quota"
                                                value={vehicleQuota}
                                                onChange={(e) => setVehicleQuota(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-20 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                            <span className="text-gray-600 dark:text-gray-400">vehicles</span>
                                        </div>
                                    </div>

                                    {tier && (
                                        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                            <p className="text-sm text-blue-900 dark:text-blue-200">
                                                ✓ Applicable Tier: <span className="font-semibold">{tier.name}</span>
                                            </p>
                                        </div>
                                    )}

                                    {errors.vehicles_quota && (
                                        <div className="text-sm text-red-600 dark:text-red-400">{errors.vehicles_quota}</div>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Billing Interval */}
                            <div>
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                                    Step 2: Choose Billing Interval
                                </h2>
                                <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                                    {[
                                        { value: 'month', label: 'Monthly', period: 'per month' },
                                        { value: 'year', label: 'Annual', period: 'per year (save 2 months!)' },
                                    ].map(option => (
                                        <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <input
                                                type="radio"
                                                name="billing_interval"
                                                value={option.value}
                                                checked={billingInterval === option.value}
                                                onChange={(e) => setBillingInterval(e.target.value)}
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{option.period}</div>
                                            </div>
                                        </label>
                                    ))}

                                    {errors.billing_interval && (
                                        <div className="text-sm text-red-600 dark:text-red-400">{errors.billing_interval}</div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Price Breakdown */}
                            <div>
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                                    Step 3: Price Breakdown
                                </h2>
                                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Vehicles:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{vehicleQuota}</span>
                                    </div>

                                    <div className="flex justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Tier:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {tier?.name || 'Loading...'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Price per Vehicle:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            Rp {tier ? (tier.price_per_vehicle / 1000).toLocaleString('id-ID') : 0}k
                                        </span>
                                    </div>

                                    {getDiscountPercent() > 0 && (
                                        <div className="flex justify-between rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                                            <span className="text-sm text-green-700 dark:text-green-300">Discount:</span>
                                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                                -{getDiscountPercent()}%
                                            </span>
                                        </div>
                                    )}

                                    <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                                        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                            {billingInterval === 'month' ? 'Monthly Total:' : 'Annual Total (2 months discount):'}
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                            Rp {billingInterval === 'month'
                                                ? (monthlyPrice / 1000).toLocaleString('id-ID')
                                                : (annualPrice / 1000).toLocaleString('id-ID')
                                            }k
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4: Tier Comparison */}
                            <div>
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                                    Pricing Tiers
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {tiers.map(t => (
                                        <div
                                            key={t.id}
                                            className={`rounded-lg border-2 p-4 transition-all ${
                                                tier?.id === t.id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                        >
                                            <div className="mb-2 font-semibold text-gray-900 dark:text-white">
                                                {t.name}
                                            </div>
                                            <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                                {t.min_vehicles}-{t.max_vehicles > 100000 ? '∞' : t.max_vehicles} vehicles
                                            </div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                Rp {(t.price_per_vehicle / 1000).toLocaleString('id-ID')}k
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                                per vehicle/month
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                                >
                                    {processing ? 'Processing...' : 'Continue to Payment'}
                                </button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </DynamicLayout>
    )
}
