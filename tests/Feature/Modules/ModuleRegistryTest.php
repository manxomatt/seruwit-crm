<?php

namespace Tests\Feature\Modules;

use App\Models\ModuleSetting;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Modules\Fleet\FleetModule;
use Modules\TransportationManagement\TransportationManagementModule;
use RuntimeException;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * The platform-wide module kill switch: turns a module off for every tenant
 * at once, independent of any plan or install state, and non-destructively
 * (re-enabling restores everything immediately).
 */
class ModuleRegistryTest extends TestCase
{
    use WithTenant;

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function fleet(): FleetModule
    {
        return app(FleetModule::class);
    }

    private function transportation(): TransportationManagementModule
    {
        return app(TransportationManagementModule::class);
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

    private function ownerOf(Tenant $tenant, string $email): User
    {
        return $tenant->run(fn (): User => User::query()->firstWhere('email', $email));
    }

    public function test_a_non_admin_cannot_access_or_toggle_the_registry(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/module/registry')->assertForbidden();
        $this->actingAs($user)->patch('/module/registry/fleet/status')->assertForbidden();
    }

    public function test_super_admin_can_disable_a_module(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->get('/module/registry')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Registry/Index')
                ->where('modules.0.is_enabled', true)
            );

        $this->actingAs($admin)->patch('/module/registry/fleet/status')
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('module_settings', ['key' => 'fleet', 'is_enabled' => false]);
    }

    public function test_toggling_twice_re_enables_the_module(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->patch('/module/registry/fleet/status');
        $this->actingAs($admin)->patch('/module/registry/fleet/status');

        $this->assertDatabaseHas('module_settings', ['key' => 'fleet', 'is_enabled' => true]);
    }

    public function test_a_disabled_module_404s_for_a_tenant_even_when_installed_and_entitled(): void
    {
        $tenant = $this->provisionTenant('Kill Co', 'kill-co', 'owner@kill.test');
        $tenant->plan = 'pro';
        $tenant->save();
        $owner = $this->ownerOf($tenant, 'owner@kill.test');

        $this->installer()->install($tenant, $this->fleet());
        tenancy()->end();

        // Disable before making any tenant request in this test, so the
        // ModuleRegistry singleton never caches a stale "enabled" state.
        ModuleSetting::create(['key' => 'fleet', 'is_enabled' => false]);
        app(\App\Modules\ModuleRegistry::class)->flushDisabledState();

        $this->actingAs($owner)->get('http://kill-co.localhost/module/fleet/vehicles')
            ->assertNotFound();
    }

    public function test_disabling_drops_the_module_from_the_sidebar_permissions_prop(): void
    {
        $tenant = $this->provisionTenant('Sidebar Co', 'sidebar-co', 'owner@sidebar.test');
        $tenant->plan = 'pro';
        $tenant->save();
        $owner = $this->ownerOf($tenant, 'owner@sidebar.test');

        $this->installer()->install($tenant, $this->fleet());
        tenancy()->end();

        $this->actingAs($owner)->get('http://sidebar-co.localhost/module/dashboard')
            ->assertInertia(fn ($page) => $page->has('auth.user.permissions.fleet'));

        ModuleSetting::create(['key' => 'fleet', 'is_enabled' => false]);
        app(\App\Modules\ModuleRegistry::class)->flushDisabledState();

        $this->actingAs($owner)->get('http://sidebar-co.localhost/module/dashboard')
            ->assertInertia(fn ($page) => $page->missing('auth.user.permissions.fleet'));
    }

    public function test_disabling_does_not_touch_installed_state_or_data_and_reenabling_restores_access(): void
    {
        $tenant = $this->provisionTenant('Restore Co', 'restore-co', 'owner@restore.test');
        $tenant->plan = 'pro';
        $tenant->save();
        $owner = $this->ownerOf($tenant, 'owner@restore.test');
        $admin = $this->makeCentralAdmin();
        $centralUrl = config('app.url').'/module/registry/fleet/status';

        $this->installer()->install($tenant, $this->fleet());

        $vehicleId = $tenant->run(fn () => \Modules\Fleet\Models\Vehicle::factory()->create()->id);
        tenancy()->end();

        $this->actingAs($admin)->patch($centralUrl)->assertRedirect();

        $this->actingAs($owner)->get('http://restore-co.localhost/module/fleet/vehicles')
            ->assertNotFound();
        tenancy()->end();

        $tenant->run(function () use ($vehicleId) {
            $this->assertDatabaseHas('vehicles', ['id' => $vehicleId]);
            $this->assertDatabaseHas('installed_modules', ['key' => 'fleet']);
        });
        tenancy()->end();

        // A relative path here would resolve against whatever domain tenancy
        // last left as the root URL, not necessarily the central one — the
        // tenant visit above forces an explicit central URL for this request.
        $this->actingAs($admin)->patch($centralUrl)->assertRedirect();

        $this->actingAs($owner)->get('http://restore-co.localhost/module/fleet/vehicles')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('vehicles.data', 1));
    }

    public function test_installing_a_disabled_module_throws_and_installs_nothing(): void
    {
        $tenant = $this->provisionTenant('Blocked Co', 'blocked-co', 'owner@blocked.test');
        $tenant->plan = 'pro';
        $tenant->save();

        ModuleSetting::create(['key' => 'fleet', 'is_enabled' => false]);
        app(\App\Modules\ModuleRegistry::class)->flushDisabledState();

        // Transportation requires fleet, so installing it should also fail —
        // proving the disabled check applies to auto-installed dependencies too.
        try {
            $this->installer()->install($tenant, $this->transportation());
            $this->fail('Expected a RuntimeException for the disabled dependency.');
        } catch (RuntimeException) {
            // expected
        }

        $tenant->run(function () {
            $this->assertDatabaseMissing('installed_modules', ['key' => 'fleet']);
            $this->assertDatabaseMissing('installed_modules', ['key' => 'transportation']);
        });
    }

    public function test_plans_page_reports_a_disabled_module(): void
    {
        $admin = $this->makeCentralAdmin();
        ModuleSetting::create(['key' => 'fleet', 'is_enabled' => false]);

        $this->actingAs($admin)->get('/module/plans')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('availableModules.2.key', 'fleet')
                ->where('availableModules.2.is_enabled', false)
            );
    }
}
