import { Link, router } from '@inertiajs/react'
import DynamicLayout from '@/Layouts/DynamicLayout'
import PageHeader from '@/Components/PageHeader'
import { useState } from 'react'

interface Tier {
    id: number
    name: string
    min_vehicles: number
    max_vehicles: number
    price_per_vehicle: number
    created_at: string
}

interface Plan {
    id: number
    name: string
    description: string | null
    price: string | null
    annual_price: string | null
    is_popular: boolean
    modules_count: number
    tenants_count: number
    trial_days: number | null
}

interface Props {
    tiers: Tier[]
    plans: Plan[]
    stats: {
        total_tiers: number
        total_plans: number
        total_tenants_on_plans: number
    }
}

export default function BillingDashboard({ tiers, plans, stats }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'tiers' | 'plans'>('overview')

    const handleDeleteTier = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus tier ini?')) {
            router.delete(`/module/subscription-tiers/${id}`)
        }
    }

    const formatPrice = (price: string | null, currency = 'IDR') => {
        if (!price || price === '0') return '—'
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
            Number(price),
        )
    }

    return (
        <DynamicLayout header={<PageHeader title="Billing & Subscription Management" />}>
            <div className="mx-auto max-w-7xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Billing & Subscription Management
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage subscription plans, pricing tiers, and payment orders
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="mb-8 grid gap-4 md:grid-cols-3">
                    {/* Total Plans */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Plans</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_plans}
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Tiers */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pricing Tiers</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_tiers}
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Tenants on Plans */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Tenants on Plans</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_tenants_on_plans}
                                </p>
                            </div>
                            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'overview'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'plans'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            Plans
                        </button>
                        <button
                            onClick={() => setActiveTab('tiers')}
                            className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'tiers'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            Pricing Tiers
                        </button>
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Plans Overview */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Plans</h2>
                                <Link
                                    href="/module/plans"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                >
                                    View All Plans
                                </Link>
                            </div>
                            {plans.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {plans.slice(0, 4).map(plan => (
                                        <div key={plan.id} className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                                    {plan.description && (
                                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                                                    )}
                                                </div>
                                                {plan.is_popular && (
                                                    <span className="ml-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                                        Popular
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Modules: <span className="font-medium text-gray-900 dark:text-white">{plan.modules_count}</span>
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Tenants: <span className="font-medium text-gray-900 dark:text-white">{plan.tenants_count}</span>
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Price: <span className="font-medium text-gray-900 dark:text-white">{formatPrice(plan.price)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center dark:border-gray-600 dark:bg-gray-900">
                                    <p className="text-gray-600 dark:text-gray-400">No plans configured yet</p>
                                    <Link
                                        href="/module/plans"
                                        className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                    >
                                        Create First Plan
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Tiers Overview */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pricing Tiers</h2>
                                <Link
                                    href="/module/subscription-tiers"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                >
                                    Manage Tiers
                                </Link>
                            </div>
                            {tiers.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Tier</th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Vehicle Range</th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Price/Vehicle</th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tiers.map(tier => (
                                                <tr key={tier.id} className="border-b border-gray-200 dark:border-gray-700">
                                                    <td className="px-6 py-3 text-gray-900 dark:text-white">{tier.name}</td>
                                                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                                                        {tier.min_vehicles}-{tier.max_vehicles > 100000 ? '∞' : tier.max_vehicles}
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-900 dark:text-white">
                                                        Rp {(tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{tier.created_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center dark:border-gray-600 dark:bg-gray-900">
                                    <p className="text-gray-600 dark:text-gray-400">No pricing tiers configured yet</p>
                                    <Link
                                        href="/module/subscription-tiers/create"
                                        className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                    >
                                        Create First Tier
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Plans Tab */}
                {activeTab === 'plans' && (
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Plans</h2>
                            <Link
                                href="/module/plans/create"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                + New Plan
                            </Link>
                        </div>
                        {plans.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {plans.map(plan => (
                                    <div key={plan.id} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                                {plan.is_popular && (
                                                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                                        Popular
                                                    </span>
                                                )}
                                            </div>
                                            {plan.description && (
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                                            )}
                                        </div>
                                        <div className="px-6 py-4 space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Price</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(plan.price)}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600 dark:text-gray-400">Modules</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{plan.modules_count}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 dark:text-gray-400">Tenants</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{plan.tenants_count}</p>
                                                </div>
                                            </div>
                                            {plan.trial_days && (
                                                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                                                    {plan.trial_days} days trial
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                                            <Link
                                                href={`/module/plans/${plan.id}/edit`}
                                                className="block text-center rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-12 py-16 text-center dark:border-gray-600 dark:bg-gray-900">
                                <p className="text-gray-600 dark:text-gray-400">No plans configured yet</p>
                                <Link
                                    href="/module/plans/create"
                                    className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                >
                                    Create First Plan
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Tiers Tab */}
                {activeTab === 'tiers' && (
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pricing Tiers</h2>
                            <Link
                                href="/module/subscription-tiers/create"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                + New Tier
                            </Link>
                        </div>
                        {tiers.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {tiers.map(tier => (
                                    <div key={tier.id} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tier.name}</h3>
                                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                {tier.min_vehicles}-{tier.max_vehicles > 100000 ? '∞' : tier.max_vehicles} vehicles
                                            </p>
                                        </div>
                                        <div className="px-6 py-4">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Price per Vehicle</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    Rp {(tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k
                                                </p>
                                            </div>
                                            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Price Examples:</p>
                                                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                                    <p>• 5 vehicles: Rp {(5 * tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k</p>
                                                    <p>• 20 vehicles: Rp {(20 * tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k</p>
                                                    <p>• 50 vehicles: Rp {(50 * tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/module/subscription-tiers/${tier.id}/edit`}
                                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteTier(tier.id)}
                                                    className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-12 py-16 text-center dark:border-gray-600 dark:bg-gray-900">
                                <p className="text-gray-600 dark:text-gray-400">No pricing tiers configured yet</p>
                                <Link
                                    href="/module/subscription-tiers/create"
                                    className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                >
                                    Create First Tier
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DynamicLayout>
    )
}
