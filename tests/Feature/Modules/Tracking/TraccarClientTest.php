<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Modules\Tracking\Exceptions\TraccarAuthenticationException;
use Modules\Tracking\Exceptions\TraccarUnavailableException;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Services\TraccarClient;
use Tests\TestCase;

class TraccarClientTest extends TestCase
{
    use RefreshDatabase;

    private function client(?TrackingConfig $config = null): TraccarClient
    {
        return new TraccarClient($config ?? TrackingConfig::factory()->create([
            'base_url' => 'https://gps.example.test',
        ]));
    }

    public function test_it_lists_every_managed_device_with_all_true(): void
    {
        Http::fake([
            'gps.example.test/api/devices?all=true' => Http::response([
                ['id' => 1, 'uniqueId' => '860123456789012', 'name' => 'Truck A', 'status' => 'online', 'positionId' => 55],
            ]),
        ]);

        $devices = $this->client()->devices();

        $this->assertCount(1, $devices);
        $this->assertSame('Truck A', $devices[0]['name']);
        Http::assertSent(fn (Request $request) => str_contains($request->url(), 'all=true'));
    }

    public function test_a_regular_account_that_rejects_all_true_falls_back_to_the_plain_listing(): void
    {
        Http::fake([
            'gps.example.test/api/devices?all=true' => Http::response([], 400),
            'gps.example.test/api/devices' => Http::response([
                ['id' => 9, 'uniqueId' => '111', 'name' => 'Own Truck', 'positionId' => 77],
            ]),
        ]);

        $devices = $this->client()->devices();

        $this->assertCount(1, $devices);
        $this->assertSame('Own Truck', $devices[0]['name']);
    }

    public function test_it_reads_positions_through_the_managed_device_ids(): void
    {
        Http::fake([
            'gps.example.test/api/devices?all=true' => Http::response([
                ['id' => 1, 'positionId' => 55],
                ['id' => 2, 'positionId' => 56],
            ]),
            'gps.example.test/api/positions?id=55&id=56' => Http::response([
                ['deviceId' => 1, 'latitude' => -6.2, 'longitude' => 106.8, 'valid' => true, 'fixTime' => '2026-07-19T10:00:00Z'],
                ['deviceId' => 2, 'latitude' => -6.3, 'longitude' => 106.9, 'valid' => true, 'fixTime' => '2026-07-19T10:00:00Z'],
            ]),
        ]);

        $positions = $this->client()->latestPositions();

        $this->assertCount(2, $positions);
        $this->assertSame(1, $positions[0]['deviceId']);
    }

    public function test_it_returns_nothing_when_no_device_has_a_position(): void
    {
        Http::fake([
            'gps.example.test/api/devices?all=true' => Http::response([
                ['id' => 1, 'positionId' => 0],
            ]),
        ]);

        $this->assertSame([], $this->client()->latestPositions());
    }

    public function test_basic_credentials_are_sent_when_the_tenant_uses_password_auth(): void
    {
        Http::fake(['gps.example.test/api/*' => Http::response([])]);

        $this->client(TrackingConfig::factory()->create([
            'base_url' => 'https://gps.example.test',
            'auth_type' => TrackingConfig::AUTH_BASIC,
            'email' => 'ops@example.test',
            'password' => 'secret',
        ]))->devices();

        Http::assertSent(fn (Request $request) => $request->hasHeader(
            'Authorization',
            'Basic '.base64_encode('ops@example.test:secret'),
        ));
    }

    public function test_a_bearer_token_is_sent_when_the_tenant_uses_token_auth(): void
    {
        Http::fake(['gps.example.test/api/*' => Http::response([])]);

        $this->client(TrackingConfig::factory()->withToken('abc123')->create([
            'base_url' => 'https://gps.example.test',
        ]))->devices();

        Http::assertSent(fn (Request $request) => $request->hasHeader('Authorization', 'Bearer abc123'));
    }

    public function test_rejected_credentials_raise_an_authentication_exception(): void
    {
        Http::fake(['gps.example.test/api/*' => Http::response([], 401)]);

        $this->expectException(TraccarAuthenticationException::class);
        $this->client()->devices();
    }

    public function test_a_server_error_raises_an_unavailable_exception(): void
    {
        Http::fake(['gps.example.test/api/*' => Http::response([], 500)]);

        $this->expectException(TraccarUnavailableException::class);
        $this->client()->devices();
    }

    public function test_an_unreachable_server_raises_an_unavailable_exception(): void
    {
        Http::fake(['gps.example.test/api/*' => fn () => throw new ConnectionException('timed out')]);

        $this->expectException(TraccarUnavailableException::class);
        $this->client()->devices();
    }
}
