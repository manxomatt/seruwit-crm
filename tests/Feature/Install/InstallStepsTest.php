<?php

namespace Tests\Feature\Install;

use App\Actions\Install\CentralMigrator;
use App\Actions\Install\CreateCentralAdminAction;
use App\Actions\Install\InstallationFinalizer;
use App\Models\PlatformSetting;
use App\Models\Role;
use App\Models\User;
use App\Support\Installer\InstallState;
use Database\Seeders\ModuleRegistrySeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class InstallStepsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        // The lock file lives outside the database transaction, so undo it here.
        InstallState::forget();

        parent::tearDown();
    }

    public function test_central_migrator_bootstraps_platform_and_central_module_tables(): void
    {
        // The base test schema does not auto-load registered-module migrations, so
        // the central-facing content tables are absent until the migrator adds them.
        $this->assertFalse(Schema::hasTable('pages'));

        (new CentralMigrator)->run();

        $this->assertNotNull(Role::query()->where('slug', 'admin')->first());
        $this->assertSame(0, User::query()->count(), 'The migrator bootstraps the platform but never an account.');

        // Central content-module tables are migrated regardless of deployment profile.
        $this->assertTrue(Schema::hasTable('pages'));
        $this->assertTrue(Schema::hasTable('posts'));
        $this->assertTrue(Schema::hasTable('carousels'));
    }

    public function test_admin_endpoint_creates_a_verified_admin_with_the_admin_role(): void
    {
        config(['app.installed' => false]);
        $this->seed(PermissionSeeder::class);
        $this->seed(ModuleRegistrySeeder::class);
        $this->seed(RoleSeeder::class);

        $this->post('/install/admin', [
            'name' => 'Platform Owner',
            'email' => 'owner@example.com',
            'password' => 'Str0ng-Passw0rd',
            'password_confirmation' => 'Str0ng-Passw0rd',
        ])->assertRedirect(route('install.index'));

        $admin = User::query()->where('email', 'owner@example.com')->first();

        $this->assertNotNull($admin);
        $this->assertTrue($admin->isAdmin());
        $this->assertNotNull($admin->email_verified_at);
        $this->assertTrue(Hash::check('Str0ng-Passw0rd', $admin->password));
    }

    public function test_create_central_admin_requires_the_admin_role_to_exist(): void
    {
        $this->expectException(RuntimeException::class);

        (new CreateCentralAdminAction)->execute([
            'name' => 'Orphan',
            'email' => 'orphan@example.com',
            'password' => 'Str0ng-Passw0rd',
        ]);
    }

    public function test_finalizer_writes_the_lock_and_audit_stamp(): void
    {
        config(['app.installed' => null]);
        InstallState::forget();

        (new InstallationFinalizer)->finalize(optimize: false);

        $this->assertTrue(File::exists(InstallState::lockPath()));
        $this->assertTrue(InstallState::isInstalled());
        $this->assertNotNull(PlatformSetting::getValue(InstallState::INSTALLED_AT_KEY));
    }
}
