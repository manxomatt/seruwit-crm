<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\RentalConfirmationService;
use Modules\Rental\Support\RentalHandoverService;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\Support\WithRentalHandoverEvidence;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalTwoGateLifecycleTest extends TestCase
{
    use RefreshDatabase;
    use WithRentalHandoverEvidence;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_confirming_issues_the_booking_without_handing_over_the_vehicle(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental), [
                'deposit_collected' => true,
                'payment_method' => 'cash',
            ])
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->status);
        $this->assertNull($rental->checked_out_at);
        $this->assertNull($rental->no_show_at);
    }

    public function test_cannot_hand_over_a_draft_or_pending_reserved_rental(): void
    {
        $admin = $this->createAdminUser();

        $draft = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);
        $this->actingAs($admin)
            ->post(route('module.rental.checkout', $draft), $this->rentalCheckoutPayload())
            ->assertStatus(422);
        $this->assertSame(Rental::STATUS_DRAFT, $draft->fresh()->status);

        $hold = Rental::factory()->pendingReserved()->create();
        $this->actingAs($admin)
            ->post(route('module.rental.checkout', $hold), $this->rentalCheckoutPayload())
            ->assertStatus(422);
        $this->assertSame(Rental::STATUS_PENDING_RESERVED, $hold->fresh()->status);
    }

    public function test_cannot_mark_no_show_on_draft_or_active_rentals(): void
    {
        $admin = $this->createAdminUser();

        $draft = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);
        $this->actingAs($admin)
            ->post(route('module.rental.no_show', $draft), ['charge_fee' => false])
            ->assertStatus(422);
        $this->assertSame(Rental::STATUS_DRAFT, $draft->fresh()->status);

        $active = Rental::factory()->active()->create();
        $this->actingAs($admin)
            ->post(route('module.rental.no_show', $active), ['charge_fee' => false])
            ->assertStatus(422);
        $this->assertSame(Rental::STATUS_ACTIVE, $active->fresh()->status);
    }

    public function test_handover_service_refuses_an_unissued_booking(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        try {
            app(RentalHandoverService::class)->handOver($rental, [
                'checkout_photos' => ['rental/handover-photos/x.jpg'],
            ]);
            $this->fail('Expected ValidationException');
        } catch (ValidationException $e) {
            $this->assertSame(__('rental.errors.checkout_confirmed_only'), $e->errors()['status'][0]);
        }

        $this->assertSame(Rental::STATUS_DRAFT, $rental->fresh()->status);
        $this->assertNull($rental->fresh()->checked_out_at);
    }

    public function test_confirmation_service_refuses_to_reissue_an_active_rental(): void
    {
        $rental = Rental::factory()->active()->create();

        try {
            app(RentalConfirmationService::class)->confirm($rental);
            $this->fail('Expected ValidationException');
        } catch (ValidationException $e) {
            $this->assertSame(__('rental.errors.confirm_draft_only'), $e->errors()['status'][0]);
        }

        $this->assertSame(Rental::STATUS_ACTIVE, $rental->fresh()->status);
    }

    public function test_signing_the_passenger_contract_does_not_hand_over_the_vehicle(): void
    {
        Storage::fake('public');

        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_booking_enabled'],
            [
                'group' => 'rental',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Passenger rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );

        $rental = Rental::factory()->confirmed()->create([
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '628123456789',
            'public_token' => 'tokengate'.str_repeat('a', 24),
            'deposit_received_at' => now(),
        ]);

        $phone = '08123456789';
        $otp = app(PassengerOtpService::class)->send($phone);
        $pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $this->from(route('book.rental.booking.show', $rental->public_token))
            ->post(route('book.rental.booking.request_pickup', $rental->public_token), [
                'booker_phone' => $phone,
                'otp_code' => $otp,
                'terms_agreed' => true,
                'customer_signature' => $pixel,
            ])
            ->assertRedirect();

        $rental->refresh();
        $this->assertSame(Rental::STATUS_CONFIRMED, $rental->status);
        $this->assertNull($rental->checked_out_at);
        $this->assertNotNull($rental->pickup_requested_at);
    }

    public function test_unsigned_draft_cannot_sign_the_passenger_contract(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_booking_enabled'],
            [
                'group' => 'rental',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Passenger rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );

        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_DRAFT,
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '628123456789',
            'public_token' => 'tokendraft'.str_repeat('a', 23),
        ]);

        $this->post(route('book.rental.booking.request_pickup', $rental->public_token), [
            'booker_phone' => '08123456789',
            'otp_code' => '123456',
            'terms_agreed' => true,
            'customer_signature' => 'data:image/png;base64,aaa',
        ])->assertStatus(422);

        $this->assertNull($rental->fresh()->pickup_requested_at);
        $this->assertSame(Rental::STATUS_DRAFT, $rental->fresh()->status);
    }
}
