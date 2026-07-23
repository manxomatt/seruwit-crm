<?php

namespace Tests\Feature\Modules\Product;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\ProductAttribute;
use Modules\Product\Models\ProductAttributeOption;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ProductAttributeTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_attributes(): void
    {
        $this->get(route('module.products.attributes.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_attributes(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.products.attributes.index'))->assertForbidden();
    }

    public function test_admin_can_view_attributes_index(): void
    {
        $user = $this->createAdminUser();
        ProductAttribute::factory()->create(['name' => 'Warna']);

        $this->actingAs($user)->get(route('module.products.attributes.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Attributes/Index')
                ->has('attributes.data', 1)
                ->where('attributes.data.0.name', 'Warna')
            );
    }

    public function test_admin_can_create_attribute_with_options(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.attributes.store'), [
            'name' => 'Ukuran',
            'type' => 'select',
            'sort' => 1,
            'options' => [
                ['name' => 'S', 'color' => null, 'extra_price' => 0, 'sort' => 0],
                ['name' => 'M', 'color' => null, 'extra_price' => 0, 'sort' => 1],
                ['name' => 'L', 'color' => null, 'extra_price' => 5000, 'sort' => 2],
            ],
        ])->assertRedirect(route('module.products.attributes.index'));

        $this->assertDatabaseHas('product_attributes', ['name' => 'Ukuran', 'type' => 'select']);
        $attribute = ProductAttribute::firstWhere('name', 'Ukuran');
        $this->assertCount(3, $attribute->options);
        $this->assertEquals('L', $attribute->options->last()->name);
    }

    public function test_creating_attribute_requires_name_and_type(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.attributes.store'), [])
            ->assertSessionHasErrors(['name', 'type']);
    }

    public function test_attribute_type_must_be_valid(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.attributes.store'), [
            'name' => 'Test',
            'type' => 'invalid_type',
        ])->assertSessionHasErrors(['type']);
    }

    public function test_admin_can_update_attribute_and_sync_options(): void
    {
        $user = $this->createAdminUser();
        $attribute = ProductAttribute::factory()->create(['name' => 'Old']);
        $existingOption = ProductAttributeOption::factory()->create(['attribute_id' => $attribute->id, 'name' => 'Keep']);
        ProductAttributeOption::factory()->create(['attribute_id' => $attribute->id, 'name' => 'Remove']);

        $this->actingAs($user)->patch(route('module.products.attributes.update', $attribute), [
            'name' => 'Updated',
            'type' => 'color',
            'options' => [
                ['id' => $existingOption->id, 'name' => 'Kept', 'color' => '#ff0000', 'extra_price' => null, 'sort' => 0],
                ['name' => 'New', 'color' => '#00ff00', 'extra_price' => null, 'sort' => 1],
            ],
        ])->assertRedirect(route('module.products.attributes.index'));

        $this->assertDatabaseHas('product_attributes', ['id' => $attribute->id, 'name' => 'Updated', 'type' => 'color']);
        $this->assertDatabaseHas('product_attribute_options', ['id' => $existingOption->id, 'name' => 'Kept']);
        $this->assertDatabaseHas('product_attribute_options', ['name' => 'New']);
        $this->assertDatabaseMissing('product_attribute_options', ['name' => 'Remove']);
    }

    public function test_admin_can_delete_attribute(): void
    {
        $user = $this->createAdminUser();
        $attribute = ProductAttribute::factory()->create();
        ProductAttributeOption::factory()->count(2)->create(['attribute_id' => $attribute->id]);

        $this->actingAs($user)->delete(route('module.products.attributes.destroy', $attribute))
            ->assertRedirect(route('module.products.attributes.index'));

        $this->assertSoftDeleted('product_attributes', ['id' => $attribute->id]);
    }

    public function test_attributes_index_supports_search(): void
    {
        $user = $this->createAdminUser();
        ProductAttribute::factory()->create(['name' => 'Warna']);
        ProductAttribute::factory()->create(['name' => 'Ukuran']);

        $this->actingAs($user)->get(route('module.products.attributes.index', ['search' => 'Warna']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('attributes.data', 1));
    }

    public function test_edit_page_loads_attribute_with_options(): void
    {
        $user = $this->createAdminUser();
        $attribute = ProductAttribute::factory()->create(['name' => 'Color']);
        ProductAttributeOption::factory()->count(3)->create(['attribute_id' => $attribute->id]);

        $this->actingAs($user)->get(route('module.products.attributes.edit', $attribute))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Attributes/Edit')
                ->where('attribute.name', 'Color')
                ->has('attribute.options', 3)
            );
    }

    public function test_deleting_attribute_cascades_options(): void
    {
        $attribute = ProductAttribute::factory()->create();
        $option = ProductAttributeOption::factory()->create(['attribute_id' => $attribute->id]);

        $attribute->forceDelete();

        $this->assertDatabaseMissing('product_attribute_options', ['id' => $option->id]);
    }
}
