<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $menus = [
            [
                'name' => 'Dashboard',
                'slug' => 'dashboard',
                'icon' => 'dashboard',
                'route_name' => 'dashboard',
                'permission_module' => null, // Visible to all authenticated users
                'sort_order' => 1,
            ],
            // sort_order 2-4 belong to Pages, Posts and Carousels — optional
            // modules that seed their own menu on install (see
            // App\Modules\ModuleContract::menu).
            [
                'name' => 'Media',
                'slug' => 'media',
                'icon' => 'media',
                'route_name' => 'media.index',
                'permission_module' => 'media',
                'permission_action' => 'view',
                'sort_order' => 5,
            ],
            [
                'name' => 'Users',
                'slug' => 'users',
                'icon' => 'users',
                'route_name' => 'users.index',
                'permission_module' => 'users',
                'permission_action' => 'view',
                'sort_order' => 6,
            ],
            [
                'name' => 'Roles',
                'slug' => 'roles',
                'icon' => 'roles',
                'route_name' => 'roles.index',
                'permission_module' => 'roles',
                'permission_action' => 'view',
                'sort_order' => 7,
            ],
            [
                'name' => 'Analytics',
                'slug' => 'analytics',
                'icon' => 'analytics',
                'route_name' => 'analytics.index',
                'permission_module' => 'analytics',
                'permission_action' => 'view',
                'sort_order' => 8,
            ],
            [
                'name' => 'Settings',
                'slug' => 'settings',
                'icon' => 'settings',
                'route_name' => 'settings.index',
                'permission_module' => 'settings',
                'permission_action' => 'view',
                'sort_order' => 9,
            ],
        ];

        // The module catalog is deliberately absent: like "Kelola Tenant", it is
        // gated by an ability rather than a permission, so ModuleLayout injects it
        // client-side from auth.user.is_admin.

        foreach ($menus as $menuData) {
            Menu::updateOrCreate(
                ['slug' => $menuData['slug']],
                $menuData
            );
        }
    }
}
