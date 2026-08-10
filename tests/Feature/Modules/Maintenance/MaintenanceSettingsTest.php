<?php

namespace Tests\Feature\Modules\Maintenance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Maintenance\Support\MaintenanceSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MaintenanceSettingsTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_view_and_update_maintenance_settings(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.maintenance.settings.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Maintenance/Settings/Edit')
                ->has('settings.alert_km_before')
                ->has('settings.auto_create_wo')
            );

        $this->actingAs($user)
            ->from(route('module.maintenance.settings.edit'))
            ->patch(route('module.maintenance.settings.update'), [
                'alert_km_before' => 750,
                'alert_days_before' => 21,
                'auto_create_wo' => true,
                'single_active_wo_per_vehicle' => false,
                'single_active_wo_per_bay' => true,
            ])
            ->assertRedirect(route('module.maintenance.settings.edit'));

        $settings = MaintenanceSettings::all();
        $this->assertSame('750', $settings['alert_km_before']);
        $this->assertSame('21', $settings['alert_days_before']);
        $this->assertTrue($settings['auto_create_wo']);
        $this->assertFalse($settings['single_active_wo_per_vehicle']);
        $this->assertTrue($settings['single_active_wo_per_bay']);
    }

    public function test_maintenance_settings_are_hidden_from_general_settings_ui(): void
    {
        MaintenanceSettings::update([
            'alert_km_before' => 500,
            'alert_days_before' => 14,
            'auto_create_wo' => false,
            'single_active_wo_per_vehicle' => true,
            'single_active_wo_per_bay' => true,
        ]);

        $this->assertFalse(
            \App\Models\Setting::query()->visibleInSettingsUi()->where('group', 'maintenance')->exists()
        );
    }
}
