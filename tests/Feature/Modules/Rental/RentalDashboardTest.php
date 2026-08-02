<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_are_redirected_from_dashboard(): void
    {
        $this->get(route('module.rental.dashboard'))->assertRedirect(route('login'));
    }

    public function test_rental_root_serves_dashboard(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get('/module/rental')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Rental/Dashboard/Index'));
    }

    public function test_legacy_rental_dashboard_path_redirects_into_module_prefix(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get('/rental/dashboard')
            ->assertRedirect('/module/rental/dashboard');
    }

    public function test_user_without_permission_cannot_view_dashboard(): void
    {
        $this->actingAs($this->createUserWithoutRole())
            ->get(route('module.rental.dashboard'))
            ->assertForbidden();
    }

    public function test_dashboard_shows_counts_utilisation_and_lists(): void
    {
        Vehicle::factory()->count(2)->create(['status' => Vehicle::STATUS_ACTIVE]);
        $onHireVehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $overdueVehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $confirmedVehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);

        $onHire = Rental::factory()->active()->create([
            'vehicle_id' => $onHireVehicle->id,
            'start_date' => now()->subDays(2)->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'total_amount' => 1_500_000,
        ]);

        Rental::factory()->active()->create([
            'vehicle_id' => $overdueVehicle->id,
            'start_date' => now()->subDays(10)->toDateString(),
            'end_date' => now()->subDays(2)->toDateString(),
            'total_amount' => 900_000,
        ]);

        Rental::factory()->create([
            'vehicle_id' => $confirmedVehicle->id,
            'status' => Rental::STATUS_CONFIRMED,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'total_amount' => 750_000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Dashboard/Index')
                ->where('board.counts.active', 2)
                ->where('board.counts.confirmed', 1)
                ->where('board.counts.overdue', 1)
                ->where('board.counts.ending_soon', 1)
                ->where('board.utilisation.on_rent', 2)
                ->where('board.utilisation.fleet_active', 5)
                ->where('board.utilisation.percent', 40)
                ->where('board.utilisation.idle', 3)
                ->has('board.overdue', 1)
                ->has('board.ending_soon', 1)
                ->where('board.ending_soon.0.code', $onHire->code)
                ->has('board.revenue.by_type')
                ->has('board.revenue.by_partner')
                ->has('board.revenue.by_vehicle')
                ->has('board.idle_vehicles', 3)
                ->has('board.compliance.documents')
                ->has('board.compliance.maintenance')
                ->has('board.kpis')
                ->where('board.kpis.adr', fn ($value) => is_numeric($value))
                ->where('board.kpis.revpac', fn ($value) => is_numeric($value))
                ->has('exportUrl')
            );
    }
}
