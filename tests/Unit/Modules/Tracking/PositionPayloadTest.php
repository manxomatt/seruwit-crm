<?php

namespace Tests\Unit\Modules\Tracking;

use Modules\Tracking\Support\PositionPayload;
use Tests\TestCase;

class PositionPayloadTest extends TestCase
{
    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function row(array $overrides = []): array
    {
        return array_replace([
            'deviceId' => 7,
            'latitude' => -6.2,
            'longitude' => 106.8,
            'speed' => 0,
            'course' => 90,
            'valid' => true,
            'fixTime' => '2026-07-19T10:00:00.000+00:00',
            'serverTime' => '2026-07-19T10:00:05.000+00:00',
            'attributes' => [],
        ], $overrides);
    }

    public function test_it_converts_speed_from_knots_to_kilometres_per_hour(): void
    {
        $payload = PositionPayload::fromTraccar($this->row(['speed' => 50]));

        // 50 knots is 92.6 km/h. Reading it as km/h would report 50 — plausible
        // on screen and 46% wrong.
        $this->assertSame(92.6, $payload->speedKph);
    }

    public function test_it_falls_back_through_the_timestamp_chain(): void
    {
        $fromDeviceTime = PositionPayload::fromTraccar($this->row([
            'fixTime' => null,
            'deviceTime' => '2026-07-19T09:00:00.000+00:00',
        ]));
        $this->assertSame('2026-07-19 09:00:00', $fromDeviceTime->recordedAt->toDateTimeString());

        $fromServerTime = PositionPayload::fromTraccar($this->row([
            'fixTime' => null,
            'deviceTime' => null,
            'serverTime' => '2026-07-19T08:00:00.000+00:00',
        ]));
        $this->assertSame('2026-07-19 08:00:00', $fromServerTime->recordedAt->toDateTimeString());
    }

    public function test_it_extracts_the_attributes_it_understands_and_keeps_the_rest(): void
    {
        $payload = PositionPayload::fromTraccar($this->row([
            'attributes' => [
                'totalDistance' => 1234.6,
                'ignition' => true,
                'motion' => false,
                'battery' => 12.4,
            ],
        ]));

        $this->assertSame(1235, $payload->totalDistanceM);
        $this->assertTrue($payload->ignition);
        $this->assertFalse($payload->motion);
        $this->assertSame(12.4, $payload->attributes['battery']);
    }

    public function test_it_keeps_a_valid_false_fix_that_still_has_real_coordinates(): void
    {
        // A parked vehicle reports valid=false with its last-known position;
        // dropping those would hide most of a fleet most of the time.
        $payload = PositionPayload::fromTraccar($this->row(['valid' => false]));

        $this->assertNotNull($payload);
        $this->assertSame(-6.2, $payload->latitude);
    }

    public function test_it_rejects_null_island_and_out_of_range_coordinates(): void
    {
        $this->assertNull(PositionPayload::fromTraccar($this->row(['latitude' => 0, 'longitude' => 0])));
        $this->assertNull(PositionPayload::fromTraccar($this->row(['latitude' => 91])));
        $this->assertNull(PositionPayload::fromTraccar($this->row(['longitude' => 181])));
    }

    public function test_it_rejects_a_fix_dated_far_in_the_future(): void
    {
        $this->assertNull(PositionPayload::fromTraccar($this->row([
            'fixTime' => now()->addYear()->toIso8601String(),
        ])));
    }

    public function test_it_rejects_a_row_without_usable_identifiers(): void
    {
        $this->assertNull(PositionPayload::fromTraccar($this->row(['deviceId' => null])));
        $this->assertNull(PositionPayload::fromTraccar($this->row(['latitude' => null])));
        $this->assertNull(PositionPayload::fromTraccar($this->row(['fixTime' => null, 'deviceTime' => null, 'serverTime' => null])));
    }
}
