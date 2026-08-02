<?php

namespace Tests\Feature\Modules\Product;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Product;
use Modules\Product\Support\ProductStatusBoard;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ProductDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_products_dashboard(): void
    {
        $this->get(route('module.products.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_products_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.products.dashboard'))->assertForbidden();
    }

    public function test_products_dashboard_shows_status_board(): void
    {
        $brand = Brand::factory()->create(['status' => 'active']);

        Product::factory()->create([
            'status' => 'active',
            'category' => 'merchandise',
            'brand_id' => $brand->id,
            'price' => 15000,
            'is_favorite' => true,
        ]);
        Product::factory()->create([
            'status' => 'active',
            'category' => 'service',
            'brand_id' => $brand->id,
            'price' => 25000,
        ]);
        Product::factory()->inactive()->create([
            'category' => 'fleet_sparepart',
            'brand_id' => null,
            'price' => null,
        ]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.products.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Dashboard/Index')
                ->where('board.counts.total', 3)
                ->where('board.counts.active', 2)
                ->where('board.counts.inactive', 1)
                ->where('board.counts.favorites', 1)
                ->where('board.counts.without_brand', 1)
                ->where('board.counts.without_price', 1)
                ->where('board.categories.merchandise', 1)
                ->where('board.categories.service', 1)
                ->where('board.categories.fleet_sparepart', 1)
                ->where('board.masters.brands_active', 1)
                ->has('board.recent', 3)
                ->has('board.top_brands', 1)
                ->where('can.create', true)
            );
    }

    public function test_status_board_counts_variants(): void
    {
        $parent = Product::factory()->create(['status' => 'active']);
        Product::factory()->create([
            'status' => 'active',
            'parent_id' => $parent->id,
        ]);

        $board = app(ProductStatusBoard::class)->build();

        $this->assertSame(2, $board['counts']['total']);
        $this->assertSame(1, $board['counts']['variants']);
    }

    public function test_products_list_route_still_works(): void
    {
        Product::factory()->create();
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.products.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Product/Index'));
    }
}
