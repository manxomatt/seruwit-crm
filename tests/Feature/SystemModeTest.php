<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Support\SystemMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemModeTest extends TestCase
{
    use RefreshDatabase;

    public function test_defaults_to_development_outside_production_env(): void
    {
        $this->assertSame(SystemMode::DEVELOPMENT, SystemMode::current());
        $this->assertTrue(SystemMode::isDevelopment());
        $this->assertFalse(SystemMode::shouldSendMail());
        $this->assertTrue(SystemMode::shouldExposeDebugOtp());
    }

    public function test_reads_central_setting_value(): void
    {
        \App\Models\PlatformSetting::setValue(SystemMode::KEY, SystemMode::PRODUCTION);

        $this->assertSame(SystemMode::PRODUCTION, SystemMode::current());
        $this->assertTrue(SystemMode::shouldSendMail());
        $this->assertFalse(SystemMode::shouldExposeDebugOtp());
    }

    public function test_system_mode_is_listed_as_central_only_and_visible_on_central(): void
    {
        $this->assertContains(SystemMode::KEY, Setting::centralOnlyKeys());

        Setting::query()->updateOrCreate(
            ['key' => SystemMode::KEY],
            [
                'group' => 'general',
                'value' => SystemMode::DEVELOPMENT,
                'type' => 'select',
                'label' => 'System Mode',
                'is_public' => false,
                'sort_order' => 8,
            ],
        );

        $this->assertTrue(
            Setting::query()->visibleInSettingsUi()->where('key', SystemMode::KEY)->exists()
        );
    }
}
