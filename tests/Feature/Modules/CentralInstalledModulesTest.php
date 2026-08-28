<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Modules\ModuleRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards Modules::centralInstalled() — the central sidebar's source of truth for
 * which module menus to show. It must list the always-on central modules plus
 * whatever is actually installed on central, and must NOT balloon to the whole
 * installable catalogue (the bug where every module menu appeared on central
 * admin), regardless of the central_serves_app dev flag.
 */
class CentralInstalledModulesTest extends TestCase
{
    use RefreshDatabase;

    private function registry(): ModuleRegistry
    {
        // The registry is a singleton and memoizes central install state; flush
        // it so each call re-reads the installed_modules table after a mutation.
        $registry = app(ModuleRegistry::class);
        $registry->flushInstalledState();

        return $registry;
    }

    public function test_it_always_includes_the_central_modules(): void
    {
        $installed = $this->registry()->centralInstalled();

        foreach (config('modules.central_modules') as $key) {
            $this->assertContains($key, $installed);
        }
    }

    public function test_it_includes_installed_and_excludes_uninstalled_or_absent(): void
    {
        InstalledModule::create(['key' => 'fleet', 'installed_at' => now()]);
        InstalledModule::create([
            'key' => 'rental',
            'installed_at' => now()->subDay(),
            'uninstalled_at' => now(),
        ]);

        $installed = $this->registry()->centralInstalled();

        $this->assertContains('fleet', $installed);      // installed on central
        $this->assertNotContains('rental', $installed);  // row exists but uninstalled
        $this->assertNotContains('shuttle', $installed); // no row at all
    }

    public function test_it_does_not_return_the_whole_catalogue_when_central_serves_app(): void
    {
        // The regression: with the dev flag on, installedOnCentral() short-circuits
        // to true for every module. centralInstalled() must ignore that flag so the
        // sidebar still lists only what is genuinely installed.
        config(['app.central_serves_app' => true]);

        $installed = $this->registry()->centralInstalled();

        $this->assertNotContains('shuttle', $installed);
        $this->assertNotContains('maintenance', $installed);
    }
}
