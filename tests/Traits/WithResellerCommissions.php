<?php

namespace Tests\Traits;

use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\ResellerProfile;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PaymentOrderService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Fixtures for the reseller commission ledger.
 *
 * Tenants are inserted straight into the central table rather than provisioned
 * through CreateTenantAction: commission accrual never touches a tenant schema,
 * so paying for real schema creation would buy the tests nothing.
 */
trait WithResellerCommissions
{
    protected function makeReseller(): User
    {
        return User::factory()->create();
    }

    protected function makePlan(float $price = 1_000_000, string $key = 'commission-basic'): Plan
    {
        return Plan::query()->create([
            'key' => $key,
            'name' => 'Commission Test Plan',
            'modules' => [],
            'sort_order' => 90,
            'is_default' => false,
            'price' => $price,
            'annual_price' => $price * 10,
            'currency' => 'IDR',
            'interval' => 'month',
            'trial_days' => 0,
            'is_trial' => false,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected function makeTenant(?string $resellerGlobalId = null, array $attributes = []): Tenant
    {
        $id = $attributes['id'] ?? 'tenant-'.Str::lower(Str::random(10));
        unset($attributes['id']);

        DB::table('tenants')->insert(array_merge([
            'id' => $id,
            'name' => 'Commission Test Tenant',
            'status' => 'active',
            'data' => null,
            'trial_ends_at' => null,
            'is_trial_expired' => false,
            'reseller_global_id' => $resellerGlobalId,
            'reseller_attributed_at' => $resellerGlobalId ? now() : null,
            'created_at' => now(),
            'updated_at' => now(),
        ], $attributes));

        return Tenant::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected function makeProfile(User $reseller, array $attributes = []): ResellerProfile
    {
        return ResellerProfile::query()->create(array_merge([
            'reseller_global_id' => $reseller->global_id,
            'referral_code' => ResellerProfile::generateReferralCode(),
            'status' => ResellerProfile::STATUS_ACTIVE,
        ], $attributes));
    }

    protected function makeOrder(Tenant $tenant, Plan $plan, string $type = 'activate', string $interval = 'month'): PaymentOrder
    {
        return app(PaymentOrderService::class)->createOrder($tenant, $plan, $type, $interval);
    }

    /**
     * Run a payment all the way through admin confirmation — the only path that
     * produces a commission.
     */
    protected function confirmOrder(PaymentOrder $order): PaymentOrder
    {
        app(PaymentOrderService::class)->confirm($order, User::factory()->create());

        return $order->fresh();
    }
}
