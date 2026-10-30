<?php

namespace Tests\Feature\Modules\Rental;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalDispatch;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalDispatchTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_view_dispatch_index_page_with_metrics(): void
    {
        $user = $this->createAdminUser();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $customer = Partner::create([
            'code' => 'PTN-DISP-01',
            'name' => 'Budi Santoso',
            'phone' => '08123456789',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $customer->id,
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(3)->toDateString(),
        ]);

        $driver = Driver::factory()->create(['name' => 'Pak Joko Runner']);

        // 1. Scheduled today
        RentalDispatch::create([
            'rental_id' => $rental->id,
            'type' => RentalDispatch::TYPE_DELIVERY,
            'status' => RentalDispatch::STATUS_SCHEDULED,
            'scheduled_at' => Carbon::today()->setHour(9)->setMinute(0),
            'location_name' => 'Bandara Juanda T1',
            'contact_name' => $customer->name,
            'contact_phone' => $customer->phone,
        ]);

        // 2. En route today
        RentalDispatch::create([
            'rental_id' => $rental->id,
            'type' => RentalDispatch::TYPE_PICKUP,
            'driver_id' => $driver->id,
            'status' => RentalDispatch::STATUS_EN_ROUTE,
            'scheduled_at' => Carbon::today()->setHour(14)->setMinute(0),
            'location_name' => 'Hotel Tentrem',
            'contact_name' => $customer->name,
            'contact_phone' => $customer->phone,
        ]);

        $response = $this->actingAs($user)->get(route('module.rental.dispatch.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/RentalDispatch/Index')
            ->has('dispatches', 2)
            ->has('metrics')
            ->where('metrics.today_total', 2)
            ->where('metrics.unassigned_count', 1)
            ->where('metrics.en_route_count', 1)
            ->where('metrics.completed_today', 0)
        );
    }

    public function test_admin_can_store_dispatch_task_for_rental(): void
    {
        $user = $this->createAdminUser();

        $vehicle = Vehicle::factory()->create();
        $customer = Partner::create([
            'code' => 'PTN-DISP-02',
            'name' => 'Siti Nurhaliza',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $customer->id,
        ]);

        $payload = [
            'type' => 'delivery',
            'scheduled_at' => Carbon::tomorrow()->setHour(10)->setMinute(0)->toDateTimeString(),
            'location_name' => 'Stasiun Gubeng',
            'location_address' => 'Pintu Masuk Barat',
            'contact_name' => 'Siti Nurhaliza',
            'contact_phone' => '089988776655',
            'fee' => 100000,
            'fee_payer' => 'customer',
            'notes' => 'Tunggu di lobby kedatangan',
        ];

        $response = $this->actingAs($user)->post(
            route('module.rental.dispatch.store', $rental->id),
            $payload
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('rental_dispatches', [
            'rental_id' => $rental->id,
            'type' => 'delivery',
            'location_name' => 'Stasiun Gubeng',
            'fee' => 100000,
            'status' => 'scheduled',
        ]);
    }

    public function test_admin_can_assign_driver_to_dispatch(): void
    {
        $user = $this->createAdminUser();

        $vehicle = Vehicle::factory()->create();
        $rental = Rental::factory()->create(['vehicle_id' => $vehicle->id]);

        $dispatch = RentalDispatch::create([
            'rental_id' => $rental->id,
            'type' => 'delivery',
            'status' => 'scheduled',
            'scheduled_at' => Carbon::now()->addHour(),
            'location_name' => 'Hotel Ciputra',
        ]);

        $driver = Driver::factory()->create(['name' => 'Bambang Runner']);

        $response = $this->actingAs($user)->patch(
            route('module.rental.dispatch.assign', $dispatch->id),
            [
                'driver_id' => $driver->id,
                'notes' => 'Tugaskan runner pagi',
            ]
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $dispatch->refresh();
        $this->assertEquals($driver->id, $dispatch->driver_id);
        $this->assertEquals('assigned', $dispatch->status);
    }

    public function test_admin_can_advance_dispatch_status(): void
    {
        $user = $this->createAdminUser();

        $vehicle = Vehicle::factory()->create();
        $rental = Rental::factory()->create(['vehicle_id' => $vehicle->id]);
        $driver = Driver::factory()->create();

        $dispatch = RentalDispatch::create([
            'rental_id' => $rental->id,
            'type' => 'delivery',
            'driver_id' => $driver->id,
            'status' => 'assigned',
            'scheduled_at' => Carbon::now(),
            'location_name' => 'Bandara Ahmad Yani',
        ]);

        // Advance to en_route
        $response = $this->actingAs($user)->patch(
            route('module.rental.dispatch.status', $dispatch->id),
            [
                'status' => 'en_route',
                'start_odometer' => 54000,
                'start_fuel_level' => 'full',
            ]
        );

        $response->assertRedirect();
        $dispatch->refresh();
        $this->assertEquals('en_route', $dispatch->status);
        $this->assertNotNull($dispatch->dispatched_at);
        $this->assertEquals(54000, $dispatch->start_odometer);

        // Advance to completed
        $this->actingAs($user)->patch(
            route('module.rental.dispatch.status', $dispatch->id),
            ['status' => 'completed']
        );

        $dispatch->refresh();
        $this->assertEquals('completed', $dispatch->status);
        $this->assertNotNull($dispatch->completed_at);
    }

    public function test_admin_can_auto_generate_dispatches_for_rental(): void
    {
        $user = $this->createAdminUser();

        $vehicle = Vehicle::factory()->create();
        $customer = Partner::create([
            'code' => 'PTN-DISP-03',
            'name' => 'Doni Kusuma',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $customer->id,
            'start_date' => Carbon::now()->addDay()->toDateString(),
            'pickup_time' => '10:00:00',
            'pickup_location' => 'Bandara Soekarno Hatta T3',
            'end_date' => Carbon::now()->addDays(4)->toDateString(),
            'return_time' => '16:00:00',
            'return_location' => 'Hotel Mulia Senayan',
        ]);

        $response = $this->actingAs($user)->post(
            route('module.rental.dispatch.auto_generate', $rental->id)
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('rental_dispatches', [
            'rental_id' => $rental->id,
            'type' => 'delivery',
            'location_name' => 'Bandara Soekarno Hatta T3',
        ]);

        $this->assertDatabaseHas('rental_dispatches', [
            'rental_id' => $rental->id,
            'type' => 'pickup',
            'location_name' => 'Hotel Mulia Senayan',
        ]);
    }
}
