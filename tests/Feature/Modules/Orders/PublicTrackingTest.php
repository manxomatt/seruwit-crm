<?php

namespace Tests\Feature\Modules\Orders;

use App\Models\Tenant;
use App\Modules\ModuleInstaller;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\OrdersModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * The unauthenticated /track/{token} page. Needs a real tenant schema because
 * the route is resolved on the tenant's own domain.
 */
class PublicTrackingTest extends TestCase
{
    use WithTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function ordersTenant(string $name, string $subdomain, string $email): Tenant
    {
        $tenant = $this->provisionTenant($name, $subdomain, $email);
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, app(OrdersModule::class));
        tenancy()->end();

        return $tenant;
    }

    public function test_a_valid_token_shows_the_shipment_without_pricing_or_driver(): void
    {
        $tenant = $this->ordersTenant('Track Co', 'track-co', 'owner@track-co.test');

        $token = $tenant->run(fn () => DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_IN_TRANSIT,
        ])->tracking_token);

        $this->get("http://track-co.localhost/track/{$token}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Track/Show')
                ->has('order.code')
                ->where('order.status', 'in_transit')
                ->missing('order.price')
                ->missing('order.trip')
            );
    }

    public function test_a_draft_order_is_not_public(): void
    {
        $tenant = $this->ordersTenant('Track Draft Co', 'track-draft-co', 'owner@track-draft.test');

        $token = $tenant->run(fn () => DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DRAFT,
        ])->tracking_token);

        $this->get("http://track-draft-co.localhost/track/{$token}")->assertNotFound();
    }

    public function test_a_cancelled_order_is_not_public(): void
    {
        $tenant = $this->ordersTenant('Track Cancel Co', 'track-cancel-co', 'owner@track-cancel.test');

        $token = $tenant->run(fn () => DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_CANCELLED,
        ])->tracking_token);

        $this->get("http://track-cancel-co.localhost/track/{$token}")->assertNotFound();
    }

    public function test_an_unknown_token_is_not_found(): void
    {
        $tenant = $this->ordersTenant('Track Unknown Co', 'track-unknown-co', 'owner@track-unknown.test');

        $this->get('http://track-unknown-co.localhost/track/'.str_repeat('x', 40))->assertNotFound();
    }

    public function test_every_order_gets_a_tracking_token_on_creation(): void
    {
        $tenant = $this->ordersTenant('Track Token Co', 'track-token-co', 'owner@track-token.test');

        $tenant->run(function () {
            $order = DeliveryOrder::factory()->create();
            $this->assertNotNull($order->tracking_token);
            $this->assertSame(40, strlen($order->tracking_token));
        });
    }
}
