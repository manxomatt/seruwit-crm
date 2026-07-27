<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Modules\DriverScoring\Models\DriverDailyScore;
use Modules\DriverScoring\Models\DriverIncentiveAward;
use Modules\DriverScoring\Models\DriverIncentiveRule;
use Modules\DriverScoring\Models\DriverScoringSetting;
use Modules\DriverScoring\Models\DrivingEvent;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

/**
 * Seeds 20 drivers with daily scores + driving events for the Scoring leaderboard.
 *
 * Default leaderboard range is the current week, so scores cover Mon → today.
 *
 *   php artisan tenants:seed --class=TenantDriverScoringDemoSeeder --tenants={id}
 */
class TenantDriverScoringDemoSeeder extends Seeder
{
    public const TAG = '[SCORING-DEMO]';

    public const DRIVER_COUNT = 20;

    /**
     * @var list<string>
     */
    private const DRIVER_NAMES = [
        'Andi Pratama',
        'Budi Santoso',
        'Cahyo Nugroho',
        'Dedi Kurniawan',
        'Eko Wibowo',
        'Fajar Hidayat',
        'Gilang Saputra',
        'Hendra Wijaya',
        'Irfan Maulana',
        'Joko Susilo',
        'Kurniawan Putra',
        'Lukman Hakim',
        'Muhammad Rizky',
        'Nugraha Aditya',
        'Oki Firmansyah',
        'Prasetyo Aji',
        'Rudi Hartono',
        'Surya Darma',
        'Taufik Rahman',
        'Yusuf Abdullah',
    ];

    public function run(): void
    {
        if (! class_exists(DriverDailyScore::class) || ! Schema::hasTable('driver_daily_scores')) {
            $this->command?->warn('Driver Scoring tables missing. Install the scoring module first.');

            return;
        }

        if (! class_exists(Driver::class) || ! Schema::hasTable('drivers') || ! Schema::hasTable('vehicles')) {
            $this->command?->warn('Fleet tables missing. Install the fleet module first.');

            return;
        }

        $settings = DriverScoringSetting::current();
        $vehicles = $this->ensureVehicles();
        $drivers = $this->ensureDrivers();

        $from = now()->startOfWeek();
        $to = now()->startOfDay();

        if ($this->demoScoresExist($drivers, $from, $to)) {
            $this->command?->info('Scoring demo data already present — skipping score/event seed.');
        } else {
            $this->seedScoresAndEvents($drivers, $vehicles, $settings, $from, $to);
        }

        $this->ensureIncentiveDemo($drivers);

        $leaderboardCount = DriverDailyScore::query()
            ->whereIn('driver_id', $drivers->pluck('id'))
            ->whereBetween('score_date', [$from->toDateString(), $to->toDateString()])
            ->distinct('driver_id')
            ->count('driver_id');

        $eventCount = DrivingEvent::query()
            ->where('meta->demo_tag', self::TAG)
            ->count();

        $this->command?->info(sprintf(
            'Scoring demo ready: %d drivers on leaderboard (%s → %s), %d demo events, %d incentive rules.',
            $leaderboardCount,
            $from->toDateString(),
            $to->toDateString(),
            $eventCount,
            DriverIncentiveRule::query()->where('notes', 'like', '%'.self::TAG.'%')->count(),
        ));
        $this->command?->info('Open /module/scoring/leaderboard');
    }

