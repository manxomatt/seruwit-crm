<?php

namespace Tests\Feature\Modules\Orders;

use App\Models\Role;
use App\Models\User;
use App\Notifications\GenericNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Modules\Fleet\Models\Driver;
use Modules\Orders\Events\ShipmentStatusChanged;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Orders\Models\ProofOfDelivery;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripStop;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PodSubmissionTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    /**
     * A 1x1 transparent PNG as a base64 data URL — stands in for the signature
     * canvas and camera output.
     */
    private const IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array{0: User, 1: DeliveryOrder, 2: TripStop, 3: DeliveryOrderItem}
     */
    private function scenario(): array
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('slug', 'driver')->firstOrFail());
        $driver = Driver::factory()->create(['user_id' => $user->id]);

        $trip = Trip::factory()->inProgress()->create(['driver_id' => $driver->id]);
        $order = DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_IN_TRANSIT,
            'trip_id' => $trip->id,
        ]);
        $item = DeliveryOrderItem::factory()->create([
            'delivery_order_id' => $order->id,
            'quantity' => 10,
        ]);
        $stop = TripStop::factory()->create([
            'trip_id' => $trip->id,
            'type' => TripStop::TYPE_DROPOFF,
            'delivery_order_id' => $order->id,
            'status' => TripStop::STATUS_ARRIVED,
        ]);

        return [$user, $order, $stop, $item];
    }

    public function test_a_valid_pod_marks_the_order_delivered_and_stores_everything(): void
    {
        Storage::fake('public');
        Notification::fake();
        Event::fake([ShipmentStatusChanged::class]);

        $admin = $this->createAdminUser(); // staff recipient for the notification
        [$user, $order, $stop, $item] = $this->scenario();

        $this->actingAs($user)
            ->post(route('module.driver.pod.store', $order), [
                'recipient_name' => 'Ibu Sari',
                'signature' => self::IMAGE,
                'photos' => [self::IMAGE, self::IMAGE],
                'notes' => 'Diterima di gudang belakang.',
                'latitude' => -6.2,
                'longitude' => 106.8,
                'items' => [[
                    'delivery_order_item_id' => $item->id,
                    'accepted_quantity' => 8,
                    'rejected_quantity' => 1,
                    'returned_quantity' => 1,
                    'reason' => 'Kemasan rusak.',
                ]],
            ])
            ->assertRedirect(route('module.driver.trip', $order->trip_id))
            ->assertSessionHas('success');

        $order->refresh();
        $this->assertSame(DeliveryOrder::STATUS_DELIVERED, $order->status);
        $this->assertNotNull($order->delivered_at);
        $this->assertSame(TripStop::STATUS_COMPLETED, $stop->fresh()->status);

        $pod = ProofOfDelivery::where('delivery_order_id', $order->id)->firstOrFail();
        $this->assertSame('Ibu Sari', $pod->recipient_name);
        $this->assertSame($user->id, $pod->submitted_by);
        $this->assertSame($stop->id, $pod->trip_stop_id);
        $this->assertCount(2, $pod->photos);
        $this->assertCount(1, $pod->items);
        $this->assertNotNull($pod->signature_path);

        Storage::disk('public')->assertExists($pod->signature_path);
        foreach ($pod->photos as $photo) {
            Storage::disk('public')->assertExists($photo->path);
        }

        Event::assertDispatched(ShipmentStatusChanged::class);
        Notification::assertSentTo($admin, GenericNotification::class);
    }

    public function test_a_pod_without_signature_or_photos_is_accepted(): void
    {
        Storage::fake('public');
        [$user, $order, , $item] = $this->scenario();

        $this->actingAs($user)
            ->post(route('module.driver.pod.store', $order), [
                'recipient_name' => 'Pak Andi',
                'items' => [[
                    'delivery_order_item_id' => $item->id,
                    'accepted_quantity' => 10,
                    'rejected_quantity' => 0,
                    'returned_quantity' => 0,
                ]],
            ])
            ->assertSessionHas('success');

        $this->assertSame(DeliveryOrder::STATUS_DELIVERED, $order->fresh()->status);
    }

    public function test_quantities_exceeding_the_order_are_rejected(): void
    {
        [$user, $order, , $item] = $this->scenario();

        $this->actingAs($user)
            ->post(route('module.driver.pod.store', $order), [
                'recipient_name' => 'Over',
                'items' => [[
                    'delivery_order_item_id' => $item->id,
                    'accepted_quantity' => 20,
                    'rejected_quantity' => 0,
                    'returned_quantity' => 0,
                ]],
            ])
            ->assertSessionHasErrors('items.0.accepted_quantity');

        $this->assertSame(DeliveryOrder::STATUS_IN_TRANSIT, $order->fresh()->status);
        $this->assertDatabaseCount('proof_of_deliveries', 0);
    }

    public function test_a_reason_is_required_when_goods_are_rejected(): void
    {
        [$user, $order, , $item] = $this->scenario();

        $this->actingAs($user)
            ->post(route('module.driver.pod.store', $order), [
                'recipient_name' => 'NoReason',
                'items' => [[
                    'delivery_order_item_id' => $item->id,
                    'accepted_quantity' => 9,
                    'rejected_quantity' => 1,
                    'returned_quantity' => 0,
                ]],
            ])
            ->assertSessionHasErrors('items.0.reason');
    }

    public function test_a_driver_cannot_submit_a_pod_for_another_drivers_order(): void
    {
        [, $order, , $item] = $this->scenario();

        $intruderUser = User::factory()->create();
        $intruderUser->roles()->attach(Role::where('slug', 'driver')->firstOrFail());
        Driver::factory()->create(['user_id' => $intruderUser->id]);

        $this->actingAs($intruderUser)
            ->post(route('module.driver.pod.store', $order), [
                'recipient_name' => 'Intruder',
                'items' => [[
                    'delivery_order_item_id' => $item->id,
                    'accepted_quantity' => 10,
                    'rejected_quantity' => 0,
                    'returned_quantity' => 0,
                ]],
            ])
            ->assertForbidden();
    }

    public function test_an_already_delivered_order_cannot_be_pod_again(): void
    {
        [$user, $order, , $item] = $this->scenario();
        $order->update(['status' => DeliveryOrder::STATUS_DELIVERED, 'delivered_at' => now()]);

        $this->actingAs($user)
            ->post(route('module.driver.pod.store', $order), [
                'recipient_name' => 'Twice',
                'items' => [[
                    'delivery_order_item_id' => $item->id,
                    'accepted_quantity' => 10,
                    'rejected_quantity' => 0,
                    'returned_quantity' => 0,
                ]],
            ])
            ->assertForbidden();
    }
}
