<?php

namespace Tests\Feature\Modules\FleetSettlement;

use App\Support\SystemRolePermissions;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetSettlement\Models\VehicleSettlement;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetSettlementTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        SystemRolePermissions::seedRolesForModule('fleet-settlement');
        SystemRolePermissions::syncAllSystemRoles();
    }

    public function test_guests_cannot_access_fleet_settlements(): void
    {
        $this->get(route('module.fleet-settlements.index'))->assertRedirect(route('login'));
        $this->get(route('module.fleet-settlement.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_access_fleet_settlements_index(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::create([
            'code' => 'PTN-INV-99',
            'name' => 'Investor Surya',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::factory()->create([
            'name' => 'Innova Zenix Investor',
            'plate_number' => 'B 9999 INV',
            'ownership_type' => 'investor',
            'partner_id' => $partner->id,
            'settlement_scheme' => 'revenue_share',
            'status' => 'active',
        ]);

        $this->actingAs($user)->get(route('module.fleet-settlement.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetSettlement/Index')
                ->has('rows')
                ->has('metrics')
            );

        $this->actingAs($user)->get(route('module.fleet-settlements.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetSettlement/Index')
                ->has('rows')
                ->has('metrics')
            );
    }

    public function test_admin_can_generate_and_save_payout(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::create([
            'code' => 'PTN-INV-88',
            'name' => 'Investor Hendra',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::factory()->create([
            'name' => 'Fortuner Investor',
            'plate_number' => 'B 8888 INV',
            'ownership_type' => 'investor',
            'partner_id' => $partner->id,
            'settlement_scheme' => 'fixed_monthly',
            'fixed_fee_amount' => 5000000,
            'maintenance_payer' => 'tenant',
            'status' => 'active',
        ]);

        $month = Carbon::now()->format('Y-m');

        // 1. Generate statement
        $generateResponse = $this->actingAs($user)->post(route('module.fleet-settlements.generate'), [
            'month' => $month,
            'vehicle_id' => $vehicle->id,
        ]);

        $generateResponse->assertRedirect();
        $this->assertDatabaseHas('vehicle_settlements', [
            'vehicle_id' => $vehicle->id,
            'period_month' => $month,
        ]);

        // 2. Save Payout
        $payoutResponse = $this->actingAs($user)->post(route('module.fleet-settlements.payout'), [
            'period_month' => $month,
            'vehicle_id' => $vehicle->id,
            'status' => VehicleSettlement::STATUS_PAID,
            'payment_method' => 'bank_transfer',
            'payment_reference' => 'TRF-123456',
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Hendra',
        ]);

        $payoutResponse->assertRedirect();
        $this->assertDatabaseHas('vehicle_settlements', [
            'vehicle_id' => $vehicle->id,
            'period_month' => $month,
            'status' => VehicleSettlement::STATUS_PAID,
            'payment_reference' => 'TRF-123456',
        ]);
    }

    public function test_admin_can_view_vehicle_settlement_show_page(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::create([
            'code' => 'PTN-INV-77',
            'name' => 'Investor Budi',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $vehicle = Vehicle::factory()->create([
            'name' => 'Yaris Cross Investor',
            'plate_number' => 'B 7777 INV',
            'ownership_type' => 'investor',
            'partner_id' => $partner->id,
            'settlement_scheme' => 'revenue_share',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->get(route('module.fleet-settlements.vehicles.show', $vehicle));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetSettlement/Show')
                ->has('settlement')
                ->where('settlement.vehicle.id', $vehicle->id)
            );
    }

    public function test_backward_compatibility_routes_work(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.fleet.settlements.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/FleetSettlement/Index')
            );
    }
}
