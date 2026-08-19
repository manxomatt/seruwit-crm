<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\AI\Contracts\VisionInspectionServiceInterface;
use Modules\Rental\AI\DTO\DetectedDamageItem;
use Modules\Rental\AI\DTO\HandoverInspectionResult;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalAiInspection;
use Tests\Support\WithRentalHandoverEvidence;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalAiInspectionTest extends TestCase
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

    protected function dummyDataUrl(): string
    {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    }

    public function test_guests_cannot_access_ai_inspection(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_ACTIVE]);

        $this->post(route('module.rental.ai_inspect_live', $rental))
            ->assertRedirect(route('login'));
    }

    public function test_unauthorized_users_cannot_access_ai_inspection(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_ACTIVE]);

        $this->actingAs($this->createUserWithRole())
            ->postJson(route('module.rental.ai_inspect_live', $rental), [
                'return_photos' => [$this->dummyDataUrl()],
            ])
            ->assertForbidden();
    }

    public function test_live_inspection_validates_photos(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_ACTIVE]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_inspect_live', $rental), [
                'return_photos' => [],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['return_photos']);
    }

    public function test_live_inspection_succeeds_and_saves_record(): void
    {
        $vehicle = Vehicle::factory()->create(['name' => 'Avanza Veloz', 'plate_number' => 'B 1234 CD']);
        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'status' => Rental::STATUS_ACTIVE,
            'start_odometer' => 45000,
            'start_fuel_level' => 'full',
            'checkout_photos' => ['rental/handover-photos/chk1.jpg'],
        ]);

        $mockDamage = new DetectedDamageItem(
            panel: 'front_bumper_left',
            damageType: 'scratch',
            severity: 'minor',
            description: 'Goresan tipis pada bumper depan kiri',
            confidenceScore: 0.95,
            suggestedRepairCost: 350000,
            isNewDamage: true,
        );

        $mockResult = new HandoverInspectionResult(
            extractedOdometer: 45250,
            extractedFuelLevel: '3/4',
            conditionSummary: 'Ditemukan 1 goresan baru pada bumper depan kiri.',
            overallStatus: 'minor_damage',
            damages: [$mockDamage],
            rawResponse: ['status' => 'mocked'],
            modelUsed: 'gemini-1.5-flash',
        );

        $this->mock(VisionInspectionServiceInterface::class, function (MockInterface $mock) use ($mockResult): void {
            $mock->shouldReceive('inspectHandover')
                ->once()
                ->andReturn($mockResult);
        });

        $response = $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_inspect_live', $rental), [
                'return_photos' => [$this->dummyDataUrl()],
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('inspection.extracted_odometer', 45250)
            ->assertJsonPath('inspection.extracted_fuel_level', '3/4')
            ->assertJsonPath('inspection.overall_status', 'minor_damage')
            ->assertJsonPath('inspection.detected_damages.0.panel', 'front_bumper_left');

        $this->assertDatabaseHas('rental_ai_inspections', [
            'rental_id' => $rental->id,
            'inspection_type' => RentalAiInspection::TYPE_LIVE_PREVIEW,
            'extracted_odometer' => 45250,
            'extracted_fuel_level' => '3/4',
            'overall_status' => 'minor_damage',
        ]);
    }

    public function test_existing_inspection_requires_return_photos(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_ACTIVE,
            'return_photos' => null,
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_inspect_existing', $rental))
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_existing_inspection_runs_when_return_photos_present(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_RETURNED,
            'checkout_photos' => ['rental/handover-photos/out.jpg'],
            'return_photos' => ['rental/handover-photos/in.jpg'],
        ]);

        $mockResult = new HandoverInspectionResult(
            extractedOdometer: 50000,
            extractedFuelLevel: 'full',
            conditionSummary: 'Unit bersih dan terawat.',
            overallStatus: 'clean',
            damages: [],
            rawResponse: ['status' => 'mocked'],
            modelUsed: 'gemini-1.5-flash',
        );

        $this->mock(VisionInspectionServiceInterface::class, function (MockInterface $mock) use ($mockResult): void {
            $mock->shouldReceive('inspectHandover')
                ->once()
                ->andReturn($mockResult);
        });

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_inspect_existing', $rental))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('inspection.overall_status', 'clean');

        $this->assertDatabaseHas('rental_ai_inspections', [
            'rental_id' => $rental->id,
            'inspection_type' => RentalAiInspection::TYPE_HANDOVER_RETURN,
            'overall_status' => 'clean',
        ]);
    }

    public function test_ai_apply_damage_creates_damage_record_and_invoice(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_RETURNED,
            'base_amount' => 1000000,
            'total_amount' => 1000000,
        ]);

        $response = $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_apply_damage', $rental), [
                'description' => '[AI] Goresan pada pintu kanan (right_door)',
                'amount' => 450000,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('damage.amount', '450000.00');

        $this->assertDatabaseHas('rental_damages', [
            'rental_id' => $rental->id,
            'description' => '[AI] Goresan pada pintu kanan (right_door)',
            'amount' => 450000,
        ]);

        $rental->refresh();
        $this->assertEquals(1450000, (float) $rental->total_amount);
    }
}
