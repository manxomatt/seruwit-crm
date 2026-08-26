<?php

namespace Tests\Feature\Install;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\CentralLandingPagesSeeder;
use Database\Seeders\DevAccountsSeeder;
use Database\Seeders\PlatformInstallSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Modules\Pages\Models\Page;
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
        // What the installer runs: control-plane data (roles, permissions, plans)
        // and nothing operator-specific — no accounts, no owned content.
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

    public function test_landing_pages_seed_only_after_a_user_exists(): void
    {
        // Central bootstrap is user-independent and never touches owned content.
        $this->seed(PlatformInstallSeeder::class);

        // The pages table is a module migration the base test schema does not load,
        // so create it here to exercise the owner guard the way a real central
        // deployment (where the table exists) would hit it.
        Artisan::call('migrate', [
            '--path' => 'modules/Pages/Database/Migrations/2026_02_20_141503_create_pages_table.php',
            '--force' => true,
        ]);

        // No user yet → the landing seeder is a no-op instead of an FK violation.
        $this->seed(CentralLandingPagesSeeder::class);
        $this->assertSame(0, Page::query()->count());

        // Once a user exists, it creates the central homepage owned by that user.
        $owner = User::factory()->create();
        $this->seed(CentralLandingPagesSeeder::class);

        $homepage = Page::query()->where('is_homepage', true)->first();
        $this->assertNotNull($homepage);
        $this->assertSame($owner->id, $homepage->user_id);
    }
}
