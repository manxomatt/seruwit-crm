<?php

namespace Tests\Feature\Modules;

use App\Models\Tenant;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Modules\TransportationManagement\Models\Vehicle;
use Modules\TransportationManagement\TransportationManagementModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Proves the Transportation module behaves like any other optional module:
 * unreachable (even for an admin) until installed and entitled, and its data
 * survives an uninstall rather than being destroyed.
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

    private function module(): TransportationManagementModule
    {
        return app(TransportationManagementModule::class);
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
        $this->installer()->install($tenant, $this->module());
    }

    public function test_workspace_admin_is_blocked_from_the_module_until_installed_and_data_survives_uninstall(): void
    {
        $tenant = $this->provisionTenant('Fleet Co', 'fleet-co', 'owner@fleet.test');
        $tenant->plan = 'pro';
        $tenant->save();
        $owner = $this->ownerOf($tenant, 'owner@fleet.test');

        $this->actingAs($owner)->get('http://fleet-co.localhost/module/transportation/vehicles')
            ->assertNotFound();

        $this->installer()->install($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://fleet-co.localhost/module/transportation/vehicles')
            ->assertOk();

        $vehicleId = $tenant->run(function () {
            return Vehicle::factory()->create()->id;
        });

        $this->installer()->uninstall($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://fleet-co.localhost/module/transportation/vehicles')
            ->assertNotFound();

        // Uninstall is non-destructive: the table and row are still there.
        $tenant->run(function () use ($vehicleId) {
            $this->assertDatabaseHas('vehicles', ['id' => $vehicleId]);
        });

        $this->installer()->install($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://fleet-co.localhost/module/transportation/vehicles')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('vehicles.data', 1));
    }
}
