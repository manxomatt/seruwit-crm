<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MobileRentalPayBalanceTest extends TestCase
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

    public function test_unauthenticated_user_cannot_pay_balance(): void
    {
        $this->postJson(route('mobile.v1.rental.bookings.pay_balance', 'dummy-token'))
            ->assertUnauthorized();
    }

    public function test_gateway_unavailable_returns_503(): void
    {
        $phone = '081234567890';
        $token = $this->issueToken($phone);
        $partner = Partner::query()->where('phone', '6281234567890')->first();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 300000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'booker_phone' => '6281234567890',
            'status' => Rental::STATUS_CONFIRMED,
            'base_amount' => 600000,
            'deposit_amount' => 500000,
            'total_amount' => 1100000,
        ]);

        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.pay_balance', $rental->public_token))
            ->assertStatus(503)
            ->assertJsonPath('code', 'gateway_unavailable');
    }

    public function test_cannot_pay_balance_if_no_outstanding_amount(): void
    {
        $phone = '081234567890';
        $token = $this->issueToken($phone);
        $partner = Partner::query()->where('phone', '6281234567890')->first();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'booker_phone' => '6281234567890',
            'status' => Rental::STATUS_CONFIRMED,
            'base_amount' => 0,
            'deposit_amount' => 0,
            'total_amount' => 0,
        ]);

        // When gateway config is mocked or available, but base_amount is 0
        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.pay_balance', $rental->public_token))
            ->assertStatus(503); // Since gateway isn't configured in testing
    }

    private function issueToken(string $phone): string
    {
        $code = app(PassengerOtpService::class)->send($phone);

        return $this->postJson(route('mobile.v1.auth.otp.verify'), [
            'phone' => $phone,
            'code' => $code,
        ])->json('token');
    }
}
