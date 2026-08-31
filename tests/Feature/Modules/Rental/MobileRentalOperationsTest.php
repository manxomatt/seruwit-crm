<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalExtensionRequest;
use Modules\Rental\Models\RentalRate;
use Modules\Shuttle\Support\PassengerOtpService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MobileRentalOperationsTest extends TestCase
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

    public function test_authenticated_customer_can_request_rental_extension(): void
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
            'status' => Rental::STATUS_ACTIVE,
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'period_type' => 'daily',
            'rate_per_period' => 300000,
            'total_periods' => 3,
            'deposit_amount' => 500000,
        ]);

        $newEndDate = now()->addDays(4)->toDateString();

        $response = $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.extend', $rental->public_token), [
                'new_end_date' => $newEndDate,
                'notes' => 'Ingin menambah 2 hari lagi liburan',
            ]);

        $response->assertCreated()
            ->assertJsonPath('extension_request.status', RentalExtensionRequest::STATUS_PENDING)
            ->assertJsonPath('extension_request.requested_end_date', $newEndDate)
            ->assertJsonPath('extension_request.estimated_periods', 2)
            ->assertJsonPath('extension_request.estimated_amount', 600000);

        $this->assertDatabaseHas('rental_extension_requests', [
            'rental_id' => $rental->id,
            'requested_end_date' => $newEndDate,
            'status' => RentalExtensionRequest::STATUS_PENDING,
            'channel' => 'mobile',
        ]);

        // Check history via GET
        $this->withToken($token)
            ->getJson(route('mobile.v1.rental.bookings.extensions', $rental->public_token))
            ->assertOk()
            ->assertJsonPath('requests.0.status', RentalExtensionRequest::STATUS_PENDING)
            ->assertJsonPath('requests.0.estimated_periods', 2);
    }

    public function test_cannot_request_extension_if_rental_is_not_active(): void
    {
        $phone = '081234567890';
        $token = $this->issueToken($phone);
        $partner = Partner::query()->where('phone', '6281234567890')->first();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'booker_phone' => '6281234567890',
            'status' => Rental::STATUS_CONFIRMED, // Not yet active
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
        ]);

        $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.extend', $rental->public_token), [
                'new_end_date' => now()->addDays(5)->toDateString(),
            ])
            ->assertStatus(422);
    }

    public function test_authenticated_customer_can_perform_digital_check_in(): void
    {
        Storage::fake('public');

        $phone = '081234567890';
        $token = $this->issueToken($phone);
        $partner = Partner::query()->where('phone', '6281234567890')->first();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'booker_phone' => '6281234567890',
            'status' => Rental::STATUS_CONFIRMED,
            'deposit_amount' => 500000,
            'deposit_received_at' => now(),
            'deposit_status' => Rental::DEPOSIT_SETTLED,
        ]);

        // Base64 transparent 1x1 png image
        $signatureBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $response = $this->withToken($token)
            ->postJson(route('mobile.v1.rental.bookings.check_in', $rental->public_token), [
                'terms_agreed' => true,
                'customer_signature' => $signatureBase64,
                'pickup_notes' => 'Tolong diantar ke lobby hotel jam 8 pagi',
            ]);

        $response->assertOk()
            ->assertJsonPath('booking.pickup_request.status', 'pending')
            ->assertJsonPath('booking.pickup_request.terms_agreed', true);

        $rental->refresh();
        $this->assertSame('pending', $rental->pickup_request_status);
        $this->assertTrue($rental->pickup_terms_agreed);
        $this->assertNotNull($rental->pickup_customer_signature_path);
        Storage::disk('public')->assertExists($rental->pickup_customer_signature_path);
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
