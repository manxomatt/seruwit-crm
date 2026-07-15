<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Models\Menu;
use App\Models\Permission;
use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Carousels\CarouselsModule;
use Modules\Carousels\Models\Carousel;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class ModuleInstallTest extends TestCase
{
    use WithTenant;

    private function module(): CarouselsModule
    {
        return app(CarouselsModule::class);
    }

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    public function test_a_new_tenant_does_not_get_optional_module_tables(): void
    {
        $tenant = $this->provisionTenant('Lean Co', 'lean-co', 'owner@lean.test');

        $tenant->run(function (): void {
            $this->assertFalse(Schema::hasTable('carousels'));
            $this->assertFalse(Schema::hasTable('carousel_images'));
            $this->assertSame(0, InstalledModule::query()->count());

            // Core still arrives untouched.
            $this->assertTrue(Schema::hasTable('pages'));
            $this->assertFalse(Permission::query()->where('module', 'carousels')->exists());
            $this->assertFalse(Menu::query()->where('slug', 'carousels')->exists());
        });
    }

    public function test_installing_creates_the_tables_permissions_and_menu(): void
    {
        $tenant = $this->provisionTenant('Slider Co', 'slider-co', 'owner@slider.test');

        $this->installer()->install($tenant, $this->module());

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('carousels'));
            $this->assertTrue(Schema::hasTable('carousel_images'));

            $this->assertSame(4, Permission::query()->where('module', 'carousels')->count());
            $this->assertSame(
                'View Carousels',
                Permission::query()->where('slug', 'carousels.view')->value('name'),
            );

            $menu = Menu::query()->where('slug', 'carousels')->first();
            $this->assertNotNull($menu);
            $this->assertTrue($menu->is_active);

            $this->assertTrue(InstalledModule::query()->where('key', 'carousels')->installed()->exists());
        });
    }

    public function test_installing_twice_is_a_no_op(): void
    {
        $tenant = $this->provisionTenant('Twice Co', 'twice-co', 'owner@twice.test');

        $this->installer()->install($tenant, $this->module());
        $this->installer()->install($tenant, $this->module());

        $tenant->run(function (): void {
            $this->assertSame(1, InstalledModule::query()->where('key', 'carousels')->count());
            $this->assertSame(4, Permission::query()->where('module', 'carousels')->count());
            $this->assertSame(1, Menu::query()->where('slug', 'carousels')->count());
        });
    }

    public function test_uninstalling_hides_the_module_but_keeps_the_data(): void
    {
        $tenant = $this->provisionTenant('Keep Co', 'keep-co', 'owner@keep.test');
        $this->installer()->install($tenant, $this->module());

        $tenant->run(function (): void {
            Carousel::factory()->create(['slug' => 'precious', 'name' => 'Precious Slider']);
        });

        $this->installer()->uninstall($tenant, $this->module());

        $tenant->run(function (): void {
            $this->assertFalse(Menu::query()->where('slug', 'carousels')->value('is_active'));

            $record = InstalledModule::query()->where('key', 'carousels')->first();
            $this->assertNotNull($record->uninstalled_at);
            $this->assertFalse($record->isInstalled());

            // The whole point of a soft uninstall: nothing is destroyed.
            $this->assertTrue(Schema::hasTable('carousels'));
            $this->assertSame(1, Carousel::query()->where('slug', 'precious')->count());
        });
    }

    public function test_reinstalling_restores_the_data_and_the_menu(): void
    {
        $tenant = $this->provisionTenant('Back Co', 'back-co', 'owner@back.test');
        $this->installer()->install($tenant, $this->module());

        $tenant->run(fn () => Carousel::factory()->create(['slug' => 'restored', 'name' => 'Restored']));

        $this->installer()->uninstall($tenant, $this->module());
        $this->installer()->install($tenant, $this->module());

        $tenant->run(function (): void {
            $this->assertTrue(InstalledModule::query()->where('key', 'carousels')->installed()->exists());
            $this->assertTrue(Menu::query()->where('slug', 'carousels')->value('is_active'));
            $this->assertSame('Restored', Carousel::query()->where('slug', 'restored')->value('name'));
        });
    }

    public function test_install_state_is_isolated_between_tenants(): void
    {
        $withModule = $this->provisionTenant('Has Co', 'has-co', 'owner@has.test');
        $withoutModule = $this->provisionTenant('Hasnt Co', 'hasnt-co', 'owner@hasnt.test');

        $this->installer()->install($withModule, $this->module());

        $this->assertTrue($this->installer()->isInstalled($withModule, $this->module()));
        $this->assertFalse($this->installer()->isInstalled($withoutModule, $this->module()));

        $withoutModule->run(function (): void {
            $this->assertFalse(Schema::hasTable('carousels'));
        });
    }

    public function test_backfill_marks_a_module_installed_when_its_tables_already_exist(): void
    {
        $tenant = $this->provisionTenant('Legacy Co', 'legacy-co', 'owner@legacy.test');

        // Stand in for a tenant provisioned before the module system: the tables are
        // there from the old core migrations, but nothing recorded the install.
        $this->installer()->install($tenant, $this->module());
        $tenant->run(fn () => InstalledModule::query()->where('key', 'carousels')->delete());

        $this->artisan('modules:backfill', ['--tenant' => $tenant->id])->assertSuccessful();

        $this->assertTrue($this->installer()->isInstalled($tenant, $this->module()));
    }

    public function test_backfill_leaves_a_deliberate_uninstall_alone(): void
    {
        $tenant = $this->provisionTenant('Chose Co', 'chose-co', 'owner@chose.test');
        $this->installer()->install($tenant, $this->module());
        $this->installer()->uninstall($tenant, $this->module());

        $this->artisan('modules:backfill', ['--tenant' => $tenant->id])->assertSuccessful();

        $this->assertFalse($this->installer()->isInstalled($tenant, $this->module()));
    }

    public function test_backfill_does_not_invent_state_for_a_tenant_without_the_tables(): void
    {
        $tenant = $this->provisionTenant('Fresh Co', 'fresh-co', 'owner@fresh.test');

        $this->artisan('modules:backfill', ['--tenant' => $tenant->id])->assertSuccessful();

        $this->assertFalse($this->installer()->isInstalled($tenant, $this->module()));
        $tenant->run(fn () => $this->assertSame(0, InstalledModule::query()->count()));
    }

    public function test_install_command_reports_an_unknown_module(): void
    {
        $tenant = $this->provisionTenant('Cmd Co', 'cmd-co', 'owner@cmd.test');

        $this->artisan('modules:install', ['tenant' => $tenant->id, 'module' => 'inventory'])
            ->expectsOutputToContain('Module [inventory] is not registered.')
            ->assertFailed();
    }

    public function test_list_command_shows_every_module_state(): void
    {
        $tenant = $this->provisionTenant('List Co', 'list-co', 'owner@list.test');

        $this->artisan('modules:list', ['tenant' => $tenant->id])
            ->expectsOutputToContain('available')
            ->assertSuccessful();

        $this->installer()->install($tenant, $this->module());

        $this->artisan('modules:list', ['tenant' => $tenant->id])
            ->expectsOutputToContain('installed')
            ->assertSuccessful();

        // The uninstalled row renders uninstalled_at, whose date cast reaches for
        // the tenant connection's query grammar — it must be built in tenant
        // context, not after tenancy has ended.
        $this->installer()->uninstall($tenant, $this->module());

        $this->artisan('modules:list', ['tenant' => $tenant->id])
            ->expectsOutputToContain('purges '.now()->addDays(30)->toDateString())
            ->assertSuccessful();
    }

    public function test_list_command_reports_a_module_locked_by_the_plan(): void
    {
        $tenant = $this->provisionTenant('Locked Co', 'locked-co', 'owner@locked.test');
        $this->installer()->install($tenant, $this->module());
        $tenant->update(['plan' => 'free']);

        // Installed but out of plan: the CLI must say the same thing the catalog
        // UI does, rather than reporting a bare "installed".
        $this->artisan('modules:list', ['tenant' => $tenant->id])
            ->expectsOutputToContain('locked by plan (installed, data kept)')
            ->assertSuccessful();
    }

    public function test_list_command_reports_an_unknown_tenant(): void
    {
        $this->artisan('modules:list', ['tenant' => 'nope'])
            ->expectsOutputToContain('Tenant [nope] not found.')
            ->assertFailed();
    }
}
