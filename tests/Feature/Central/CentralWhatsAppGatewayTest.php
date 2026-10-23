<?php

namespace Tests\Feature\Central;

use App\Models\CentralUser;
use App\Models\OnboardingSession;
use App\Models\PlatformSetting;
use App\Models\Role;
use App\Models\User;
use App\Services\Central\CentralOnboardingWhatsAppNotifier;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CentralWhatsAppGatewayTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        PlatformSetting::ensureDefaultsExist();
    }

    public function test_manager_uses_central_session_id_when_outside_tenant(): void
    {
        $manager = app(WhatsAppGatewayManager::class);

        $this->assertFalse($manager->isTenantContext());
        $this->assertSame('central_platform', $manager->getSessionId());
    }

    public function test_manager_resolves_log_driver_when_disabled(): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.is_enabled'],
            ['group' => 'whatsapp', 'value' => '0']
        );

        $manager = app(WhatsAppGatewayManager::class);
        $driver = $manager->forCentral();

        $this->assertInstanceOf(\App\Services\WhatsApp\LogWhatsAppGateway::class, $driver);
    }

    public function test_manager_resolves_seruwit_driver_when_enabled(): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.is_enabled'],
            ['group' => 'whatsapp', 'value' => '1']
        );

        $manager = app(WhatsAppGatewayManager::class);
        $driver = $manager->forCentral();

        $this->assertInstanceOf(\App\Services\WhatsApp\SeruwitWhatsAppGateway::class, $driver);
        $this->assertSame('central_platform', $driver->getSessionId());
    }

    public function test_onboarding_welcome_notifier_sends_message_with_placeholders(): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.is_enabled'],
            ['group' => 'whatsapp', 'value' => '1']
        );
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.onboarding_welcome_enabled'],
            ['group' => 'whatsapp', 'value' => '1']
        );

        $owner = User::factory()->create([
            'name' => 'Budi Pratama',
            'email' => 'budi@example.com',
        ]);

        $session = OnboardingSession::create([
            'global_user_id' => $owner->global_id,
            'company_name' => 'Bintang Kejora Rent',
            'subdomain' => 'bintangkejora',
            'phone' => '081234567890',
            'plan_key' => 'starter',
            'status' => OnboardingSession::STATUS_READY,
        ]);

        Http::fake([
            '*/api/messages/send-text' => Http::response([
                'success' => true,
                'message_id' => 'MSG-12345',
            ], 200),
        ]);

        $notifier = app(CentralOnboardingWhatsAppNotifier::class);
        $result = $notifier->sendWelcomeNotification($session);

        $this->assertTrue($result);

        Http::assertSent(function ($request) {
            $data = $request->data();

            return $request->url() === 'http://127.0.0.1:8080/api/messages/send-text'
                && $data['session_id'] === 'central_platform'
                && $data['to'] === '6281234567890'
                && str_contains($data['message'], 'Budi Pratama')
                && str_contains($data['message'], 'Bintang Kejora Rent')
                && str_contains($data['message'], 'bintangkejora');
        });
    }

    public function test_onboarding_welcome_notifier_skips_when_disabled(): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.is_enabled'],
            ['group' => 'whatsapp', 'value' => '0']
        );

        $user = User::factory()->create();

        $session = OnboardingSession::create([
            'global_user_id' => $user->global_id,
            'company_name' => 'Test Company',
            'subdomain' => 'testco',
            'phone' => '081234567890',
            'status' => OnboardingSession::STATUS_READY,
        ]);

        Http::fake();

        $notifier = app(CentralOnboardingWhatsAppNotifier::class);
        $result = $notifier->sendWelcomeNotification($session);

        $this->assertFalse($result);
        Http::assertNothingSent();
    }

    public function test_admin_can_view_whatsapp_platform_settings_group(): void
    {
        $this->setUpRoles();
        $admin = $this->createAdminUser();

        Http::fake([
            '*/api/sessions/central_platform/status' => Http::response([
                'success' => true,
                'status' => 'DISCONNECTED',
            ], 200),
        ]);

        $this->actingAs($admin)
            ->get(route('module.platform-settings.group', 'whatsapp'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/PlatformSettings/Group')
                ->where('currentGroup', 'whatsapp')
                ->has('deviceStatus')
                ->where('sessionId', 'central_platform'));
    }

    public function test_admin_can_trigger_start_session_qr(): void
    {
        $this->setUpRoles();
        $admin = $this->createAdminUser();

        Http::fake([
            '*/api/sessions/start' => Http::response([
                'success' => true,
                'qr_base64' => 'data:image/png;base64,sample',
            ], 200),
        ]);

        $this->actingAs($admin)
            ->post(route('module.platform-settings.whatsapp.start'))
            ->assertOk()
            ->assertJson([
                'success' => true,
                'qr_base64' => 'data:image/png;base64,sample',
            ]);
    }

    public function test_admin_can_send_test_message(): void
    {
        $this->setUpRoles();
        $admin = $this->createAdminUser();

        Http::fake([
            '*/api/messages/send-text' => Http::response([
                'success' => true,
                'message' => 'Pesan uji coba berhasil terkirim',
            ], 200),
        ]);

        $this->actingAs($admin)
            ->post(route('module.platform-settings.whatsapp.test'), [
                'phone' => '081234567890',
                'message' => 'Tes pesan WhatsApp Central',
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
            ]);
    }
}
