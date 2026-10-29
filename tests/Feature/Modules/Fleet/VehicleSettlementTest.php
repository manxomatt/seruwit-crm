<?php

namespace Tests\Feature\Modules\Fleet;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Models\VehicleMaintenanceLog;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class VehicleSettlementTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_user_can_view_vehicle_settlement_page_with_calculated_revenue_share(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::create([
            'code' => 'PTN-INV-01',
            'name' => 'Investor Surya',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::factory()->create([
            'name' => 'Innova Zenix Investor',
            'plate_number' => 'B 1111 INV',
            'ownership_type' => 'investor',
            'partner_id' => $partner->id,
            'contract_number' => 'PKS/2026/01',
            'settlement_scheme' => 'revenue_share',
            'revenue_share_owner_pct' => 70,
            'revenue_share_tenant_pct' => 30,
            'maintenance_payer' => 'shared',
            'status' => 'active',
        ]);

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();

        // Create a rental order if Rental model exists
        if (class_exists(\Modules\Rental\Models\Rental::class)) {
            $customer = Partner::create([
                'code' => 'PTN-CUST-01',
                'name' => 'John Customer',
                'account_type' => 'individual',
                'status' => 'active',
            ]);

            \Modules\Rental\Models\Rental::factory()->create([
                'code' => 'RNT-TEST-001',
                'vehicle_id' => $vehicle->id,
                'partner_id' => $customer->id,
                'status' => \Modules\Rental\Models\Rental::STATUS_COMPLETED,
                'start_date' => $startOfMonth->toDateString(),
                'end_date' => $startOfMonth->copy()->addDays(3)->toDateString(),
                'total_amount' => 1000000,
                'rate_per_period' => 350000,
                'total_periods' => 3,
                'period_type' => 'daily',
            ]);
        }

        // Create a maintenance log
        VehicleMaintenanceLog::create([
            'vehicle_id' => $vehicle->id,
            'type' => 'repair',
            'description' => 'Ganti Oli & Kampas Rem',
            'scheduled_date' => $startOfMonth->copy()->addDays(5)->toDateString(),
            'cost' => 200000,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($user)->get(route('module.fleet.vehicles.settlement', [
            'vehicle' => $vehicle->id,
            'month' => $now->format('Y-m'),
        ]));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetSettlement/Show')
                ->has('settlement')
                ->where('settlement.vehicle.id', $vehicle->id)
                ->where('settlement.summary.total_maintenance_cost', 200000)
                ->where('settlement.summary.maintenance_deduction', 100000) // 50% because 'shared'
            );
    }

    public function test_user_can_view_partner_consolidated_settlement_page(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::create([
            'code' => 'PTN-INV-02',
            'name' => 'Investor Makmur Bersama',
            'account_type' => 'company',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::factory()->create([
            'name' => 'Avanza Investor',
            'plate_number' => 'B 2222 INV',
            'ownership_type' => 'investor',
            'partner_id' => $partner->id,
            'contract_number' => 'PKS/2026/02',
            'settlement_scheme' => 'fixed_monthly',
            'fixed_fee_amount' => 4500000,
            'maintenance_payer' => 'tenant',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->get(route('module.partners.settlement', $partner->id));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Partners/Settlement')
                ->where('settlement.partner.id', $partner->id)
                ->where('isConsolidated', true)
            );
    }
}