    /**
     * @return \Illuminate\Support\Collection<int, Vehicle>
     */
    protected function ensureVehicles()
    {
        $vehicles = Vehicle::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->orderBy('id')
            ->get();

        if ($vehicles->count() >= 5) {
            return $vehicles;
        }

        $existing = Vehicle::query()->orderBy('id')->limit(5)->get();
        if ($existing->count() >= 5) {
            return $existing;
        }

        $definitions = [
            ['name' => 'Scoring Demo Truck 01', 'plate_number' => 'BE SC 01', 'type' => 'truck'],
            ['name' => 'Scoring Demo Truck 02', 'plate_number' => 'BE SC 02', 'type' => 'truck'],
            ['name' => 'Scoring Demo Van 01', 'plate_number' => 'BE SC 03', 'type' => 'van'],
            ['name' => 'Scoring Demo Van 02', 'plate_number' => 'BE SC 04', 'type' => 'van'],
            ['name' => 'Scoring Demo Pickup', 'plate_number' => 'BE SC 05', 'type' => 'car'],
        ];

        foreach ($definitions as $row) {
            Vehicle::query()->firstOrCreate(
                ['plate_number' => $row['plate_number']],
                [
                    'name' => $row['name'],
                    'type' => $row['type'],
                    'brand' => 'Hino',
                    'model_year' => 2022,
                    'capacity_kg' => $row['type'] === 'truck' ? 5000 : 1500,
                    'tank_capacity_liters' => $row['type'] === 'truck' ? 120 : 55,
                    'expected_km_per_liter' => $row['type'] === 'truck' ? 6.5 : 10,
                    'fuel_type' => 'diesel',
                    'status' => Vehicle::STATUS_ACTIVE,
                    'odometer_km' => 35000,
                    'notes' => self::TAG.' Demo vehicle for driver scoring.',
                ],
            );
        }

        return Vehicle::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->orWhereIn('plate_number', collect($definitions)->pluck('plate_number'))
            ->orderBy('id')
            ->get();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Driver>
     */
    protected function ensureDrivers()
    {
        $drivers = collect();

        foreach (self::DRIVER_NAMES as $index => $name) {
            $license = sprintf('SIM-SC-%04d', $index + 1);

            $driver = Driver::query()->firstOrCreate(
                ['license_number' => $license],
                [
                    'name' => $name,
                    'license_type' => 'B2',
                    'license_expires_at' => now()->addYears(2)->toDateString(),
                    'phone' => sprintf('0812%08d', 10000000 + $index),
                    'email' => sprintf('scoring.demo.%02d@example.test', $index + 1),
                    'status' => Driver::STATUS_AVAILABLE,
                    'notes' => self::TAG.' Demo driver for scoring leaderboard.',
                ],
            );

            if (! str_contains((string) $driver->notes, self::TAG)) {
                $driver->update([
                    'notes' => trim(self::TAG.' '.((string) $driver->notes)),
                ]);
            }

            $drivers->push($driver);
        }

        return $drivers->values();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Driver>  $drivers
     */
    protected function demoScoresExist($drivers, Carbon $from, Carbon $to): bool
    {
        $driverIds = $drivers->pluck('id');

        $scoredDrivers = DriverDailyScore::query()
            ->whereIn('driver_id', $driverIds)
            ->whereBetween('score_date', [$from->toDateString(), $to->toDateString()])
            ->distinct('driver_id')
            ->count('driver_id');

        return $scoredDrivers >= self::DRIVER_COUNT;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Driver>  $drivers
     * @param  \Illuminate\Support\Collection<int, Vehicle>  $vehicles
     */
    protected function seedScoresAndEvents($drivers, $vehicles, DriverScoringSetting $settings, Carbon $from, Carbon $to): void
    {
        $days = [];
        for ($day = $from->copy(); $day->lte($to); $day->addDay()) {
            $days[] = $day->copy();
        }

        if ($days === []) {
            $days[] = $to->copy();
        }

        foreach ($drivers as $index => $driver) {
            $tier = $index % 5;
            $vehicle = $vehicles[$index % $vehicles->count()];

            foreach ($days as $dayIndex => $day) {
                $counts = $this->eventCountsForTier($tier, $dayIndex);

                $pointsDelta =
                    ($counts['harsh_brake'] * (int) $settings->points_harsh_brake)
                    + ($counts['harsh_accel'] * (int) $settings->points_harsh_accel)
                    + ($counts['speeding'] * (int) $settings->points_speeding)
                    + ($counts['idle'] * (int) $settings->points_idle);

                $eventCount = array_sum($counts);
                $score = max(
                    (int) config('scoring.points.min', 0),
                    min(
                        (int) config('scoring.points.max', 100),
                        (int) $settings->daily_base_points + $pointsDelta,
                    ),
                );

                DriverDailyScore::query()->updateOrCreate(
                    [
                        'driver_id' => $driver->id,
                        'score_date' => $day->toDateString(),
                    ],
                    [
                        'score' => $score,
                        'harsh_brake_count' => $counts['harsh_brake'],
                        'harsh_accel_count' => $counts['harsh_accel'],
                        'speeding_count' => $counts['speeding'],
                        'idle_count' => $counts['idle'],
                        'points_delta' => $pointsDelta,
                        'event_count' => $eventCount,
                    ],
                );

                $this->seedEventsForDay($driver, $vehicle, $day, $counts, $settings);
            }
        }
    }

    /**
     * @return array{harsh_brake: int, harsh_accel: int, speeding: int, idle: int}
     */
    protected function eventCountsForTier(int $tier, int $dayIndex): array
    {
        $jitter = $dayIndex % 3;

        return match ($tier) {
            0 => ['harsh_brake' => 0, 'harsh_accel' => 0, 'speeding' => 0, 'idle' => $jitter === 0 ? 0 : 1],
            1 => ['harsh_brake' => 0, 'harsh_accel' => 1, 'speeding' => 0, 'idle' => 1 + $jitter],
            2 => ['harsh_brake' => 1, 'harsh_accel' => 1, 'speeding' => 1, 'idle' => 1],
            3 => ['harsh_brake' => 1 + $jitter, 'harsh_accel' => 1, 'speeding' => 2, 'idle' => 1],
            default => ['harsh_brake' => 2, 'harsh_accel' => 2, 'speeding' => 2 + $jitter, 'idle' => 2],
        };
    }

    /**
     * @param  array{harsh_brake: int, harsh_accel: int, speeding: int, idle: int}  $counts
     */
    protected function seedEventsForDay(
        Driver $driver,
        Vehicle $vehicle,
        Carbon $day,
        array $counts,
        DriverScoringSetting $settings,
    ): void {
        $already = DrivingEvent::query()
            ->where('driver_id', $driver->id)
            ->whereDate('recorded_at', $day->toDateString())
            ->where('meta->demo_tag', self::TAG)
            ->exists();

        if ($already) {
            return;
        }

        $hour = 7;
        $map = [
            DrivingEvent::TYPE_HARSH_BRAKE => [$counts['harsh_brake'], (int) $settings->points_harsh_brake, 14.5, 45],
            DrivingEvent::TYPE_HARSH_ACCEL => [$counts['harsh_accel'], (int) $settings->points_harsh_accel, 13.2, 55],
            DrivingEvent::TYPE_SPEEDING => [$counts['speeding'], (int) $settings->points_speeding, null, 92],
            DrivingEvent::TYPE_IDLE => [$counts['idle'], (int) $settings->points_idle, null, 0],
        ];

        foreach ($map as $type => [$count, $points, $magnitude, $speed]) {
            for ($i = 0; $i < $count; $i++) {
                $recordedAt = $day->copy()->setTime($hour, 10 + ($i * 7), 0);
                $hour = min(18, $hour + 1);

                DrivingEvent::query()->create([
                    'vehicle_id' => $vehicle->id,
                    'driver_id' => $driver->id,
                    'type' => $type,
                    'severity' => $type === DrivingEvent::TYPE_SPEEDING ? 'critical' : 'warning',
                    'magnitude' => $magnitude,
                    'speed_kph' => $speed,
                    'latitude' => -6.200000 + (($driver->id % 20) * 0.001),
                    'longitude' => 106.816666 + (($driver->id % 20) * 0.001),
                    'points_delta' => $points,
                    'recorded_at' => $recordedAt,
                    'ended_at' => $type === DrivingEvent::TYPE_IDLE ? $recordedAt->copy()->addMinutes(12) : null,
                    'meta' => [
                        'demo_tag' => self::TAG,
                        'source' => 'TenantDriverScoringDemoSeeder',
                    ],
                ]);
            }
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Driver>  $drivers
     */
    protected function ensureIncentiveDemo($drivers): void
    {
        $weekly = DriverIncentiveRule::query()->firstOrCreate(
            ['name' => 'Bonus Aman Mingguan '.self::TAG],
            [
                'period' => DriverIncentiveRule::PERIOD_WEEKLY,
                'min_score' => 90,
                'min_days' => 3,
                'reward_amount' => 250000,
                'reward_label' => 'Bonus aman berkendara',
                'is_active' => true,
                'notes' => self::TAG.' Weekly safe-driving bonus.',
            ],
        );

        $monthly = DriverIncentiveRule::query()->firstOrCreate(
            ['name' => 'Bonus Aman Bulanan '.self::TAG],
            [
                'period' => DriverIncentiveRule::PERIOD_MONTHLY,
                'min_score' => 88,
                'min_days' => 15,
                'reward_amount' => 750000,
                'reward_label' => 'Bonus bulanan',
                'is_active' => true,
                'notes' => self::TAG.' Monthly safe-driving bonus.',
            ],
        );

        $periodStart = now()->startOfWeek()->toDateString();
        $periodEnd = now()->endOfWeek()->toDateString();

        foreach ($drivers->take(5) as $index => $driver) {
            $avg = DriverDailyScore::query()
                ->where('driver_id', $driver->id)
                ->whereBetween('score_date', [$periodStart, now()->toDateString()])
                ->avg('score');

            if ($avg === null) {
                continue;
            }

            DriverIncentiveAward::query()->firstOrCreate(
                [
                    'driver_incentive_rule_id' => $weekly->id,
                    'driver_id' => $driver->id,
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                ],
                [
                    'average_score' => round((float) $avg, 2),
                    'scored_days' => DriverDailyScore::query()
                        ->where('driver_id', $driver->id)
                        ->whereBetween('score_date', [$periodStart, now()->toDateString()])
                        ->count(),
                    'reward_amount' => $weekly->reward_amount,
                    'status' => match ($index % 3) {
                        0 => DriverIncentiveAward::STATUS_PENDING,
                        1 => DriverIncentiveAward::STATUS_APPROVED,
                        default => DriverIncentiveAward::STATUS_PAID,
                    },
                    'awarded_at' => now()->subDays($index),
                ],
            );
        }

        unset($monthly);
    }
}
