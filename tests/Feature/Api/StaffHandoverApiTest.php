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
use Modules\Rental\AI\Contracts\VisionInspectionServiceInterface;
use Modules\Rental\AI\DTO\DetectedDamageItem;
use Modules\Rental\AI\DTO\HandoverInspectionResult;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class StaffHandoverApiTest extends TestCase
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
            'email' => 'checker@seruwit.test',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        $this->token = $this->staff->createToken('checker-mobile-token')->plainTextToken;
    }

    public function test_staff_can_view_today_handovers(): void
    {
        $vehicle = Vehicle::factory()->create();
        $partner = Partner::factory()->create();

        // 1 Pickup scheduled for today
        Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_CONFIRMED,
            'start_date' => Carbon::today(),
            'end_date' => Carbon::today()->addDays(2),
        ]);

        // 1 Return scheduled for today
        Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_ACTIVE,
            'start_date' => Carbon::today()->subDays(2),
            'end_date' => Carbon::today(),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.handovers.today'));

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'meta' => [
                    'date' => Carbon::today()->toDateString(),
                    'count' => 2,
                ],
            ]);

        // Test filter pickup only
        $pickupResponse = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.handovers.today', ['type' => 'pickup']));

        $pickupResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'meta' => ['count' => 1],
            ]);

        // Test filter return only
        $returnResponse = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson(route('staff.v1.handovers.today', ['type' => 'return']));

        $returnResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'meta' => ['count' => 1],
            ]);
    }

    public function test_staff_can_execute_handover_out(): void
    {
        $vehicle = Vehicle::factory()->create();
        $partner = Partner::factory()->create();

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_CONFIRMED,
            'deposit_amount' => 500000,
            'deposit_status' => Rental::DEPOSIT_HELD,
            'deposit_received_at' => now(),
            'start_date' => Carbon::today(),
            'end_date' => Carbon::today()->addDays(2),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.handovers.out', ['rental' => $rental->id]), [
                'start_odometer' => 15200,
                'start_fuel_level' => 'Full',
                'checkout_notes' => 'Kondisi mulus, spion lengkap.',
                'checkout_checklist' => [
                    'stnk_present' => true,
                    'spare_tire_present' => true,
                ],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'rental_id' => $rental->id,
                    'status' => Rental::STATUS_ACTIVE,
                    'start_odometer' => 15200,
                    'start_fuel_level' => 'Full',
                ],
            ]);

        $this->assertDatabaseHas('rentals', [
            'id' => $rental->id,
            'status' => Rental::STATUS_ACTIVE,
            'start_odometer' => 15200,
            'start_fuel_level' => 'Full',
        ]);
    }

    public function test_staff_can_execute_handover_in_and_calculate_settlement(): void
    {
        $vehicle = Vehicle::factory()->create();
        $partner = Partner::factory()->create();

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_ACTIVE,
            'start_date' => Carbon::today()->subDays(3),
            'end_date' => Carbon::today()->subDay(),
            'start_odometer' => 10000,
            'km_limit_per_period' => 100,
            'total_periods' => 2,
            'excess_km_rate' => 1000,
            'late_fee_per_day' => 150000,
            'deposit_amount' => 0,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.handovers.in', ['rental' => $rental->id]), [
                'end_odometer' => 10300,
                'end_fuel_level' => '3/4',
                'actual_return_date' => Carbon::today()->toDateString(),
                'return_notes' => 'Mobil ada sedikit baret di bemper depan',
                'damages' => [
                    [
                        'description' => 'Baret bemper depan',
                        'amount' => 250000,
                    ],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'rental_id' => $rental->id,
                    'status' => Rental::STATUS_RETURNED,
                    'excess_km' => 100,
                    'excess_amount' => 100000,
                    'overdue_days' => 1,
                    'late_fee_amount' => 150000,
                ],
            ]);

        $this->assertDatabaseHas('rentals', [
            'id' => $rental->id,
            'status' => Rental::STATUS_RETURNED,
            'end_odometer' => 10300,
            'excess_km' => 100,
        ]);

        $this->assertDatabaseHas('rental_damages', [
            'rental_id' => $rental->id,
            'description' => 'Baret bemper depan',
            'amount' => 250000,
        ]);
    }

    public function test_staff_can_trigger_ai_inspection(): void
    {
        $vehicle = Vehicle::factory()->create([
            'name' => 'Toyota Avanza 2023',
            'plate_number' => 'B 1234 ABC',
        ]);
        $partner = Partner::factory()->create();

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_ACTIVE,
            'start_odometer' => 10000,
            'start_fuel_level' => 'Full',
            'checkout_photos' => ['rental/handover-photos/front.jpg'],
        ]);

        $mockService = Mockery::mock(VisionInspectionServiceInterface::class);
        $mockResult = new HandoverInspectionResult(
            extractedOdometer: 10450,
            extractedFuelLevel: 'Full',
            conditionSummary: 'Terdeteksi goresan minor pada bemper depan kanan.',
            overallStatus: 'minor_damage',
            damages: [
                new DetectedDamageItem(
                    panel: 'front_bumper',
                    damageType: 'scratch',
                    severity: 'minor',
                    description: 'Goresan permukaan sekitar 10cm',
                    confidenceScore: 0.92,
                    photoIndex: 0,
                    suggestedRepairCost: 200000,
                    isNewDamage: true
                ),
            ],
            rawResponse: ['gemini' => 'sample response'],
            modelUsed: 'gemini-3.6-flash'
        );

        $mockService->shouldReceive('inspectHandover')
            ->once()
            ->andReturn($mockResult);

        $this->app->instance(VisionInspectionServiceInterface::class, $mockService);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson(route('staff.v1.handovers.ai-inspect', ['rental' => $rental->id]), [
                'photos' => ['https://storage.seruwit.test/photos/return1.jpg'],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'overall_status' => 'minor_damage',
                    'condition_summary' => 'Terdeteksi goresan minor pada bemper depan kanan.',
                    'extracted_odometer' => 10450,
                    'extracted_fuel_level' => 'Full',
                ],
            ]);

        $this->assertDatabaseHas('rental_ai_inspections', [
            'rental_id' => $rental->id,
            'overall_status' => 'minor_damage',
            'extracted_odometer' => 10450,
        ]);
    }
}
