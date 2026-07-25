<?php

namespace Tests\Feature\Modules\Product;

use Database\Seeders\TenantProductDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Product\Models\Product;
use Modules\Product\Models\ProductCombination;
use Tests\TestCase;

class TenantProductDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_forty_parent_products_with_variants_and_combinations(): void
    {
        $this->seed(TenantProductDemoSeeder::class);

        $parents = Product::query()->whereNull('parent_id')->get();
        $variants = Product::query()->whereNotNull('parent_id')->get();

        $this->assertCount(40, $parents);
        $this->assertGreaterThan(40, $variants->count());
        $this->assertTrue(
            $parents->every(fn (Product $product) => $product->variants()->exists()),
            'Every parent product should have at least one variant.'
        );
        $this->assertGreaterThan(0, ProductCombination::query()->count());
        $this->assertTrue(
            Product::query()->whereNotNull('parent_id')->whereHas('combinations')->exists()
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantProductDemoSeeder::class);
        $this->seed(TenantProductDemoSeeder::class);

        $this->assertSame(40, Product::query()->whereNull('parent_id')->count());
    }
}
