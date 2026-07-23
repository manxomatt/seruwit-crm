<?php

namespace Tests\Feature\Modules\Product;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductPackaging;
use Modules\Product\Models\ProductTag;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ProductEnhancementTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_product_can_be_created_with_new_fields(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.store'), [
            'name' => 'Enhanced Product',
            'unit' => 'pcs',
            'status' => 'active',
            'cost' => 15000,
            'weight' => 1.5,
            'volume' => 0.003,
            'tracking' => 'serial',
            'is_storable' => true,
            'description_sale' => 'For sale',
            'description_purchase' => 'For purchase',
        ])->assertRedirect();

        $product = Product::firstWhere('name', 'Enhanced Product');
        $this->assertEquals(15000, $product->cost);
        $this->assertEquals(1.5, $product->weight);
        $this->assertEquals('serial', $product->tracking);
        $this->assertTrue($product->is_storable);
        $this->assertEquals('For sale', $product->description_sale);
    }

    public function test_product_can_be_created_with_tags(): void
    {
        $user = $this->createAdminUser();
        $tag1 = ProductTag::factory()->create();
        $tag2 = ProductTag::factory()->create();

        $this->actingAs($user)->post(route('module.products.store'), [
            'name' => 'Tagged Product',
            'unit' => 'pcs',
            'status' => 'active',
            'tag_ids' => [$tag1->id, $tag2->id],
        ])->assertRedirect();

        $product = Product::firstWhere('name', 'Tagged Product');
        $this->assertCount(2, $product->tags);
    }

    public function test_product_can_be_created_with_packagings(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.store'), [
            'name' => 'Packaged Product',
            'unit' => 'pcs',
            'status' => 'active',
            'packagings' => [
                ['name' => 'Box', 'barcode' => '1234567890', 'qty' => 12, 'sort' => 0],
                ['name' => 'Karton', 'barcode' => '9876543210', 'qty' => 48, 'sort' => 1],
            ],
        ])->assertRedirect();

        $product = Product::firstWhere('name', 'Packaged Product');
        $this->assertCount(2, $product->packagings);
        $this->assertEquals('Box', $product->packagings->first()->name);
    }

    public function test_product_update_syncs_tags(): void
    {
        $user = $this->createAdminUser();
        $product = Product::factory()->create();
        $tag1 = ProductTag::factory()->create();
        $tag2 = ProductTag::factory()->create();
        $tag3 = ProductTag::factory()->create();
        $product->tags()->sync([$tag1->id, $tag2->id]);

        $this->actingAs($user)->patch(route('module.products.update', $product), [
            'tag_ids' => [$tag2->id, $tag3->id],
        ])->assertRedirect();

        $product->refresh();
        $tagIds = $product->tags->pluck('id')->toArray();
        $this->assertContains($tag2->id, $tagIds);
        $this->assertContains($tag3->id, $tagIds);
        $this->assertNotContains($tag1->id, $tagIds);
    }

    public function test_product_update_syncs_packagings(): void
    {
        $user = $this->createAdminUser();
        $product = Product::factory()->create();
        $keepPkg = ProductPackaging::factory()->create(['product_id' => $product->id, 'name' => 'Keep']);
        ProductPackaging::factory()->create(['product_id' => $product->id, 'name' => 'Remove']);

        $this->actingAs($user)->patch(route('module.products.update', $product), [
            'packagings' => [
                ['id' => $keepPkg->id, 'name' => 'Kept', 'barcode' => null, 'qty' => 10, 'sort' => 0],
                ['name' => 'New', 'barcode' => null, 'qty' => 20, 'sort' => 1],
            ],
        ])->assertRedirect();

        $product->refresh();
        $this->assertCount(2, $product->packagings);
        $this->assertDatabaseHas('product_packagings', ['id' => $keepPkg->id, 'name' => 'Kept']);
        $this->assertDatabaseHas('product_packagings', ['name' => 'New']);
        $this->assertDatabaseMissing('product_packagings', ['name' => 'Remove']);
    }

    public function test_product_show_loads_tags_and_packagings(): void
    {
        $user = $this->createAdminUser();
        $product = Product::factory()->create();
        $tag = ProductTag::factory()->create(['name' => 'TestTag']);
        $product->tags()->attach($tag->id);
        ProductPackaging::factory()->create(['product_id' => $product->id, 'name' => 'Box']);

        $this->actingAs($user)->get(route('module.products.show', $product))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Show')
                ->has('product.tags', 1)
                ->has('product.packagings', 1)
            );
    }

    public function test_product_variant_relationship(): void
    {
        $parent = Product::factory()->create(['name' => 'Template']);
        $variant1 = Product::factory()->create(['parent_id' => $parent->id, 'name' => 'Variant Red']);
        $variant2 = Product::factory()->create(['parent_id' => $parent->id, 'name' => 'Variant Blue']);

        $this->assertCount(2, $parent->variants);
        $this->assertEquals($parent->id, $variant1->parent->id);
    }

    public function test_deleting_parent_cascades_to_variants(): void
    {
        $parent = Product::factory()->create();
        $variant = Product::factory()->create(['parent_id' => $parent->id]);

        $parent->delete();

        $this->assertDatabaseMissing('products', ['id' => $variant->id]);
    }

    public function test_product_tracking_validation(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.store'), [
            'name' => 'Test',
            'unit' => 'pcs',
            'status' => 'active',
            'tracking' => 'invalid',
        ])->assertSessionHasErrors(['tracking']);
    }

    public function test_packaging_belongs_to_product(): void
    {
        $product = Product::factory()->create();
        $packaging = ProductPackaging::factory()->create(['product_id' => $product->id]);

        $this->assertEquals($product->id, $packaging->product->id);
    }

    public function test_product_edit_loads_tags_and_packagings(): void
    {
        $user = $this->createAdminUser();
        $product = Product::factory()->create();
        $tag = ProductTag::factory()->create();
        $product->tags()->attach($tag->id);
        ProductPackaging::factory()->create(['product_id' => $product->id]);

        $this->actingAs($user)->get(route('module.products.edit', $product))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Edit')
                ->has('product.tags', 1)
                ->has('product.packagings', 1)
                ->has('tags')
            );
    }

    public function test_product_tables_exist(): void
    {
        $this->assertTrue(\Schema::hasTable('product_attributes'));
        $this->assertTrue(\Schema::hasTable('product_attribute_options'));
        $this->assertTrue(\Schema::hasTable('product_tags'));
        $this->assertTrue(\Schema::hasTable('product_product_tag'));
        $this->assertTrue(\Schema::hasTable('product_packagings'));
        $this->assertTrue(\Schema::hasTable('product_product_attributes'));
        $this->assertTrue(\Schema::hasTable('product_attribute_values'));
        $this->assertTrue(\Schema::hasTable('product_combinations'));
    }

    public function test_service_product_enforces_no_inventory(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.store'), [
            'name' => 'Jasa Pengiriman',
            'unit' => 'service',
            'status' => 'active',
            'category' => 'service',
            'brand_id' => \Modules\Product\Models\Brand::factory()->create()->id,
            'product_type_id' => \Modules\Product\Models\ProductType::factory()->create()->id,
            'cost' => 50000,
            'weight' => 5,
            'volume' => 0.5,
            'tracking' => 'qty',
            'is_storable' => true,
            'reorder_threshold' => 10,
            'reorder_quantity' => 50,
        ])->assertRedirect();

        $product = Product::firstWhere('name', 'Jasa Pengiriman');
        $this->assertNull($product->brand_id);
        $this->assertNull($product->product_type_id);
        $this->assertNull($product->cost);
        $this->assertFalse($product->is_storable);
        $this->assertEquals('none', $product->tracking);
        $this->assertNull($product->weight);
        $this->assertNull($product->volume);
        $this->assertEquals(0, $product->reorder_threshold);
        $this->assertEquals(0, $product->reorder_quantity);
        $this->assertTrue($product->isService());
    }

    public function test_service_category_validation_accepts_service(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.products.store'), [
            'name' => 'Jasa Bongkar Muat',
            'unit' => 'service',
            'status' => 'active',
            'category' => 'service',
            'price' => 150000,
            'cost' => 100000,
        ])->assertRedirect();

        $this->assertDatabaseHas('products', [
            'name' => 'Jasa Bongkar Muat',
            'category' => 'service',
        ]);
    }

    public function test_update_to_service_clears_inventory_fields(): void
    {
        $user = $this->createAdminUser();
        $brand = \Modules\Product\Models\Brand::factory()->create();
        $type = \Modules\Product\Models\ProductType::factory()->create();
        $product = Product::factory()->create([
            'brand_id' => $brand->id,
            'product_type_id' => $type->id,
            'cost' => 50000,
            'weight' => 1.5,
            'volume' => 0.003,
            'tracking' => 'qty',
            'is_storable' => true,
            'reorder_threshold' => 10,
            'reorder_quantity' => 50,
        ]);

        $this->actingAs($user)->patch(route('module.products.update', $product), [
            'category' => 'service',
        ])->assertRedirect();

        $product->refresh();
        $this->assertNull($product->brand_id);
        $this->assertNull($product->product_type_id);
        $this->assertNull($product->cost);
        $this->assertFalse($product->is_storable);
        $this->assertEquals('none', $product->tracking);
        $this->assertNull($product->weight);
        $this->assertNull($product->volume);
        $this->assertEquals(0, $product->reorder_threshold);
        $this->assertEquals(0, $product->reorder_quantity);
    }

    public function test_index_filters_by_category(): void
    {
        $user = $this->createAdminUser();
        Product::factory()->create(['name' => 'Barang A', 'category' => 'merchandise']);
        Product::factory()->create(['name' => 'Jasa B', 'category' => 'service']);

        $this->actingAs($user)->get(route('module.products.index', ['category' => 'service']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Product/Index')
                ->where('filters.category', 'service')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Jasa B')
            );
    }

    public function test_products_table_has_new_columns(): void
    {
        $this->assertTrue(\Schema::hasColumn('products', 'parent_id'));
        $this->assertTrue(\Schema::hasColumn('products', 'cost'));
        $this->assertTrue(\Schema::hasColumn('products', 'weight'));
        $this->assertTrue(\Schema::hasColumn('products', 'volume'));
        $this->assertTrue(\Schema::hasColumn('products', 'is_favorite'));
        $this->assertTrue(\Schema::hasColumn('products', 'is_storable'));
        $this->assertTrue(\Schema::hasColumn('products', 'tracking'));
        $this->assertTrue(\Schema::hasColumn('products', 'description_sale'));
        $this->assertTrue(\Schema::hasColumn('products', 'description_purchase'));
        $this->assertTrue(\Schema::hasColumn('products', 'images'));
    }
}
