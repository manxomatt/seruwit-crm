<?php

namespace Tests\Unit\Support;

use App\Support\Geo;
use PHPUnit\Framework\TestCase;

class GeoTest extends TestCase
{
    public function test_it_measures_a_known_intercity_distance(): void
    {
        // Monas, Jakarta → Gedung Sate, Bandung: about 118 km great-circle.
        $metres = Geo::distanceMetres(-6.175392, 106.827153, -6.902477, 107.618782);

        $this->assertEqualsWithDelta(118_000, $metres, 2_000);
    }

    public function test_the_same_point_is_zero_distance(): void
    {
        $this->assertSame(0.0, Geo::distanceMetres(-6.2, 106.8, -6.2, 106.8));
    }

    public function test_it_resolves_distances_below_a_metre(): void
    {
        // One ten-millionth of a degree of latitude is roughly 1.1 cm, which is
        // finer than the decimal(10,7) columns can even store.
        $metres = Geo::distanceMetres(-6.2000000, 106.8, -6.2000100, 106.8);

        $this->assertEqualsWithDelta(1.11, $metres, 0.05);
    }

    public function test_it_answers_whether_a_point_is_inside_a_radius(): void
    {
        // ~111 m north of the centre.
        $this->assertTrue(Geo::isWithin(-6.199000, 106.8, -6.2, 106.8, 200));
        $this->assertFalse(Geo::isWithin(-6.199000, 106.8, -6.2, 106.8, 50));
    }

    public function test_it_answers_whether_a_point_is_inside_a_polygon(): void
    {
        // Square polygon around (-6.2, 106.8)
        $polygon = [
            [-6.19, 106.79],
            [-6.19, 106.81],
            [-6.21, 106.81],
            [-6.21, 106.79],
        ];

        // Center is inside
        $this->assertTrue(Geo::isInsidePolygon(-6.20, 106.80, $polygon));

        // Outside point
        $this->assertFalse(Geo::isInsidePolygon(-6.25, 106.80, $polygon));
        $this->assertFalse(Geo::isInsidePolygon(-6.20, 106.85, $polygon));
    }

    public function test_it_calculates_polygon_centroid(): void
    {
        $polygon = [
            [0.0, 0.0],
            [0.0, 10.0],
            [10.0, 10.0],
            [10.0, 0.0],
        ];

        $centroid = Geo::polygonCentroid($polygon);
        $this->assertSame(5.0, $centroid['lat']);
        $this->assertSame(5.0, $centroid['lng']);
    }
}
