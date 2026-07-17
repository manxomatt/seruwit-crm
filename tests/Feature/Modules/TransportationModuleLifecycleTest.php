<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Modules\Fleet\FleetModule;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\TransportationManagementModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Proves the Transportation/Fleet split behaves like any other optional
 * module — unreachable (even for an admin) until installed and entitled, data
 * survives an uninstall — and that installing Transportation alone also
 * installs Fleet, its declared requirement.
 */
class TransportationModuleLifecycleTest extends TestCase
{
    use WithTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function transportation(): TransportationManagementModule
    {
        return app(TransportationManagementModule::class);
    }

    private function fleet(): FleetModule
    {
        return app(FleetModule::class);
    }

    private function ownerOf(Tenant $tenant, string $email): User
    {
        return $tenant->run(fn (): User => User::query()->firstWhere('email', $email));
    }

    public function test_installing_requires_a_plan_entitled_to_transportation(): void
    {
        $tenant = $this->provisionTenant('Basic Co', 'basic-co', 'owner@basic.test');

        // The default plan (basic) does not include transportation.
        $this->expectException(\RuntimeException::class);
        $this->installer()->install($tenant, $this->transportation());
    }

    /**
     * Fleet is entitled by the plan but Transportation is not — installing
     * Transportation must not silently install Fleet on its way to failing.
     */
    public function test_a_missing_requirement_entitlement_blocks_the_whole_install(): void
    {
        $tenant = $this->provisionTenant('Half Co', 'half-co', 'owner@half.test');
        $tenant->plan = 'basic'; // includes carousels only, not fleet or transportation
        $tenant->save();

        try {
            $this->installer()->install($tenant, $this->transportation());
            $this->fail('Expected a RuntimeException for the missing fleet entitlement.');
        } catch (\RuntimeException) {
            // expected
        }

        $tenant->run(function () {
            $this->assertDatabaseMissing('installed_modules', ['key' => 'fleet']);
            $this->assertDatabaseMissing('installed_modules', ['key' => 'transportation']);
        });
    }

    /**
     * Installing Transportation alone must also install Fleet, since
     * Transportation declares `requires(): ['fleet']` and nothing installs it
     * up front.
     */
    public function test_installing_transportation_auto_installs_fleet(): void
    {
        $tenant = $this->provisionTenant('Auto Co', 'auto-co', 'owner@auto.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->transportation());

        $tenant->run(function () {
            $this->assertTrue(InstalledModule::query()->where('key', 'fleet')->installed()->exists());
            $this->assertTrue(InstalledModule::query()->where('key', 'transportation')->installed()->exists());
        });
    }

    public function test_workspace_admin_is_blocked_from_either_module_until_installed_and_data_survives_uninstall(): void
    {
        $tenant = $this->provisionTenant('Fleet Co', 'fleet-co', 'owner@fleet.test');
        $tenant->plan = 'pro';
        $tenant->save();
        $owner = $this->ownerOf($tenant, 'owner@fleet.test');

        $this->actingAs($owner)->get('http://fleet-co.localhost/module/transportation/trips')
            ->assertNotFound();
        $this->actingAs($owner)->get('http://fleet-co.localhost/module/fleet/vehicles')
            ->assertNotFound();

        // Installing only transportation must bring fleet along automatically.
        $this->installer()->install($tenant, $this->transportation());
        tenancy()->end();

        $this->actingAs($owner)->get('http://fleet-co.localhost/module/transportation/trips')
            ->assertOk();
        $this->actingAs($owner)->get('http://fleet-co.localhost/module/fleet/vehicles')
            ->assertOk();

        $vehicleId = $tenant->run(function () {
            return Vehicle::factory()->create()->id;
        });

        // Uninstalling the dependent (transportation) must not touch its
        // dependency (fleet) — fleet stays installed and reachable.
        $this->installer()->uninstall($tenant, $this->transportation());
        tenancy()->end();

        $this->actingAs($owner)->get('http://fleet-co.localhost/module/transportation/trips')
            ->assertNotFound();
        $this->actingAs($owner)->get('http://fleet-co.localhost/module/fleet/vehicles')
            ->assertOk();

        // Uninstall is non-destructive: the table and row are still there.
        $tenant->run(function () use ($vehicleId) {
            $this->assertDatabaseHas('vehicles', ['id' => $vehicleId]);
        });

        $this->installer()->install($tenant, $this->transportation());
        tenancy()->end();

        $this->actingAs($owner)->get('http://fleet-co.localhost/module/transportation/trips')
            ->assertOk();
    }

    /**
     * Fleet cannot be uninstalled while Transportation (or any other module)
     * still depends on it.
     */
    public function test_fleet_cannot_be_uninstalled_while_transportation_depends_on_it(): void
    {
        $tenant = $this->provisionTenant('Guard Co', 'guard-co', 'owner@guard.test');
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->transportation());

        $this->expectException(\RuntimeException::class);
        $this->installer()->uninstall($tenant, $this->fleet());
    }
}
