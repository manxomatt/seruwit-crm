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
        $cities = $this->seedCitiesAndPools();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.corridors.store'), [
                'code' => 'JKT-BDG',
                'name' => 'Jakarta – Bandung',
                'origin_city_id' => $cities['jakarta']->id,
                'destination_city_id' => $cities['bandung']->id,
                'origin_pool_id' => $cities['originPool']->id,
                'destination_pool_id' => $cities['destinationPool']->id,
                'service_type' => 'pool',
                'base_fare' => 200000,
                'is_active' => true,
            ])
            ->assertRedirect(route('module.shuttle.corridors.index'));

        $this->assertDatabaseHas('shuttle_corridors', [
            'code' => 'JKT-BDG',
            'base_fare' => 200000,
            'service_type' => 'pool',
            'origin_city_id' => $cities['jakarta']->id,
            'destination_city_id' => $cities['bandung']->id,
        ]);
    }

    public function test_corridors_index_exposes_city_labels_as_strings(): void
    {
        $cities = $this->seedCitiesAndPools();

        ShuttleCorridor::query()->create([
            'code' => 'JKT-BDG',
            'name' => 'Jakarta – Bandung',
            'origin_city' => $cities['jakarta']->name,
            'destination_city' => $cities['bandung']->name,
            'origin_city_id' => $cities['jakarta']->id,
            'destination_city_id' => $cities['bandung']->id,
            'origin_pool_id' => $cities['originPool']->id,
            'destination_pool_id' => $cities['destinationPool']->id,
            'origin_location_id' => $cities['originPool']->location_id,
            'destination_location_id' => $cities['destinationPool']->location_id,
            'service_type' => 'pool',
            'base_fare' => 200000,
            'is_active' => true,
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.shuttle.corridors.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Shuttle/Corridors/Index')
                ->where('corridors.data.0.origin_city', $cities['jakarta']->name)
                ->where('corridors.data.0.destination_city', $cities['bandung']->name)
            );
    }

    public function test_can_create_door_corridor_product(): void
    {
        $cities = $this->seedCitiesAndPools();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.corridors.store'), [
                'code' => 'JKT-BDG-DOOR',
                'name' => 'Jakarta – Bandung Door',
                'origin_city_id' => $cities['jakarta']->id,
                'destination_city_id' => $cities['bandung']->id,
                'origin_pool_id' => $cities['originPool']->id,
                'destination_pool_id' => $cities['destinationPool']->id,
                'service_type' => 'door',
                'base_fare' => 250000,
                'is_active' => true,
            ])
            ->assertRedirect(route('module.shuttle.corridors.index'));

        $this->assertDatabaseHas('shuttle_corridors', [
            'code' => 'JKT-BDG-DOOR',
            'service_type' => 'door',
            'base_fare' => 250000,
        ]);
    }

    public function test_can_manage_settings_cities_and_pools(): void
    {
        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.settings.cities.store'), [
                'code' => 'JKT',
                'name' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'is_active' => true,
            ])
            ->assertRedirect();

        $city = \Modules\Shuttle\Models\ShuttleCity::query()->where('code', 'JKT')->firstOrFail();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.settings.pools.store'), [
                'city_id' => $city->id,
                'code' => 'POOL-GMB',
                'name' => 'Pool Gambir',
                'address' => 'Jl. Medan Merdeka Timur',
                'latitude' => -6.1769,
                'longitude' => 106.8306,
                'is_origin' => true,
                'is_destination' => true,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('shuttle_pools', [
            'code' => 'POOL-GMB',
            'city_id' => $city->id,
        ]);
        $this->assertDatabaseHas('locations', [
            'code' => 'SH-POOL-GMB',
            'name' => 'Pool Gambir',
        ]);

        $this->actingAs($this->createAdminUser())
            ->patch(route('module.shuttle.settings.general'), [
                'default_seat_capacity' => 12,
                'default_pickup_cutoff_minutes' => 60,
                'default_pool_base_fare' => 180000,
                'default_door_base_fare' => 220000,
            ])
            ->assertRedirect();

        $this->assertSame('12', \Modules\Shuttle\Models\ShuttleSetting::getValue('default_seat_capacity'));
    }

    /**
     * @return array{jakarta: \Modules\Shuttle\Models\ShuttleCity, bandung: \Modules\Shuttle\Models\ShuttleCity, originPool: \Modules\Shuttle\Models\ShuttlePool, destinationPool: \Modules\Shuttle\Models\ShuttlePool}
     */
    private function seedCitiesAndPools(): array
    {
        $jakarta = \Modules\Shuttle\Models\ShuttleCity::query()->create([
            'code' => 'JKT',
            'name' => 'Jakarta',
            'is_active' => true,
        ]);
        $bandung = \Modules\Shuttle\Models\ShuttleCity::query()->create([
            'code' => 'BDG',
            'name' => 'Bandung',
            'is_active' => true,
        ]);

        $originLocation = Location::factory()->create([
            'code' => 'LOC-JKT',
            'latitude' => -6.1769,
            'longitude' => 106.8306,
        ]);
        $destinationLocation = Location::factory()->create([
            'code' => 'LOC-BDG',
            'latitude' => -6.8885,
            'longitude' => 107.6186,
        ]);

        $originPool = \Modules\Shuttle\Models\ShuttlePool::query()->create([
            'city_id' => $jakarta->id,
            'code' => 'POOL-JKT',
            'name' => 'Pool Jakarta',
            'location_id' => $originLocation->id,
            'is_origin' => true,
            'is_destination' => true,
            'is_active' => true,
        ]);
        $destinationPool = \Modules\Shuttle\Models\ShuttlePool::query()->create([
            'city_id' => $bandung->id,
            'code' => 'POOL-BDG',
            'name' => 'Pool Bandung',
            'location_id' => $destinationLocation->id,
            'is_origin' => true,
            'is_destination' => true,
            'is_active' => true,
        ]);

        return compact('jakarta', 'bandung', 'originPool', 'destinationPool');
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

    public function test_route_optimizer_sequences_depot_pickups_then_dropoffs(): void
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

        $corridor = ShuttleCorridor::factory()->door()->create([
            'origin_location_id' => $origin->id,
            'destination_location_id' => $destination->id,
        ]);

        $departure = ShuttleDeparture::factory()->create([
            'corridor_id' => $corridor->id,
            'service_type' => ShuttleCorridor::SERVICE_DOOR,
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

        $departure->update(['seats_booked' => $booking->passenger_count]);

        $result = app(DepartureRouteOptimizer::class)->optimize($departure->fresh());

        $this->assertGreaterThanOrEqual(4, $result['stop_count']);
        $this->assertSame(ShuttleDeparture::STATUS_OPTIMIZED, $departure->fresh()->status);

        $types = $departure->fresh()->routeStops->pluck('stop_type')->all();
        $this->assertSame(
            ['pool_origin', 'pickup', 'dropoff', 'pool_destination'],
            $types,
        );
    }

    public function test_pool_product_optimizer_only_uses_pool_stops(): void
    {
        $origin = Location::factory()->create([
            'latitude' => -6.1769,
            'longitude' => 106.8306,
        ]);
        $destination = Location::factory()->create([
            'latitude' => -6.8885,
            'longitude' => 107.6186,
        ]);

        $corridor = ShuttleCorridor::factory()->pool()->create([
            'origin_location_id' => $origin->id,
            'destination_location_id' => $destination->id,
        ]);

        $departure = ShuttleDeparture::factory()->create([
            'corridor_id' => $corridor->id,
            'service_type' => ShuttleCorridor::SERVICE_POOL,
            'origin_pool_id' => $origin->id,
            'destination_pool_id' => $destination->id,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $result = app(DepartureRouteOptimizer::class)->optimize($departure->fresh());

        $this->assertSame(2, $result['stop_count']);
        $this->assertSame(
            ['pool_origin', 'pool_destination'],
            $departure->fresh()->routeStops->pluck('stop_type')->all(),
        );
    }

    public function test_pool_product_coerces_door_modes_to_pool(): void
    {
        $corridor = ShuttleCorridor::factory()->pool()->create();
        $departure = ShuttleDeparture::factory()->create([
            'corridor_id' => $corridor->id,
            'service_type' => ShuttleCorridor::SERVICE_POOL,
            'seat_capacity' => 7,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);
        $partner = Partner::factory()->create();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.bookings.store'), [
                'departure_id' => $departure->id,
                'partner_id' => $partner->id,
                'passenger_count' => 1,
                'pickup_mode' => 'door',
                'dropoff_mode' => 'door',
                'pickup_address' => 'Somewhere',
                'pickup_lat' => -6.2,
                'pickup_lng' => 106.8,
                'dropoff_address' => 'Elsewhere',
                'dropoff_lat' => -6.9,
                'dropoff_lng' => 107.6,
                'passengers' => [
                    ['name' => 'Siti Demo', 'phone' => '0812', 'id_number' => null],
                ],
            ])
            ->assertRedirect();

        $booking = ShuttleBooking::query()->firstOrFail();
        $this->assertSame(ShuttleBooking::MODE_POOL, $booking->pickup_mode);
        $this->assertSame(ShuttleBooking::MODE_POOL, $booking->dropoff_mode);
    }

    public function test_booking_create_includes_pool_map_defaults(): void
    {
        $origin = Location::factory()->create([
            'name' => 'Pool Jakarta',
            'address' => 'Jl. Gambir',
            'latitude' => -6.1769,
            'longitude' => 106.8306,
        ]);
        $destination = Location::factory()->create([
            'name' => 'Pool Bandung',
            'address' => 'Jl. Dipatiukur',
            'latitude' => -6.8885,
            'longitude' => 107.6186,
        ]);

        $corridor = ShuttleCorridor::factory()->door()->create([
            'origin_location_id' => $origin->id,
            'destination_location_id' => $destination->id,
        ]);

        ShuttleDeparture::factory()->create([
            'corridor_id' => $corridor->id,
            'service_type' => ShuttleCorridor::SERVICE_DOOR,
            'origin_pool_id' => $origin->id,
            'destination_pool_id' => $destination->id,
            'status' => ShuttleDeparture::STATUS_OPEN,
            'depart_date' => now()->toDateString(),
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.shuttle.bookings.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Shuttle/Bookings/Create')
                ->has('departures.0.origin_pool')
                ->has('departures.0.destination_pool')
                ->where('departures.0.origin_pool.address', 'Jl. Gambir')
                ->where('departures.0.destination_pool.name', 'Pool Bandung')
                ->where('departures.0.origin_pool.latitude', fn ($lat) => abs((float) $lat - (-6.1769)) < 0.0001)
                ->where('departures.0.destination_pool.longitude', fn ($lng) => abs((float) $lng - 107.6186) < 0.0001)
            );
    }

    public function test_can_create_walk_in_booking_without_partner(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
            'depart_date' => now()->toDateString(),
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.bookings.store'), [
                'departure_id' => $departure->id,
                'partner_id' => '',
                'passenger_count' => 1,
                'pickup_mode' => 'pool',
                'dropoff_mode' => 'pool',
                'passengers' => [
                    ['name' => 'Budi Walkin', 'phone' => '08123456789', 'id_number' => null],
                ],
            ])
            ->assertRedirect();

        $booking = ShuttleBooking::query()->firstOrFail();
        $this->assertNull($booking->partner_id);
        $this->assertSame('Budi Walkin', $booking->passengers()->value('name'));

        $confirmed = app(BookingConfirmationService::class)->confirm($booking->fresh());
        $this->assertSame(ShuttleBooking::STATUS_CONFIRMED, $confirmed->status);
        $this->assertNull($confirmed->invoice_id);
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

    public function test_cancel_departure_cancels_bookings_and_releases_seats(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $partner = Partner::factory()->create();
        $booking = ShuttleBooking::factory()->create([
            'departure_id' => $departure->id,
            'partner_id' => $partner->id,
            'passenger_count' => 2,
            'unit_fare' => 150000,
            'total_fare' => 300000,
            'status' => ShuttleBooking::STATUS_DRAFT,
        ]);
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'A']);
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'B']);

        app(BookingConfirmationService::class)->confirm($booking);
        $this->assertSame(2, $departure->fresh()->seats_booked);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.shuttle.departures.cancel', $departure))
            ->assertRedirect();

        $this->assertSame(ShuttleDeparture::STATUS_CANCELLED, $departure->fresh()->status);
        $this->assertSame(0, $departure->fresh()->seats_booked);
        $this->assertSame(ShuttleBooking::STATUS_CANCELLED, $booking->fresh()->status);
    }

    public function test_cannot_cancel_dispatched_departure(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'status' => ShuttleDeparture::STATUS_DISPATCHED,
            'seats_booked' => 1,
        ]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.shuttle.departures.show', $departure))
            ->post(route('module.shuttle.departures.cancel', $departure))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame(ShuttleDeparture::STATUS_DISPATCHED, $departure->fresh()->status);
    }
}
