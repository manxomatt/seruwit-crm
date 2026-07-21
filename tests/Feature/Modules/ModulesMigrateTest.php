<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Models\Tenant;
use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\TransportationManagement\TransportationManagementModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Guards the recovery path for tenants stranded on a stale module schema when a
 * migration was added to a module they had already installed.
 */
class ModulesMigrateTest extends TestCase
{
    use WithTenant;

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function transportation(): TransportationManagementModule
    {
        return app(TransportationManagementModule::class);
    }

    /**
     * Installs Transportation, then drops the trip_stops table and forgets its
     * migration records — reproducing a tenant that installed the module before
     * that migration was added.
     */
    private function strandedTenant(string $name, string $subdomain, string $email): Tenant
    {
        $tenant = $this->provisionTenant($name, $subdomain, $email);
        $tenant->plan = 'pro';
        $tenant->save();

        $this->installer()->install($tenant, $this->transportation());

        $tenant->run(function () {
            Schema::dropIfExists('trip_stops');
            DB::table('migrations')->where('migration', 'like', '%trip_stops%')->delete();
        });

        tenancy()->end();

        return $tenant;
    }

    public function test_it_applies_a_module_migration_added_after_the_tenant_installed_it(): void
    {
        $tenant = $this->strandedTenant('Stale Co', 'stale-co', 'owner@stale.test');

        $tenant->run(fn () => $this->assertFalse(Schema::hasTable('trip_stops')));

        $this->artisan('modules:migrate', ['--tenant' => $tenant->id])->assertSuccessful();

        $tenant->run(fn () => $this->assertTrue(Schema::hasTable('trip_stops')));
    }

    public function test_pretend_reports_without_running(): void
    {
        $tenant = $this->strandedTenant('Pretend Co', 'pretend-co', 'owner@pretend.test');

        $this->artisan('modules:migrate', ['--tenant' => $tenant->id, '--pretend' => true])
            ->assertSuccessful();

        $tenant->run(fn () => $this->assertFalse(Schema::hasTable('trip_stops')));
    }

    public function test_a_fully_migrated_tenant_is_untouched(): void
    {
        $tenant = $this->provisionTenant('Fresh Co', 'fresh-co', 'owner@fresh.test');
        $tenant->plan = 'pro';
        $tenant->save();
        $this->installer()->install($tenant, $this->transportation());
        tenancy()->end();

        // A fresh install already has every migration, so nothing runs.
        $this->artisan('modules:migrate', ['--tenant' => $tenant->id])
            ->assertSuccessful()
            ->expectsOutputToContain('Ran 0 pending module migration(s)');
    }

    public function test_an_uninstalled_module_is_not_re_migrated(): void
    {
        $tenant = $this->strandedTenant('Removed Co', 'removed-co', 'owner@removed.test');

        // Mark transportation uninstalled: its retired schema must not be
        // resurrected by a blanket migrate.
        $tenant->run(fn () => InstalledModule::query()
            ->where('key', 'transportation')
            ->update(['uninstalled_at' => now()]));

        $this->artisan('modules:migrate', ['--tenant' => $tenant->id])->assertSuccessful();

        $tenant->run(fn () => $this->assertFalse(Schema::hasTable('trip_stops')));
    }
}
