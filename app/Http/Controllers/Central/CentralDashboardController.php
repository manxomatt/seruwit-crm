<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\InstalledModule;
use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\Tenant;
use App\Modules\Facades\Modules;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CentralDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantQuery = Tenant::query();

        $totalTenants = (clone $tenantQuery)->count();
        $activeTenants = (clone $tenantQuery)->where('status', 'active')->count();
        $suspendedTenants = (clone $tenantQuery)->where('status', 'suspended')->count();

        $now = Carbon::now();
        $onTrialTenants = (clone $tenantQuery)
            ->where('status', 'active')
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '>', $now)
            ->count();

        // Financial KPIs
        $completedPaymentQuery = PaymentOrder::where('status', 'completed');
        $totalRevenue = (float) $completedPaymentQuery->sum('amount');

        $mrr = (float) PaymentOrder::where('status', 'completed')
            ->where('created_at', '>=', $now->copy()->subDays(30))
            ->sum('amount');

        $pendingPaymentsCount = PaymentOrder::where('status', 'pending_confirmation')->count();

        // Recent Pending Payment Orders
        $pendingPaymentOrders = PaymentOrder::query()
            ->with(['tenant', 'plan'])
            ->where('status', 'pending_confirmation')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (PaymentOrder $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number ?? "ORD-{$order->id}",
                'tenant_id' => $order->tenant_id,
                'tenant_name' => $order->tenant->name ?? 'N/A',
                'plan_name' => $order->plan->name ?? ($order->metadata['plan_name'] ?? 'Subscription'),
                'amount' => (float) $order->amount,
                'payment_method' => $order->payment_method ?? 'manual_transfer',
                'proof_url' => $order->payment_proof_path ? asset("storage/{$order->payment_proof_path}") : null,
                'created_at' => $order->created_at->diffForHumans(),
            ]);

        // Recent Tenant Registrations
        $recentTenants = Tenant::query()
            ->latest()
            ->limit(6)
            ->get()
            ->map(function (Tenant $tenant) {
                $primaryDomain = $tenant->domains->first()?->domain;

                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'status' => $tenant->status,
                    'domain' => $primaryDomain,
                    'full_url' => $primaryDomain ? "https://{$primaryDomain}" : null,
                    'created_at' => $tenant->created_at?->format('d M Y, H:i') ?? 'N/A',
                    'is_on_trial' => (bool) $tenant->is_on_trial,
                    'trial_ends_at' => $tenant->trial_ends_at?->format('d M Y'),
                ];
            });

        // Plan distribution
        $plans = Plan::all();
        $allTenants = Tenant::all();
        $planDistribution = $plans->map(function (Plan $plan) use ($allTenants) {
            $planKey = $plan->key ?? $plan->code ?? (string) $plan->id;
            $count = $allTenants->filter(function (Tenant $tenant) use ($planKey, $plan) {
                $tenantPlan = $tenant->planKey();

                return $tenantPlan === $planKey || $tenantPlan === $plan->code || (string) $tenant->plan === (string) $plan->id;
            })->count();

            return [
                'id' => $plan->id,
                'name' => $plan->name,
                'code' => $plan->code ?? $plan->key ?? "plan-{$plan->id}",
                'price' => (float) ($plan->price ?? 0),
                'tenant_count' => $count,
            ];
        });

        // Monthly Tenant Growth (Last 6 Months)
        $growthMonths = collect(range(5, 0))->map(function ($i) use ($now) {
            $month = $now->copy()->subMonths($i);
            $count = Tenant::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count();

            return [
                'month' => $month->format('M Y'),
                'count' => $count,
            ];
        });

        // Module Registry & Catalog Overview
        $catalog = Modules::all();
        $totalModulesCount = count($catalog);
        $disabledModulesCount = \App\Models\ModuleSetting::query()->where('is_enabled', false)->count();
        $activeModulesCount = $totalModulesCount - $disabledModulesCount;

        // Top installed modules on the central schema (guarded: the table only
        // exists once the central installed_modules migration has run). The
        // column is `key`, matching the installed_modules migration.
        $topInstalledModules = \Illuminate\Support\Facades\Schema::hasTable('installed_modules')
            ? InstalledModule::query()
                ->installed()
                ->select('key', DB::raw('count(*) as install_count'))
                ->groupBy('key')
                ->orderByDesc('install_count')
                ->limit(5)
                ->get()
                ->map(function ($item) use ($catalog) {
                    $moduleObj = $catalog[$item->key] ?? null;

                    return [
                        'key' => $item->key,
                        'label' => $moduleObj ? $moduleObj->label() : ucfirst($item->key),
                        'count' => (int) $item->install_count,
                    ];
                })
            : collect();

        return Inertia::render('Central/AdminDashboard', [
            'kpis' => [
                'total_tenants' => $totalTenants,
                'active_tenants' => $activeTenants,
                'on_trial_tenants' => $onTrialTenants,
                'suspended_tenants' => $suspendedTenants,
                'total_revenue' => $totalRevenue,
                'mrr' => $mrr,
                'pending_payments_count' => $pendingPaymentsCount,
                'active_modules_count' => $activeModulesCount,
                'total_modules_count' => $totalModulesCount,
            ],
            'pendingPaymentOrders' => $pendingPaymentOrders,
            'recentTenants' => $recentTenants,
            'planDistribution' => $planDistribution,
            'growthMonths' => $growthMonths,
            'moduleStats' => [
                'total' => $totalModulesCount,
                'active' => $activeModulesCount,
                'disabled' => $disabledModulesCount,
                'topInstalled' => $topInstalledModules,
            ],
        ]);
    }
}
