<?php

namespace Tests\Feature\Central;

use App\Models\CentralUser;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Central\CentralPhoneVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CentralPhoneVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        PlatformSetting::ensureDefaultsExist();
    }

    public function test_user_model_has_phone_verification_attributes_and_helpers(): void
    {
        $user = User::factory()->create([
            'phone' => '628123456789',
            'phone_verified_at' => null,
        ]);

        $this->assertFalse($user->hasVerifiedPhone());

        $user->markPhoneAsVerified();

        $this->assertTrue($user->hasVerifiedPhone());
        $this->assertNotNull($user->phone_verified_at);
        $this->assertContains('phone', $user->getSyncedAttributeNames());
        $this->assertContains('phone_verified_at', $user->getSyncedAttributeNames());
    }

    public function test_central_user_model_has_phone_verification_attributes_and_helpers(): void
    {
        $user = User::factory()->create();
        $centralUser = CentralUser::query()->where('global_id', $user->global_id)->firstOrFail();

        $this->assertFalse($centralUser->hasVerifiedPhone());

        $centralUser->markPhoneAsVerified();

        $this->assertTrue($centralUser->hasVerifiedPhone());
        $this->assertNotNull($centralUser->phone_verified_at);
        $this->assertContains('phone', $centralUser->getSyncedAttributeNames());
        $this->assertContains('phone_verified_at', $centralUser->getSyncedAttributeNames());
    }

    public function test_service_sends_otp_and_dispatches_via_whatsapp(): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.is_enabled'],
            ['group' => 'whatsapp', 'value' => '1']
        );

        $user = User::factory()->create(['name' => 'Ahmad Syarif']);

        Http::fake([
            '*/api/messages/send-text' => Http::response([
                'success' => true,
                'message_id' => 'MSG-OTP-001',
            ], 200),
        ]);

        $service = app(CentralPhoneVerificationService::class);
        $result = $service->sendOtp($user, '0812-3456-7890');

        $this->assertTrue($result['success']);
        $this->assertSame('6281234567890', $result['phone']);
        $this->assertNotNull($result['cooldown']);

        // Assert HTTP payload sent to Seruwit WA Gateway
        Http::assertSent(function ($request) {
            $data = $request->data();

            return $data['session_id'] === 'central_platform'
                && $data['to'] === '6281234567890'
                && str_contains($data['message'], 'KODE VERIFIKASI SERUWIT')
                && str_contains($data['message'], 'Ahmad Syarif');
        });
    }

    public function test_service_blocks_resend_when_cooldown_active(): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.is_enabled'],
            ['group' => 'whatsapp', 'value' => '1']
        );

        $user = User::factory()->create();

        Http::fake([
            '*/api/messages/send-text' => Http::response(['success' => true], 200),
        ]);

        $service = app(CentralPhoneVerificationService::class);
        $service->sendOtp($user, '081234567890');

        // Immediate second attempt should trigger ValidationException
        $this->expectException(ValidationException::class);
        $service->sendOtp($user, '081234567890');
    }

    public function test_service_verifies_valid_otp_and_marks_user_verified(): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.is_enabled'],
            ['group' => 'whatsapp', 'value' => '1']
        );

        $user = User::factory()->create([
            'phone' => null,
            'phone_verified_at' => null,
        ]);

        Http::fake([
            '*/api/messages/send-text' => Http::response(['success' => true], 200),
        ]);

        $service = app(CentralPhoneVerificationService::class);
        $sendResult = $service->sendOtp($user, '081234567890');

        // Read the generated code from cache challenge or debug code
        $phone = '6281234567890';
        $cacheData = Cache::get('central_phone_otp:'.$phone);
        $this->assertNotNull($cacheData);

        // We can extract debug code or test via direct OTP verification
        $otp = $sendResult['debug_code'] ?? null;
        if (! $otp) {
            // In testing without debug code, inject known challenge
            \Illuminate\Support\Facades\Hash::setRounds(4);
            $otp = '654321';
            Cache::put('central_phone_otp:'.$phone, [
                'code_hash' => \Illuminate\Support\Facades\Hash::make($otp),
                'attempts' => 0,
                'created_at' => now()->timestamp,
            ], 300);
        }

        $verifyResult = $service->verifyOtp($user, $phone, $otp);

        $this->assertTrue($verifyResult['success']);
        $user->refresh();
        $this->assertSame($phone, $user->phone);
        $this->assertTrue($user->hasVerifiedPhone());

        // Cache should be cleared
        $this->assertNull(Cache::get('central_phone_otp:'.$phone));
    }

    public function test_service_rejects_invalid_otp_and_increments_attempts(): void
    {
        $user = User::factory()->create();
        $phone = '6281234567890';

        Cache::put('central_phone_otp:'.$phone, [
            'code_hash' => \Illuminate\Support\Facades\Hash::make('123456'),
            'attempts' => 0,
            'created_at' => now()->timestamp,
        ], 300);

        $service = app(CentralPhoneVerificationService::class);
        $result = $service->verifyOtp($user, $phone, '999999');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Sisa percobaan: 4', $result['error']);

        $cached = Cache::get('central_phone_otp:'.$phone);
        $this->assertSame(1, $cached['attempts']);
    }

    public function test_service_locks_out_after_max_failed_attempts(): void
    {
        $user = User::factory()->create();
        $phone = '6281234567890';

        Cache::put('central_phone_otp:'.$phone, [
            'code_hash' => \Illuminate\Support\Facades\Hash::make('123456'),
            'attempts' => 5,
            'created_at' => now()->timestamp,
        ], 300);

        $service = app(CentralPhoneVerificationService::class);
        $result = $service->verifyOtp($user, $phone, '999999');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Terlalu banyak percobaan salah', $result['error']);

        // OTP cache cleared after max attempts
        $this->assertNull(Cache::get('central_phone_otp:'.$phone));
    }
}
