<?php

namespace Tests\Feature\Modules\Orders;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\PodItem;
use Modules\Orders\Models\PodPhoto;
use Modules\Orders\Models\ProofOfDelivery;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ProofOfDeliveryViewingTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_staff_order_page_carries_the_pod_panel_data(): void
    {
        $admin = $this->createAdminUser();
        $trip = Trip::factory()->completed()->create();
        $order = DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'trip_id' => $trip->id,
            'delivered_at' => now(),
        ]);
        $pod = ProofOfDelivery::factory()->create([
            'delivery_order_id' => $order->id,
            'recipient_name' => 'Ibu Sari',
        ]);
        PodPhoto::factory()->create(['proof_of_delivery_id' => $pod->id]);
        PodItem::factory()->create(['proof_of_delivery_id' => $pod->id]);

        $response = $this->actingAs($admin)->get(route('module.orders.show', $order));

        $response->assertOk();
        $props = $response->viewData('page')['props'];
        $this->assertSame('Ibu Sari', $props['order']['pod']['recipient_name']);
        $this->assertCount(1, $props['order']['pod']['photos']);
        $this->assertCount(1, $props['order']['pod']['items']);
    }

    public function test_public_track_reveals_the_recipient_only_once_delivered(): void
    {
        $trip = Trip::factory()->inProgress()->create();
        $order = DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_IN_TRANSIT,
            'trip_id' => $trip->id,
        ]);
        ProofOfDelivery::factory()->create([
            'delivery_order_id' => $order->id,
            'recipient_name' => 'Ibu Sari',
        ]);

        // In transit: the POD exists but the recipient must stay hidden.
        $response = $this->get(route('track.show', $order->tracking_token));
        $this->assertNull($response->viewData('page')['props']['order']['recipient_name']);

        $order->update(['status' => DeliveryOrder::STATUS_DELIVERED, 'delivered_at' => now()]);

        $response = $this->get(route('track.show', $order->tracking_token));
        $this->assertSame('Ibu Sari', $response->viewData('page')['props']['order']['recipient_name']);
    }

    public function test_public_track_never_exposes_signature_photos_or_gps(): void
    {
        $order = DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);
        ProofOfDelivery::factory()->create([
            'delivery_order_id' => $order->id,
            'signature_path' => 'pod/signatures/x.png',
            'latitude' => -6.2,
            'longitude' => 106.8,
        ]);

        $props = $this->get(route('track.show', $order->tracking_token))->viewData('page')['props'];

        $this->assertArrayNotHasKey('signature_url', $props['order']);
        $this->assertArrayNotHasKey('latitude', $props['order']);
        $this->assertArrayNotHasKey('photos', $props['order']);
    }

    public function test_deleting_a_pod_cascades_to_photos_and_items(): void
    {
        $pod = ProofOfDelivery::factory()->create();
        PodPhoto::factory()->count(2)->create(['proof_of_delivery_id' => $pod->id]);
        PodItem::factory()->create(['proof_of_delivery_id' => $pod->id]);

        $pod->delete();

        $this->assertDatabaseCount('pod_photos', 0);
        $this->assertDatabaseCount('pod_items', 0);
    }

    public function test_deleting_an_order_cascades_to_its_pod(): void
    {
        $order = DeliveryOrder::factory()->create();
        ProofOfDelivery::factory()->create(['delivery_order_id' => $order->id]);

        $order->delete();

        $this->assertDatabaseCount('proof_of_deliveries', 0);
    }
}
