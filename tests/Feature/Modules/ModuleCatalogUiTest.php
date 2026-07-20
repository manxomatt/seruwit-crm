<?php

namespace Tests\Feature\Modules;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Carousels\CarouselsModule;
use Modules\Carousels\Models\Carousel;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * The two catalogs: a workspace admin managing their own modules on the tenant
 * domain, and a super admin managing any tenant's from central.
 */
class ModuleCatalogUiTest extends TestCase
{
    use WithTenant;

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function module(): CarouselsModule
    {
        return app(CarouselsModule::class);
    }

    private function ownerOf(Tenant $tenant, string $email): User
    {
        return $tenant->run(fn (): User => User::query()->firstWhere('email', $email));
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

    // ---------------------------------------------------------------- tenant admin

    public function test_workspace_admin_sees_the_catalog_with_plan_and_state(): void
    {
        $tenant = $this->provisionTenant('Cat Co', 'cat-co', 'owner@cat.test');
        $owner = $this->ownerOf($tenant, 'owner@cat.test');

        $this->actingAs($owner)->get('http://cat-co.localhost/module/modules')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Modules/Index')
                ->where('plan.key', 'basic')
                // Registration order puts billing first; carousels sits at 1.
                ->where('modules.1.key', 'carousels')
                ->where('modules.1.entitled', true)
                ->where('modules.1.installed', false)
                ->where('modules.1.state', 'available')
            );
    }

    public function test_workspace_admin_can_install_and_uninstall_from_the_catalog(): void
    {
        $tenant = $this->provisionTenant('Do Co', 'do-co', 'owner@do.test');
        $owner = $this->ownerOf($tenant, 'owner@do.test');

        $this->actingAs($owner)
            ->post('http://do-co.localhost/module/modules/carousels/install')
            ->assertRedirect();

        $this->assertTrue($this->installer()->isInstalled($tenant, $this->module()));
        tenancy()->end();

        $this->actingAs($owner)->get('http://do-co.localhost/module/carousels')->assertOk();

        $this->actingAs($owner)
            ->delete('http://do-co.localhost/module/modules/carousels')
            ->assertRedirect();

        $this->assertFalse($this->installer()->isInstalled($tenant, $this->module()));
        tenancy()->end();

        $this->actingAs($owner)->get('http://do-co.localhost/module/carousels')->assertNotFound();
    }

