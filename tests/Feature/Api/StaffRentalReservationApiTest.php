<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalRate;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StaffRentalReservationApiTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected User $staff;

    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        $this->staff = User::factory()->create([
            'email' => 'operator@seruwit.test',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        $this->token = $this->staff->createToken('operator-mobile-token')->plainTextToken;
    }

    public function test_unauthenticated_staff_cannot_access_reservation_api(): void
    {
        $response = $this->getJson(route('staff.v1.rental.reservations.available_vehicles'));
        $response->assertUnauthorized();
    }

    public function test_staff_can_search_available_vehicles(): void
    {
        /** @var Vehicle $vehicle */
        $vehicle = Vehicle::factory()->create([
            'name' => 'Avanza Veloz 1.5 AT',
            'status' => Vehicle::STATUS_ACTIVE,
            'rental_class' => 'mpv',
        ]);

        RentalRate::factory()->create([
            'vehicle_id' => $vehicle->id,
            'period_type' => 'daily',
            'rate_per_period' => 450000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.rental.reservations.available_vehicles', [
                'start_date' => Carbon::tomorrow()->toDateString(),
                'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
                'period_type' => 'daily',
            ]));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'plate_number',
                        'rental_class',
                        'suggested_rate' => [
                            'rate_id',
                            'rate_name',
                            'rate_per_period',
                            'base_amount',
                        ],
                    ],
                ],
                'meta' => [
                    'total_available',
                    'periods',
                ],
            ]);
    }

    public function test_staff_can_scan_document_with_ai_ocr(): void
    {
        $mockKyc = Mockery::mock(DocumentKycServiceInterface::class);
        $mockKyc->shouldReceive('scanSingleDocument')
            ->once()
            ->andReturn([
                'doc_type' => 'ktp',
                'data' => [
                    'nik' => '3271012304900005',
                    'name' => 'BUDI SANTOSO',
                    'address' => 'JL. MERDEKA NO. 10',
                ],
                'confidence' => 0.95,
                'raw' => [],
            ]);

        $this->app->instance(DocumentKycServiceInterface::class, $mockKyc);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.rental.customers.scan_id'), [
                'image' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'doc_type' => 'ktp',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.doc_type', 'ktp')
            ->assertJsonPath('data.data.name', 'BUDI SANTOSO');
    }

    public function test_staff_can_create_walk_in_customer(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.rental.customers.walk_in'), [
                'name' => 'Siti Nurhaliza',
                'phone' => '081299887766',
                'email' => 'siti@example.com',
                'id_number' => '3271012304900008',
                'driver_license_number' => 'SIM-12345678',
                'address' => 'Bandung, Jawa Barat',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Siti Nurhaliza')
            ->assertJsonPath('data.is_new', true);

        $this->assertDatabaseHas('partners', [
            'name' => 'Siti Nurhaliza',
            'phone' => '081299887766',
        ]);
    }

    public function test_staff_can_calculate_quote(): void
    {
        /** @var Vehicle $vehicle */
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        RentalRate::factory()->create([
            'vehicle_id' => $vehicle->id,
            'period_type' => 'daily',
            'rate_per_period' => 500000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.rental.reservations.quote'), [
                'vehicle_id' => $vehicle->id,
                'start_date' => Carbon::tomorrow()->toDateString(),
                'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
                'period_type' => 'daily',
                'service_type' => 'self_drive',
                'discount_amount' => 50000,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.available', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'available',
                    'total_periods',
                    'breakdown' => [
                        'rate_per_period',
                        'base_rental_amount',
                        'discount_amount',
                        'total_amount',
                    ],
                ],
            ]);
    }

    public function test_staff_can_store_reservation(): void
    {
        /** @var Vehicle $vehicle */
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        /** @var Partner $partner */
        $partner = Partner::factory()->create();

        RentalRate::factory()->create([
            'vehicle_id' => $vehicle->id,
            'period_type' => 'daily',
            'rate_per_period' => 500000,
            'deposit_amount' => 500000,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.rental.reservations.store'), [
                'partner_id' => $partner->id,
                'vehicle_id' => $vehicle->id,
                'start_date' => Carbon::tomorrow()->toDateString(),
                'end_date' => Carbon::tomorrow()->addDays(2)->toDateString(),
                'period_type' => 'daily',
                'service_type' => 'self_drive',
                'notes' => 'Offline walk-in booking bandara',
                'status' => 'confirmed',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.direct_handover_ready', true);

        $this->assertDatabaseHas('rentals', [
            'partner_id' => $partner->id,
            'vehicle_id' => $vehicle->id,
            'status' => 'confirmed',
            'channel' => Rental::CHANNEL_STAFF,
        ]);
    }

    public function test_staff_can_collect_payment_on_spot(): void
    {
        /** @var Vehicle $vehicle */
        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        /** @var Partner $partner */
        $partner = Partner::factory()->create();

        /** @var Rental $rental */
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_PENDING,
            'total_amount' => 1000000,
            'deposit_amount' => 500000,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.rental.reservations.collect_payment', $rental), [
                'payment_type' => 'deposit',
                'payment_method' => 'cash',
                'amount' => 500000,
                'notes' => 'Kas tunai diterima operator',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.collected_amount', 500000)
            ->assertJsonPath('data.payment_method', 'cash');

        $this->assertEquals(Rental::STATUS_CONFIRMED, $rental->fresh()->status);
    }
}
