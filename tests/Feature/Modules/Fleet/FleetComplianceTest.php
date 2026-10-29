<?php

namespace Tests\Feature\Modules\Fleet;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetComplianceTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_user_can_view_compliance_index_page_with_metrics(): void
    {
        $user = $this->createAdminUser();

        // Expired STNK
        Vehicle::factory()->create([
            'name' => 'Avanza Expired',
            'plate_number' => 'B 1001 EXP',
            'stnk_expires_at' => Carbon::now()->subDays(10)->toDateString(),
            'stnk_five_year_expires_at' => Carbon::now()->addYears(2)->toDateString(),
            'status' => 'active',
        ]);

        // Warning STNK (15 days remaining)
        Vehicle::factory()->create([
            'name' => 'Xpander Warning',
            'plate_number' => 'B 1002 WRN',
            'stnk_expires_at' => Carbon::now()->addDays(15)->toDateString(),
            'status' => 'active',
        ]);

        // Safe STNK & all documents (>30 days remaining)
        Vehicle::factory()->create([
            'name' => 'Innova Safe',
            'plate_number' => 'B 1003 SAF',
            'stnk_expires_at' => Carbon::now()->addDays(60)->toDateString(),
            'stnk_five_year_expires_at' => Carbon::now()->addYears(2)->toDateString(),
            'insurance_expires_at' => Carbon::now()->addMonths(6)->toDateString(),
            'kir_expires_at' => null,
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->get(route('module.fleet.compliance.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/FleetCompliance/Index')
            ->has('vehicles', 3)
            ->has('kpi')
            ->where('kpi.total_monitored', 3)
            ->where('kpi.expired_count', 1)
            ->where('kpi.expiring_soon_count', 1)
            ->where('kpi.safe_count', 1)
        );
    }

    public function test_user_can_renew_vehicle_compliance_document(): void
    {
        $user = $this->createAdminUser();

        $vehicle = Vehicle::factory()->create([
            'name' => 'Fortuner Partner',
            'plate_number' => 'B 8888 FTR',
            'ownership_type' => 'investor',
            'stnk_expires_at' => Carbon::now()->subDays(5)->toDateString(),
        ]);

        $newExpiryDate = Carbon::now()->addYear()->toDateString();
        $today = Carbon::now()->toDateString();

        $payload = [
            'document_type' => 'stnk_annual',
            'new_expires_at' => $newExpiryDate,
            'renewal_date' => $today,
            'cost' => 3500000,
            'payer' => 'owner',
            'reference_number' => 'INV-SAMSAT-998',
            'notes' => 'Perpanjangan pajak 1 tahunan unit titipan investor.',
        ];

        $response = $this->actingAs($user)->post(
            route('module.fleet.compliance.renew', $vehicle->id),
            $payload
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Check vehicle field updated
        $vehicle->refresh();
        $this->assertEquals($newExpiryDate, $vehicle->stnk_expires_at->toDateString());

        // Check renewal audit log created
        $this->assertDatabaseHas('vehicle_compliance_renewals', [
            'vehicle_id' => $vehicle->id,
            'document_type' => 'stnk_annual',
            'cost' => 3500000,
            'payer' => 'owner',
            'reference_number' => 'INV-SAMSAT-998',
        ]);
    }

    public function test_vehicle_compliance_summary_accessor_calculates_overall_status(): void
    {
        $vehicle = Vehicle::factory()->create([
            'name' => 'HiAce Test',
            'plate_number' => 'B 9999 HAC',
            'stnk_expires_at' => Carbon::now()->addDays(50)->toDateString(),
            'insurance_expires_at' => Carbon::now()->subDays(2)->toDateString(), // One document expired
        ]);

        $summary = $vehicle->compliance_summary;

        $this->assertEquals('expired', $summary['overall']);
        $this->assertEquals('safe', $summary['stnk_annual']['status']);
        $this->assertEquals('expired', $summary['insurance']['status']);
    }
}
