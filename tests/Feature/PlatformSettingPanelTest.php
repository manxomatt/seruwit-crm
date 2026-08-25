<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\Setting;
use App\Support\CentralAiSettings;
use App\Support\SystemMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PlatformSettingPanelTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_view_platform_settings_panel(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.platform-settings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/PlatformSettings/Index')
                ->has('settings.ai_features_enabled')
                ->has('settings.system_mode')
                ->has('systemModes'));
    }

    public function test_non_admin_cannot_view_platform_settings_panel(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.platform-settings.index'))
            ->assertForbidden();
    }

    public function test_admin_update_persists_to_platform_settings(): void
    {
        $this->actingAs($this->createAdminUser())
            ->patch(route('module.platform-settings.update'), [
                'ai_features_enabled' => false,
                'system_mode' => SystemMode::PRODUCTION,
            ])
            ->assertRedirect();

        $this->assertSame('0', PlatformSetting::getValue(CentralAiSettings::KEY));
        $this->assertSame(SystemMode::PRODUCTION, PlatformSetting::getValue(SystemMode::KEY));
        $this->assertFalse(CentralAiSettings::isEnabled());
        $this->assertTrue(SystemMode::isProduction());
    }

    public function test_non_admin_cannot_update(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->patch(route('module.platform-settings.update'), [
                'ai_features_enabled' => false,
                'system_mode' => SystemMode::PRODUCTION,
            ])
            ->assertForbidden();
    }

    public function test_platform_keys_removed_from_central_settings_table(): void
    {
        // B3 cleanup migration deletes the shadow rows from `settings`.
        $this->assertSame(
            0,
            DB::table('settings')->whereIn('key', Setting::centralOnlyKeys())->count(),
        );
    }
}
