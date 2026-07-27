<?php

namespace Tests\Feature\Modules\DriverScoring;

use Database\Seeders\TenantDriverScoringDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\DriverScoring\Models\DriverDailyScore;
use Modules\DriverScoring\Models\DriverIncentiveRule;
use Modules\DriverScoring\Models\DrivingEvent;
use Modules\Fleet\Models\Driver;
use Tests\TestCase;

class DriverScoringDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_twenty_drivers_with_scores_and_events(): void
    {
        $this->seed(TenantDriverScoringDemoSeeder::class);

        $this->assertSame(
            TenantDriverScoringDemoSeeder::DRIVER_COUNT,
            Driver::query()->where('notes', 'like', '%'.TenantDriverScoringDemoSeeder::TAG.'%')->count(),
        );

        $from = now()->startOfWeek()->toDateString();
        $to = now()->toDateString();

        $scoredDrivers = DriverDailyScore::query()
            ->whereBetween('score_date', [$from, $to])
            ->distinct('driver_id')
            ->count('driver_id');

        $this->assertSame(TenantDriverScoringDemoSeeder::DRIVER_COUNT, $scoredDrivers);
        $this->assertGreaterThan(0, DrivingEvent::query()->where('meta->demo_tag', TenantDriverScoringDemoSeeder::TAG)->count());
        $this->assertGreaterThanOrEqual(2, DriverIncentiveRule::query()->where('notes', 'like', '%'.TenantDriverScoringDemoSeeder::TAG.'%')->count());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantDriverScoringDemoSeeder::class);

        $scoreCount = DriverDailyScore::query()->count();
        $eventCount = DrivingEvent::query()->where('meta->demo_tag', TenantDriverScoringDemoSeeder::TAG)->count();
        $driverCount = Driver::query()->where('notes', 'like', '%'.TenantDriverScoringDemoSeeder::TAG.'%')->count();

        $this->seed(TenantDriverScoringDemoSeeder::class);

        $this->assertSame($scoreCount, DriverDailyScore::query()->count());
        $this->assertSame($eventCount, DrivingEvent::query()->where('meta->demo_tag', TenantDriverScoringDemoSeeder::TAG)->count());
        $this->assertSame($driverCount, Driver::query()->where('notes', 'like', '%'.TenantDriverScoringDemoSeeder::TAG.'%')->count());
    }
}