    public function test_the_catalog_reports_an_uninstalled_module_with_its_purge_date(): void
    {
        $tenant = $this->provisionTenant('Grace Co', 'grace-co', 'owner@grace.test');
        $owner = $this->ownerOf($tenant, 'owner@grace.test');

        $this->installer()->install($tenant, $this->module());
        $this->installer()->uninstall($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://grace-co.localhost/module/modules')
            ->assertInertia(fn ($page) => $page
                ->where('modules.1.state', 'uninstalled')
                ->where('modules.1.purges_at', now()->addDays(30)->toDateString())
            );
    }

    public function test_the_catalog_marks_an_unentitled_module_that_still_holds_data(): void
    {
        $tenant = $this->provisionTenant('Lock Co', 'lock-co', 'owner@lock.test');
        $owner = $this->ownerOf($tenant, 'owner@lock.test');

        $this->installer()->install($tenant, $this->module());
        $tenant->update(['plan' => 'free']);
        tenancy()->end();

        $this->actingAs($owner)->get('http://lock-co.localhost/module/modules')
            ->assertInertia(fn ($page) => $page
                ->where('modules.1.entitled', false)
                ->where('modules.1.state', 'locked_with_data')
                ->where('modules.1.plans_offering', ['Basic', 'Pro'])
            );
    }

    public function test_the_catalog_refuses_to_install_beyond_the_plan(): void
    {
        $tenant = $this->provisionTenant('Cheap Co', 'cheap-co', 'owner@cheap.test');
        $owner = $this->ownerOf($tenant, 'owner@cheap.test');
        $tenant->update(['plan' => 'free']);
        tenancy()->end();

        $this->actingAs($owner)
            ->post('http://cheap-co.localhost/module/modules/carousels/install')
            ->assertSessionHas('error');

        $this->assertFalse($this->installer()->isInstalled($tenant, $this->module()));
    }

    public function test_a_non_admin_member_cannot_reach_the_catalog(): void
    {
        $tenant = $this->provisionTenant('Member Co', 'member-co', 'owner@member.test');

        $member = $tenant->run(function (): User {
            $user = User::factory()->create(['email' => 'member@member.test']);
            $user->assignRole(Role::query()->where('slug', 'user')->firstOrFail());

            return $user;
        });

        $this->actingAs($member)->get('http://member-co.localhost/module/modules')->assertForbidden();
        $this->actingAs($member)->post('http://member-co.localhost/module/modules/carousels/install')->assertForbidden();
    }

    public function test_the_catalog_does_not_exist_on_the_central_domain(): void
    {
        $admin = $this->makeCentralAdmin();

        // There is no workspace on central whose modules these would be.
        $this->actingAs($admin)->get('http://localhost/module/modules')->assertNotFound();
    }

    // ---------------------------------------------------------------- super admin

    public function test_super_admin_sees_a_tenants_modules_and_plan(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Seen Co', 'seen-co', 'owner@seen.test');

        $this->actingAs($admin)->get('/module/tenants/'.$tenant->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Tenants/Show')
                ->where('tenant.plan', 'basic')
                ->where('modules.1.key', 'carousels')
                ->where('modules.1.state', 'available')
                ->has('plans', 3)
            );
    }

    public function test_super_admin_can_install_a_module_for_a_tenant(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Helped Co', 'helped-co', 'owner@helped.test');

        $this->actingAs($admin)
            ->post('/module/tenants/'.$tenant->id.'/modules/carousels')
            ->assertRedirect();

        $this->assertTrue($this->installer()->isInstalled($tenant, $this->module()));
        $tenant->run(fn () => $this->assertTrue(Schema::hasTable('carousels')));
    }

    public function test_super_admin_can_uninstall_a_module_for_a_tenant(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Pulled Co', 'pulled-co', 'owner@pulled.test');
        $this->installer()->install($tenant, $this->module());

        $this->actingAs($admin)
            ->delete('/module/tenants/'.$tenant->id.'/modules/carousels')
            ->assertRedirect();

        $this->assertFalse($this->installer()->isInstalled($tenant, $this->module()));
        $tenant->run(fn () => $this->assertTrue(Schema::hasTable('carousels')));
    }

    public function test_super_admin_cannot_install_beyond_the_tenants_plan(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Bound Co', 'bound-co', 'owner@bound.test');
        $tenant->update(['plan' => 'free']);

        // Entitlement stays the single source of truth: to hand over a module the
        // super admin moves the plan rather than working around it.
        $this->actingAs($admin)
            ->post('/module/tenants/'.$tenant->id.'/modules/carousels')
            ->assertSessionHas('error');

        $this->assertFalse($this->installer()->isInstalled($tenant, $this->module()));
    }

    public function test_super_admin_changing_the_plan_unlocks_the_module(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Moved Co', 'moved-co', 'owner@moved.test');
        $tenant->update(['plan' => 'free']);

        $this->actingAs($admin)->patch('/module/tenants/'.$tenant->id, [
            'name' => 'Moved Co',
            'subdomain' => 'moved-co',
            'status' => 'active',
            'plan' => 'pro',
        ])->assertSessionHasNoErrors();

        $this->assertSame('pro', $tenant->fresh()->planKey());

        $this->actingAs($admin)
            ->post('/module/tenants/'.$tenant->id.'/modules/carousels')
            ->assertRedirect();

        $this->assertTrue($this->installer()->isInstalled($tenant, $this->module()));
    }

    public function test_super_admin_downgrade_keeps_the_tenants_data(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Kept Co', 'kept-co', 'owner@kept.test');
        $owner = $this->ownerOf($tenant, 'owner@kept.test');

        $this->installer()->install($tenant, $this->module());
        $tenant->run(fn () => Carousel::factory()->create(['user_id' => $owner->id, 'slug' => 'safe']));

        $this->actingAs($admin)->patch('/module/tenants/'.$tenant->id, [
            'name' => 'Kept Co',
            'subdomain' => 'kept-co',
            'status' => 'active',
            'plan' => 'free',
        ])->assertSessionHasNoErrors();

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('carousels'));
            $this->assertSame(1, Carousel::query()->where('slug', 'safe')->count());
        });
    }

    public function test_an_unknown_plan_is_rejected(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Bogus Co', 'bogus-co', 'owner@bogus.test');

        $this->actingAs($admin)->patch('/module/tenants/'.$tenant->id, [
            'name' => 'Bogus Co',
            'subdomain' => 'bogus-co',
            'status' => 'active',
            'plan' => 'platinum-unlimited',
        ])->assertSessionHasErrors('plan');
    }

    public function test_a_non_admin_cannot_manage_another_tenants_modules(): void
    {
        $user = User::factory()->create();
        $tenant = $this->provisionTenant('Private Co', 'private-co', 'owner@private.test');

        $this->actingAs($user)->post('/module/tenants/'.$tenant->id.'/modules/carousels')->assertForbidden();
        $this->actingAs($user)->delete('/module/tenants/'.$tenant->id.'/modules/carousels')->assertForbidden();
    }
}
