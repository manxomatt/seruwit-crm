<?php

namespace Tests\Feature\Modules\Shuttle;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleCorridor;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttlePassenger;
use Modules\Shuttle\Models\ShuttleSchedule;
use Modules\Shuttle\Support\BookingConfirmationService;
use Modules\Shuttle\Support\DepartureRouteOptimizer;
use Modules\Shuttle\Support\ScheduleDepartureGenerator;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ShuttleCrudTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_are_redirected_from_shuttle_dashboard(): void
    {
        $this->get(route('module.shuttle.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_with_view_permission_sees_dashboard(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.shuttle.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Shuttle/Dashboard'));
    }

    public function test_can_create_corridor(): void
    {
        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.corridors.store'), [
                'code' => 'JKT-BDG',
                'name' => 'Jakarta – Bandung',
                'origin_city' => 'Jakarta',
                'destination_city' => 'Bandung',
                'base_fare' => 200000,
                'is_active' => true,
            ])
            ->assertRedirect(route('module.shuttle.corridors.index'));

        $this->assertDatabaseHas('shuttle_corridors', [
            'code' => 'JKT-BDG',
            'base_fare' => 200000,
        ]);
    }

    public function test_can_create_schedule_and_generate_departures(): void
    {
        $corridor = ShuttleCorridor::factory()->create(['code' => 'JKT-BDG']);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.schedules.store'), [
                'corridor_id' => $corridor->id,
                'code' => 'JKT-BDG-PAGI',
                'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
                'departure_time' => '07:00',
                'seat_capacity' => 7,
                'is_active' => true,
            ])
            ->assertRedirect();

        $schedule = ShuttleSchedule::query()->where('code', 'JKT-BDG-PAGI')->firstOrFail();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.schedules.generate', $schedule), [
                'from' => now()->toDateString(),
                'to' => now()->addDays(3)->toDateString(),
            ])
            ->assertRedirect();

        $this->assertGreaterThan(0, ShuttleDeparture::query()->where('schedule_id', $schedule->id)->count());
    }

    public function test_booking_confirm_locks_seats_and_rejects_overbook(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 2,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $partner = Partner::factory()->create();

        $booking = ShuttleBooking::factory()->create([
            'departure_id' => $departure->id,
            'partner_id' => $partner->id,
            'passenger_count' => 2,
            'unit_fare' => 200000,
            'total_fare' => 400000,
            'status' => ShuttleBooking::STATUS_DRAFT,
        ]);

        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'A']);
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'B']);

        app(BookingConfirmationService::class)->confirm($booking);

        $this->assertSame(2, $departure->fresh()->seats_booked);
        $this->assertSame(ShuttleBooking::STATUS_CONFIRMED, $booking->fresh()->status);

        $overbook = ShuttleBooking::factory()->create([
            'departure_id' => $departure->id,
            'partner_id' => $partner->id,
            'passenger_count' => 1,
            'unit_fare' => 200000,
            'total_fare' => 200000,
            'status' => ShuttleBooking::STATUS_DRAFT,
        ]);

        $this->expectException(\RuntimeException::class);
        app(BookingConfirmationService::class)->confirm($overbook);
    }

    public function test_route_optimizer_sequences_pickup_pool_and_dropoff(): void
    {
        $origin = Location::factory()->create([
            'name' => 'Pool Jakarta',
            'latitude' => -6.1769,
            'longitude' => 106.8306,
        ]);
        $destination = Location::factory()->create([
            'name' => 'Pool Bandung',
            'latitude' => -6.8885,
            'longitude' => 107.6186,
        ]);

        $corridor = ShuttleCorridor::factory()->create([
            'origin_location_id' => $origin->id,
            'destination_location_id' => $destination->id,
        ]);

        $departure = ShuttleDeparture::factory()->create([
            'corridor_id' => $corridor->id,
            'origin_pool_id' => $origin->id,
            'destination_pool_id' => $destination->id,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $partner = Partner::factory()->create();

        $booking = ShuttleBooking::factory()
            ->doorPickup()
            ->doorDropoff()
            ->confirmed()
            ->create([
                'departure_id' => $departure->id,
                'partner_id' => $partner->id,
                'pickup_lat' => -6.2607,
                'pickup_lng' => 106.8163,
                'dropoff_lat' => -6.9175,
                'dropoff_lng' => 107.6191,
            ]);

        // Confirm path increments seats in real flow; seed seats for manifest consistency.
        $departure->update(['seats_booked' => $booking->passenger_count]);

        $result = app(DepartureRouteOptimizer::class)->optimize($departure->fresh());

        $this->assertGreaterThanOrEqual(3, $result['stop_count']);
        $this->assertSame(ShuttleDeparture::STATUS_OPTIMIZED, $departure->fresh()->status);

        $types = $departure->fresh()->routeStops->pluck('stop_type')->all();
        $this->assertContains('pickup', $types);
        $this->assertContains('pool_origin', $types);
        $this->assertContains('pool_destination', $types);
        $this->assertContains('dropoff', $types);
    }

    public function test_http_confirm_booking(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);
        $partner = Partner::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.bookings.store'), [
                'departure_id' => $departure->id,
                'partner_id' => $partner->id,
                'passenger_count' => 1,
                'pickup_mode' => 'pool',
                'dropoff_mode' => 'pool',
                'passengers' => [
                    ['name' => 'Siti Demo', 'phone' => '0812', 'id_number' => null],
                ],
            ])
            ->assertRedirect();

        $booking = ShuttleBooking::query()->firstOrFail();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.bookings.confirm', $booking))
            ->assertRedirect();

        $this->assertSame(ShuttleBooking::STATUS_CONFIRMED, $booking->fresh()->status);
        $this->assertSame(1, $departure->fresh()->seats_booked);
    }

    public function test_schedule_generator_is_idempotent(): void
    {
        $schedule = ShuttleSchedule::factory()->create([
            'days_of_week' => [1, 2, 3, 4, 5, 6, 7],
            'departure_time' => '08:00:00',
        ]);

        $generator = app(ScheduleDepartureGenerator::class);
        $from = Carbon::today();
        $to = Carbon::today()->addDays(2);

        $first = $generator->generate($schedule->load('corridor', 'vehicle'), $from, $to);
        $second = $generator->generate($schedule->load('corridor', 'vehicle'), $from, $to);

        $this->assertSame($first['created']->count(), ShuttleDeparture::query()->where('schedule_id', $schedule->id)->count());
        $this->assertSame(0, $second['created']->count());
        $this->assertNotEmpty($second['skipped']);
    }
}
