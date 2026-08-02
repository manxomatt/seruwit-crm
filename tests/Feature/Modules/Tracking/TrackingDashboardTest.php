<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Tracking\Models\GpsDevice;
use Modules\Tracking\Models\TrackingConfig;
use Modules\Tracking\Support\TrackingStatusBoard;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TrackingDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_tracking_dashboard(): void
    {
        $this->get(route('module.tracking.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_tracking_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.tracking.dashboard'))->assertForbidden();
    }

    public function test_tracking_dashboard_shows_status_board(): void
    {
        TrackingConfig::current()->update([
            'poll_enabled' => true,
            'base_url' => 'https://traccar.example.test',
            'auth_type' => 'token',
            'token' => 'test-token',
        ]);

        $vehicle = Vehicle::factory()->create();

        GpsDevice::factory()
            ->pairedTo($vehicle)
            ->at(-6.2, 106.8)
            ->create([
                'status' => 'online',
                'last_speed_kph' => 42,
                'last_recorded_at' => now()->subMinute(),
            ]);

        GpsDevice::factory()->create([
            'status' => 'unknown',
            'last_latitude' => null,
            'last_longitude' => null,
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.tracking.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Tracking/Dashboard/Index')
                ->where('board.devices.total', 2)
                ->where('board.devices.paired', 1)
                ->where('board.devices.unpaired', 1)
                ->where('board.devices.moving', 1)
                ->where('board.devices.stale', 1)
                ->where('board.config.configured', true)
                ->where('board.config.poll_enabled', true)
                ->has('board.recent', 2)
                ->where('can.update', true)
            );
    }

    public function test_status_board_classifies_idle_devices(): void
    {
        $vehicle = Vehicle::factory()->create();

        GpsDevice::factory()
            ->pairedTo($vehicle)
            ->at(-6.2, 106.8)
            ->create([
                'last_speed_kph' => 0,
                'last_recorded_at' => now()->subMinutes(2),
            ]);

        $board = app(TrackingStatusBoard::class)->build();

        $this->assertSame(1, $board['devices']['idle']);
        $this->assertSame(0, $board['devices']['moving']);
        $this->assertSame('idle', $board['recent'][0]['tone']);
    }
}
