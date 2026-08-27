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

    public function test_the_marketplace_lists_the_installable_modules_for_a_super_admin(): void
    {
        $admin = $this->makeCentralAdmin();

        // Every registered optional module is installable on central by default,
        // so the marketplace mirrors what a tenant can install — fleet included,
        // available and not yet installed.
        $this->actingAs($admin)->get('/module/marketplace')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/CentralModules/Index')
                ->where('modules', fn ($modules) => collect($modules)->count() > 1
                    && collect($modules)->firstWhere('key', 'fleet')['installed'] === false
                    && collect($modules)->firstWhere('key', 'fleet')['state'] === 'available')
            );
    }

    public function test_a_non_admin_cannot_reach_the_central_marketplace(): void
    {
        // A role (any non-admin one) keeps the user past workspace onboarding so
        // the request reaches the manage-central-modules gate rather than being
        // bounced to /onboarding first.
        $role = Role::query()->firstOrCreate(
            ['slug' => 'staff'],
            ['name' => 'Staff', 'description' => 'Non-admin staff', 'is_system' => false, 'dashboard_path' => '/module/dashboard'],
        );
        $user = User::factory()->create(['email' => 'staff@platform.test']);
        $user->assignRole($role);

        $this->actingAs($user)->get('/module/marketplace')->assertForbidden();
        $this->actingAs($user)->post('/module/marketplace/fleet/install')->assertForbidden();
        $this->actingAs($user)->delete('/module/marketplace/fleet')->assertForbidden();
    }

    public function test_an_always_on_central_module_cannot_be_installed_via_the_marketplace(): void
    {
        $admin = $this->makeCentralAdmin();

        // Document is a registered module, but it is an always-on central module
        // (config('modules.central_modules')), so it is excluded from the
        // marketplace and cannot be installed there.
        $this->actingAs($admin)->post('/module/marketplace/document/install')->assertNotFound();
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

        // Now reachable on the central dashboard.
        $this->actingAs($admin)->get('/module/fleet')->assertOk();

        // The install granted the admin fleet permissions and the sidebar has the
        // data it needs to surface the module (shared on every central page).
        $this->actingAs($admin)->get('/module/marketplace')
            ->assertInertia(fn ($page) => $page
                ->has('auth.user.permissions.fleet')
                ->where('centralInstallableModules', fn ($keys) => collect($keys)->contains('fleet'))
                ->where('modules', fn ($modules) => collect($modules)->firstWhere('key', 'fleet')['installed'] === true)
            );
    }

    public function test_the_central_admin_dashboard_renders_and_aggregates_installed_modules(): void
    {
        $admin = $this->makeCentralAdmin();

        // Empty installed_modules table: the "top installed" widget must not error
        // (the query is guarded by hasTable, which is now always true on central).
        $this->actingAs($admin)->get('/module/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Central/AdminDashboard'));

        // With a module installed on central, it is aggregated by its `key`.
        $this->installer()->installOnCentral($this->fleet());

        $this->actingAs($admin)->get('/module/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Central/AdminDashboard')
                ->where('moduleStats.topInstalled', fn ($rows) => collect($rows)->firstWhere('key', 'fleet')['count'] === 1)
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
