<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalExtensionRequest;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalExtensionConflictTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        \App\Models\Setting::query()->updateOrCreate(
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
    }

    public function test_passenger_can_request_extension_even_when_vehicle_has_conflicting_booking(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $phone = '081111222333';
        $otp = app(PassengerOtpService::class)->send($phone);

        // Customer A: active on 18 Oct
        $rentalA = Rental::factory()->active()->create([
            'vehicle_id' => $vehicle->id,
            'channel' => Rental::CHANNEL_WEB,
            'booker_phone' => '6281111222333',
            'start_date' => '2026-10-18',
            'end_date' => '2026-10-18',
            'period_type' => 'daily',
            'rate_per_period' => 500000,
            'total_periods' => 1,
            'base_amount' => 500000,
            'total_amount' => 500000,
            'public_token' => 'tokencustomerA'.str_repeat('a', 20),
        ]);

        // Customer B: confirmed on 19 Oct for vehicle X
        $rentalB = Rental::factory()->confirmed()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => '2026-10-19',
            'end_date' => '2026-10-19',
            'period_type' => 'daily',
            'rate_per_period' => 500000,
            'total_periods' => 1,
            'base_amount' => 500000,
            'total_amount' => 500000,
        ]);

        // Customer A submits extension request for 19 Oct
        $response = $this->from(route('book.rental.booking.show', $rentalA->public_token))
            ->post(
                route('book.rental.booking.extend_request', $rentalA->public_token),
                [
                    'booker_phone' => $phone,
                    'otp_code' => $otp,
                    'new_end_date' => '2026-10-19',
                    'notes' => 'Customer A perpanjang 1 hari',
                ]
            );

        $response->assertRedirect(route('book.rental.booking.show', $rentalA->public_token));
        $response->assertSessionHas('success', __('rental.public.extend_requested_with_conflict'));

        $this->assertDatabaseHas('rental_extension_requests', [
            'rental_id' => $rentalA->id,
            'requested_end_date' => '2026-10-19',
            'has_conflict' => true,
            'conflicting_rental_id' => $rentalB->id,
            'status' => RentalExtensionRequest::STATUS_PENDING,
        ]);
    }

    public function test_admin_cannot_approve_conflicting_request_until_conflict_is_resolved(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $rentalA = Rental::factory()->active()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => '2026-10-18',
            'end_date' => '2026-10-18',
            'period_type' => 'daily',
            'rate_per_period' => 500000,
        ]);

        $rentalB = Rental::factory()->confirmed()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => '2026-10-19',
            'end_date' => '2026-10-19',
        ]);

        $req = RentalExtensionRequest::query()->create([
            'rental_id' => $rentalA->id,
            'requested_end_date' => '2026-10-19',
            'estimated_periods' => 1,
            'estimated_amount' => 500000,
            'status' => RentalExtensionRequest::STATUS_PENDING,
            'has_conflict' => true,
            'conflicting_rental_id' => $rentalB->id,
        ]);

        $admin = $this->createAdminUser();

        // Attempt approve while conflict still exists
        $response = $this->actingAs($admin)
            ->from(route('module.rental.show', $rentalA))
            ->post(route('module.rental.extension_requests.approve', [$rentalA, $req]));

        $response->assertRedirect(route('module.rental.show', $rentalA));
        $response->assertSessionHasErrors('new_end_date');

        $this->assertSame(RentalExtensionRequest::STATUS_PENDING, $req->fresh()->status);
    }

    public function test_admin_can_reassign_conflicting_booking_and_then_approve_extension(): void
    {
        $vehicleX = Vehicle::factory()->create(['name' => 'Avanza X', 'status' => Vehicle::STATUS_ACTIVE]);
        $vehicleY = Vehicle::factory()->create(['name' => 'Avanza Y', 'status' => Vehicle::STATUS_ACTIVE]);

        $rentalA = Rental::factory()->active()->create([
            'vehicle_id' => $vehicleX->id,
            'start_date' => '2026-10-18',
            'end_date' => '2026-10-18',
            'period_type' => 'daily',
            'rate_per_period' => 500000,
        ]);

        $rentalB = Rental::factory()->confirmed()->create([
            'vehicle_id' => $vehicleX->id,
            'start_date' => '2026-10-19',
            'end_date' => '2026-10-19',
        ]);

        $req = RentalExtensionRequest::query()->create([
            'rental_id' => $rentalA->id,
            'requested_end_date' => '2026-10-19',
            'estimated_periods' => 1,
            'estimated_amount' => 500000,
            'status' => RentalExtensionRequest::STATUS_PENDING,
            'has_conflict' => true,
            'conflicting_rental_id' => $rentalB->id,
        ]);

        $admin = $this->createAdminUser();

        // 1. Reassign Customer B to Vehicle Y
        $reassignResponse = $this->actingAs($admin)
            ->post(route('module.rental.reassign_conflicting_booking', $rentalA), [
                'conflicting_rental_id' => $rentalB->id,
                'to_vehicle_id' => $vehicleY->id,
                'notes' => 'Customer B dialihkan ke Unit Y',
            ]);

        $reassignResponse->assertRedirect();
        $this->assertSame($vehicleY->id, $rentalB->fresh()->vehicle_id);

        // Conflict on request A should now be automatically cleared
        $this->assertFalse($req->fresh()->has_conflict);

        // 2. Now approve extension for Customer A
        $approveResponse = $this->actingAs($admin)
            ->post(route('module.rental.extension_requests.approve', [$rentalA, $req]));

        $approveResponse->assertRedirect();
        $this->assertSame(RentalExtensionRequest::STATUS_APPROVED, $req->fresh()->status);
        $this->assertSame('2026-10-19', $rentalA->fresh()->end_date->toDateString());
    }

    public function test_admin_can_reject_extension_request_with_refund_details(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $rentalA = Rental::factory()->active()->create([
            'vehicle_id' => $vehicle->id,
            'start_date' => '2026-10-18',
            'end_date' => '2026-10-18',
        ]);

        $req = RentalExtensionRequest::query()->create([
            'rental_id' => $rentalA->id,
            'requested_end_date' => '2026-10-19',
            'estimated_periods' => 1,
            'estimated_amount' => 500000,
            'status' => RentalExtensionRequest::STATUS_PENDING,
        ]);

        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)
            ->post(route('module.rental.extension_requests.reject', [$rentalA, $req]), [
                'staff_notes' => 'Armada penuh dan tidak ada pengganti',
                'refund_status' => 'pending_refund',
                'transfer_amount_reported' => 500000,
            ]);

        $response->assertRedirect();
        $this->assertSame(RentalExtensionRequest::STATUS_REJECTED, $req->fresh()->status);
        $this->assertSame('pending_refund', $req->fresh()->refund_status);
        $this->assertEquals(500000, (float) $req->fresh()->transfer_amount_reported);
    }
}
