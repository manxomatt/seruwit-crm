<?php

namespace Tests\Feature\Install;

use App\Support\Installer\InstallState;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The first-run gate is DB-free by design (InstallState reads a lock file), so
 * these tests never touch the database and drive installed-state through the
 * config('app.installed') override rather than the real lock file.
 */
class InstallationGateTest extends TestCase
{
    private function probeRoute(): void
    {
        Route::middleware('web')->get('/__gate_probe', fn (): string => 'ok');
    }

    public function test_installer_landing_is_reachable_when_not_installed(): void
    {
        config(['app.installed' => false]);

        $this->get('/install')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Install/Wizard'));
    }

    public function test_normal_route_redirects_to_installer_when_not_installed(): void
    {
        config(['app.installed' => false]);
        $this->probeRoute();

        $this->get('/__gate_probe')->assertRedirect(route('install.index'));
    }

    public function test_installer_is_sealed_off_once_installed(): void
    {
        config(['app.installed' => true]);

        $this->get('/install')->assertRedirect('/');
    }

    public function test_normal_route_passes_through_once_installed(): void
    {
        config(['app.installed' => true]);
        $this->probeRoute();

        $this->get('/__gate_probe')->assertOk()->assertSee('ok');
    }

    public function test_lock_file_drives_installed_state_without_override(): void
    {
        config(['app.installed' => null]);
        InstallState::forget();

        $this->assertFalse(InstallState::isInstalled());

        File::put(InstallState::lockPath(), 'installed');
        $this->assertTrue(InstallState::isInstalled());

        InstallState::forget();
        $this->assertFalse(InstallState::isInstalled());
    }
}
