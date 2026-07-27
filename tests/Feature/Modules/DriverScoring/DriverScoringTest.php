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

    public function test_incentives_page_renders_awards(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();
        $rule = DriverIncentiveRule::query()->create([
            'name' => 'Safe week UI',
            'period' => DriverIncentiveRule::PERIOD_WEEKLY,
            'min_score' => 85,
            'min_days' => 2,
            'reward_amount' => 200000,
            'is_active' => true,
        ]);

        DriverIncentiveAward::query()->create([
            'driver_incentive_rule_id' => $rule->id,
            'driver_id' => $driver->id,
            'period_start' => now()->startOfWeek()->toDateString(),
            'period_end' => now()->endOfWeek()->toDateString(),
            'average_score' => 91.5,
            'scored_days' => 5,
            'reward_amount' => 200000,
            'status' => DriverIncentiveAward::STATUS_PENDING,
            'awarded_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('module.scoring.incentives.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/DriverScoring/Incentives/Index')
                ->has('awards', 1)
                ->where('awards.0.status', DriverIncentiveAward::STATUS_PENDING)
                ->where('can.award', true));
    }

    public function test_award_status_can_be_updated(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();
        $rule = DriverIncentiveRule::query()->create([
            'name' => 'Safe week status',
            'period' => DriverIncentiveRule::PERIOD_WEEKLY,
            'min_score' => 85,
            'min_days' => 2,
            'reward_amount' => 200000,
            'is_active' => true,
        ]);

        $award = DriverIncentiveAward::query()->create([
            'driver_incentive_rule_id' => $rule->id,
            'driver_id' => $driver->id,
            'period_start' => now()->startOfWeek()->toDateString(),
            'period_end' => now()->endOfWeek()->toDateString(),
            'average_score' => 91.5,
            'scored_days' => 5,
            'reward_amount' => 200000,
            'status' => DriverIncentiveAward::STATUS_PENDING,
            'awarded_at' => now(),
        ]);

        $this->actingAs($user)
            ->post(route('module.scoring.awards.status', $award), [
                'status' => DriverIncentiveAward::STATUS_APPROVED,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('driver_incentive_awards', [
            'id' => $award->id,
            'status' => DriverIncentiveAward::STATUS_APPROVED,
        ]);
    }

    public function test_incentive_rule_can_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $rule = DriverIncentiveRule::query()->create([
            'name' => 'Rule to delete',
            'period' => DriverIncentiveRule::PERIOD_WEEKLY,
            'min_score' => 85,
            'min_days' => 2,
            'reward_amount' => 150000,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->delete(route('module.scoring.incentives.destroy', $rule))
            ->assertRedirect();

        $this->assertDatabaseMissing('driver_incentive_rules', [
            'id' => $rule->id,
        ]);
    }

    public function test_leaderboard_page_renders(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.scoring.leaderboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/DriverScoring/Leaderboard/Index')
                ->has('leaderboard.data')
                ->has('leaderboard.current_page')
                ->has('leaderboard.last_page')
                ->has('leaderboard.per_page')
                ->has('leaderboard.total')
                ->has('leaderboard.links'));
    }

    public function test_events_index_page_renders(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();

        DrivingEvent::query()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'type' => DrivingEvent::TYPE_SPEEDING,
            'severity' => 'critical',
            'speed_kph' => 95,
            'points_delta' => -4,
            'recorded_at' => now()->setTime(14, 5),
        ]);

        $this->actingAs($user)
            ->get(route('module.scoring.events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/DriverScoring/Events/Index')
                ->has('events.data', 1)
                ->has('events.current_page')
                ->has('events.last_page')
                ->has('events.per_page')
                ->has('events.total')
                ->has('events.links')
                ->where('events.data.0.recorded_at', fn ($value) => is_string($value) && $value !== ''));
    }

    public function test_events_index_paginates_results(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();

        foreach (range(1, 16) as $i) {
            DrivingEvent::query()->create([
                'vehicle_id' => $vehicle->id,
                'driver_id' => $driver->id,
                'type' => DrivingEvent::TYPE_IDLE,
                'severity' => 'warning',
                'points_delta' => -2,
                'recorded_at' => now()->subMinutes($i),
            ]);
        }

        $this->actingAs($user)
            ->get(route('module.scoring.events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('events.per_page', 15)
                ->where('events.total', 16)
                ->where('events.last_page', 2)
                ->has('events.data', 15));

        $this->actingAs($user)
            ->get(route('module.scoring.events.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('events.data', 1));
    }

    public function test_leaderboard_paginates_results(): void
    {
        $user = $this->createAdminUser();
        $from = now()->startOfWeek()->toDateString();
        $to = now()->endOfWeek()->toDateString();

        foreach (range(1, 16) as $i) {
            $driver = Driver::factory()->create(['name' => "Paginate Driver {$i}"]);
            DriverDailyScore::query()->create([
                'driver_id' => $driver->id,
                'score_date' => $from,
                'score' => 100 - $i,
                'harsh_brake_count' => 0,
                'harsh_accel_count' => 0,
                'speeding_count' => 0,
                'idle_count' => 0,
                'points_delta' => 0,
                'event_count' => 0,
            ]);
        }

        $this->actingAs($user)
            ->get(route('module.scoring.leaderboard', ['from' => $from, 'to' => $to]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/DriverScoring/Leaderboard/Index')
                ->where('leaderboard.per_page', 15)
                ->where('leaderboard.total', 16)
                ->where('leaderboard.last_page', 2)
                ->has('leaderboard.data', 15));

        $this->actingAs($user)
            ->get(route('module.scoring.leaderboard', ['from' => $from, 'to' => $to, 'page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('leaderboard.data', 1));
    }

    public function test_driver_show_paginates_scores_and_events(): void
    {
        $user = $this->createAdminUser();
        $driver = Driver::factory()->create();
        $vehicle = Vehicle::factory()->create();
        $from = now()->subDays(40)->toDateString();
        $to = now()->toDateString();

        foreach (range(0, 19) as $i) {
            DriverDailyScore::query()->create([
                'driver_id' => $driver->id,
                'score_date' => now()->subDays($i)->toDateString(),
                'score' => 90,
                'harsh_brake_count' => 1,
                'harsh_accel_count' => 0,
                'speeding_count' => 0,
                'idle_count' => 0,
                'points_delta' => -5,
                'event_count' => 1,
            ]);
        }

        foreach (range(0, 19) as $i) {
            DrivingEvent::query()->create([
                'vehicle_id' => $vehicle->id,
                'driver_id' => $driver->id,
                'type' => DrivingEvent::TYPE_HARSH_BRAKE,
                'severity' => 'warning',
                'points_delta' => -5,
                'recorded_at' => now()->subHours($i),
            ]);
        }

        $this->actingAs($user)
            ->get(route('module.scoring.drivers.show', [
                'driver' => $driver->id,
                'from' => $from,
                'to' => $to,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/DriverScoring/Leaderboard/Show')
                ->has('scores.data', 15)
                ->where('scores.last_page', 2)
                ->has('events.data', 15)
                ->where('events.last_page', 2)
                ->where('summary.event_count', 20)
                ->where('summary.harsh_brake_count', 20));
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
