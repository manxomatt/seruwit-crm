<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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
    private function payload(array $overrides = []): array
    {
        return array_replace([
            'base_url' => 'https://gps.example.test',
            'auth_type' => 'basic',
            'email' => 'ops@example.test',
            'password' => 'secret',
            'poll_enabled' => true,
            'geofence_radius_m' => 200,
            'checkpoint_min_distance_m' => 200,
            'checkpoint_min_interval_minutes' => 5,
            'retention_days' => 90,
        ], $overrides);
    }

    public function test_the_settings_page_renders_without_leaking_the_stored_secret(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create(['password' => 'top-secret']);

        $this->actingAs($user)->get(route('module.tracking.settings.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Tracking/Settings')
                ->where('hasPassword', true)
                ->missing('config.password')
                ->missing('config.token')
            );
    }

    public function test_credentials_are_stored_encrypted(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->patch(route('module.tracking.settings.update'), $this->payload());

        $config = TrackingConfig::first();
        $this->assertSame('secret', $config->password);

        $raw = DB::table('tracking_configs')->where('id', $config->id)->value('password');
        $this->assertNotSame('secret', $raw);
    }

    public function test_submitting_a_blank_password_keeps_the_stored_one(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create(['password' => 'original']);

        $this->actingAs($user)->patch(route('module.tracking.settings.update'), $this->payload([
            'password' => '',
            'geofence_radius_m' => 350,
        ]))->assertSessionHas('success');

        $config = TrackingConfig::first();
        $this->assertSame('original', $config->password);
        $this->assertSame(350, $config->geofence_radius_m);
    }

    public function test_thresholds_are_validated(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->patch(route('module.tracking.settings.update'), $this->payload([
            'geofence_radius_m' => 1,
            'retention_days' => 0,
            'auth_type' => 'carrier-pigeon',
        ]))->assertSessionHasErrors(['geofence_radius_m', 'retention_days', 'auth_type']);
    }

    public function test_the_connection_test_reports_success(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create(['base_url' => 'https://gps.example.test']);
        Http::fake(['gps.example.test/api/devices' => Http::response([])]);

        $this->actingAs($user)->post(route('module.tracking.settings.test'))->assertSessionHas('success');

        $this->assertNull(TrackingConfig::first()->last_poll_error);
    }

    public function test_the_connection_test_records_a_failure_for_the_settings_page(): void
    {
        $user = $this->createAdminUser();
        TrackingConfig::factory()->create(['base_url' => 'https://gps.example.test']);
        Http::fake(['gps.example.test/api/*' => Http::response([], 401)]);

        $this->actingAs($user)->post(route('module.tracking.settings.test'))->assertSessionHas('error');

        $this->assertNotNull(TrackingConfig::first()->last_poll_error);
    }
}
