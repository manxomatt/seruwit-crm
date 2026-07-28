<?php

namespace Tests\Unit\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Tracking\Models\VehiclePosition;
use Modules\Tracking\Support\PositionTrail;
use Tests\TestCase;

class PositionTrailTest extends TestCase
{
    use RefreshDatabase;

    public function test_thin_keeps_first_and_last_when_over_limit(): void
    {
        $positions = collect(range(1, 10))->map(fn (int $i) => new VehiclePosition([
            'latitude' => -6.2 + ($i / 1000),
            'longitude' => 106.8,
            'recorded_at' => now()->addMinutes($i),
        ]));

        $thinned = PositionTrail::thin($positions, 4);

        $this->assertLessThanOrEqual(5, $thinned->count());
        $this->assertTrue($thinned->first()->is($positions->first()) || $thinned->first()->latitude === $positions->first()->latitude);
        $this->assertSame(
            (string) $positions->last()->latitude,
            (string) $thinned->last()->latitude,
        );
    }

    public function test_distance_prefers_provider_total_distance_delta(): void
    {
        $positions = collect([
            new VehiclePosition(['latitude' => -6.2, 'longitude' => 106.8, 'total_distance_m' => 1000]),
            new VehiclePosition(['latitude' => -6.3, 'longitude' => 106.9, 'total_distance_m' => 4500]),
        ]);

        $this->assertSame(3.5, PositionTrail::distanceKm($positions));
    }
}
