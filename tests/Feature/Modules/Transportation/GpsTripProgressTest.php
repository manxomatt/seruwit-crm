<?php

namespace Tests\Feature\Modules\Transportation;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Tracking\Events\VehiclePositionsRecorded;
use Modules\Tracking\Support\PositionPayload;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripCheckpoint;
use Modules\TransportationManagement\Models\TripStop;
use Tests\TestCase;
use Tests\Traits\WithRoles;

/**
 * What GPS telemetry does to a trip. Drives the real event rather than the
 * listener directly, so the wiring in TransportationManagementModule::boot() is
 * part of what is under test.
 */
class GpsTripProgressTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @param  array<int, array{float, float, string}>  $fixes  [lat, lng, recordedAt]
     */
    private function report(Trip $trip, array $fixes, int $minDistanceM = 200, int $minIntervalMinutes = 5, int $radiusM = 200): void
    {
        $positions = array_map(fn (array $fix) => new PositionPayload(
            traccarDeviceId: 7,
            latitude: $fix[0],
            longitude: $fix[1],
            speedKph: 40,
            course: null,
            altitude: null,
            ignition: true,
            motion: true,
            totalDistanceM: null,
            recordedAt: CarbonImmutable::parse($fix[2]),
            serverTime: null,
            attributes: null,
        ), $fixes);

        VehiclePositionsRecorded::dispatch(
            $positions,
            [7 => $trip->vehicle_id],
            $radiusM,
            $minDistanceM,
            $minIntervalMinutes,
        );
    }

    public function test_a_fix_on_a_running_trip_is_recorded_as_a_gps_checkpoint(): void
    {
        $trip = Trip::factory()->inProgress()->create();

        $this->report($trip, [[-6.2, 106.8, '2026-07-19 10:00:00']]);

        $checkpoint = TripCheckpoint::where('trip_id', $trip->id)->sole();
        $this->assertSame(TripCheckpoint::SOURCE_GPS, $checkpoint->source);
        $this->assertSame('-6.2000000', $checkpoint->latitude);
    }

    public function test_a_small_move_soon_after_the_last_point_is_throttled_away(): void
    {
        $trip = Trip::factory()->inProgress()->create();

        // ~55 m apart, one minute later: under both thresholds.
        $this->report($trip, [
            [-6.2, 106.8, '2026-07-19 10:00:00'],
            [-6.2005, 106.8, '2026-07-19 10:01:00'],
        ]);

        $this->assertSame(1, TripCheckpoint::where('trip_id', $trip->id)->count());
    }

    public function test_a_move_past_the_distance_threshold_is_recorded(): void
    {
        $trip = Trip::factory()->inProgress()->create();

        // ~330 m apart, one minute later.
        $this->report($trip, [
            [-6.2, 106.8, '2026-07-19 10:00:00'],
            [-6.203, 106.8, '2026-07-19 10:01:00'],
        ]);

        $this->assertSame(2, TripCheckpoint::where('trip_id', $trip->id)->count());
    }

    public function test_standing_still_for_longer_than_the_interval_is_still_recorded(): void
    {
        $trip = Trip::factory()->inProgress()->create();

        $this->report($trip, [
            [-6.2, 106.8, '2026-07-19 10:00:00'],
            [-6.2, 106.8, '2026-07-19 10:30:00'],
        ]);

        $this->assertSame(2, TripCheckpoint::where('trip_id', $trip->id)->count());
    }

    public function test_it_accumulates_the_distance_covered(): void
    {
        $trip = Trip::factory()->inProgress()->create(['distance_km' => 0]);

        // Two ~1.1 km hops east.
        $this->report($trip, [
            [-6.2, 106.80, '2026-07-19 10:00:00'],
            [-6.2, 106.81, '2026-07-19 10:05:00'],
            [-6.2, 106.82, '2026-07-19 10:10:00'],
        ]);

        $this->assertEqualsWithDelta(2.21, (float) $trip->fresh()->distance_km, 0.1);
    }

    public function test_trips_that_are_not_running_are_left_alone(): void
    {
        $scheduled = Trip::factory()->create();
        $completed = Trip::factory()->completed()->create();

        $this->report($scheduled, [[-6.2, 106.8, '2026-07-19 10:00:00']]);
        $this->report($completed, [[-6.2, 106.8, '2026-07-19 10:00:00']]);

        $this->assertSame(0, TripCheckpoint::count());
    }

    public function test_reaching_a_planned_stop_marks_it_arrived(): void
    {
        $trip = Trip::factory()->inProgress()->create();
        $stop = TripStop::factory()->create([
            'trip_id' => $trip->id,
            'lat' => -6.2,
            'lng' => 106.8,
        ]);

        // ~55 m from the stop.
        $this->report($trip, [[-6.2005, 106.8, '2026-07-19 10:00:00']]);

        $stop->refresh();
        $this->assertSame(TripStop::STATUS_ARRIVED, $stop->status);
        $this->assertNotNull($stop->arrived_at);
    }

    public function test_a_stop_outside_the_radius_is_not_touched(): void
    {
        $trip = Trip::factory()->inProgress()->create();
        $stop = TripStop::factory()->create([
            'trip_id' => $trip->id,
            'lat' => -6.2,
            'lng' => 106.8,
        ]);

        // ~1.1 km away.
        $this->report($trip, [[-6.21, 106.8, '2026-07-19 10:00:00']]);

        $this->assertSame(TripStop::STATUS_PENDING, $stop->fresh()->status);
    }

    public function test_a_stop_without_coordinates_is_never_auto_arrived(): void
    {
        $trip = Trip::factory()->inProgress()->create();
        $stop = TripStop::factory()->create([
            'trip_id' => $trip->id,
            'lat' => null,
            'lng' => null,
        ]);

        $this->report($trip, [[-6.2, 106.8, '2026-07-19 10:00:00']]);

        $this->assertSame(TripStop::STATUS_PENDING, $stop->fresh()->status);
    }

    public function test_only_the_earliest_stop_at_a_shared_location_arrives(): void
    {
        $trip = Trip::factory()->inProgress()->create();
        $pickup = TripStop::factory()->pickup()->create([
            'trip_id' => $trip->id, 'sequence' => 1, 'lat' => -6.2, 'lng' => 106.8,
        ]);
        $dropoff = TripStop::factory()->create([
            'trip_id' => $trip->id, 'sequence' => 2, 'lat' => -6.2, 'lng' => 106.8,
        ]);

        $this->report($trip, [[-6.2, 106.8, '2026-07-19 10:00:00']]);

        $this->assertSame(TripStop::STATUS_ARRIVED, $pickup->fresh()->status);
        $this->assertSame(TripStop::STATUS_PENDING, $dropoff->fresh()->status);
    }

    public function test_an_already_completed_stop_is_untouched(): void
    {
        $trip = Trip::factory()->inProgress()->create();
        $stop = TripStop::factory()->completed()->create([
            'trip_id' => $trip->id, 'lat' => -6.2, 'lng' => 106.8,
        ]);
        $completedAt = $stop->completed_at;

        $this->report($trip, [[-6.2, 106.8, '2026-07-19 10:00:00']]);

        $stop->refresh();
        $this->assertSame(TripStop::STATUS_COMPLETED, $stop->status);
        $this->assertEquals($completedAt, $stop->completed_at);
    }

    /**
     * The load-bearing guarantee: automatic arrival is advisory, and must never
     * settle a delivery order — that is what makes an order billable.
     */
    public function test_auto_arrival_leaves_the_delivery_order_in_transit(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->inProgress()->create();
        $order = DeliveryOrder::factory()->assigned($trip)->create([
            'status' => DeliveryOrder::STATUS_IN_TRANSIT,
        ]);
        $stop = TripStop::factory()->create([
            'trip_id' => $trip->id,
            'lat' => -6.2,
            'lng' => 106.8,
            'delivery_order_id' => $order->id,
        ]);

        $this->report($trip, [[-6.2, 106.8, '2026-07-19 10:00:00']]);

        $this->assertSame(TripStop::STATUS_ARRIVED, $stop->fresh()->status);
        $this->assertSame(DeliveryOrder::STATUS_IN_TRANSIT, $order->fresh()->status);

        // And completing it by hand afterwards still delivers the order, which
        // proves extracting the guards did not break Orders' observer.
        $this->actingAs($user)->post(route('module.transportation.trips.stops.complete', [$trip, $stop]));

        $this->assertSame(DeliveryOrder::STATUS_DELIVERED, $order->fresh()->status);
    }
}
