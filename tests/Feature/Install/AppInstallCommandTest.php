<?php

namespace Tests\Feature\Install;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Support\Installer\EnvironmentWriter;
use App\Support\Installer\InstallState;
use App\Support\SystemMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppInstallCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        InstallState::forget();

        parent::tearDown();
    }

    public function test_it_refuses_to_run_when_already_installed(): void
    {
        config(['app.installed' => true]);

        $this->artisan('app:install', ['--skip-database' => true])->assertExitCode(1);
    }

    public function test_it_installs_the_platform_creates_the_admin_and_seals_the_installer(): void
    {
        config(['app.installed' => null]);
        InstallState::forget();

        // Redirect .env writes to a throwaway file so the real project .env is untouched.
        $envPath = tempnam(sys_get_temp_dir(), 'install-env');
        $this->app->instance(EnvironmentWriter::class, new EnvironmentWriter($envPath));

        $this->artisan('app:install', [
            '--skip-database' => true,
            '--app-name' => 'Acme Platform',
            '--app-url' => 'https://acme.test',
            '--tenant-base-domain' => 'acme.test',
            '--profile' => 'production',
            '--admin-name' => 'Platform Owner',
            '--admin-email' => 'owner@example.com',
            '--admin-password' => 'Str0ng-Passw0rd',
            '--force' => true,
        ])->assertExitCode(0);

        $this->assertTrue(InstallState::isInstalled());

        $admin = User::query()->where('email', 'owner@example.com')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->isAdmin());

        $this->assertSame(SystemMode::PRODUCTION, PlatformSetting::getValue(SystemMode::KEY));

        $env = file_get_contents($envPath);
        @unlink($envPath);

        $this->assertStringContainsString('APP_NAME="Acme Platform"', $env);
        $this->assertStringContainsString('APP_URL=https://acme.test', $env);
        $this->assertStringContainsString('CENTRAL_SERVES_APP=false', $env);
    }
}
