<?php

namespace Tests\Feature\Modules\DriverScoring;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\DriverScoring\Models\DriverDailyScore;
use Modules\DriverScoring\Models\DriverIncentiveAward;
use Modules\DriverScoring\Models\DriverIncentiveRule;
use Modules\DriverScoring\Models\DriverScoringSetting;
use Modules\DriverScoring\Models\DrivingEvent;
use Modules\DriverScoring\Support\DrivingEventDetector;
use Modules\DriverScoring\Support\DrivingEventRecorder;
use Modules\DriverScoring\Support\IncentiveEvaluator;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Support\PositionPayload;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DriverScoringTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_detector_flags_harsh_brake_and_speeding(): void
    {
        $settings = DriverScoringSetting::current();
        $settings->update([
            'harsh_brake_kph_per_s' => 10,
            'speeding_limit_kph' => 80,
            'idle_minutes' => 10,
        ]);

        $base = CarbonImmutable::parse('2026-07-24 10:00:00');
        $positions = [
            $this->payload($base, 90),
            $this->payload($base->addSeconds(5), 30),
            $this->payload($base->addSeconds(10), 95),
            $this->payload($base->addSeconds(20), 40),
        ];

        $events = (new DrivingEventDetector)->detect($positions, $settings->fresh());
        $types = collect($events)->pluck('type')->all();

        $this->assertContains(DrivingEvent::TYPE_HARSH_BRAKE, $types);
        $this->assertContains(DrivingEvent::TYPE_SPEEDING, $types);
    }

    public function test_detector_flags_idle_after_threshold(): void
    {
        $settings = DriverScoringSetting::current();
        $settings->update([
            'idle_speed_kph' => 3,
            'idle_minutes' => 10,
        ]);

        $base = CarbonImmutable::parse('2026-07-24 11:00:00');
        $positions = [
            $this->payload($base, 0, ignition: true),
            $this->payload($base->addMinutes(5), 0, ignition: true),
            $this->payload($base->addMinutes(11), 0, ignition: true),
        ];

        $events = (new DrivingEventDetector)->detect($positions, $settings->fresh());

        $this->assertTrue(collect($events)->contains('type', DrivingEvent::TYPE_IDLE));
    }

    public function test_recorder_attributes_events_to_in_progress_trip_driver_and_updates_score(): void
    {
        $vehicle = Vehicle::factory()->create();
        $driver = Driver::factory()->create(['status' => Driver::STATUS_AVAILABLE]);
        Trip::factory()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'status' => Trip::STATUS_IN_PROGRESS,
            'started_at' => now()->subHour(),
        ]);

        $settings = DriverScoringSetting::current();
        $settings->update([
            'harsh_brake_kph_per_s' => 10,
            'speeding_limit_kph' => 120,
            'daily_base_points' => 100,
            'points_harsh_brake' => -5,
        ]);

        $base = CarbonImmutable::parse('2026-07-24 12:00:00');
        $saved = app(DrivingEventRecorder::class)->processVehicle(
            $vehicle->id,
            [
                $this->payload($base, 100),
                $this->payload($base->addSeconds(5), 20),
            ],
            $settings->fresh(),
        );

        $this->assertNotEmpty($saved);
        $this->assertSame($driver->id, $saved[0]->driver_id);
        $this->assertTrue(collect($saved)->contains('type', DrivingEvent::TYPE_HARSH_BRAKE));
        $this->assertDatabaseHas('driving_events', [
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'type' => DrivingEvent::TYPE_HARSH_BRAKE,
        ]);

        $score = DriverDailyScore::query()->where('driver_id', $driver->id)->first();
        $this->assertNotNull($score);
        $this->assertSame(95, $score->score);
        $this->assertSame(1, $score->harsh_brake_count);
    }

    public function test_incentive_evaluator_creates_pending_awards(): void
    {
        $driver = Driver::factory()->create();
        DriverDailyScore::query()->create([
            'driver_id' => $driver->id,
            'score_date' => now()->startOfWeek()->toDateString(),
            'score' => 92,
            'event_count' => 1,
        ]);
        DriverDailyScore::query()->create([
            'driver_id' => $driver->id,
            'score_date' => now()->startOfWeek()->addDay()->toDateString(),
            'score' => 90,
            'event_count' => 0,
        ]);

        $rule = DriverIncentiveRule::query()->create([
            'name' => 'Safe week',
            'period' => DriverIncentiveRule::PERIOD_WEEKLY,
            'min_score' => 85,
            'min_days' => 2,
            'reward_amount' => 200000,
            'is_active' => true,
        ]);

        $awards = app(IncentiveEvaluator::class)->evaluate(now());

        $this->assertCount(1, $awards);
        $this->assertDatabaseHas('driver_incentive_awards', [
            'driver_incentive_rule_id' => $rule->id,
            'driver_id' => $driver->id,
            'status' => DriverIncentiveAward::STATUS_PENDING,
        ]);
    }

    public function test_leaderboard_page_renders(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.scoring.leaderboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/DriverScoring/Leaderboard/Index'));
    }

    private function payload(CarbonImmutable $at, float $speedKph, ?bool $ignition = null): PositionPayload
    {
        return new PositionPayload(
            traccarDeviceId: 1,
            latitude: -6.2,
            longitude: 106.8,
            speedKph: $speedKph,
            course: null,
            altitude: null,
            ignition: $ignition,
            motion: $speedKph > 3,
            totalDistanceM: null,
            recordedAt: $at,
            serverTime: null,
            attributes: null,
        );
    }
}
