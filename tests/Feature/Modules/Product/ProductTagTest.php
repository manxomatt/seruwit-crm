<?php

namespace Tests\Feature\Modules\Product;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductTag;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ProductTagTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_tags(): void
    {
        $this->get(route('module.products.tags.index'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_tags(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.products.tags.index'))->assertForbidden();
    }

    public function test_admin_can_view_tags_index(): void
    {
        $user = $this->createAdminUser();
        ProductTag::factory()->create(['name' => 'Promo']);

        $this->actingAs($user)->get(route('module.products.tags.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Tags/Index')
                ->has('tags.data', 1)
                ->where('tags.data.0.name', 'Promo')
            );
    }

    public function test_admin_can_create_a_tag(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.tags.store'), [
            'name' => 'Bestseller',
            'color' => 'green',
        ])->assertRedirect(route('module.products.tags.index'));

        $this->assertDatabaseHas('product_tags', ['name' => 'Bestseller', 'color' => 'green']);
    }

    public function test_tag_name_must_be_unique(): void
    {
        $user = $this->createAdminUser();
        ProductTag::factory()->create(['name' => 'Promo']);

        $this->actingAs($user)->post(route('module.products.tags.store'), [
            'name' => 'Promo',
            'color' => 'red',
        ])->assertSessionHasErrors(['name']);
    }

    public function test_creating_tag_requires_name(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.tags.store'), [
            'color' => 'blue',
        ])->assertSessionHasErrors(['name']);
    }

    public function test_admin_can_update_a_tag(): void
    {
        $user = $this->createAdminUser();
        $tag = ProductTag::factory()->create(['name' => 'Old', 'color' => 'red']);

        $this->actingAs($user)->patch(route('module.products.tags.update', $tag), [
            'name' => 'Updated',
            'color' => 'blue',
        ])->assertRedirect(route('module.products.tags.index'));

        $this->assertDatabaseHas('product_tags', ['id' => $tag->id, 'name' => 'Updated', 'color' => 'blue']);
    }

    public function test_admin_can_delete_a_tag_without_products(): void
    {
        $user = $this->createAdminUser();
        $tag = ProductTag::factory()->create();

        $this->actingAs($user)->delete(route('module.products.tags.destroy', $tag))
            ->assertRedirect(route('module.products.tags.index'));

        $this->assertSoftDeleted('product_tags', ['id' => $tag->id]);
    }

    public function test_tag_with_products_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $tag = ProductTag::factory()->create();
        $product = Product::factory()->create();
        $product->tags()->attach($tag->id);

        $this->actingAs($user)->delete(route('module.products.tags.destroy', $tag))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('product_tags', ['id' => $tag->id]);
    }

    public function test_tags_index_supports_search(): void
    {
        $user = $this->createAdminUser();
        ProductTag::factory()->create(['name' => 'Promo']);
        ProductTag::factory()->create(['name' => 'New Arrival']);

        $this->actingAs($user)->get(route('module.products.tags.index', ['search' => 'Promo']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('tags.data', 1));
    }

    public function test_product_tag_many_to_many_relationship(): void
    {
        $product = Product::factory()->create();
        $tag1 = ProductTag::factory()->create(['name' => 'Sale']);
        $tag2 = ProductTag::factory()->create(['name' => 'New']);
        $product->tags()->sync([$tag1->id, $tag2->id]);

        $this->assertCount(2, $product->tags);
        $this->assertCount(1, $tag1->products);
    }
}
