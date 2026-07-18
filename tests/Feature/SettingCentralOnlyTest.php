<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Defining, renaming, or deleting a setting is a platform capability: only
 * reachable on the central domain (see routes/web.php). A tenant may still
 * view and edit the *values* of its own settings — e.g. its own social media
 * links — via the ordinary settings:update permission, which still exists on
 * every domain.
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

    /**
     * A tenant user with only the read-only "user" role — settings:view but
     * not settings:update, unlike the tenant's owner (assigned "admin" on
     * provisioning).
     */
    private function readOnlyUserOf(Tenant $tenant, string $email): User
    {
        return $tenant->run(function () use ($email): User {
            $user = User::factory()->create(['email' => $email]);
            $user->assignRole(Role::query()->where('slug', 'user')->firstOrFail());

            return $user;
        });
    }

    public function test_a_tenant_admin_can_edit_the_value_of_its_own_setting(): void
    {
        $tenant = $this->provisionTenant('Editable Co', 'editable-co', 'owner@editable.test');
        $owner = $this->ownerOf($tenant, 'owner@editable.test');

        $settingId = $tenant->run(fn () => Setting::factory()->group('social')->create(['key' => 'social.twitter_test', 'value' => 'old-handle'])->id);
        tenancy()->end();

        $this->actingAs($owner)->post('http://editable-co.localhost/module/settings/bulk-update', [
            'group' => 'social',
            'settings' => [['id' => $settingId, 'value' => 'new-handle']],
        ])->assertRedirect();

        $tenant->run(function () use ($settingId) {
            $this->assertDatabaseHas('settings', ['id' => $settingId, 'value' => 'new-handle']);
        });
    }

    public function test_a_tenant_admin_gets_a_write_error_from_every_settings_structure_route(): void
    {
        $tenant = $this->provisionTenant('Locked Co', 'locked-co', 'owner@locked.test');
        $owner = $this->ownerOf($tenant, 'owner@locked.test');
        tenancy()->end();

        // GET /settings and GET /settings/{group} still exist on the tenant
        // domain (view/edit-value only), so a wrong-method request against
        // those same URI shapes is a 405 rather than a 404 — the structural
        // write action itself is refused either way, there is simply no
        // route left to perform it.
        $this->actingAs($owner)->post('http://locked-co.localhost/module/settings', [])->assertStatus(405);
        $this->actingAs($owner)->patch('http://locked-co.localhost/module/settings/1', [])->assertStatus(405);
        $this->actingAs($owner)->delete('http://locked-co.localhost/module/settings/1')->assertStatus(405);

        // The create-form route itself is gone from the tenant domain — the only
        // GET route left matching this path shape is the group page, which
        // treats "create" as a literal (empty) group rather than a form.
        $this->actingAs($owner)->get('http://locked-co.localhost/module/settings/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Settings/Group')->where('currentGroup', 'create'));
    }

    public function test_a_read_only_tenant_user_can_view_but_not_edit_or_manage(): void
    {
        $tenant = $this->provisionTenant('View Co', 'view-co', 'owner@view.test');
        $viewer = $this->readOnlyUserOf($tenant, 'viewer@view.test');

        $tenant->run(function () {
            Setting::factory()->group('general')->create();
        });
        tenancy()->end();

        $this->actingAs($viewer)->get('http://view-co.localhost/module/settings/general')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Settings/Group')
                ->where('canEditValues', false)
                ->where('canManageStructure', false)
            );
    }

    public function test_a_central_admin_can_manage_settings_structure_and_values(): void
    {
        $admin = $this->makeCentralAdmin();
        $centralUrl = config('app.url').'/module/settings';

        Setting::factory()->group('general')->create();

        $this->actingAs($admin)->get($centralUrl.'/general')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('canEditValues', true)
                ->where('canManageStructure', true)
            );

        $this->actingAs($admin)->get($centralUrl.'/create')->assertOk();
    }

    public function test_creating_a_setting_centrally_propagates_it_to_every_tenant(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenantA = $this->provisionTenant('Tenant A', 'tenant-a', 'owner@tenanta.test');
        $tenantB = $this->provisionTenant('Tenant B', 'tenant-b', 'owner@tenantb.test');
        tenancy()->end();

        $this->actingAs($admin)->post(config('app.url').'/module/settings', [
            'key' => 'social.mastodon',
            'group' => 'social',
            'value' => 'https://mastodon.example/@platform',
            'type' => 'url',
            'label' => 'Mastodon URL',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('settings', ['key' => 'social.mastodon', 'value' => 'https://mastodon.example/@platform']);

        foreach ([$tenantA, $tenantB] as $tenant) {
            $tenant->run(function () {
                $this->assertDatabaseHas('settings', ['key' => 'social.mastodon', 'value' => 'https://mastodon.example/@platform']);
            });
        }
    }

    /**
     * Idempotent by design (App\Console\Commands\ModulesBackfill uses the same
     * firstOrCreate pattern for this reason): a tenant that has already
     * customized a key with this name keeps its own value untouched.
     */
    public function test_propagation_does_not_overwrite_a_tenant_that_already_has_that_key(): void
    {
        $admin = $this->makeCentralAdmin();
        $tenant = $this->provisionTenant('Custom Co', 'custom-co', 'owner@custom.test');

        $tenant->run(function () {
            Setting::factory()->group('social')->create(['key' => 'social.mastodon', 'value' => 'already-customized']);
        });
        tenancy()->end();

        $this->actingAs($admin)->post(config('app.url').'/module/settings', [
            'key' => 'social.mastodon',
            'group' => 'social',
            'value' => 'platform-default',
            'type' => 'url',
            'label' => 'Mastodon URL',
        ])->assertSessionHasNoErrors();

        $tenant->run(function () {
            $this->assertDatabaseHas('settings', ['key' => 'social.mastodon', 'value' => 'already-customized']);
        });
    }
}
