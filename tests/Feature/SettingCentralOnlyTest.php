<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Adding/editing settings is a platform capability: only reachable on the
 * central domain (see routes/web.php). A tenant may still browse its own
 * settings but has no route left to write one, regardless of role.
 */
class SettingCentralOnlyTest extends TestCase
{
    use WithTenant;

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

    public function test_a_tenant_admin_gets_404_from_every_settings_write_route(): void
    {
        $tenant = $this->provisionTenant('Locked Co', 'locked-co', 'owner@locked.test');
        $owner = $this->ownerOf($tenant, 'owner@locked.test');
        tenancy()->end();

        // GET /settings and GET /settings/{group} still exist on the tenant
        // domain (view-only), so a wrong-method request against those same
        // URI shapes is a 405 rather than a 404 — the write action itself is
        // refused either way, there is simply no route left to perform it.
        $this->actingAs($owner)->post('http://locked-co.localhost/module/settings', [])->assertStatus(405);
        $this->actingAs($owner)->post('http://locked-co.localhost/module/settings/bulk-update', [])->assertStatus(405);
        $this->actingAs($owner)->patch('http://locked-co.localhost/module/settings/1', [])->assertStatus(405);
        $this->actingAs($owner)->delete('http://locked-co.localhost/module/settings/1')->assertStatus(405);

        // The create-form route itself is gone from the tenant domain — the only
        // GET route left matching this path shape is the group page, which
        // treats "create" as a literal (empty) group rather than a form.
        $this->actingAs($owner)->get('http://locked-co.localhost/module/settings/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Settings/Group')->where('currentGroup', 'create'));
    }

    public function test_a_tenant_can_still_view_settings_without_manage_abilities(): void
    {
        $tenant = $this->provisionTenant('View Co', 'view-co', 'owner@view.test');
        $owner = $this->ownerOf($tenant, 'owner@view.test');

        $tenant->run(function () {
            Setting::factory()->group('general')->create();
        });
        tenancy()->end();

        $this->actingAs($owner)->get('http://view-co.localhost/module/settings/general')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Settings/Group')
                ->where('canManage', false)
            );
    }

    public function test_a_central_admin_can_manage_settings(): void
    {
        $admin = $this->makeCentralAdmin();
        $centralUrl = config('app.url').'/module/settings';

        Setting::factory()->group('general')->create();

        $this->actingAs($admin)->get($centralUrl.'/general')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('canManage', true));

        $this->actingAs($admin)->get($centralUrl.'/create')->assertOk();
    }
}
