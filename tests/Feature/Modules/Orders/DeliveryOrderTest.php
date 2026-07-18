<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Customer\Models\Customer;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DeliveryOrderTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('module.orders.index'))->assertRedirect(route('login'));
    }

    public function test_the_order_index_renders(): void
    {
        $user = $this->createAdminUser();
        DeliveryOrder::factory()->count(3)->create();

        $this->actingAs($user)->get(route('module.orders.index'))->assertOk();
    }

    public function test_an_order_can_be_created_as_a_draft_with_a_sequential_code(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create();

        $this->actingAs($user)->post(route('module.orders.store'), [
            'customer_id' => $customer->id,
            'order_date' => now()->toDateString(),
            'pickup_address' => 'Gudang A, Jakarta',
            'delivery_address' => 'Toko B, Bandung',
        ])->assertRedirect();

        $order = DeliveryOrder::first();
        $this->assertSame(DeliveryOrder::STATUS_DRAFT, $order->status);
        $this->assertSame('DO-000001', $order->code);
    }

    public function test_only_a_draft_order_can_be_edited(): void
    {
        $user = $this->createAdminUser();
        $draft = DeliveryOrder::factory()->create();
        $confirmed = DeliveryOrder::factory()->confirmed()->create();

        $this->actingAs($user)->patch(route('module.orders.update', $draft), [
            'pickup_address' => 'Gudang Baru',
        ])->assertRedirect(route('module.orders.show', $draft));

        $this->assertSame('Gudang Baru', $draft->fresh()->pickup_address);

        $this->actingAs($user)->patch(route('module.orders.update', $confirmed), [
            'pickup_address' => 'Gudang Baru',
        ])->assertSessionHas('error');

        $this->assertNotSame('Gudang Baru', $confirmed->fresh()->pickup_address);
    }

    public function test_only_a_draft_order_can_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $draft = DeliveryOrder::factory()->create();
        $confirmed = DeliveryOrder::factory()->confirmed()->create();

        $this->actingAs($user)->delete(route('module.orders.destroy', $confirmed))->assertSessionHas('error');
        $this->assertDatabaseHas('delivery_orders', ['id' => $confirmed->id]);

        $this->actingAs($user)->delete(route('module.orders.destroy', $draft))
            ->assertRedirect(route('module.orders.index'));
        $this->assertDatabaseMissing('delivery_orders', ['id' => $draft->id]);
    }

    public function test_confirming_requires_at_least_one_item(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create();

        $this->actingAs($user)->post(route('module.orders.confirm', $order))->assertSessionHas('error');
        $this->assertSame(DeliveryOrder::STATUS_DRAFT, $order->fresh()->status);
    }

    public function test_a_draft_order_with_items_can_be_confirmed(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create();
        DeliveryOrderItem::factory()->create(['delivery_order_id' => $order->id]);

        $this->actingAs($user)->post(route('module.orders.confirm', $order))->assertSessionHas('success');

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_CONFIRMED, $order->status);
        $this->assertNotNull($order->confirmed_at);
    }

    public function test_a_confirmed_order_can_be_cancelled_with_a_reason(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->confirmed()->create();

        $this->actingAs($user)->post(route('module.orders.cancel', $order), [
            'cancelled_reason' => 'Customer withdrew the request',
        ])->assertSessionHas('success');

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_CANCELLED, $order->status);
        $this->assertSame('Customer withdrew the request', $order->cancelled_reason);
    }

    public function test_an_assigned_order_cannot_be_cancelled(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create(['status' => DeliveryOrder::STATUS_ASSIGNED]);

        $this->actingAs($user)->post(route('module.orders.cancel', $order), [
            'cancelled_reason' => 'Too late',
        ])->assertSessionHas('error');

        $this->assertSame(DeliveryOrder::STATUS_ASSIGNED, $order->fresh()->status);
    }
}
