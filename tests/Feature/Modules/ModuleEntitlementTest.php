<?php

namespace Tests\Feature\Modules;

use App\Models\Tenant;
use App\Models\User;
use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Carousels\CarouselsModule;
use Modules\Carousels\Models\Carousel;
use RuntimeException;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Entitlement is the plan's answer to "may you have this module", kept separate
 * from whether the tenant installed it. A downgrade revokes access without ever
 * touching data, so an upgrade restores everything exactly as it was.
 */
class ModuleEntitlementTest extends TestCase
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

    private function ownerOf(Tenant $tenant, string $email): User
    {
        return $tenant->run(fn (): User => User::query()->firstWhere('email', $email));
    }

    public function test_a_tenant_without_an_explicit_plan_falls_back_to_the_default(): void
    {
        $tenant = $this->provisionTenant('Legacy Co', 'legacy-co', 'owner@legacy.test');

        // Every tenant provisioned before plans existed lands here — the default
        // must cover what they already had, or introducing plans steals modules.
        $this->assertSame('basic', $tenant->planKey());
        $this->assertTrue($tenant->isEntitledTo('carousels'));
    }

    public function test_installing_a_module_the_plan_excludes_is_refused(): void
    {
        $tenant = $this->provisionTenant('Free Co', 'free-co', 'owner@free.test');
        $tenant->update(['plan' => 'free']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Plan [free] does not include module [carousels].');

        $this->installer()->install($tenant, $this->module());
    }

    public function test_nothing_is_created_when_an_install_is_refused(): void
    {
        $tenant = $this->provisionTenant('Nope Co', 'nope-co', 'owner@nope.test');
        $tenant->update(['plan' => 'free']);

        try {
            $this->installer()->install($tenant, $this->module());
        } catch (RuntimeException) {
            // expected
        }

        $tenant->run(function (): void {
            $this->assertFalse(Schema::hasTable('carousels'));
        });
    }

    public function test_a_downgrade_revokes_access_without_destroying_anything(): void
    {
        $tenant = $this->provisionTenant('Down Co', 'down-co', 'owner@down.test');
        $owner = $this->ownerOf($tenant, 'owner@down.test');

        $this->installer()->install($tenant, $this->module());

        $tenant->run(function () use ($owner): void {
            Carousel::factory()->create(['user_id' => $owner->id, 'slug' => 'kept', 'name' => 'Kept Slider']);
        });

        $tenant->update(['plan' => 'free']);
        tenancy()->end();

        // Unreachable...
        $this->actingAs($owner)->get('http://down-co.localhost/module/carousels')->assertNotFound();

        // ...but still installed, with its data untouched and no purge clock started.
        $this->assertTrue($this->installer()->isInstalled($tenant, $this->module()));

        $tenant->run(function (): void {
            $this->assertTrue(Schema::hasTable('carousels'));
            $this->assertSame('Kept Slider', Carousel::query()->where('slug', 'kept')->value('name'));
        });
    }

    public function test_upgrading_brings_the_module_straight_back(): void
    {
        $tenant = $this->provisionTenant('Up Co', 'up-co', 'owner@up.test');
        $owner = $this->ownerOf($tenant, 'owner@up.test');

        $this->installer()->install($tenant, $this->module());
        $tenant->run(fn () => Carousel::factory()->create(['user_id' => $owner->id, 'slug' => 'restored']));

        $tenant->update(['plan' => 'free']);
        tenancy()->end();
        $this->actingAs($owner)->get('http://up-co.localhost/module/carousels')->assertNotFound();

        $tenant->update(['plan' => 'pro']);
        tenancy()->end();

        $this->actingAs($owner)->get('http://up-co.localhost/module/carousels')->assertOk();
        $tenant->run(fn () => $this->assertSame(1, Carousel::query()->where('slug', 'restored')->count()));
    }

    public function test_a_downgrade_hides_the_module_from_the_sidebar(): void
    {
        $tenant = $this->provisionTenant('Nav Co', 'nav-co', 'owner@nav.test');
        $owner = $this->ownerOf($tenant, 'owner@nav.test');

        $this->installer()->install($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://nav-co.localhost/module/dashboard')
            ->assertInertia(fn ($page) => $page->where(
                'menus',
                fn ($menus) => collect($menus)->contains('slug', 'carousels'),
            ));

        // A downgrade never touches Menu::is_active, so only a runtime check can
        // stop the sidebar offering a link that now 404s.
        $tenant->update(['plan' => 'free']);
        tenancy()->end();

        $this->actingAs($owner)->get('http://nav-co.localhost/module/dashboard')
            ->assertInertia(fn ($page) => $page->where(
                'menus',
                fn ($menus) => ! collect($menus)->contains('slug', 'carousels'),
            ));
    }

    public function test_a_downgrade_drops_the_module_from_stat_props(): void
    {
        $tenant = $this->provisionTenant('Stat Co', 'stat-co', 'owner@stat.test');
        $owner = $this->ownerOf($tenant, 'owner@stat.test');

        $this->installer()->install($tenant, $this->module());
        $tenant->update(['plan' => 'free']);
        tenancy()->end();

        $this->actingAs($owner)->get('http://stat-co.localhost/module/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->missing('stats.carousels'));

        $this->actingAs($owner)->get('http://stat-co.localhost/module/analytics')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->missing('contentStats.carousels'));
    }

    public function test_a_public_page_survives_a_downgrade(): void
    {
        $tenant = $this->provisionTenant('Site Co', 'site-co', 'owner@site.test');
        $owner = $this->ownerOf($tenant, 'owner@site.test');

        $this->installer()->install($tenant, $this->module());
        $this->installer()->install($tenant, app(\Modules\Pages\PagesModule::class));

        $tenant->run(function () use ($owner): void {
            $carousel = Carousel::factory()->active()->create(['user_id' => $owner->id, 'slug' => 'hero']);

            \Modules\Pages\Models\Page::factory()->published()->create([
                'user_id' => $owner->id,
                'slug' => 'landing',
                'html' => '<div>Halo<carousel slug="'.$carousel->slug.'"></carousel></div>',
            ]);
        });

        // The downgrade under test revokes Carousels, not Pages — losing Pages
        // too would take the whole public site down (correctly), which is a
        // different scenario than a page surviving a missing embed.
        \App\Models\Plan::query()->create([
            'key' => 'pages_only',
            'name' => 'Pages Only',
            'modules' => ['pages'],
            'sort_order' => 99,
            'is_default' => false,
        ]);

        $tenant->update(['plan' => 'pages_only']);
        tenancy()->end();

        $response = $this->get('http://site-co.localhost/p/landing');

        $response->assertOk();
        $response->assertSee('Halo');
        $response->assertDontSee('<carousel', escape: false);
    }
}
