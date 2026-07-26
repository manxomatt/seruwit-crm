<?php

namespace Database\Seeders;

use App\Models\CentralUser;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\AccessibleWarehouses;

/**
 * Demo users for warehouse site scoping.
 *
 *   password for both: password
 *
 *   php artisan tenants:seed --class=TenantWarehouseUsersDemoSeeder --tenants={id}
 */
class TenantWarehouseUsersDemoSeeder extends Seeder
{
    public const HEAD_EMAIL = 'warehouse.head@demo.test';

    public const MANAGER_EMAIL = 'warehouse.manager@demo.test';

    public const PASSWORD = 'password';

    public function run(): void
    {
        if (! class_exists(Warehouse::class) || ! Schema::hasTable('warehouses') || ! Schema::hasTable('user_warehouse')) {
            $this->command?->warn('Inventory warehouses / user_warehouse missing. Install inventory module first.');

            return;
        }

        $this->call(RoleSeeder::class);

        $sites = Warehouse::query()->orderBy('id')->get();

        if ($sites->isEmpty()) {
            $sites = collect([
                Warehouse::query()->create([
                    'name' => 'Demo Site Pusat',
                    'location' => 'Bandar Lampung',
                    'status' => 'active',
                ]),
                Warehouse::query()->create([
                    'name' => 'Demo Site Cabang',
                    'location' => 'Metro',
                    'status' => 'active',
                ]),
            ]);
            $this->command?->info('Created 2 demo sites (no warehouses existed yet).');
        }

        if ($sites->count() < 2) {
            $sites->push(Warehouse::query()->create([
                'name' => 'Demo Site Cadangan',
                'location' => 'Lampung',
                'status' => 'active',
            ]));
        }

        $headSite = $sites->first();
        $managerSites = $sites->take(2);

        $head = $this->upsertScopedUser(
            email: self::HEAD_EMAIL,
            name: 'Demo Warehouse Head',
            username: 'wh_head',
            roleSlug: AccessibleWarehouses::ROLE_HEAD,
            warehouseIds: [(int) $headSite->id],
        );

        $manager = $this->upsertScopedUser(
            email: self::MANAGER_EMAIL,
            name: 'Demo Warehouse Manager',
            username: 'wh_manager',
            roleSlug: AccessibleWarehouses::ROLE_MANAGER,
            warehouseIds: $managerSites->pluck('id')->map(fn ($id): int => (int) $id)->all(),
        );

        $this->command?->info(sprintf(
            'Warehouse Head: %s / %s → %s',
            $head->email,
            self::PASSWORD,
            $headSite->name,
        ));
        $this->command?->info(sprintf(
            'Warehouse Manager: %s / %s → %s',
            $manager->email,
            self::PASSWORD,
            $managerSites->pluck('name')->implode(', '),
        ));
    }

    /**
     * @param  list<int>  $warehouseIds
     */
    protected function upsertScopedUser(
        string $email,
        string $name,
        string $username,
        string $roleSlug,
        array $warehouseIds,
    ): User {
        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();
        $locale = config('app.locale', 'id');

        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            // Avoid Stancl copying tenant users.id into central (PK collisions).
            $user = User::withoutEvents(function () use ($email, $name, $username, $locale): User {
                return User::query()->create([
                    'global_id' => (string) Str::uuid(),
                    'name' => $name,
                    'username' => $username,
                    'email' => $email,
                    'password' => self::PASSWORD,
                    'locale' => $locale,
                ]);
            });

            $this->ensureCentralMembership($user, $name, $username, $locale);
        } else {
            User::withoutEvents(function () use ($user, $name, $username, $locale): void {
                $user->update([
                    'name' => $name,
                    'username' => $username,
                    'password' => self::PASSWORD,
                    'locale' => $user->locale ?: $locale,
                ]);
            });

            $this->ensureCentralMembership($user->fresh(), $name, $username, $locale);
        }

        $user->syncRoles([$role->id]);
        $user->warehouses()->sync($warehouseIds);

        return $user->fresh(['roles', 'warehouses']);
    }

    protected function ensureCentralMembership(User $user, string $name, string $username, string $locale): void
    {
        $tenant = tenant();

        $central = CentralUser::query()->firstOrCreate(
            ['email' => $user->email],
            [
                'global_id' => $user->global_id,
                'name' => $name,
                'username' => $username,
                'password' => self::PASSWORD,
                'locale' => $locale,
            ],
        );

        // Keep identity attributes aligned without re-hashing unnecessarily.
        if ($central->global_id !== $user->global_id) {
            // Prefer existing central identity; rematerialize tenant copy under that gid.
            User::withoutEvents(function () use ($user, $central): void {
                $user->forceFill(['global_id' => $central->global_id])->save();
            });
        }

        CentralUser::withoutEvents(function () use ($central, $name, $username, $locale): void {
            $central->fill([
                'name' => $name,
                'username' => $username,
                'password' => self::PASSWORD,
                'locale' => $central->locale ?: $locale,
            ])->save();
        });

        if ($tenant === null) {
            return;
        }

        $alreadyLinked = DB::connection(config('tenancy.database.central_connection'))
            ->table('tenant_users')
            ->where('tenant_id', $tenant->getTenantKey())
            ->where('global_user_id', $central->global_id)
            ->exists();

        if (! $alreadyLinked) {
            DB::connection(config('tenancy.database.central_connection'))
                ->table('tenant_users')
                ->insert([
                    'tenant_id' => $tenant->getTenantKey(),
                    'global_user_id' => $central->global_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
        }
    }
}
