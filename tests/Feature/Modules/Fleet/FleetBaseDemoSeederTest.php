<?php

namespace Tests\Feature\Modules\Fleet;

use App\Models\User;
use Database\Seeders\TenantFleetBaseDemoSeeder;
use Database\Seeders\TenantVehicleDemoSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\FleetBaseKind;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetBaseDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            ValidateCsrfToken::class,
            VerifyCsrfToken::class,
        ]);
        $this->setUpRoles();
        $this->createAdminUser();
    }

    public function test_seeds_five_demo_fleet_bases(): void
    {
        $this->seed(TenantFleetBaseDemoSeeder::class);

        $this->assertSame(
            5,
            FleetBase::query()
                ->where('code', 'like', TenantFleetBaseDemoSeeder::CODE_PREFIX.'-%')
                ->count(),
        );

        $this->assertTrue(
            FleetBase::query()
                ->where('code', TenantFleetBaseDemoSeeder::CODE_PREFIX.'-JKT')
                ->where('kind', FleetBaseKind::Depot->value)
                ->whereNotNull('latitude')
                ->whereNotNull('manager_id')
                ->exists(),
        );

        $this->assertTrue((new TenantFleetBaseDemoSeeder)->isInstalled());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantFleetBaseDemoSeeder::class);
        $this->seed(TenantFleetBaseDemoSeeder::class);

        $this->assertSame(
            5,
            FleetBase::query()
                ->where('notes', 'like', '%'.TenantFleetBaseDemoSeeder::TAG.'%')
                ->count(),
        );
    }

    public function test_assigns_vehicle_demo_units_to_bases_when_present(): void
    {
        $this->seed(TenantVehicleDemoSeeder::class);
        $this->seed(TenantFleetBaseDemoSeeder::class);

        $this->assertGreaterThan(
            0,
            Vehicle::query()
                ->where('notes', 'like', '%'.TenantVehicleDemoSeeder::TAG.'%')
                ->whereNotNull('home_base_id')
                ->count(),
        );
    }

    public function test_uninstall_removes_demo_bases_and_clears_vehicle_links(): void
    {
        $this->seed(TenantVehicleDemoSeeder::class);
        $this->seed(TenantFleetBaseDemoSeeder::class);

        $seeder = new TenantFleetBaseDemoSeeder;
        $seeder->uninstall();

        $this->assertFalse($seeder->isInstalled());
        $this->assertSame(
            0,
            FleetBase::query()->where('notes', 'like', '%'.TenantFleetBaseDemoSeeder::TAG.'%')->count(),
        );
        $this->assertSame(
            0,
            Vehicle::query()
                ->where('notes', 'like', '%'.TenantVehicleDemoSeeder::TAG.'%')
                ->whereNotNull('home_base_id')
                ->count(),
        );
    }

    public function test_manager_is_synced_to_base_staff(): void
    {
        $this->seed(TenantFleetBaseDemoSeeder::class);

        $base = FleetBase::query()->where('code', TenantFleetBaseDemoSeeder::CODE_PREFIX.'-JKT')->firstOrFail();
        $manager = User::query()->findOrFail($base->manager_id);

        $this->assertTrue($base->users()->whereKey($manager->id)->exists());
    }
}
