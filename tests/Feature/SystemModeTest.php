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

    public function test_transition_to_production_syncs_legacy_setting_revokes_demo_data_and_clears_debug_session(): void
    {
        \App\Models\PlatformSetting::setValue(SystemMode::KEY, SystemMode::DEVELOPMENT);

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

        $tenant = new \App\Models\Tenant([
            'id' => 'demo-transition-tenant',
            'name' => 'Demo Transition Co',
            'can_install_demo_data' => true,
        ]);
        $tenant->saveQuietly();

        session()->start();
        session()->put([
            'dev_verification_url' => 'http://localhost/verify-email/test',
            'dev_reset_url' => 'http://localhost/reset-password/test',
            'debug_otp' => '123456',
        ]);

        SystemMode::transitionTo(SystemMode::PRODUCTION);

        $this->assertTrue(SystemMode::isProduction());
        $this->assertSame(
            SystemMode::PRODUCTION,
            Setting::query()->where('key', SystemMode::KEY)->value('value')
        );
        $this->assertFalse($tenant->fresh()->canInstallDemoData());
        $this->assertNull(session('dev_verification_url'));
        $this->assertNull(session('dev_reset_url'));
        $this->assertNull(session('debug_otp'));

        // Clean up tenant row without triggering tenancy database pipeline
        \Illuminate\Support\Facades\DB::table('tenants')->where('id', 'demo-transition-tenant')->delete();
    }

    public function test_production_readiness_issues_detects_missing_smtp_and_whatsapp_gateway(): void
    {
        \App\Models\PlatformSetting::setValue('email.smtp_host', '');
        \App\Models\PlatformSetting::setValue('whatsapp.require_phone_verification', '1');
        \App\Models\PlatformSetting::setValue('whatsapp.is_enabled', '0');

        $issues = SystemMode::productionReadinessIssues();

        $this->assertCount(2, $issues);

        \App\Models\PlatformSetting::setValue('email.smtp_host', 'smtp.seruwit.test');
        \App\Models\PlatformSetting::setValue('whatsapp.is_enabled', '1');

        $this->assertSame([], SystemMode::productionReadinessIssues());
    }
}
