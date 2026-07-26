<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\PriceList;
use Modules\Sales\Models\PriceListItem;
use Modules\Sales\Support\PriceListResolver;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PriceListTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_price_list_can_be_created_and_items_saved(): void
    {
        $user = $this->createAdminUser();
        $product = Product::factory()->create(['price' => 1000]);

        $this->actingAs($user)
            ->post(route('module.sales.price-lists.store', [], false), [
                'name' => 'Retail',
                'code' => 'PL-RETAIL',
                'is_active' => true,
            ])
            ->assertRedirect();

        $list = PriceList::query()->firstOrFail();
        $this->assertSame('Retail', $list->name);

        $this->actingAs($user)
            ->post(route('module.sales.price-lists.items.store', $list, false), [
                'product_id' => $product->id,
                'unit_price' => 1250,
            ])
            ->assertSessionHas('success');

        $this->assertEquals(1250, (float) PriceListItem::query()->where('price_list_id', $list->id)->value('unit_price'));
        $this->assertEquals(1250, PriceListResolver::resolveUnitPrice($list->id, $product->id));
    }

    public function test_partner_price_list_is_used_as_so_default_via_resolver(): void
    {
        $product = Product::factory()->create(['price' => 900, 'cost' => 700]);
        $list = PriceList::query()->create([
            'name' => 'Key Account',
            'code' => 'PL-KA',
            'is_active' => true,
        ]);
        PriceListItem::query()->create([
            'price_list_id' => $list->id,
            'product_id' => $product->id,
            'unit_price' => 850,
        ]);

        $partner = Partner::factory()->create([
            'customer_rank' => 1,
            'price_list_id' => $list->id,
        ]);

        $this->assertEquals(850, PriceListResolver::resolveUnitPrice((int) $partner->price_list_id, $product->id));
        $this->assertEquals(900, PriceListResolver::fallbackProductPrice($product));
        $this->assertArrayHasKey($list->id, PriceListResolver::activePriceMaps());
    }
}
