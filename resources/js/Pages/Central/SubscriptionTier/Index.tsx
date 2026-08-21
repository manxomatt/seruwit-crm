import { Link, router } from '@inertiajs/react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'

interface Tier {
    id: number
    name: string
    min_vehicles: number
    max_vehicles: number
    price_per_vehicle: number
    created_at: string
}

interface Props {
    tiers: Tier[]
}

export default function Index({ tiers }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this tier?')) {
            router.delete(`/module/subscription-tiers/${id}`)
        }
    }

    return (
        <DynamicLayout header={<PageHeader title="Subscription Tiers" />}>
            <div className="mx-auto max-w-5xl px-4 py-12">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Subscription Tiers
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Configure pricing tiers for vehicle-based subscription
                        </p>
                    </div>
                    <Link
                        href="/module/subscription-tiers/create"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                        + New Tier
                    </Link>
                </div>

                {/* Tiers Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tiers.map(tier => (
                        <div key={tier.id} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                            {/* Header */}
                            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {tier.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            {tier.min_vehicles}-{tier.max_vehicles > 100000 ? '∞' : tier.max_vehicles} vehicles
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-4">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Price per Vehicle</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                            Rp {(tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k
                                        </p>
                                    </div>

                                    {/* Discount Badge */}
                                    {tier.price_per_vehicle < 20000 && (
                                        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                                {Math.round((1 - (tier.price_per_vehicle / 20000)) * 100)}% discount vs Tier 1
                                            </p>
                                        </div>
                                    )}

                                    {/* Price Examples */}
                                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Price Examples:</p>
                                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                            <p>• 5 units: Rp {(5 * tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k</p>
                                            <p>• 20 units: Rp {(20 * tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k</p>
                                            <p>• 50 units: Rp {(50 * tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer - Actions */}
                            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                                <div className="flex gap-2">
                                    <Link
                                        href={`/module/subscription-tiers/${tier.id}/edit`}
                                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(tier.id)}
                                        className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {tiers.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-12 py-16 text-center dark:border-gray-600 dark:bg-gray-900">
                        <p className="text-gray-600 dark:text-gray-400">
                            No subscription tiers configured yet.
                        </p>
                        <Link
                            href="/module/subscription-tiers/create"
                            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            Create First Tier
                        </Link>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-12 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        How Tier Pricing Works
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                        <li>• Tenants select how many vehicles they want to manage</li>
                        <li>• The applicable tier is auto-selected based on vehicle count</li>
                        <li>• Price is calculated as: vehicle_count × price_per_vehicle</li>
                        <li>• Tiers can be configured with any min/max range</li>
                        <li>• Changes apply to new subscriptions immediately</li>
                    </ul>
                </div>
            </div>
        </DynamicLayout>
    )
}
