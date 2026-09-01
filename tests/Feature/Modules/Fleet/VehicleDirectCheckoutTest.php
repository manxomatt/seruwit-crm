<?php

namespace Tests\Feature\Modules\Fleet;

use App\Models\PaymentOrder;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PaymentOrderService;
use Carbon\Carbon;
use Database\Seeders\PlanSeeder;
use Database\Seeders\SubscriptionTierSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleCheckoutService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class VehicleDirectCheckoutTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    private User $user;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->seed(PlanSeeder::class);
        $this->seed(SubscriptionTierSeeder::class);
        $this->setUpRoles();
        $this->user = $this->createAdminUser();

        $this->tenant = Tenant::withoutEvents(function (): Tenant {
            return Tenant::create([
                'id' => fake()->uuid(),
                'name' => 'Direct Checkout Fleet',
                'status' => 'active',
                'plan' => 'starter',
                'unit_capacity_credits' => 0,
                'provision' => ['owner_global_id' => fake()->uuid()],
            ]);
        });
        $this->tenant->domains()->create(['domain' => 'directfleet.seruwit.test']);

        app()->instance('tenant', $this->tenant);
    }

    public function test_service_can_calculate_pricing_with_discounts(): void
    {
        $service = app(VehicleCheckoutService::class);

        // 2 vehicles for 1 month
        $pricing1 = $service->calculatePrice([1, 2], 1);
        $this->assertEquals(2, $pricing1['vehicle_count']);
        $this->assertEquals(1, $pricing1['duration_months']);
        $this->assertEquals(0, $pricing1['discount_percent']);
        $this->assertEquals(40000.0, $pricing1['total_amount']);

        // 2 vehicles for 12 months (20% discount)
        $pricing12 = $service->calculatePrice([1, 2], 12);
        $this->assertEquals(20, $pricing12['discount_percent']);
        $this->assertEquals(480000.0, $pricing12['subtotal']);
        $this->assertEquals(96000.0, $pricing12['discount_amount']);
        $this->assertEquals(384000.0, $pricing12['total_amount']);
    }

    public function test_endpoint_can_calculate_checkout_price(): void
    {
        $v1 = Vehicle::factory()->create(['status' => Vehicle::STATUS_INACTIVE]);
        $v2 = Vehicle::factory()->create(['status' => Vehicle::STATUS_INACTIVE]);

        $response = $this->actingAs($this->user)
            ->postJson(route('module.fleet.vehicles.checkout.calculate'), [
                'vehicle_ids' => [$v1->id, $v2->id],
                'duration_months' => 6,
            ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'vehicle_count' => 2,
                'duration_months' => 6,
                'discount_percent' => 10,
            ],
        ]);
    }

    public function test_endpoint_can_create_checkout_order(): void
    {
        $v1 = Vehicle::factory()->create(['status' => Vehicle::STATUS_INACTIVE]);
        $v2 = Vehicle::factory()->create(['status' => Vehicle::STATUS_INACTIVE]);

        $response = $this->actingAs($this->user)
            ->postJson(route('module.fleet.vehicles.checkout'), [
                'vehicle_ids' => [$v1->id, $v2->id],
                'duration_months' => 3,
                'payment_method' => 'manual_transfer',
            ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'order_id',
            'redirect_url',
        ]);

        $orderId = $response->json('order_id');
        $order = PaymentOrder::find($orderId);
        $this->assertNotNull($order);
        $this->assertEquals(PaymentOrder::TYPE_VEHICLE_CHECKOUT, $order->type);
        $this->assertEquals(2, $order->subscribed_vehicles);
        $this->assertEquals(PaymentOrder::STATUS_PENDING, $order->status);
        $this->assertEquals([$v1->id, $v2->id], $order->gateway_data['vehicle_ids']);
    }

    public function test_confirming_checkout_order_activates_vehicles(): void
    {
        $v1 = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_INACTIVE,
            'is_trial' => true,
            'active_until' => Carbon::now()->subDay(),
        ]);
        $v2 = Vehicle::factory()->create([
            'status' => Vehicle::STATUS_INACTIVE,
            'is_trial' => false,
            'active_until' => null,
        ]);

        $checkoutService = app(VehicleCheckoutService::class);
        $order = $checkoutService->createCheckoutOrder($this->tenant, [$v1->id, $v2->id], 3);

        $admin = $this->createAdminUser();
        $paymentOrderService = app(PaymentOrderService::class);
        $paymentOrderService->confirmOrder($order, $admin);

        $v1->refresh();
        $v2->refresh();

        $this->assertEquals(Vehicle::STATUS_ACTIVE, $v1->status);
        $this->assertFalse((bool) $v1->is_trial);
        $this->assertNotNull($v1->active_until);
        $this->assertTrue($v1->active_until->isFuture());

        $this->assertEquals(Vehicle::STATUS_ACTIVE, $v2->status);
        $this->assertFalse((bool) $v2->is_trial);
        $this->assertNotNull($v2->active_until);
        $this->assertTrue($v2->active_until->isFuture());
    }
}
