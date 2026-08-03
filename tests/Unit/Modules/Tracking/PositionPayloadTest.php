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

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function skyTrackRow(array $overrides = []): array
    {
        return array_replace_recursive([
            'imei' => '358735072143802',
            'status' => 'm',
            'data' => [
                'dt_server' => '2026-07-19 10:00:05',
                'dt_tracker' => '2026-07-19 10:00:00',
                'lat' => -7.036783,
                'lng' => 107.396587,
                'altitude' => 12,
                'angle' => 176,
                'speed' => 42,
                'params' => [
                    'acc' => 1,
                    'motion' => true,
                    'totalDistance' => 2113841.13,
                    'batl' => 6,
                ],
            ],
            'odometer' => 166,
        ], $overrides);
    }

    public function test_it_maps_a_sky_track_row_without_converting_speed(): void
    {
        $payload = PositionPayload::fromSkyTrack($this->skyTrackRow());

        $this->assertSame(358735072143802, $payload->traccarDeviceId);
        $this->assertSame(-7.036783, $payload->latitude);
        $this->assertSame(107.396587, $payload->longitude);
        // Sky Track already reports km/h — do not apply the Traccar knots factor.
        $this->assertSame(42.0, $payload->speedKph);
        $this->assertSame(176.0, $payload->course);
        $this->assertSame(12.0, $payload->altitude);
        $this->assertTrue($payload->ignition);
        $this->assertTrue($payload->motion);
        $this->assertSame(2113841, $payload->totalDistanceM);
        // 10:00 Asia/Jakarta → 03:00 UTC when APP_TIMEZONE is UTC.
        $this->assertSame('2026-07-19 03:00:00', $payload->recordedAt->toDateTimeString());
        $this->assertSame(6, $payload->attributes['batl']);
    }

    public function test_it_falls_back_to_sky_track_server_time(): void
    {
        $payload = PositionPayload::fromSkyTrack($this->skyTrackRow([
            'data' => ['dt_tracker' => null],
        ]));

        $this->assertSame('2026-07-19 03:00:05', $payload->recordedAt->toDateTimeString());
    }

    public function test_it_accepts_live_sky_track_timestamps_in_jakarta_time(): void
    {
        // APP_TIMEZONE=UTC; Sky Track sends "20:00" meaning 20:00 WIB (= 13:00 UTC).
        $this->travelTo(now()->utc()->setTimeFromTimeString('13:05:00'));

        $payload = PositionPayload::fromSkyTrack($this->skyTrackRow([
            'data' => [
                'dt_tracker' => now('Asia/Jakarta')->format('Y-m-d H:i:s'),
                'dt_server' => now('Asia/Jakarta')->format('Y-m-d H:i:s'),
            ],
        ]));

        $this->assertNotNull($payload);
        $this->assertTrue($payload->recordedAt->lte(now()->addMinutes(10)));
    }

    public function test_it_rejects_unusable_sky_track_rows(): void
    {
        $this->assertNull(PositionPayload::fromSkyTrack($this->skyTrackRow(['imei' => ''])));
        $this->assertNull(PositionPayload::fromSkyTrack($this->skyTrackRow(['imei' => 'ABC'])));
        $this->assertNull(PositionPayload::fromSkyTrack($this->skyTrackRow([
            'data' => ['lat' => 0, 'lng' => 0],
        ])));
        $this->assertNull(PositionPayload::fromSkyTrack($this->skyTrackRow([
            'data' => ['dt_tracker' => null, 'dt_server' => null],
        ])));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function gpsServerRow(array $overrides = []): array
    {
        return array_replace_recursive([
            'imei' => '352503097417775',
            'active' => 'true',
            'dt_server' => '2026-08-03 15:54:04',
            'dt_tracker' => '2026-08-03 15:53:26',
            'lat' => '-7.806912',
            'lng' => '110.413102',
            'altitude' => '0',
            'angle' => '103',
            'speed' => '11',
            'params' => [
                'acc' => '1',
                'track' => '1',
                'batl' => '6',
            ],
            'name' => 'ROCKY',
            'odometer' => '29549.893497999794',
        ], $overrides);
    }

    public function test_it_maps_a_gps_server_row_without_converting_speed(): void
    {
        $payload = PositionPayload::fromGpsServer($this->gpsServerRow());

        $this->assertSame(352503097417775, $payload->traccarDeviceId);
        $this->assertSame(-7.806912, $payload->latitude);
        $this->assertSame(110.413102, $payload->longitude);
        $this->assertSame(11.0, $payload->speedKph);
        $this->assertSame(103.0, $payload->course);
        $this->assertSame(0.0, $payload->altitude);
        $this->assertTrue($payload->ignition);
        $this->assertTrue($payload->motion);
        $this->assertSame(29549893, $payload->totalDistanceM);
        // 15:53:26 Asia/Jakarta → 08:53:26 UTC when APP_TIMEZONE is UTC.
        $this->assertSame('2026-08-03 08:53:26', $payload->recordedAt->toDateTimeString());
        $this->assertSame('6', $payload->attributes['batl']);
    }

    public function test_it_falls_back_to_gps_server_server_time(): void
    {
        $payload = PositionPayload::fromGpsServer($this->gpsServerRow([
            'dt_tracker' => null,
        ]));

        $this->assertSame('2026-08-03 08:54:04', $payload->recordedAt->toDateTimeString());
    }

    public function test_it_rejects_unusable_gps_server_rows(): void
    {
        $this->assertNull(PositionPayload::fromGpsServer($this->gpsServerRow(['imei' => ''])));
        $this->assertNull(PositionPayload::fromGpsServer($this->gpsServerRow(['imei' => 'ABC'])));
        $this->assertNull(PositionPayload::fromGpsServer($this->gpsServerRow([
            'lat' => 0,
            'lng' => 0,
        ])));
        $this->assertNull(PositionPayload::fromGpsServer($this->gpsServerRow([
            'dt_tracker' => null,
            'dt_server' => null,
        ])));
        $this->assertNull(PositionPayload::fromGpsServer($this->gpsServerRow([
            'dt_tracker' => '0000-00-00 00:00:00',
            'dt_server' => '0000-00-00 00:00:00',
        ])));
    }
}
