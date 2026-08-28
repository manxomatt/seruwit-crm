<?php

namespace Tests\Feature\Subscription;

use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PaymentOrderService;
use App\Services\SubscriptionService;
use Database\Seeders\PlanSeeder;
use Database\Seeders\SubscriptionTierSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class ProratedUpgradeBillingTest extends TestCase
{
    use DatabaseMigrations;

    private SubscriptionService $subscriptionService;

    private PaymentOrderService $paymentOrderService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([PlanSeeder::class, SubscriptionTierSeeder::class]);

        $this->subscriptionService = app(SubscriptionService::class);
        $this->paymentOrderService = app(PaymentOrderService::class);
    }

    private function createTenantWithActiveSubscription(int $vehicles = 8, int $daysRemaining = 15): array
    {
        $tenant = Tenant::create([
            'id' => uniqid('tenant-'),
            'name' => 'Upgrade Test Workspace',
        ]);

        $plan = Plan::where('key', 'trial')->firstOrFail();
        $now = now();
        $startsAt = $now->copy()->subDays(30 - $daysRemaining);
        $endsAt = $now->copy()->addDays($daysRemaining);

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'subscribed_vehicles' => $vehicles,
            'current_vehicle_count' => $vehicles,
            'subscription_type' => 'payg',
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'renewal_date' => $endsAt->toDateString(),
            'next_billing_date' => $endsAt,
            'auto_renew' => true,
            'status' => Subscription::STATUS_ACTIVE,
        ]);

        $tenant->update([
            'plan' => $plan->key,
            'subscription_type' => 'payg',
            'max_vehicles_allowed' => $vehicles,
            'subscription_id' => $subscription->id,
            'status' => 'active',
        ]);

        return [$tenant, $subscription];
    }

    public function test_calculate_prorated_upgrade_within_same_tier(): void
    {
        // 8 vehicles (Tier 1 @ 20.000) -> Upgrade to 10 vehicles (Tier 1 @ 20.000)
        // Sisa 15 hari dari 30 hari.
        // Old monthly = 8 * 20.000 = 160.000 (daily = 5.333,33)
        // New monthly = 10 * 20.000 = 200.000 (daily = 6.666,67)
        // Daily diff = 1.333,33. Prorated 15 days = 20.000
        [$tenant, $subscription] = $this->createTenantWithActiveSubscription(8, 15);

        $calculation = $this->subscriptionService->calculateProratedUpgrade($tenant, 10);

        $this->assertEquals(8, $calculation['current_vehicles']);
        $this->assertEquals(10, $calculation['new_vehicles']);
        $this->assertEquals(2, $calculation['additional_vehicles']);
        $this->assertEquals(15, $calculation['days_remaining']);
        $this->assertEquals(20000, $calculation['prorated_amount']);
    }

    public function test_calculate_prorated_upgrade_jumping_tier(): void
    {
        // 10 vehicles (Tier 1 @ 20.000 = 200.000/mo) -> Upgrade to 15 vehicles (Tier 2 @ 15.000 = 225.000/mo)
        // Sisa 15 hari dari 30 hari.
        // Old daily = 200.000 / 30 = 6.666,67
        // New daily = 225.000 / 30 = 7.500,00
        // Daily diff = 833,33. Prorated 15 days = 12.500
        [$tenant, $subscription] = $this->createTenantWithActiveSubscription(10, 15);

        $calculation = $this->subscriptionService->calculateProratedUpgrade($tenant, 15);

        $this->assertEquals(10, $calculation['current_vehicles']);
        $this->assertEquals(15, $calculation['new_vehicles']);
        $this->assertEquals(5, $calculation['additional_vehicles']);
        $this->assertEquals(12500, $calculation['prorated_amount']);
        $this->assertEquals('Tier 2 - Medium', $calculation['new_tier_name']);
    }

    public function test_calculate_prorated_upgrade_throws_if_new_count_not_greater(): void
    {
        [$tenant, $subscription] = $this->createTenantWithActiveSubscription(8, 15);

        $this->expectException(\InvalidArgumentException::class);
        $this->subscriptionService->calculateProratedUpgrade($tenant, 8);
    }

    public function test_upgrade_creates_pending_payment_order_with_type_upgrade(): void
    {
        [$tenant, $subscription] = $this->createTenantWithActiveSubscription(8, 15);

        $order = $this->subscriptionService->upgrade($tenant, 12);

        $this->assertInstanceOf(PaymentOrder::class, $order);
        $this->assertEquals('upgrade', $order->type);
        $this->assertEquals(12, $order->subscribed_vehicles);
        $this->assertEquals(8, $order->upgrade_from_vehicles);
        $this->assertEquals(PaymentOrder::STATUS_PENDING, $order->status);
        $this->assertGreaterThan(0, $order->prorated_amount);
        $this->assertEquals($order->prorated_amount + $order->unique_code, $order->total_amount);
    }

    public function test_confirming_upgrade_order_updates_quota_without_resetting_dates(): void
    {
        [$tenant, $subscription] = $this->createTenantWithActiveSubscription(8, 15);
        $originalEndsAt = $subscription->ends_at;

        $order = $this->subscriptionService->upgrade($tenant, 12);

        $admin = User::factory()->create();

        // Confirm the payment order via PaymentOrderService
        $updatedSubscription = $this->paymentOrderService->confirm($order, $admin);

        $this->assertNotNull($updatedSubscription);
        $this->assertEquals(12, $updatedSubscription->subscribed_vehicles);
        $this->assertEquals($originalEndsAt->toDateTimeString(), $updatedSubscription->ends_at->toDateTimeString());

        // Verify tenant quota is updated
        $tenant->refresh();
        $this->assertEquals(12, $tenant->max_vehicles_allowed);
    }
}
