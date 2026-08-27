<?php

namespace Tests\Feature\Modules;

use App\Models\Role;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\FleetModule;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;

/**
 * The central module marketplace: the super admin installs optional modules
 * (config('modules.central_installable')) onto the central dashboard itself.
 *
 * Central-domain only. Because CENTRAL_SERVES_APP is false under test, the
 * gating fails closed — an optional module is unreachable on central until it is
 * installed, and its routes 404 again once uninstalled.
 */
class CentralModuleInstallTest extends TestCase
{
    use DatabaseMigrations;

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function fleet(): FleetModule
    {
        return app(FleetModule::class);
    }

    private function makeCentralAdmin(): User
    {
        $admin = User::factory()->create(['email' => 'super@platform.test']);

        $role = Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Platform admin', 'is_system' => true, 'dashboard_path' => '/module/dashboard'],
        );

        $admin->assignRole($role);

        return $admin;
    }

    public function test_the_marketplace_lists_allowlisted_modules_for_a_super_admin(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->get('/module/marketplace')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/CentralModules/Index')
                ->where('modules.0.key', 'fleet')
                ->where('modules.0.installed', false)
                ->where('modules.0.state', 'available')
            );
    }

    public function test_a_non_admin_cannot_reach_the_central_marketplace(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/module/marketplace')->assertForbidden();
        $this->actingAs($user)->post('/module/marketplace/fleet/install')->assertForbidden();
        $this->actingAs($user)->delete('/module/marketplace/fleet')->assertForbidden();
    }

    public function test_a_module_absent_from_the_allowlist_cannot_be_installed_on_central(): void
    {
        $admin = $this->makeCentralAdmin();

        // Inventory is a registered optional module, but not central-installable.
        $this->actingAs($admin)->post('/module/marketplace/inventory/install')->assertNotFound();
    }

    public function test_an_uninstalled_module_route_404s_on_central(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->get('/module/fleet')->assertNotFound();
    }

    public function test_installing_fleet_on_central_creates_its_tables_and_records_it(): void
    {
        // Drive the installer directly so a migration failure surfaces its own
        // message rather than being swallowed into a flash error.
        $this->installer()->installOnCentral($this->fleet());

        $this->assertTrue(Schema::hasTable('vehicles'));
        $this->assertDatabaseHas('installed_modules', ['key' => 'fleet', 'uninstalled_at' => null]);
    }

    public function test_super_admin_installs_fleet_on_central_and_reaches_it(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->post('/module/marketplace/fleet/install')
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('installed_modules', ['key' => 'fleet', 'uninstalled_at' => null]);

        // Now reachable on the central dashboard, and surfaced to the sidebar.
        $this->actingAs($admin)->get('/module/fleet')->assertOk();

        $this->actingAs($admin)->get('/module/dashboard')
            ->assertInertia(fn ($page) => $page
                ->has('auth.user.permissions.fleet')
                ->where('centralInstallableModules', ['fleet'])
            );
    }

    public function test_uninstalling_fleet_on_central_404s_the_route_but_keeps_data(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->installer()->installOnCentral($this->fleet());
        $vehicleId = Vehicle::factory()->create()->id;

        $this->actingAs($admin)->delete('/module/marketplace/fleet')
            ->assertRedirect()
            ->assertSessionHas('success');

        // Soft uninstall: unreachable, but the row and its tables survive the
        // grace period so a reinstall restores everything.
        $this->actingAs($admin)->get('/module/fleet')->assertNotFound();
        $this->assertDatabaseHas('vehicles', ['id' => $vehicleId]);
        $this->assertDatabaseHas('installed_modules', ['key' => 'fleet']);
        $this->assertNotNull(\App\Models\InstalledModule::query()->where('key', 'fleet')->value('uninstalled_at'));
    }

    public function test_reinstalling_fleet_on_central_restores_access(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->installer()->installOnCentral($this->fleet());
        $this->installer()->uninstallOnCentral($this->fleet());

        $this->actingAs($admin)->get('/module/fleet')->assertNotFound();

        $this->actingAs($admin)->post('/module/marketplace/fleet/install')->assertRedirect();

        $this->actingAs($admin)->get('/module/fleet')->assertOk();
        $this->assertDatabaseHas('installed_modules', ['key' => 'fleet', 'uninstalled_at' => null]);
    }
}
