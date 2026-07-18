<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Modules\ModuleInstaller;
use Modules\Carousels\CarouselsModule;
use Modules\Carousels\Models\Carousel;
use Modules\Carousels\Models\CarouselImage;
use Modules\Pages\Models\Page;
use Modules\Pages\PagesModule;
use Tests\TestCase;
use Tests\Traits\WithTenant;

/**
 * Proves an uninstalled module is actually unreachable, and that the rest of the
 * app survives its absence.
 *
 * The subject is deliberately the workspace *admin*: User::hasPermissionFor() and
 * Menu::userHasPermission() both return true early for admins, so permissions can
 * never enforce an uninstall for the one user most likely to hit it.
 */
class ModuleEnforcementTest extends TestCase
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
     * Fetch the owner from inside the tenant so the instance is pinned to the
     * tenant connection — its role checks must hit the tenant schema.
     */
    private function ownerOf(\App\Models\Tenant $tenant, string $email): User
    {
        return $tenant->run(fn (): User => User::query()->firstWhere('email', $email));
    }

    public function test_workspace_admin_is_blocked_from_an_uninstalled_module(): void
    {
        $tenant = $this->provisionTenant('Gate Co', 'gate-co', 'owner@gate.test');
        $owner = $this->ownerOf($tenant, 'owner@gate.test');

        $this->assertTrue($tenant->run(fn (): bool => $owner->isAdmin()));

        // Never installed: the admin's blanket permissions must not get them in.
        $this->actingAs($owner)->get('http://gate-co.localhost/module/carousels')
            ->assertNotFound();

        $this->installer()->install($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://gate-co.localhost/module/carousels')
            ->assertOk();

        $this->installer()->uninstall($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://gate-co.localhost/module/carousels')
            ->assertNotFound();
    }

    public function test_every_module_route_is_gated_not_just_the_index(): void
    {
        $tenant = $this->provisionTenant('Deep Co', 'deep-co', 'owner@deep.test');
        $owner = $this->ownerOf($tenant, 'owner@deep.test');

        foreach (['/module/carousels', '/module/carousels/create', '/module/carousels/1', '/module/carousels/1/edit'] as $path) {
            $this->actingAs($owner)->get('http://deep-co.localhost'.$path)
                ->assertNotFound();
        }

        $this->actingAs($owner)->post('http://deep-co.localhost/module/carousels', [
            'name' => 'Sneaky',
            'slug' => 'sneaky',
            'autoplay_interval' => 5000,
        ])->assertNotFound();
    }

    public function test_the_sidebar_drops_the_module_for_an_admin_after_uninstall(): void
    {
        $tenant = $this->provisionTenant('Menu Co', 'menu-co', 'owner@menu.test');
        $owner = $this->ownerOf($tenant, 'owner@menu.test');

        $this->installer()->install($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://menu-co.localhost/module/dashboard')
            ->assertInertia(fn ($page) => $page
                ->where(
                    'menus',
                    fn ($menus) => collect($menus)->contains('slug', 'carousels'),
                )
                // This is the prop ModuleLayout.tsx actually builds the sidebar
                // from — `menus` is fetched but never read client-side, so an
                // assertion against it alone would not catch a leak here.
                ->has('auth.user.permissions.carousels')
            );

        $this->installer()->uninstall($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://menu-co.localhost/module/dashboard')
            ->assertInertia(fn ($page) => $page
                ->where(
                    'menus',
                    fn ($menus) => ! collect($menus)->contains('slug', 'carousels'),
                )
                ->missing('auth.user.permissions.carousels')
            );
    }

    public function test_the_rest_of_the_app_survives_a_missing_module(): void
    {
        $tenant = $this->provisionTenant('Rest Co', 'rest-co', 'owner@rest.test');
        $owner = $this->ownerOf($tenant, 'owner@rest.test');

        // Carousels was never installed, so its tables do not exist. Every one of
        // these queries carousel data unguarded before the module system.
        $this->actingAs($owner)->get('http://rest-co.localhost/module/dashboard')->assertOk();
        $this->actingAs($owner)->get('http://rest-co.localhost/module/analytics')->assertOk();
        $this->actingAs($owner)->get('http://rest-co.localhost/module/search?q=slider')->assertOk();
        $this->get('http://rest-co.localhost/')->assertOk();
    }

    /**
     * A 200 only proves the server answered. These pages read stats.carousels
     * straight out of the props, so the prop must genuinely be absent — otherwise
     * the page still white-screens in the browser on a TypeError.
     */
    public function test_stat_props_omit_the_module_rather_than_sending_empty_values(): void
    {
        $tenant = $this->provisionTenant('Props Co', 'props-co', 'owner@props.test');
        $owner = $this->ownerOf($tenant, 'owner@props.test');

        $this->actingAs($owner)->get('http://props-co.localhost/module/dashboard')
            ->assertInertia(fn ($page) => $page->missing('stats.carousels'));

        $this->actingAs($owner)->get('http://props-co.localhost/module/analytics')
            ->assertInertia(fn ($page) => $page
                ->missing('overview.totalCarousels')
                ->missing('contentStats.carousels')
            );

        $this->installer()->install($tenant, $this->module());
        tenancy()->end();

        $this->actingAs($owner)->get('http://props-co.localhost/module/dashboard')
            ->assertInertia(fn ($page) => $page->has('stats.carousels'));

        $this->actingAs($owner)->get('http://props-co.localhost/module/analytics')
            ->assertInertia(fn ($page) => $page
                ->has('overview.totalCarousels')
                ->has('contentStats.carousels')
            );
    }

    /**
     * Pages and Posts went through the same extraction as Carousels; this pins
     * their enforcement plus the public fallbacks that are unique to them —
     * the homepage must fall back to the stock landing page and the blog must
     * 404 rather than 500 on the missing tables.
     */
    public function test_pages_and_posts_modules_are_enforced_including_their_public_faces(): void
    {
        $tenant = $this->provisionTenant('Cms Co', 'cms-co', 'owner@cms.test');
        $owner = $this->ownerOf($tenant, 'owner@cms.test');

        $this->actingAs($owner)->get('http://cms-co.localhost/module/pages')->assertNotFound();
        $this->actingAs($owner)->get('http://cms-co.localhost/module/posts')->assertNotFound();

        // Public faces survive the absence: stock landing, 404s over 500s.
        $this->get('http://cms-co.localhost/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Welcome'));
        $this->get('http://cms-co.localhost/blog')->assertNotFound();
        $this->get('http://cms-co.localhost/p/anything')->assertNotFound();

        $this->installer()->install($tenant, app(PagesModule::class));
        $this->installer()->install($tenant, app(\Modules\Posts\PostsModule::class));
        tenancy()->end();

        $this->actingAs($owner)->get('http://cms-co.localhost/module/pages')->assertOk();
        $this->actingAs($owner)->get('http://cms-co.localhost/module/posts')->assertOk();
        $this->get('http://cms-co.localhost/blog')->assertOk();
    }

    public function test_a_public_page_with_a_stale_carousel_tag_still_renders(): void
    {
        $tenant = $this->provisionTenant('Stale Co', 'stale-co', 'owner@stale.test');

        // Pages is a module of its own now, so public rendering needs it
        // installed — the point here stays Carousels' absence, not Pages'.
        $this->installer()->install($tenant, app(PagesModule::class));

        // Page HTML saved while the module was installed keeps its <carousel> tag
        // forever. Rendering it must not consult the module's missing tables.
        $tenant->run(function (): void {
            $owner = User::query()->firstWhere('email', 'owner@stale.test');

            Page::factory()->published()->create([
                'user_id' => $owner->id,
                'slug' => 'legacy',
                'html' => '<div>Still here<carousel slug="ghost"></carousel></div>',
            ]);
        });

        $response = $this->get('http://stale-co.localhost/p/legacy');

        $response->assertOk();
        $response->assertSee('Still here');
        $response->assertDontSee('<carousel', escape: false);
    }

    public function test_an_installed_module_still_renders_on_a_public_page(): void
    {
        $tenant = $this->provisionTenant('Live Co', 'live-co', 'owner@live.test');
        $this->installer()->install($tenant, $this->module());
        $this->installer()->install($tenant, app(PagesModule::class));

        $tenant->run(function (): void {
            $owner = User::query()->firstWhere('email', 'owner@live.test');

            $carousel = Carousel::factory()->active()->create([
                'user_id' => $owner->id,
                'slug' => 'shown',
            ]);
            CarouselImage::factory()->active()->create([
                'carousel_id' => $carousel->id,
                'title' => 'Live Slide',
            ]);

            Page::factory()->published()->create([
                'user_id' => $owner->id,
                'slug' => 'showcase',
                'html' => '<div><carousel slug="shown"></carousel></div>',
            ]);
        });

        tenancy()->end();

        $response = $this->get('http://live-co.localhost/p/showcase');

        $response->assertOk();
        $response->assertSee('Live Slide');
        $response->assertSee('data-carousel="shown"', escape: false);
    }
}
