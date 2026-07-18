<?php

namespace Tests\Feature\Modules;

use App\Models\InstalledModule;
use App\Models\Menu;
use App\Models\Permission;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Carousels\CarouselsModule;
use Modules\Carousels\Models\Carousel;
use Modules\Pages\Models\Page;
use Modules\Pages\PagesModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

class ModulePurgeTest extends TestCase
{
    use WithTenant;

    private function installer(): ModuleInstaller
    {
        return app(ModuleInstaller::class);
    }

    private function module(): CarouselsModule
    {
        return app(CarouselsModule::class);
    }

    /**
     * Make a carousel owned by the tenant's own owner.
     *
     * Deliberately not letting the factory mint a User: resource syncing pushes any
     * tenant user back into central, and two tenants both minting id 2 collide on
     * the central users primary key.
     */
    private function makeCarouselFor(\App\Models\Tenant $tenant, string $ownerEmail, string $slug): void
    {
        $tenant->run(function () use ($ownerEmail, $slug): void {
            Carousel::factory()->create([
                'user_id' => User::query()->firstWhere('email', $ownerEmail)->id,
                'slug' => $slug,
            ]);
        });
    }

    /**
     * Uninstall, then backdate the record to simulate the grace period lapsing.
     */
    private function uninstallDaysAgo(\App\Models\Tenant $tenant, int $days): void
    {
        $this->installer()->uninstall($tenant, $this->module());

        $tenant->run(fn () => InstalledModule::query()
            ->where('key', 'carousels')
            ->update(['uninstalled_at' => now()->subDays($days)]));
    }

    public function test_nothing_is_purged_inside_the_grace_period(): void
    {
        $tenant = $this->provisionTenant('Grace Co', 'grace-co', 'owner@grace.test');
        $this->installer()->install($tenant, $this->module());
        $this->makeCarouselFor($tenant, 'owner@grace.test', 'safe');

        $this->uninstallDaysAgo($tenant, 29);

        $this->artisan('modules:purge-expired')->assertSuccessful();

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('carousels'));
            $this->assertSame(1, Carousel::query()->where('slug', 'safe')->count());
        });
    }

    public function test_an_installed_module_is_never_purged(): void
    {
        $tenant = $this->provisionTenant('Active Co', 'active-co', 'owner@active.test');
        $this->installer()->install($tenant, $this->module());

        $this->artisan('modules:purge-expired')->assertSuccessful();

        $tenant->run(fn () => $this->assertTrue(Schema::hasTable('carousels')));
        $this->assertTrue($this->installer()->isInstalled($tenant, $this->module()));
    }

    public function test_the_module_is_purged_once_the_grace_period_lapses(): void
    {
        $tenant = $this->provisionTenant('Gone Co', 'gone-co', 'owner@gone.test');
        $this->installer()->install($tenant, $this->module());
        $this->makeCarouselFor($tenant, 'owner@gone.test', 'doomed');

        $this->uninstallDaysAgo($tenant, 31);

        $this->artisan('modules:purge-expired')->assertSuccessful();

        $tenant->run(function (): void {
            $this->assertFalse(Schema::hasTable('carousels'));
            $this->assertFalse(Schema::hasTable('carousel_images'));
            $this->assertFalse(Permission::query()->where('module', 'carousels')->exists());
            $this->assertFalse(Menu::query()->where('slug', 'carousels')->exists());
            $this->assertFalse(InstalledModule::query()->where('key', 'carousels')->exists());

            // Core survives: migrate:reset --path must not touch anything else.
            $this->assertTrue(Schema::hasTable('media'));
            $this->assertTrue(Schema::hasTable('users'));
            $this->assertTrue(Permission::query()->where('module', 'media')->exists());
        });
    }

    public function test_purging_leaves_other_tenants_untouched(): void
    {
        $doomed = $this->provisionTenant('Doomed Co', 'doomed-co', 'owner@doomed.test');
        $keeper = $this->provisionTenant('Keeper Co', 'keeper-co', 'owner@keeper.test');

        $this->installer()->install($doomed, $this->module());
        $this->installer()->install($keeper, $this->module());
        $this->makeCarouselFor($keeper, 'owner@keeper.test', 'kept');

        $this->uninstallDaysAgo($doomed, 31);

        $this->artisan('modules:purge-expired')->assertSuccessful();

        $doomed->run(fn () => $this->assertFalse(Schema::hasTable('carousels')));
        $keeper->run(function (): void {
            $this->assertTrue(Schema::hasTable('carousels'));
            $this->assertSame(1, Carousel::query()->where('slug', 'kept')->count());
        });
    }

    public function test_pretend_reports_without_destroying_anything(): void
    {
        $tenant = $this->provisionTenant('Dry Co', 'dry-co', 'owner@dry.test');
        $this->installer()->install($tenant, $this->module());
        $this->uninstallDaysAgo($tenant, 31);

        $this->artisan('modules:purge-expired', ['--pretend' => true])
            ->expectsOutputToContain('would purge [carousels]')
            ->assertSuccessful();

        $tenant->run(fn () => $this->assertTrue(Schema::hasTable('carousels')));
    }

    /**
     * The reason purge is sequenced last: page HTML saved while the module was
     * installed keeps its <carousel> tag forever, and this render is public and
     * unauthenticated. Without the guard it would be a 500 on the tenant's site.
     */
    public function test_a_public_page_survives_the_purge_of_a_carousel_it_references(): void
    {
        $tenant = $this->provisionTenant('Public Co', 'public-co', 'owner@public.test');
        $this->installer()->install($tenant, $this->module());
        $this->installer()->install($tenant, app(PagesModule::class));

        $tenant->run(function (): void {
            $owner = User::query()->firstWhere('email', 'owner@public.test');

            Carousel::factory()->active()->create(['user_id' => $owner->id, 'slug' => 'banner']);

            Page::factory()->published()->create([
                'user_id' => $owner->id,
                'slug' => 'home',
                'html' => '<div>Welcome<carousel slug="banner"></carousel></div>',
            ]);
        });

        $this->uninstallDaysAgo($tenant, 31);
        $this->artisan('modules:purge-expired')->assertSuccessful();
        tenancy()->end();

        $response = $this->get('http://public-co.localhost/p/home');

        $response->assertOk();
        $response->assertSee('Welcome');
        $response->assertDontSee('<carousel', escape: false);
    }

    public function test_the_admin_area_survives_the_purge(): void
    {
        $tenant = $this->provisionTenant('Admin Co', 'admin-co', 'owner@admin.test');
        $this->installer()->install($tenant, $this->module());
        $this->uninstallDaysAgo($tenant, 31);
        $this->artisan('modules:purge-expired')->assertSuccessful();
        tenancy()->end();

        $owner = $tenant->run(fn (): User => User::query()->firstWhere('email', 'owner@admin.test'));

        $this->actingAs($owner)->get('http://admin-co.localhost/module/dashboard')->assertOk();
        $this->actingAs($owner)->get('http://admin-co.localhost/module/analytics')->assertOk();
        $this->actingAs($owner)->get('http://admin-co.localhost/module/search?q=banner')->assertOk();
        $this->actingAs($owner)->get('http://admin-co.localhost/module/carousels')->assertNotFound();
    }
}
