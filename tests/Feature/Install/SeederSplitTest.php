<?php

namespace Tests\Feature\Install;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DevAccountsSeeder;
use Database\Seeders\PlatformInstallSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The installer runs PlatformInstallSeeder alone, so that seeder must bootstrap the
 * control plane without planting any account. The hard-coded dev/test accounts live
 * in DevAccountsSeeder, which only local/test seeding (DatabaseSeeder) ever runs.
 */
class SeederSplitTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_bootstrap_plants_no_accounts_while_dev_seeder_does(): void
    {
        // What the installer runs: control-plane data (roles, permissions, plans,
        // pages) and nothing operator-specific.
        $this->seed(PlatformInstallSeeder::class);

        $this->assertSame(0, User::query()->count(), 'Installer bootstrap must not create any accounts.');
        $this->assertNotNull(Role::query()->where('slug', 'admin')->first(), 'Roles should be bootstrapped.');
        $this->assertTrue(Permission::query()->exists(), 'Permissions should be bootstrapped.');

        // The dev/test convenience accounts are a separate seeder the installer skips.
        $this->seed(DevAccountsSeeder::class);

        $admin = User::query()->where('email', 'admin@domain.com')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->hasRole('admin'));

        $regular = User::query()->where('email', 'test@domain.com')->first();
        $this->assertNotNull($regular);
        $this->assertTrue($regular->hasRole('user'));
    }
}
