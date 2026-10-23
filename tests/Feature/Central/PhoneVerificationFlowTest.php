<?php

namespace Tests\Feature\Central;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PhoneVerificationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        PlatformSetting::ensureDefaultsExist();
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.is_enabled'],
            ['group' => 'whatsapp', 'value' => '1']
        );
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.require_phone_verification'],
            ['group' => 'whatsapp', 'value' => '1']
        );
    }

    public function test_unverified_user_sees_phone_verification_notice(): void
    {
        $user = User::factory()->create([
            'phone' => '628123456789',
            'phone_verified_at' => null,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('central.phone.notice'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Central/Auth/VerifyPhone')
                ->where('phone', '628123456789')
                ->where('hasPhone', true));
    }

    public function test_already_verified_user_is_redirected_away_from_notice(): void
    {
        $user = User::factory()->create([
            'phone' => '628123456789',
            'phone_verified_at' => now(),
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('central.phone.notice'))
            ->assertRedirect(route('central.onboarding.show'));
    }

    public function test_user_can_request_otp_via_whatsapp(): void
    {
        $user = User::factory()->create([
            'phone' => '081234567890',
            'phone_verified_at' => null,
            'email_verified_at' => now(),
        ]);

        Http::fake([
            '*/api/messages/send-text' => Http::response(['success' => true], 200),
        ]);

        $this->actingAs($user)
            ->post(route('central.phone.send'))
            ->assertRedirect()
            ->assertSessionHas('status');

        Http::assertSent(function ($request) {
            $data = $request->data();

            return $data['session_id'] === 'central_platform'
                && $data['to'] === '6281234567890'
                && str_contains($data['message'], 'KODE VERIFIKASI SERUWIT');
        });
    }

    public function test_user_can_verify_phone_with_valid_otp(): void
    {
        $user = User::factory()->create([
            'phone' => '6281234567890',
            'phone_verified_at' => null,
            'email_verified_at' => now(),
        ]);

        $otp = '123456';
        Cache::put('central_phone_otp:6281234567890', [
            'code_hash' => Hash::make($otp),
            'attempts' => 0,
            'created_at' => now()->timestamp,
        ], 300);

        $this->actingAs($user)
            ->post(route('central.phone.verify'), [
                'code' => $otp,
            ])
            ->assertRedirect(route('central.onboarding.show'))
            ->assertSessionHas('status');

        $user->refresh();
        $this->assertTrue($user->hasVerifiedPhone());
        $this->assertNotNull($user->phone_verified_at);
    }

    public function test_user_cannot_verify_with_invalid_otp(): void
    {
        $user = User::factory()->create([
            'phone' => '6281234567890',
            'phone_verified_at' => null,
            'email_verified_at' => now(),
        ]);

        Cache::put('central_phone_otp:6281234567890', [
            'code_hash' => Hash::make('123456'),
            'attempts' => 0,
            'created_at' => now()->timestamp,
        ], 300);

        $this->actingAs($user)
            ->from(route('central.phone.notice'))
            ->post(route('central.phone.verify'), [
                'code' => '999999',
            ])
            ->assertRedirect(route('central.phone.notice'))
            ->assertSessionHasErrors(['code']);

        $user->refresh();
        $this->assertFalse($user->hasVerifiedPhone());
    }

    public function test_user_can_update_phone_number_and_receive_fresh_otp(): void
    {
        $user = User::factory()->create([
            'phone' => '628123456789',
            'phone_verified_at' => null,
            'email_verified_at' => now(),
        ]);

        Http::fake([
            '*/api/messages/send-text' => Http::response(['success' => true], 200),
        ]);

        $this->actingAs($user)
            ->patch(route('central.phone.update'), [
                'phone' => '087711223344',
            ])
            ->assertRedirect()
            ->assertSessionHas('status');

        $user->refresh();
        $this->assertSame('6287711223344', $user->phone);

        Http::assertSent(function ($request) {
            return $request->data()['to'] === '6287711223344';
        });
    }

    public function test_unverified_phone_user_is_redirected_from_onboarding(): void
    {
        $user = User::factory()->create([
            'phone' => '628123456789',
            'phone_verified_at' => null,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('central.onboarding.show'))
            ->assertRedirect(route('central.phone.notice'));
    }

    public function test_user_can_access_onboarding_when_phone_verification_is_disabled(): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'whatsapp.require_phone_verification'],
            ['group' => 'whatsapp', 'value' => '0']
        );

        $user = User::factory()->create([
            'phone' => null,
            'phone_verified_at' => null,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('central.onboarding.show'))
            ->assertOk();
    }
}
