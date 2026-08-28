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

    /**
     * The install lock lives at storage_path('framework/installed'), which is NOT
     * environment-isolated, so a developer's real lock is the same file this suite
     * writes and forgets. Snapshot it up front and restore it verbatim afterwards
     * so running these tests never un-installs the local app.
     */
    private ?string $lockSnapshot = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->lockSnapshot = File::exists(InstallState::lockPath())
            ? File::get(InstallState::lockPath())
            : null;
    }

    protected function tearDown(): void
    {
        // The lock file lives outside the database transaction, so restore whatever
        // state the developer's environment had before this test touched it.
        if ($this->lockSnapshot === null) {
            InstallState::forget();
        } else {
            File::ensureDirectoryExists(dirname(InstallState::lockPath()));
            File::put(InstallState::lockPath(), $this->lockSnapshot);
        }

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

    public function test_finalizer_never_writes_a_config_cache_outside_production(): void
    {
        config(['app.installed' => null]);
        InstallState::forget();
        $configCache = $this->app->getCachedConfigPath();
        File::delete($configCache);

        // optimize defaults to true, but the test environment is not production, so
        // the finalizer must still refuse to bake a config cache (the dev footgun
        // behind the post-install MissingAppKeyException).
        (new InstallationFinalizer)->finalize();

        $this->assertFalse(File::exists($configCache));
    }

    public function test_finalize_endpoint_drives_a_full_page_visit_home_for_inertia_clients(): void
    {
        config(['app.installed' => false]);
        InstallState::forget();

        // Swap the finalizer so hitting the endpoint never writes a real config
        // cache or install lock the suite would otherwise have to undo.
        $this->mock(InstallationFinalizer::class)
            ->shouldReceive('finalize')
            ->once();

        $response = $this->withHeader('X-Inertia', 'true')
            ->post('/install/finalize');

        // The wizard posts via Inertia and the homepage is a Blade response, so a
        // plain redirect would be swallowed and rendered inside Inertia's iframe.
        // The 409 + location header forces a real browser navigation home instead.
        $response->assertStatus(409);
        $response->assertHeader('X-Inertia-Location', '/');
    }
}
