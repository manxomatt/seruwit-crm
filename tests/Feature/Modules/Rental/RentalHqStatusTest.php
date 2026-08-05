<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalRate;
use Modules\Rental\Support\RentalBookingPolicy;
use Modules\Rental\Support\RentalConfirmationService;
use Modules\Rental\Support\RentalPendingReservedExpirer;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalHqStatusTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
        $this->user = $this->createUserWithRole('admin');

        Setting::query()->updateOrCreate(
            ['key' => RentalBookingPolicy::SETTING_PENDING_RESERVED_TTL],
            [
                'group' => 'rental',
                'value' => '120',
                'type' => 'number',
                'label' => 'TTL',
                'is_public' => false,
                'sort_order' => 10,
            ],
        );
        Setting::query()->updateOrCreate(
            ['key' => RentalBookingPolicy::SETTING_CANCELLATION_FEE_TYPE],
            ['group' => 'rental', 'value' => 'fixed', 'type' => 'string', 'label' => 'Cancel type', 'is_public' => false, 'sort_order' => 11],
        );
        Setting::query()->updateOrCreate(
            ['key' => RentalBookingPolicy::SETTING_CANCELLATION_FEE_AMOUNT],
            ['group' => 'rental', 'value' => '150000', 'type' => 'number', 'label' => 'Cancel fee', 'is_public' => false, 'sort_order' => 12],
        );
        Setting::query()->updateOrCreate(
            ['key' => RentalBookingPolicy::SETTING_NO_SHOW_FEE_TYPE],
            ['group' => 'rental', 'value' => 'fixed', 'type' => 'string', 'label' => 'No-show type', 'is_public' => false, 'sort_order' => 13],
        );
        Setting::query()->updateOrCreate(
            ['key' => RentalBookingPolicy::SETTING_NO_SHOW_FEE_AMOUNT],
            ['group' => 'rental', 'value' => '200000', 'type' => 'number', 'label' => 'No-show fee', 'is_public' => false, 'sort_order' => 14],
        );
    }

    public function test_pending_reserved_blocks_availability_but_pending_does_not(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $start = now()->addDays(2)->toDateString();
        $end = now()->addDays(4)->toDateString();

        Rental::factory()->pendingReserved()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => $start,
            'end_date' => $end,
        ]);

        $this->assertTrue(Rental::hasOverlapFor($vehicle->id, $start, $end));

        Rental::query()->where('vehicle_id', $vehicle->id)->update([
            'status' => Rental::STATUS_PENDING,
            'reserved_until' => null,
        ]);

        $this->assertFalse(Rental::hasOverlapFor($vehicle->id, $start, $end));
    }

    public function test_expirer_moves_pending_reserved_to_pending(): void
    {
        $rental = Rental::factory()->pendingReserved()->create([
            'reserved_until' => now()->subMinute(),
        ]);

        $count = app(RentalPendingReservedExpirer::class)->expire();

        $this->assertSame(1, $count);
        $this->assertSame(Rental::STATUS_PENDING, $rental->fresh()->status);
        $this->assertNull($rental->fresh()->reserved_until);
    }

    public function test_cancel_with_fee_becomes_cancelled_paid(): void
    {
        $rental = Rental::factory()->confirmed()->create([
            'base_amount' => 1000000,
            'deposit_amount' => 0,
            'deposit_status' => Rental::DEPOSIT_SETTLED,
        ]);

        app(RentalConfirmationService::class)->cancel($rental, 'Customer cancelled', chargeFee: true);

        $fresh = $rental->fresh();
        $this->assertSame(Rental::STATUS_CANCELLED_PAID, $fresh->status);
        $this->assertNotNull($fresh->cancelled_at);
        $this->assertTrue(
            RentalCharge::query()
                ->where('rental_id', $rental->id)
                ->where('addon_code', 'cancellation_fee')
                ->where('amount', 150000)
                ->exists(),
        );
    }

    public function test_no_show_with_fee_becomes_no_show_paid(): void
    {
        $rental = Rental::factory()->confirmed()->create([
            'base_amount' => 1000000,
            'deposit_amount' => 0,
            'deposit_status' => Rental::DEPOSIT_SETTLED,
        ]);

        app(RentalConfirmationService::class)->markNoShow($rental, chargeFee: true);

        $this->assertSame(Rental::STATUS_NO_SHOW_PAID, $rental->fresh()->status);
        $this->assertTrue(
            RentalCharge::query()
                ->where('rental_id', $rental->id)
                ->where('addon_code', 'no_show_fee')
                ->exists(),
        );
    }

    public function test_mark_fee_paid_promotes_cancelled_to_cancelled_paid(): void
    {
        $rental = Rental::factory()->cancelled()->create([
            'base_amount' => 500000,
        ]);

        app(RentalConfirmationService::class)->markFeePaid($rental);

        $this->assertSame(Rental::STATUS_CANCELLED_PAID, $rental->fresh()->status);
    }

    public function test_staff_can_confirm_pending_reserved(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $partner = Partner::factory()->create();
        $rental = Rental::factory()->pendingReserved()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'deposit_amount' => 0,
        ]);

        $this->actingAs($this->user)
            ->post(route('module.rental.confirm', $rental))
            ->assertRedirect();

        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->fresh()->status);
        $this->assertNull($rental->fresh()->reserved_until);
    }

    public function test_staff_can_mark_no_show_from_show_action(): void
    {
        $rental = Rental::factory()->confirmed()->create([
            'deposit_amount' => 0,
            'deposit_status' => Rental::DEPOSIT_SETTLED,
        ]);

        $this->actingAs($this->user)
            ->post(route('module.rental.no_show', $rental), [
                'charge_fee' => false,
            ])
            ->assertRedirect();

        $this->assertSame(Rental::STATUS_NO_SHOW, $rental->fresh()->status);
    }

    public function test_mobile_booking_creates_pending_reserved_when_deposit_required(): void
    {
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

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        RentalRate::factory()->daily()->create([
            'vehicle_id' => $vehicle->id,
            'rate_per_period' => 350000,
            'deposit_amount' => 1000000,
            'is_active' => true,
            'min_periods' => 1,
        ]);

        $token = $this->issueMobileToken('081234567890');
        $start = now()->addDay()->toDateString();
        $end = now()->addDays(3)->toDateString();

        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.store'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => $start,
                'end_date' => $end,
                'period_type' => 'daily',
                'customer_name' => 'Budi',
            ])
            ->assertCreated()
            ->assertJsonPath('booking.status', Rental::STATUS_PENDING_RESERVED);

        $this->assertTrue(Rental::hasOverlapFor($vehicle->id, $start, $end));
    }

    private function issueMobileToken(string $phone): string
    {
        $code = app(\Modules\Shuttle\Support\PassengerOtpService::class)->send($phone);

        return (string) $this->postJson(route('mobile.v1.auth.otp.verify'), [
            'phone' => $phone,
            'code' => $code,
        ])->json('token');
    }
}
