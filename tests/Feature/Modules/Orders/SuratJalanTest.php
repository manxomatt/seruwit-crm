<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SuratJalanTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_an_assigned_order_streams_a_pdf_surat_jalan(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create();
        DeliveryOrderItem::factory()->count(2)->create(['delivery_order_id' => $order->id]);

        $response = $this->actingAs($user)->get(route('module.orders.surat-jalan', $order));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_a_draft_order_has_no_surat_jalan(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create();

        $this->actingAs($user)
            ->from(route('module.orders.show', $order))
            ->get(route('module.orders.surat-jalan', $order))
            ->assertRedirect(route('module.orders.show', $order));
    }
}
