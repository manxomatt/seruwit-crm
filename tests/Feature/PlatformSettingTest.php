<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Support\CentralAiSettings;
use App\Support\SystemMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_and_set_value_roundtrip(): void
    {
        PlatformSetting::setValue('platform.demo_flag', '1');

        $this->assertSame('1', PlatformSetting::getValue('platform.demo_flag'));
        $this->assertNull(PlatformSetting::getValue('platform.missing'));
        $this->assertSame('fallback', PlatformSetting::getValue('platform.missing', 'fallback'));
    }

    public function test_set_value_fills_required_columns_on_first_write(): void
    {
        PlatformSetting::setValue('platform.demo_flag', 'on');

        $row = PlatformSetting::query()->where('key', 'platform.demo_flag')->first();

        $this->assertNotNull($row);
        $this->assertSame('general', $row->group);
        $this->assertSame('platform.demo_flag', $row->label);
    }

    public function test_migration_copies_global_ai_flag_from_central_settings(): void
    {
        // Seeded into central `settings` by add_ai_features_enabled_to_central_settings
        // and copied into platform_settings by the B1 migration.
        $this->assertNotNull(PlatformSetting::getValue('general.ai_features_enabled'));
    }

    public function test_model_is_pinned_to_central_connection(): void
    {
        $this->assertSame(
            config('tenancy.database.central_connection'),
            (new PlatformSetting)->getConnectionName(),
        );
    }

    public function test_central_ai_settings_reads_from_platform_setting(): void
    {
        PlatformSetting::setValue(CentralAiSettings::KEY, '0');
        $this->assertFalse(CentralAiSettings::isEnabled());

        PlatformSetting::setValue(CentralAiSettings::KEY, '1');
        $this->assertTrue(CentralAiSettings::isEnabled());
    }

    public function test_system_mode_reads_from_platform_setting(): void
    {
        PlatformSetting::setValue(SystemMode::KEY, SystemMode::DEVELOPMENT);
        $this->assertTrue(SystemMode::isDevelopment());

        PlatformSetting::setValue(SystemMode::KEY, SystemMode::PRODUCTION);
        $this->assertTrue(SystemMode::isProduction());
    }
}
