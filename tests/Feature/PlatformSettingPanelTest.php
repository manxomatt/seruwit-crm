<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\Setting;
use App\Support\CentralAiSettings;
use App\Support\SystemMode;
use Database\Seeders\PlatformSettingSeeder;
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
        $this->seed(PlatformSettingSeeder::class);
    }

    public function test_admin_index_redirects_to_first_group(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.platform-settings.index'))
            ->assertRedirect(route('module.platform-settings.group', 'general'));
    }

    public function test_admin_can_view_platform_settings_group(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.platform-settings.group', 'general'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/PlatformSettings/Group')
                ->has('groupSettings')
                ->has('groups')
                ->where('currentGroup', 'general')
                ->has('systemModes'));
    }

    public function test_admin_can_view_ai_platform_settings_group(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.platform-settings.group', 'ai'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/PlatformSettings/Group')
                ->where('currentGroup', 'ai')
                ->has('groupSettings', 10)
                ->has('hasGeminiApiKey')
                ->has('hasGroqApiKey'));
    }

    public function test_admin_bulk_update_persists_ai_credentials_and_applies_config(): void
    {
        $geminiKeySetting = PlatformSetting::query()->where('key', PlatformSetting::KEY_AI_GEMINI_API_KEY)->firstOrFail();
        $geminiModelSetting = PlatformSetting::query()->where('key', PlatformSetting::KEY_AI_GEMINI_MODEL)->firstOrFail();
        $groqKeySetting = PlatformSetting::query()->where('key', PlatformSetting::KEY_AI_GROQ_API_KEY)->firstOrFail();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.platform-settings.bulk-update'), [
                'group' => 'ai',
                'settings' => [
                    ['id' => $geminiKeySetting->id, 'value' => 'AIzaSyTestGeminiKey123'],
                    ['id' => $geminiModelSetting->id, 'value' => 'gemini-2.5-pro'],
                    ['id' => $groqKeySetting->id, 'value' => 'gsk_TestGroqKey456'],
                ],
            ])
            ->assertRedirect(route('module.platform-settings.group', 'ai'));

        $this->assertSame('AIzaSyTestGeminiKey123', PlatformSetting::getValue(PlatformSetting::KEY_AI_GEMINI_API_KEY));
        $this->assertSame('gemini-2.5-pro', PlatformSetting::getValue(PlatformSetting::KEY_AI_GEMINI_MODEL));
        $this->assertSame('gsk_TestGroqKey456', PlatformSetting::getValue(PlatformSetting::KEY_AI_GROQ_API_KEY));

        $this->assertSame('AIzaSyTestGeminiKey123', config('services.gemini.api_key'));
        $this->assertSame('gemini-2.5-pro', config('services.gemini.model'));
        $this->assertSame('gsk_TestGroqKey456', config('services.groq.api_key'));
    }

    public function test_admin_blank_api_key_submission_preserves_existing_key(): void
    {
        $geminiKeySetting = PlatformSetting::query()->where('key', PlatformSetting::KEY_AI_GEMINI_API_KEY)->firstOrFail();
        $geminiKeySetting->update(['value' => 'precious-stored-gemini-key']);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.platform-settings.bulk-update'), [
                'group' => 'ai',
                'settings' => [
                    ['id' => $geminiKeySetting->id, 'value' => ''],
                ],
            ])
            ->assertRedirect(route('module.platform-settings.group', 'ai'));

        $this->assertSame('precious-stored-gemini-key', PlatformSetting::getValue(PlatformSetting::KEY_AI_GEMINI_API_KEY));
    }

    public function test_admin_can_test_gemini_connection_successful(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'generativelanguage.googleapis.com/*' => \Illuminate\Support\Facades\Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'PONG'],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.platform-settings.test-ai'), [
                'provider' => 'gemini',
                'api_key' => 'AIzaSyMockKey',
                'model' => 'gemini-2.5-flash',
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_admin_can_test_groq_connection_successful(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'api.groq.com/*' => \Illuminate\Support\Facades\Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'PONG',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.platform-settings.test-ai'), [
                'provider' => 'groq',
                'api_key' => 'gsk_mock_key',
                'model' => 'qwen/qwen3.6-27b',
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_non_admin_cannot_view_platform_settings_panel(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.platform-settings.group', 'general'))
            ->assertForbidden();
    }

    public function test_admin_bulk_update_persists_to_platform_settings(): void
    {
        $setting = PlatformSetting::query()->where('key', CentralAiSettings::KEY)->firstOrFail();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.platform-settings.bulk-update'), [
                'group' => $setting->group,
                'settings' => [
                    [
                        'id' => $setting->id,
                        'value' => '0',
                    ],
                ],
            ])
            ->assertRedirect(route('module.platform-settings.group', $setting->group));

        $this->assertSame('0', PlatformSetting::getValue(CentralAiSettings::KEY));
        $this->assertFalse(CentralAiSettings::isEnabled());
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
