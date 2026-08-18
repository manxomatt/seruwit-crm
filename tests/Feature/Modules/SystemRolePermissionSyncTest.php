<?php

namespace Tests\Feature\Modules;

use App\Models\Permission;
use App\Models\Role;
use App\Modules\ModuleInstaller;
use Modules\Carousels\CarouselsModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class SystemRolePermissionSyncTest extends TestCase
{
    use WithTenant;

    public function test_installing_a_module_grants_admin_its_permissions(): void
    {
        $id = \Illuminate\Support\Str::random(6);
        $tenant = $this->provisionTenant('Admin Sync Co', 'admin-sync-'.$id, "owner-{$id}@admin-sync.test");

        $tenant->run(function (): void {
            $admin = Role::query()->where('slug', 'admin')->firstOrFail();
            $this->assertFalse(
                $admin->permissions()->where('module', 'carousels')->exists()
            );
        });

        app(ModuleInstaller::class)->install($tenant, app(CarouselsModule::class));

        $tenant->run(function (): void {
            $admin = Role::query()->where('slug', 'admin')->firstOrFail();
            $user = Role::query()->where('slug', 'user')->first();
            if ($user === null) {
                $user = Role::query()->create(\App\Support\SystemRolePermissions::getSystemRoleDefinition('user'));
                \App\Support\SystemRolePermissions::syncAllSystemRoles();
            }

            $carouselPermissionIds = Permission::query()
                ->where('module', 'carousels')
                ->pluck('id');

            $this->assertSame(4, $carouselPermissionIds->count());

            foreach ($carouselPermissionIds as $permissionId) {
                $this->assertTrue(
                    $admin->permissions()->whereKey($permissionId)->exists(),
                    "Admin should receive carousel permission [{$permissionId}]."
                );
            }

            $this->assertTrue(
                $user->permissions()
                    ->where('module', 'carousels')
                    ->where('action', 'view')
                    ->exists()
            );
            $this->assertFalse(
                $user->permissions()
                    ->where('module', 'carousels')
                    ->where('action', 'create')
                    ->exists()
            );

            $this->assertSame(
                Permission::query()->count(),
                $admin->permissions()->count()
            );
        });
    }

    public function test_backfill_command_assigns_missing_module_permissions_to_admin(): void
    {
        $id = \Illuminate\Support\Str::random(6);
        $tenant = $this->provisionTenant('Backfill Sync Co', 'backfill-sync-'.$id, "owner-{$id}@backfill-sync.test");

        app(ModuleInstaller::class)->install($tenant, app(CarouselsModule::class));

        $tenant->run(function (): void {
            $admin = Role::query()->where('slug', 'admin')->firstOrFail();
            $admin->permissions()->detach(
                Permission::query()->where('module', 'carousels')->pluck('id')
            );

            $this->assertFalse(
                $admin->fresh()->permissions()->where('module', 'carousels')->exists()
            );
        });

        $this->artisan('tenants:sync-system-role-permissions', ['--tenant' => $tenant->id])
            ->assertSuccessful();

        $tenant->run(function (): void {
            $admin = Role::query()->where('slug', 'admin')->firstOrFail();

            $this->assertSame(4, $admin->permissions()->where('module', 'carousels')->count());
            $this->assertSame(
                Permission::query()->count(),
                $admin->permissions()->count()
            );
        });
    }
}
