<?php

namespace Tests\Feature\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionTier;
use App\Models\Tenant;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionPaygTest extends TestCase
{
    use RefreshDatabase;

    private SubscriptionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(SubscriptionService::class);
    }

    private function createTenant(string $id = null): Tenant
    {
        return Tenant::create([
            'id' => $id ?? uniqid('tenant-'),
            'name' => 'Test Workspace',
        ]);
    }

    public function test_subscription_tier_pricing_calculation(): void
    {
        // Tier 1: 1-10 vehicles @ Rp 20.000
        $price = SubscriptionTier::calculatePrice(5);
        $this->assertEquals(100000, $price); // 5 × 20.000

        // Tier 2: 11-50 vehicles @ Rp 15.000
        $price = SubscriptionTier::calculatePrice(25);
        $this->assertEquals(375000, $price); // 25 × 15.000

        // Tier 3: 51+ vehicles @ Rp 10.000
        $price = SubscriptionTier::calculatePrice(100);
        $this->assertEquals(1000000, $price); // 100 × 10.000
    }

    public function test_subscription_tier_for_vehicle_count(): void
    {
        $tier = SubscriptionTier::tierFor(5);
        $this->assertEquals('Tier 1 - Small', $tier->name);
        $this->assertEquals(1, $tier->min_vehicles);
        $this->assertEquals(10, $tier->max_vehicles);

        $tier = SubscriptionTier::tierFor(25);
        $this->assertEquals('Tier 2 - Medium', $tier->name);

        $tier = SubscriptionTier::tierFor(60);
        $this->assertEquals('Tier 3 - Large', $tier->name);
    }

    public function test_subscription_tier_price_breakdown(): void
    {
        $breakdown = SubscriptionTier::priceBreakdown(15, 'month');

        $this->assertEquals(15, $breakdown['vehicle_count']);
        $this->assertEquals('Tier 2 - Medium', $breakdown['tier_name']);
        $this->assertEquals(15000, $breakdown['price_per_vehicle']);
        $this->assertEquals(225000, $breakdown['total_price']);
        $this->assertEquals(25, $breakdown['discount_percent']); // 25% discount vs Tier 1
    }

    public function test_activate_subscription(): void
    {
        $tenant = $this->createTenant();
        $plan = Plan::where('key', 'trial')->firstOrFail();

        $subscription = $this->service->activate($tenant, $plan, false, 'month', 8);

        $this->assertNotNull($subscription->id);
        $this->assertEquals($tenant->id, $subscription->tenant_id);
        $this->assertEquals(8, $subscription->subscribed_vehicles);
        $this->assertEquals('payg', $subscription->subscription_type);
        $this->assertTrue($subscription->auto_renew);
        $this->assertEquals(Subscription::STATUS_ACTIVE, $subscription->status);

        // Verify tenant updated
        $tenant->refresh();
        $this->assertEquals('payg', $tenant->subscription_type);
        $this->assertEquals(8, $tenant->max_vehicles_allowed);
        $this->assertEquals($subscription->id, $tenant->subscription_id);
    }

    public function test_can_add_vehicle_during_trial(): void
    {
        $tenant = $this->createTenant();
        $tenant->update(['trial_ends_at' => now()->addDays(7)]);

        // During trial, unlimited vehicles
        $canAdd = $this->service->canAddVehicle($tenant, 50);
        $this->assertTrue($canAdd);
    }

    public function test_cannot_add_vehicle_after_quota_exceeded(): void
    {
        $tenant = $this->createTenant();
        $plan = Plan::where('key', 'trial')->firstOrFail();
        $this->service->activate($tenant, $plan, false, 'month', 5);

        // Current count = 4, quota = 5, can add
        $canAdd = $this->service->canAddVehicle($tenant, 4);
        $this->assertTrue($canAdd);

        // Current count = 5, quota = 5, cannot add
        $canAdd = $this->service->canAddVehicle($tenant, 5);
        $this->assertFalse($canAdd);
    }

    public function test_upgrade_subscription_mid_period(): void
    {
        $tenant = $this->createTenant();
        $plan = Plan::where('key', 'trial')->firstOrFail();
        $this->service->activate($tenant, $plan, false, 'month', 8);

        // Upgrade from 8 to 12 vehicles
        $paymentOrder = $this->service->upgrade($tenant, 12);

        $this->assertEquals('upgrade', $paymentOrder->type);
        $this->assertEquals(12, $paymentOrder->subscribed_vehicles);
        $this->assertEquals(8, $paymentOrder->upgrade_from_vehicles);
        $this->assertNotNull($paymentOrder->prorated_amount);
        $this->assertEquals(\App\Models\PaymentOrder::STATUS_PENDING, $paymentOrder->status);
    }

    public function test_confirm_upgrade(): void
    {
        $tenant = $this->createTenant();
        $plan = Plan::where('key', 'trial')->firstOrFail();
        $this->service->activate($tenant, $plan, false, 'month', 8);

        $paymentOrder = $this->service->upgrade($tenant, 12);

        // Mark as confirmed
        $paymentOrder->update(['status' => \App\Models\PaymentOrder::STATUS_CONFIRMED]);

        // Confirm upgrade in subscription
        $updated = $this->service->confirmUpgrade($paymentOrder);

        $this->assertEquals(12, $updated->subscribed_vehicles);
        $this->assertEquals(12, $updated->current_vehicle_count);

        $tenant->refresh();
        $this->assertEquals(12, $tenant->max_vehicles_allowed);
    }

    public function test_cancel_subscription(): void
    {
        $tenant = $this->createTenant();
        $plan = Plan::where('key', 'trial')->firstOrFail();
        $this->service->activate($tenant, $plan, false, 'month', 8);

        $this->service->cancel($tenant);

        $tenant->refresh();
        $subscription = $tenant->subscription;
        $this->assertEquals(Subscription::STATUS_CANCELLED, $subscription->status);
        $this->assertNotNull($subscription->cancelled_at);
        $this->assertEquals('suspended', $tenant->status);
        $this->assertTrue($tenant->is_trial_expired);
    }

    public function test_expire_trials(): void
    {
        $tenant1 = $this->createTenant('tenant-expired');
        $tenant1->update([
            'trial_ends_at' => now()->subDay(),
            'is_trial_expired' => false,
        ]);

        $tenant2 = $this->createTenant('tenant-active');
        $tenant2->update([
            'trial_ends_at' => now()->addDays(5),
            'is_trial_expired' => false,
        ]);

        $count = $this->service->expireTrials();

        $this->assertEquals(1, $count);

        $tenant1->refresh();
        $this->assertTrue($tenant1->is_trial_expired);
        $this->assertEquals('suspended', $tenant1->status);

        $tenant2->refresh();
        $this->assertFalse($tenant2->is_trial_expired);
    }

    public function test_renewal_creates_payment_order(): void
    {
        $tenant = $this->createTenant();
        $plan = Plan::where('key', 'trial')->firstOrFail();
        $subscription = $this->service->activate($tenant, $plan, false, 'month', 8);

        $paymentOrder = $this->service->renew($subscription);

        $this->assertEquals('renewal', $paymentOrder->type);
        $this->assertEquals(8, $paymentOrder->subscribed_vehicles);
        $this->assertNotNull($paymentOrder->total_amount);
        $this->assertEquals(8 * 20000, $paymentOrder->total_amount); // Tier 1 price
    }

    public function test_get_max_vehicles_allowed_on_trial(): void
    {
        $tenant = $this->createTenant();
        $tenant->update(['trial_ends_at' => now()->addDays(7)]);

        $max = $this->service->getMaxVehiclesAllowed($tenant);
        $this->assertNull($max); // Unlimited on trial
    }

    public function test_get_max_vehicles_allowed_with_subscription(): void
    {
        $tenant = $this->createTenant();
        $plan = Plan::where('key', 'trial')->firstOrFail();
        $this->service->activate($tenant, $plan, false, 'month', 15);

        $max = $this->service->getMaxVehiclesAllowed($tenant);
        $this->assertEquals(15, $max);
    }

    public function test_get_max_vehicles_allowed_no_subscription(): void
    {
        $tenant = $this->createTenant();
        $tenant->update([
            'trial_ends_at' => null,
            'is_trial_expired' => true,
        ]);

        $max = $this->service->getMaxVehiclesAllowed($tenant);
        $this->assertEquals(0, $max); // Blocked
    }
}
