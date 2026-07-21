<?php

namespace Tests\Feature\Modules\Orders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\Orders\Models\DeliveryOrder;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DriverPortalTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    private function driverUser(?Driver &$driver = null): User
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('slug', 'driver')->firstOrFail());
        $driver = Driver::factory()->create(['user_id' => $user->id]);

        return $user;
    }

    public function test_a_staff_user_without_deliver_capability_cannot_reach_the_portal(): void
    {
        $staff = $this->createUserWithRole(); // read-only "user" role: orders,view but not deliver

        $this->actingAs($staff)->get(route('module.driver.today'))->assertForbidden();
    }

    public function test_a_driver_login_with_no_linked_driver_is_forbidden(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('slug', 'driver')->firstOrFail());

        $this->actingAs($user)->get(route('module.driver.today'))->assertForbidden();
    }

    public function test_a_driver_sees_only_their_own_trips_today(): void
    {
        $user = $this->driverUser($driver);
        $mine = Trip::factory()->create(['driver_id' => $driver->id, 'scheduled_at' => now()]);
        Trip::factory()->create(['scheduled_at' => now()]); // another driver

        $response = $this->actingAs($user)->get(route('module.driver.today'));

        $response->assertOk();
        $trips = $response->viewData('page')['props']['trips'];
        $this->assertCount(1, $trips);
        $this->assertSame($mine->id, $trips[0]['id']);
    }

    public function test_a_driver_cannot_open_another_drivers_trip(): void
    {
        $user = $this->driverUser($driver);
        $foreign = Trip::factory()->create();

        $this->actingAs($user)->get(route('module.driver.trip', $foreign))->assertForbidden();
    }

    public function test_a_driver_cannot_open_a_pod_form_for_another_drivers_order(): void
    {
        $user = $this->driverUser($driver);
        $foreignTrip = Trip::factory()->inProgress()->create();
        $order = DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_IN_TRANSIT,
            'trip_id' => $foreignTrip->id,
        ]);

        $this->actingAs($user)->get(route('module.driver.pod.create', $order))->assertForbidden();
    }

    public function test_starting_a_trip_moves_its_orders_in_transit(): void
    {
        $user = $this->driverUser($driver);
        $trip = Trip::factory()->create(['driver_id' => $driver->id, 'scheduled_at' => now()]);
        $order = DeliveryOrder::factory()->assigned($trip)->create();

        $this->actingAs($user)
            ->post(route('module.driver.trips.start', $trip))
            ->assertSessionHas('success');

        $this->assertSame(Trip::STATUS_IN_PROGRESS, $trip->fresh()->status);
        $this->assertSame(DeliveryOrder::STATUS_IN_TRANSIT, $order->fresh()->status);
    }
}
