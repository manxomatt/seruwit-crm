<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Support\RentalGeneralSettings;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MobileApiRateLimitingSettingTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_booking_enabled'],
            [
                'group' => 'rental',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Mobile rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );
    }

    public function test_rate_limiting_is_disabled_by_default_allowing_multiple_otp_requests(): void
    {
        // Rate limiting is disabled by default (0)
        Setting::query()->where('key', 'rental.mobile_rate_limiting_enabled')->delete();
        Setting::query()->where('key', 'mobile.rate_limiting_enabled')->delete();

        // Perform 8 consecutive OTP requests (default limit would have been 5)
        for ($i = 0; $i < 8; $i++) {
            $response = $this->postJson(route('mobile.v1.auth.otp.send'), [
                'phone' => '081234567890',
            ]);
            $response->assertOk()
                ->assertJson(['ok' => true]);
        }
    }

    public function test_rate_limiting_can_be_enabled_via_setting(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'rental.mobile_rate_limiting_enabled'],
            [
                'group' => 'rental_internal',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Mobile API Rate Limiting',
                'is_public' => false,
                'sort_order' => 40,
            ],
        );

        // Perform 5 allowed requests
        for ($i = 0; $i < 5; $i++) {
            $this->postJson(route('mobile.v1.auth.otp.send'), [
                'phone' => '081234567890',
            ])->assertOk();
        }

        // The 6th request within the same minute should be throttled (429)
        $this->postJson(route('mobile.v1.auth.otp.send'), [
            'phone' => '081234567890',
        ])->assertStatus(429);
    }

    public function test_tenant_admin_can_update_rate_limiting_setting_via_dashboard(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->from(route('module.rental.settings.index', ['tab' => 'general']))
            ->patch(route('module.rental.settings.general.update'), [
                'default_one_way_fee' => 150000,
                'passenger_booking_enabled' => true,
                'pending_reserved_ttl_minutes' => 120,
                'cancellation_fee_type' => 'fixed',
                'cancellation_fee_amount' => 50000,
                'no_show_fee_type' => 'fixed',
                'no_show_fee_amount' => 100000,
                'passenger_free_cancel_hours' => 24,
                'public_mask_plates' => true,
                'calendar_click_to_book' => true,
                'ai_inspection_enabled' => true,
                'ai_kyc_enabled' => true,
                'ai_pricing_optimizer_enabled' => true,
                'mobile_rate_limiting_enabled' => true,
            ])
            ->assertRedirect(route('module.rental.settings.index', ['tab' => 'general']));

        $settings = RentalGeneralSettings::all();
        $this->assertTrue($settings['mobile_rate_limiting_enabled']);
    }
}
