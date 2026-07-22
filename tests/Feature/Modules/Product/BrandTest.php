<?php

namespace Tests\Feature\Modules\Product;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Brand;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class BrandTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_brands(): void
    {
        $this->get(route('module.products.brands.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_view_brands_index(): void
    {
        $user = $this->createAdminUser();
        Brand::factory()->create(['name' => 'Sunsilk']);

        $this->actingAs($user)->get(route('module.products.brands.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Brands/Index')
                ->has('brands.data', 1)
                ->where('brands.data.0.name', 'Sunsilk')
            );
    }

    public function test_brands_can_be_filtered_by_principal(): void
    {
        $user = $this->createAdminUser();
        $p1 = Principal::factory()->create();
        $p2 = Principal::factory()->create();
        Brand::factory()->create(['principal_id' => $p1->id, 'name' => 'Brand A']);
        Brand::factory()->create(['principal_id' => $p2->id, 'name' => 'Brand B']);

        $this->actingAs($user)->get(route('module.products.brands.index', ['principal_id' => $p1->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('brands.data', 1)->where('brands.data.0.name', 'Brand A'));
    }

    public function test_admin_can_create_a_brand(): void
    {
        $user = $this->createAdminUser();
        $principal = Principal::factory()->create();

        $this->actingAs($user)->post(route('module.products.brands.store'), [
            'principal_id' => $principal->id,
            'name' => 'Dove',
            'status' => 'active',
        ])->assertRedirect(route('module.products.brands.index'));

        $this->assertDatabaseHas('brands', ['name' => 'Dove', 'principal_id' => $principal->id]);
    }

    public function test_creating_a_brand_requires_principal_and_name(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.brands.store'), [
            'status' => 'active',
        ])->assertSessionHasErrors(['principal_id', 'name']);
    }

    public function test_admin_can_update_a_brand(): void
    {
        $user = $this->createAdminUser();
        $brand = Brand::factory()->create(['name' => 'Old']);

        $this->actingAs($user)->patch(route('module.products.brands.update', $brand), [
            'name' => 'New',
        ])->assertRedirect(route('module.products.brands.index'));

        $this->assertDatabaseHas('brands', ['id' => $brand->id, 'name' => 'New']);
    }

    public function test_admin_can_delete_a_brand_without_products(): void
    {
        $user = $this->createAdminUser();
        $brand = Brand::factory()->create();

        $this->actingAs($user)->delete(route('module.products.brands.destroy', $brand))
            ->assertRedirect(route('module.products.brands.index'));

        $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
    }

    public function test_brand_with_products_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $brand = Brand::factory()->create();
        Product::factory()->create(['brand_id' => $brand->id]);

        $this->actingAs($user)->delete(route('module.products.brands.destroy', $brand))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('brands', ['id' => $brand->id]);
    }
}
