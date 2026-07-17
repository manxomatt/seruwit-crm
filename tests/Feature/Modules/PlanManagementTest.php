<?php

namespace Tests\Feature\Modules;

use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Modules\Carousels\CarouselsModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Super admin CRUD over plans, and the thing that actually matters: that editing
 * a plan reaches the tenants on it.
 */
class PlanManagementTest extends TestCase
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

    public function test_super_admin_sees_plans_with_their_modules_and_tenant_counts(): void
    {
        $admin = $this->makeCentralAdmin();
        $this->provisionTenant('Counted Co', 'counted-co', 'owner@counted.test');

        $this->actingAs($admin)->get('/module/plans')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Plans/Index')
                ->has('plans', 3)
                ->has('availableModules', 1)
                ->where('availableModules.0.key', 'carousels')
                // The tenant carries no plan of its own, so it counts against the
                // default — the plan it actually falls back to.
                ->where('plans.1.key', 'basic')
                ->where('plans.1.is_default', true)
                ->where('plans.1.tenants', 1)
                ->where('plans.0.key', 'free')
                ->where('plans.0.tenants', 0)
            );
    }

    public function test_super_admin_can_create_a_plan(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->post('/module/plans', [
            'key' => 'enterprise',
            'name' => 'Enterprise',
            'description' => 'Semua modul plus dukungan khusus.',
            'modules' => ['carousels'],
            'sort_order' => 4,
            'is_default' => false,
        ])->assertSessionHasNoErrors();

        $plan = Plan::query()->firstWhere('key', 'enterprise');

        $this->assertNotNull($plan);
        $this->assertSame(['carousels'], $plan->modules);
        $this->assertFalse($plan->is_default);
    }

    public function test_a_plan_key_must_be_unique_and_url_safe(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->post('/module/plans', [
            'key' => 'basic',
            'name' => 'Duplicate',
            'modules' => [],
        ])->assertSessionHasErrors('key');

        $this->actingAs($admin)->post('/module/plans', [
            'key' => 'Not Valid!',
            'name' => 'Bad Key',
            'modules' => [],
        ])->assertSessionHasErrors('key');
    }

    public function test_a_plan_cannot_sell_a_module_that_does_not_exist(): void
    {
        $admin = $this->makeCentralAdmin();

        $this->actingAs($admin)->post('/module/plans', [
            'key' => 'fantasy',
            'name' => 'Fantasy',
            'modules' => ['teleportation'],
        ])->assertSessionHasErrors('modules.0');
    }

    public function test_editing_a_plan_changes_what_its_tenants_may_install(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Live Co', 'live-co', 'owner@live.test');
        $owner = $tenant->run(fn (): User => User::query()->firstWhere('email', 'owner@live.test'));

        $this->installer()->install($tenant, $this->module());
        tenancy()->end();
        $this->actingAs($owner)->get('http://live-co.localhost/module/carousels')->assertOk();

        // End tenancy so the admin's role check reads the central schema, and
        // address central absolutely: after a tenant-domain request a relative
        // URL resolves against that host, which has no central routes.
        tenancy()->end();

        // Pull carousels out of the plan the tenant is on.
        $basic = Plan::query()->firstWhere('key', 'basic');
        $this->actingAs($admin)->patch('http://localhost/module/plans/'.$basic->id, [
            'name' => 'Basic',
            'description' => 'Tanpa carousel lagi.',
            'modules' => [],
            'sort_order' => 2,
            'is_default' => true,
        ])->assertRedirect();

        $this->assertSame([], $basic->fresh()->modules);

        tenancy()->end();

        // The tenant loses access without anyone touching their workspace...
        $this->actingAs($owner)->get('http://live-co.localhost/module/carousels')->assertNotFound();

        // ...and their install and data survive it.
        $this->assertTrue($this->installer()->isInstalled($tenant, $this->module()));
    }

    public function test_a_plan_key_cannot_be_changed_out_from_under_its_tenants(): void
    {
        $admin = $this->makeCentralAdmin();
        $basic = Plan::query()->firstWhere('key', 'basic');

        $this->actingAs($admin)->patch('/module/plans/'.$basic->id, [
            'key' => 'renamed',
            'name' => 'Basic',
            'modules' => ['carousels'],
            'sort_order' => 2,
            'is_default' => true,
        ])->assertSessionHasNoErrors();

        // Tenants reference the key, so it is ignored rather than applied.
        $this->assertSame('basic', $basic->fresh()->key);
    }

    public function test_making_a_plan_default_demotes_the_previous_one(): void
    {
        $admin = $this->makeCentralAdmin();
        $pro = Plan::query()->firstWhere('key', 'pro');

        $this->actingAs($admin)->patch('/module/plans/'.$pro->id, [
            'name' => 'Pro',
            'modules' => ['carousels'],
            'sort_order' => 3,
            'is_default' => true,
        ])->assertSessionHasNoErrors();

        $this->assertTrue($pro->fresh()->is_default);
        $this->assertFalse(Plan::query()->firstWhere('key', 'basic')->is_default);
        $this->assertSame(1, Plan::query()->where('is_default', true)->count());
    }

    public function test_a_tenant_without_a_plan_follows_the_default_wherever_it_moves(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Follow Co', 'follow-co', 'owner@follow.test');

        $this->assertSame('basic', $tenant->planKey());

        $free = Plan::query()->firstWhere('key', 'free');
        $this->actingAs($admin)->patch('/module/plans/'.$free->id, [
            'name' => 'Free',
            'modules' => [],
            'sort_order' => 1,
            'is_default' => true,
        ])->assertSessionHasNoErrors();

        // The tenant never had a plan of its own, so it moves with the default.
        $this->assertSame('free', $tenant->fresh()->planKey());
        $this->assertFalse($tenant->fresh()->isEntitledTo('carousels'));
    }

    public function test_a_plan_in_use_cannot_be_deleted(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Held Co', 'held-co', 'owner@held.test');
        $tenant->update(['plan' => 'pro']);

        $pro = Plan::query()->firstWhere('key', 'pro');

        $this->actingAs($admin)->delete('/module/plans/'.$pro->id)
            ->assertSessionHas('error');

        $this->assertNotNull(Plan::query()->find($pro->id));
    }

    public function test_the_default_plan_cannot_be_deleted(): void
    {
        $admin = $this->makeCentralAdmin();
        $basic = Plan::query()->firstWhere('key', 'basic');

        $this->actingAs($admin)->delete('/module/plans/'.$basic->id)
            ->assertSessionHas('error');

        $this->assertNotNull(Plan::query()->find($basic->id));
    }

    public function test_an_unused_plan_can_be_deleted(): void
    {
        $admin = $this->makeCentralAdmin();
        $pro = Plan::query()->firstWhere('key', 'pro');

        $this->actingAs($admin)->delete('/module/plans/'.$pro->id)
            ->assertSessionHas('success');

        $this->assertNull(Plan::query()->find($pro->id));
    }

    public function test_a_non_admin_cannot_reach_plan_management(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/module/plans')->assertForbidden();
        $this->actingAs($user)->post('/module/plans', [
            'key' => 'sneaky',
            'name' => 'Sneaky',
            'modules' => [],
        ])->assertForbidden();
    }

    public function test_plan_management_is_central_only(): void
    {
        $admin = $this->makeCentralAdmin();
        $this->provisionTenant('Nope Co', 'nope-co', 'owner@nope.test');

        // Plans are a platform definition; a workspace has no business editing
        // what it is allowed to buy.
        $this->actingAs($admin)->get('http://nope-co.localhost/module/plans')->assertNotFound();
    }
}
