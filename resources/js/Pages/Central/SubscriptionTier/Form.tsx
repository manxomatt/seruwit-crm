import { Form } from '@inertiajs/react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'

interface Props {
    tier?: {
        id: number
        name: string
        min_vehicles: number
        max_vehicles: number
        price_per_vehicle: number
    }
}

export default function TierForm({ tier }: Props) {
    const isEdit = !!tier
    const title = isEdit ? 'Edit Subscription Tier' : 'Create Subscription Tier'

    return (
        <DynamicLayout header={<PageHeader title={title} />}>
            <div className="mx-auto max-w-2xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </h1>
                </div>

                <Form action={isEdit ? `/module/subscription-tiers/${tier.id}` : '/module/subscription-tiers'} method={isEdit ? 'patch' : 'post'}>
                    {({ errors, processing, wasSuccessful }) => (
                        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                            {/* Tier Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tier Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    defaultValue={tier?.name}
                                    placeholder="e.g., Tier 1 - Small"
                                    className={`w-full rounded-lg border px-4 py-2 dark:bg-gray-700 dark:text-white ${
                                        errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                                )}
                            </div>

                            {/* Vehicle Range */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="min_vehicles" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Minimum Vehicles
                                    </label>
                                    <input
                                        type="number"
                                        id="min_vehicles"
                                        name="min_vehicles"
                                        defaultValue={tier?.min_vehicles || 1}
                                        min="1"
                                        className={`w-full rounded-lg border px-4 py-2 dark:bg-gray-700 dark:text-white ${
                                            errors.min_vehicles ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    />
                                    {errors.min_vehicles && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.min_vehicles}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="max_vehicles" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Maximum Vehicles
                                    </label>
                                    <input
                                        type="number"
                                        id="max_vehicles"
                                        name="max_vehicles"
                                        defaultValue={tier?.max_vehicles || 10}
                                        min="1"
                                        className={`w-full rounded-lg border px-4 py-2 dark:bg-gray-700 dark:text-white ${
                                            errors.max_vehicles ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    />
                                    {errors.max_vehicles && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.max_vehicles}</p>
                                    )}
                                </div>
                            </div>

                            {/* Price per Vehicle */}
                            <div>
                                <label htmlFor="price_per_vehicle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Price per Vehicle (Rupiah/Month)
                                </label>
                                <div className="flex items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Rp</span>
                                    <input
                                        type="number"
                                        id="price_per_vehicle"
                                        name="price_per_vehicle"
                                        defaultValue={tier?.price_per_vehicle || 20000}
                                        min="0"
                                        step="1000"
                                        className={`ml-2 flex-1 rounded-lg border px-4 py-2 dark:bg-gray-700 dark:text-white ${
                                            errors.price_per_vehicle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    />
                                    <span className="ml-2 text-gray-600 dark:text-gray-400">/month</span>
                                </div>
                                {errors.price_per_vehicle && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price_per_vehicle}</p>
                                )}
                            </div>

                            {/* Preview */}
                            <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                                <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Price Examples:
                                </p>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <p>
                                        • 5 vehicles: Rp{' '}
                                        {(
                                            5 * parseInt(document.querySelector<HTMLInputElement>('#price_per_vehicle')?.value || '20000' || '0')
                                        ).toLocaleString('id-ID')}
                                        /month
                                    </p>
                                    <p>
                                        • 20 vehicles: Rp{' '}
                                        {(
                                            20 * parseInt(document.querySelector<HTMLInputElement>('#price_per_vehicle')?.value || '20000' || '0')
                                        ).toLocaleString('id-ID')}
                                        /month
                                    </p>
                                    <p>
                                        • 50 vehicles: Rp{' '}
                                        {(
                                            50 * parseInt(document.querySelector<HTMLInputElement>('#price_per_vehicle')?.value || '20000' || '0')
                                        ).toLocaleString('id-ID')}
                                        /month
                                    </p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                                <p className="text-sm text-blue-900 dark:text-blue-200">
                                    <span className="font-semibold">Note:</span> Once a tier is saved, new subscriptions will use this pricing. Existing subscriptions keep their original pricing.
                                </p>
                            </div>

                            {/* Success Message */}
                            {wasSuccessful && (
                                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        ✓ Tier saved successfully!
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4">
                                <a
                                    href="/module/subscription-tiers"
                                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                                >
                                    {processing ? 'Saving...' : isEdit ? 'Update Tier' : 'Create Tier'}
                                </button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </DynamicLayout>
    )
}
