<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaintenanceModeTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_access_homepage_when_maintenance_mode_is_off(): void
    {
        Setting::setValue('general.maintenance_mode', '0');

        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_public_receives_503_when_maintenance_mode_is_on(): void
    {
        Setting::setValue('general.maintenance_mode', '1');

        $response = $this->get('/');

        $response->assertStatus(503);
        $response->assertHeader('Retry-After', '3600');
    }

    public function test_json_request_receives_503_json_when_maintenance_mode_is_on(): void
    {
        Setting::setValue('general.maintenance_mode', '1');

        $response = $this->getJson('/');

        $response->assertStatus(503);
        $response->assertHeader('Retry-After', '3600');
        $response->assertJsonStructure(['message']);
    }

    public function test_login_route_is_accessible_when_maintenance_mode_is_on(): void
    {
        Setting::setValue('general.maintenance_mode', '1');

        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_authenticated_staff_bypasses_maintenance_mode(): void
    {
        Setting::setValue('general.maintenance_mode', '1');

        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')->get('/');

        $response->assertStatus(200);
    }
}
