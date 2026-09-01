<?php

namespace Tests\Feature\Central;

use App\Models\PlatformSetting;
use App\Models\Role;
use App\Models\User;
use App\Support\SystemMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformSettingCapacityTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Role::factory()->admin()->create();
        $this->admin = User::factory()->admin()->create();
    }

    public function test_default_capacity_and_fleet_platform_settings(): void
    {
        $this->assertSame(PlatformSetting::MODEL_PER_VEHICLE_TRIAL, PlatformSetting::getBusinessModel());
        $this->assertTrue(PlatformSetting::isPerVehicleTrialEnabled());
        $this->assertSame(30, PlatformSetting::getVehicleTrialDurationDays());
        $this->assertTrue(PlatformSetting::isPreventDuplicatePlateTrial());
        $this->assertTrue(PlatformSetting::isCapacityCreditsLifetime());
        $this->assertSame(30, PlatformSetting::getVehicleActivationDurationDays());
        $this->assertSame(3, PlatformSetting::getVehicleGracePeriodDays());
        $this->assertFalse(PlatformSetting::isPauseDuringMaintenanceEnabled());
    }

    public function test_admin_can_update_capacity_and_fleet_platform_settings(): void
    {
        $response = $this->actingAs($this->admin)->patch(route('module.platform-settings.update'), [
            'ai_features_enabled' => true,
            'system_mode' => SystemMode::PRODUCTION,
            'capacity_business_model' => PlatformSetting::MODEL_TENANT_QUOTA,
            'vehicle_trial_duration_days' => 14,
            'prevent_duplicate_plate_trial' => false,
            'capacity_credits_lifetime_enabled' => false,
            'vehicle_activation_duration_days' => 45,
            'vehicle_grace_period_days' => 7,
            'pause_during_maintenance_enabled' => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame(PlatformSetting::MODEL_TENANT_QUOTA, PlatformSetting::getBusinessModel());
        $this->assertFalse(PlatformSetting::isPerVehicleTrialEnabled());
        $this->assertSame(14, PlatformSetting::getVehicleTrialDurationDays());
        $this->assertFalse(PlatformSetting::isPreventDuplicatePlateTrial());
        $this->assertFalse(PlatformSetting::isCapacityCreditsLifetime());
        $this->assertSame(45, PlatformSetting::getVehicleActivationDurationDays());
        $this->assertSame(7, PlatformSetting::getVehicleGracePeriodDays());
        $this->assertTrue(PlatformSetting::isPauseDuringMaintenanceEnabled());
    }
}
