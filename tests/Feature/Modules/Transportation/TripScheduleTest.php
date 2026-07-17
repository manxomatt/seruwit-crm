<?php

namespace Tests\Feature\Modules\Transportation;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\Trip;
use Modules\TransportationManagement\Models\TripSchedule;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TripScheduleTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_schedules(): void
    {
        $this->get(route('module.transportation.schedules.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_create_a_schedule(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create();

        $response = $this->actingAs($user)->post(route('module.transportation.schedules.store'), [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'days_of_week' => [1, 4],
            'time_of_day' => '08:00',
            'starts_on' => now()->toDateString(),
        ]);

        $schedule = TripSchedule::first();
        $response->assertRedirect(route('module.transportation.schedules.show', $schedule));
        $this->assertSame([1, 4], $schedule->days_of_week);
    }

    public function test_creating_a_schedule_requires_at_least_one_day_of_week(): void
    {
        $user = $this->createAdminUser();
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create();

        $this->actingAs($user)->post(route('module.transportation.schedules.store'), [
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'days_of_week' => [],
            'time_of_day' => '08:00',
            'starts_on' => now()->toDateString(),
        ])->assertSessionHasErrors('days_of_week');
    }

    public function test_admin_can_update_a_schedule(): void
    {
        $user = $this->createAdminUser();
        $schedule = TripSchedule::factory()->create(['origin' => 'Old Origin']);

        $this->actingAs($user)->patch(route('module.transportation.schedules.update', $schedule), [
            'origin' => 'New Origin',
        ])->assertRedirect(route('module.transportation.schedules.show', $schedule));

        $this->assertDatabaseHas('trip_schedules', ['id' => $schedule->id, 'origin' => 'New Origin']);
    }

    public function test_deleting_a_schedule_keeps_trips_already_generated_from_it(): void
    {
        $user = $this->createAdminUser();
        $schedule = TripSchedule::factory()->create();
        $trip = Trip::factory()->create(['trip_schedule_id' => $schedule->id]);

        $this->actingAs($user)->delete(route('module.transportation.schedules.destroy', $schedule))
            ->assertRedirect(route('module.transportation.schedules.index'));

        $this->assertDatabaseMissing('trip_schedules', ['id' => $schedule->id]);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'trip_schedule_id' => null]);
    }

    public function test_generate_creates_trips_only_on_matching_days_within_range(): void
    {
        $user = $this->createAdminUser();
        $monday = Carbon::parse('next monday')->startOfDay();

        TripSchedule::factory()->create([
            'days_of_week' => [1], // Monday
            'time_of_day' => '08:00:00',
            'starts_on' => $monday->toDateString(),
            'ends_on' => null,
        ]);

        // Two full weeks starting on that Monday contains exactly 2 Mondays.
        $this->actingAs($user)->post(route('module.transportation.schedules.generate'), [
            'from' => $monday->toDateString(),
            'to' => $monday->copy()->addDays(13)->toDateString(),
        ])->assertRedirect();

        $this->assertSame(2, Trip::count());
        Trip::all()->each(function (Trip $trip) {
            $this->assertSame(1, $trip->scheduled_at->dayOfWeek);
        });
    }

    public function test_generate_respects_ends_on(): void
    {
        $user = $this->createAdminUser();
        $monday = Carbon::parse('next monday')->startOfDay();

        TripSchedule::factory()->create([
            'days_of_week' => [1],
            'time_of_day' => '08:00:00',
            'starts_on' => $monday->toDateString(),
            'ends_on' => $monday->toDateString(), // only the first Monday
        ]);

        $this->actingAs($user)->post(route('module.transportation.schedules.generate'), [
            'from' => $monday->toDateString(),
            'to' => $monday->copy()->addDays(13)->toDateString(),
        ]);

        $this->assertSame(1, Trip::count());
    }

    public function test_generate_skips_inactive_schedules(): void
    {
        $user = $this->createAdminUser();
        $monday = Carbon::parse('next monday')->startOfDay();

        TripSchedule::factory()->inactive()->create([
            'days_of_week' => [1],
            'starts_on' => $monday->toDateString(),
        ]);

        $this->actingAs($user)->post(route('module.transportation.schedules.generate'), [
            'from' => $monday->toDateString(),
            'to' => $monday->copy()->addDays(6)->toDateString(),
        ]);

        $this->assertSame(0, Trip::count());
    }

    public function test_generate_is_idempotent_on_repeated_runs(): void
    {
        $user = $this->createAdminUser();
        $monday = Carbon::parse('next monday')->startOfDay();

        TripSchedule::factory()->create([
            'days_of_week' => [1],
            'starts_on' => $monday->toDateString(),
        ]);

        $range = ['from' => $monday->toDateString(), 'to' => $monday->copy()->addDays(6)->toDateString()];

        $this->actingAs($user)->post(route('module.transportation.schedules.generate'), $range);
        $this->actingAs($user)->post(route('module.transportation.schedules.generate'), $range);

        $this->assertSame(1, Trip::count());
    }

    public function test_generate_skips_a_same_date_conflict_instead_of_failing(): void
    {
        $user = $this->createAdminUser();
        $monday = Carbon::parse('next monday')->startOfDay();
        $schedule = TripSchedule::factory()->create([
            'days_of_week' => [1],
            'time_of_day' => '08:00:00',
            'starts_on' => $monday->toDateString(),
        ]);

        // The schedule's own vehicle already has an unrelated active trip that same day.
        Trip::factory()->create([
            'vehicle_id' => $schedule->vehicle_id,
            'status' => Trip::STATUS_SCHEDULED,
            'scheduled_at' => $monday->copy()->setTime(6, 0),
        ]);

        $this->actingAs($user)->post(route('module.transportation.schedules.generate'), [
            'from' => $monday->toDateString(),
            'to' => $monday->toDateString(),
        ])->assertSessionHas('success');

        // Only the pre-existing trip exists; nothing generated for the conflicting date.
        $this->assertSame(1, Trip::count());
    }
}
