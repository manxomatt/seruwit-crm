<?php

namespace Tests\Feature\Modules\Product;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductType;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ProductTypeTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_product_types(): void
    {
        $this->get(route('module.products.product-types.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_view_product_types_index(): void
    {
        $user = $this->createAdminUser();
        ProductType::factory()->create(['name' => 'Makanan']);

        $this->actingAs($user)->get(route('module.products.product-types.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/ProductTypes/Index')
                ->has('productTypes.data', 1)
                ->where('productTypes.data.0.name', 'Makanan')
            );
    }

    public function test_admin_can_create_a_product_type(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.product-types.store'), [
            'name' => 'Minuman',
            'sort_order' => 1,
        ])->assertRedirect(route('module.products.product-types.index'));

        $this->assertDatabaseHas('product_types', ['name' => 'Minuman', 'sort_order' => 1]);
    }

    public function test_admin_can_create_a_child_product_type(): void
    {
        $user = $this->createAdminUser();
        $parent = ProductType::factory()->create(['name' => 'Makanan']);

        $this->actingAs($user)->post(route('module.products.product-types.store'), [
            'name' => 'Snack',
            'parent_id' => $parent->id,
        ])->assertRedirect(route('module.products.product-types.index'));

        $this->assertDatabaseHas('product_types', ['name' => 'Snack', 'parent_id' => $parent->id]);
    }

    public function test_admin_can_update_a_product_type(): void
    {
        $user = $this->createAdminUser();
        $type = ProductType::factory()->create(['name' => 'Old']);

        $this->actingAs($user)->patch(route('module.products.product-types.update', $type), [
            'name' => 'New',
        ])->assertRedirect(route('module.products.product-types.index'));

        $this->assertDatabaseHas('product_types', ['id' => $type->id, 'name' => 'New']);
    }

    public function test_admin_can_delete_a_product_type_without_products(): void
    {
        $user = $this->createAdminUser();
        $type = ProductType::factory()->create();

        $this->actingAs($user)->delete(route('module.products.product-types.destroy', $type))
            ->assertRedirect(route('module.products.product-types.index'));

        $this->assertDatabaseMissing('product_types', ['id' => $type->id]);
    }

    public function test_product_type_with_products_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $type = ProductType::factory()->create();
        Product::factory()->create(['product_type_id' => $type->id]);

        $this->actingAs($user)->delete(route('module.products.product-types.destroy', $type))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('product_types', ['id' => $type->id]);
    }

    public function test_product_type_with_children_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $parent = ProductType::factory()->create();
        ProductType::factory()->create(['parent_id' => $parent->id]);

        $this->actingAs($user)->delete(route('module.products.product-types.destroy', $parent))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('product_types', ['id' => $parent->id]);
    }
}
