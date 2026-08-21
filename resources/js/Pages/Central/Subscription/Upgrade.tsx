import { Form } from '@inertiajs/react'
import { useState } from 'react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'

interface Props {
    tenant: {
        id: string
        name: string
    }
    subscription: {
        subscribed_vehicles: number
        starts_at: string
        ends_at: string
        monthly_cost: number
        days_remaining: number
    }
    tiers: any[]
}

export default function Upgrade({ tenant, subscription, tiers }: Props) {
    const [newQuota, setNewQuota] = useState(subscription.subscribed_vehicles + 1)

    // Calculate pro-rated cost
    const daysRemaining = subscription.days_remaining
    const totalDays = 30

    const oldTier = tiers.find(t => subscription.subscribed_vehicles >= t.min_vehicles && subscription.subscribed_vehicles <= t.max_vehicles)
    const newTier = tiers.find(t => newQuota >= t.min_vehicles && newQuota <= t.max_vehicles)

    const oldDailyRate = oldTier ? (subscription.subscribed_vehicles * oldTier.price_per_vehicle) / totalDays : 0
    const newDailyRate = newTier ? (newQuota * newTier.price_per_vehicle) / totalDays : 0
    const proratedAmount = (newDailyRate - oldDailyRate) * daysRemaining

    const newMonthlyPrice = newTier ? newQuota * newTier.price_per_vehicle : 0

    return (
        <DynamicLayout header={<PageHeader title="Upgrade Vehicle Quota" />}>
            <div className="mx-auto max-w-3xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Upgrade Vehicle Quota
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Workspace: <span className="font-semibold">{tenant.name}</span>
                    </p>
                </div>

                <Form action={`/subscriptions/${tenant.id}/upgrade`} method="post">
                    {({ processing, errors }) => (
                        <div className="space-y-8">
                            {/* Current Subscription */}
                            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Current Subscription
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Quota</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {subscription.subscribed_vehicles} vehicles
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Rp {(subscription.monthly_cost / 1000).toLocaleString('id-ID')}k
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Billing Period</p>
                                        <p className="text-gray-900 dark:text-white">
                                            {subscription.starts_at} to {subscription.ends_at}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {subscription.days_remaining} days
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Upgrade Form */}
                            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    New Quota
                                </h2>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        New Vehicle Quota
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min={subscription.subscribed_vehicles + 1}
                                            max="200"
                                            value={newQuota}
                                            onChange={(e) => setNewQuota(parseInt(e.target.value))}
                                            className="flex-1"
                                        />
                                        <input
                                            type="number"
                                            name="new_vehicle_quota"
                                            value={newQuota}
                                            onChange={(e) => setNewQuota(Math.max(subscription.subscribed_vehicles + 1, parseInt(e.target.value) || subscription.subscribed_vehicles + 1))}
                                            className="w-20 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        <span className="text-gray-600 dark:text-gray-400">vehicles</span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                                        Minimum: {subscription.subscribed_vehicles + 1} vehicles
                                    </p>
                                </div>

                                {errors.new_vehicle_quota && (
                                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.new_vehicle_quota}</div>
                                )}
                            </div>

                            {/* Pro-Rated Calculation */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/30 dark:bg-blue-900/20">
                                <h2 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-200">
                                    Pro-Rated Billing Calculation
                                </h2>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-blue-800 dark:text-blue-300">Days Remaining:</span>
                                        <span className="font-medium text-blue-900 dark:text-blue-200">{subscription.days_remaining} days</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-800 dark:text-blue-300">Current Daily Rate:</span>
                                        <span className="font-medium text-blue-900 dark:text-blue-200">
                                            Rp {(oldDailyRate / 1000).toLocaleString('id-ID')}k/day
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-800 dark:text-blue-300">New Daily Rate:</span>
                                        <span className="font-medium text-blue-900 dark:text-blue-200">
                                            Rp {(newDailyRate / 1000).toLocaleString('id-ID')}k/day
                                        </span>
                                    </div>
                                    <div className="border-t border-blue-200 pt-3 dark:border-blue-900/30">
                                        <div className="flex justify-between">
                                            <span className="text-blue-800 dark:text-blue-300">Additional Cost:</span>
                                            <span className="text-lg font-bold text-blue-900 dark:text-blue-200">
                                                Rp {(proratedAmount / 1000).toLocaleString('id-ID')}k
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* New Pricing */}
                            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    New Pricing (Starting Next Period)
                                </h2>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">New Tier</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            {newTier?.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">New Monthly Cost</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Rp {(newMonthlyPrice / 1000).toLocaleString('id-ID')}k
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        ✓ Pay <span className="font-bold">Rp {(proratedAmount / 1000).toLocaleString('id-ID')}k</span> now for the remaining {subscription.days_remaining} days
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
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
                                    disabled={processing || newQuota <= subscription.subscribed_vehicles}
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
