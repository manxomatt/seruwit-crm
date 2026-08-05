<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\GpsSource;
use Modules\Tracking\Models\TrackingConfig;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TrackingConfigTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * @return array<string, mixed>
     */
    private function configPayload(array $overrides = []): array
    {
        return array_replace([
            'alerts_enabled' => true,
            'alert_speed_kph' => 80,
            'alert_stale_minutes' => 15,
            'alert_idle_minutes' => 30,
            'alert_cooldown_minutes' => 30,
            'geofence_radius_m' => 200,
            'checkpoint_min_distance_m' => 200,
            'checkpoint_min_interval_minutes' => 5,
            'retention_days' => 90,
        ], $overrides);
    }

    /**
     * @return array<string, mixed>
     */
    private function sourcePayload(array $overrides = []): array
    {
        return array_replace([
            'name' => 'Primary',
            'provider' => 'traccar',
            'base_url' => 'https://gps.example.test',
            'auth_type' => 'basic',
            'email' => 'ops@example.test',
            'password' => 'secret',
            'poll_enabled' => true,
        ], $overrides);
    }

    public function test_the_settings_page_renders_without_leaking_the_stored_secret(): void
    {
        $user = $this->createAdminUser();
        GpsSource::factory()->create(['password' => 'top-secret']);

        $this->actingAs($user)->get(route('module.tracking.settings.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Tracking/Settings')
                ->has('sources', 1)
                ->where('sources.0.has_password', true)
                ->where('sources.0.has_token', false)
                ->missing('sources.0.password')
                ->missing('sources.0.token')
                ->has('config.alerts_enabled')
                ->has('maxSources')
            );
    }

    public function test_thresholds_are_saved(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create();

        $this->actingAs($user)->patch(route('module.tracking.settings.update'), $this->configPayload([
            'geofence_radius_m' => 350,
        ]))->assertSessionHas('success');

        $this->assertSame(350, TrackingConfig::first()->geofence_radius_m);
    }

    public function test_source_credentials_are_stored_encrypted(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.tracking.settings.sources.store'), $this->sourcePayload());

        $source = GpsSource::first();
        $this->assertSame('secret', $source->password);

        $raw = DB::table('gps_sources')->where('id', $source->id)->value('password');
        $this->assertNotSame('secret', $raw);
    }

    public function test_submitting_a_blank_password_keeps_the_stored_one(): void
    {
        $user = $this->createAdminUser();
        $source = GpsSource::factory()->create(['password' => 'original']);

        $this->actingAs($user)->patch(route('module.tracking.settings.sources.update', $source), $this->sourcePayload([
            'password' => '',
            'name' => 'Updated',
        ]))->assertSessionHas('success');

        $source->refresh();
        $this->assertSame('original', $source->password);
        $this->assertSame('Updated', $source->name);
    }

    public function test_sky_track_source_stores_url_and_api_key(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.tracking.settings.sources.store'), $this->sourcePayload([
            'name' => 'Sky Track',
            'provider' => 'sky_track',
            'base_url' => 'https://api.sky-track.example.test',
            'auth_type' => 'api_key',
            'email' => 'ignored@example.test',
            'password' => 'ignored',
            'token' => 'sky-secret-key',
        ]))->assertSessionHas('success');

        $source = GpsSource::first();
        $this->assertSame('sky_track', $source->provider);
        $this->assertSame('api_key', $source->auth_type);
        $this->assertSame('https://api.sky-track.example.test', $source->base_url);
        $this->assertSame('sky-secret-key', $source->token);
        $this->assertNull($source->email);
        $this->assertNull($source->password);
        $this->assertTrue($source->isConfigured());
    }

    public function test_gps_server_source_stores_url_and_api_key(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.tracking.settings.sources.store'), $this->sourcePayload([
            'name' => 'GPS-Server',
            'provider' => 'gps_server',
            'base_url' => 'https://gsi-tracking.com',
            'auth_type' => 'api_key',
            'email' => 'ignored@example.test',
            'password' => 'ignored',
            'token' => '8A215CA3D0D513899DB7357D9CBE0CD5',
        ]))->assertSessionHas('success');

        $source = GpsSource::first();
        $this->assertSame('gps_server', $source->provider);
        $this->assertSame('api_key', $source->auth_type);
        $this->assertSame('https://gsi-tracking.com', $source->base_url);
        $this->assertSame('8A215CA3D0D513899DB7357D9CBE0CD5', $source->token);
        $this->assertNull($source->email);
        $this->assertNull($source->password);
        $this->assertTrue($source->isConfigured());
        $this->assertTrue($source->usesGpsServer());
    }

    public function test_sky_track_requires_a_base_url(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.tracking.settings.sources.store'), $this->sourcePayload([
            'provider' => 'sky_track',
            'base_url' => '',
            'auth_type' => 'api_key',
            'token' => 'sky-secret-key',
        ]))->assertSessionHasErrors(['base_url']);
    }

    public function test_gps_server_requires_a_base_url(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.tracking.settings.sources.store'), $this->sourcePayload([
            'provider' => 'gps_server',
            'base_url' => '',
            'auth_type' => 'api_key',
            'token' => 'gps-server-key',
        ]))->assertSessionHasErrors(['base_url']);
    }

    public function test_thresholds_are_validated(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->patch(route('module.tracking.settings.update'), $this->configPayload([
            'geofence_radius_m' => 1,
            'retention_days' => 0,
        ]))->assertSessionHasErrors(['geofence_radius_m', 'retention_days']);
    }

    public function test_the_connection_test_reports_success(): void
    {
        $user = $this->createAdminUser();
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        Http::fake(['gps.example.test/api/devices' => Http::response([])]);

        $this->actingAs($user)->post(route('module.tracking.settings.sources.test', $source))->assertSessionHas('success');

        $this->assertNull($source->fresh()->last_poll_error);
    }

    public function test_the_sky_track_connection_test_sends_x_api_key_header(): void
    {
        $user = $this->createAdminUser();
        $source = GpsSource::factory()->skyTrack('sky-secret-key')->create();
        Http::fake([
            'api.sky-track.example.test/api/objects' => Http::response([]),
        ]);

        $this->actingAs($user)->post(route('module.tracking.settings.sources.test', $source))->assertSessionHas('success');

        Http::assertSent(fn ($request) => $request->url() === 'https://api.sky-track.example.test/api/objects'
            && $request->hasHeader('X-Api-Key', 'sky-secret-key'));
        $this->assertNull($source->fresh()->last_poll_error);
    }

    public function test_the_gps_server_connection_test_sends_key_query_parameter(): void
    {
        $user = $this->createAdminUser();
        $source = GpsSource::factory()->gpsServer('gps-server-key')->create();
        Http::fake([
            'gsi-tracking.example.test/api/api.php*' => Http::response([]),
        ]);

        $this->actingAs($user)->post(route('module.tracking.settings.sources.test', $source))->assertSessionHas('success');

        Http::assertSent(function ($request) {
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

            return str_starts_with($request->url(), 'https://gsi-tracking.example.test/api/api.php')
                && ($query['api'] ?? null) === 'user'
                && ($query['ver'] ?? null) === '1.0'
                && ($query['key'] ?? null) === 'gps-server-key'
                && ($query['cmd'] ?? null) === 'USER_GET_OBJECTS';
        });
        $this->assertNull($source->fresh()->last_poll_error);
    }

    public function test_the_connection_test_records_a_failure_for_the_settings_page(): void
    {
        $user = $this->createAdminUser();
        $source = GpsSource::factory()->create(['base_url' => 'https://gps.example.test']);
        Http::fake(['gps.example.test/api/*' => Http::response([], 401)]);

        $this->actingAs($user)->post(route('module.tracking.settings.sources.test', $source))->assertSessionHas('error');

        $this->assertNotNull($source->fresh()->last_poll_error);
    }

    public function test_a_source_with_paired_devices_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $source = GpsSource::factory()->create();
        $vehicle = Vehicle::factory()->create();
        GpsDevice::factory()->forSource($source)->pairedTo($vehicle)->create();

        $this->actingAs($user)->delete(route('module.tracking.settings.sources.destroy', $source))
            ->assertSessionHas('error');

        $this->assertModelExists($source);
    }

    public function test_source_limit_is_enforced(): void
    {
        $user = $this->createAdminUser();
        GpsSource::factory()->count(GpsSource::MAX_PER_TENANT)->create();

        $this->actingAs($user)->post(route('module.tracking.settings.sources.store'), $this->sourcePayload([
            'name' => 'Overflow',
        ]))->assertSessionHasErrors(['name']);
    }
}
