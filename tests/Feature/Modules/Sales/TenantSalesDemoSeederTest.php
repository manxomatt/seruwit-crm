<?php

namespace Tests\Feature\Modules\Sales;

use Database\Seeders\TenantSalesDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\StockMovement;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesOrder;
use Tests\TestCase;

class TenantSalesDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_ten_sales_orders_with_consistent_gins(): void
    {
        Partner::factory()->count(3)->create(['customer_rank' => 1, 'credit_limit' => null]);
        Warehouse::factory()->create(['status' => 'active'])->createDefaultLocations();
        Product::factory()->count(8)->create([
            'status' => 'active',
            'category' => 'merchandise',
            'is_storable' => true,
            'price' => 15000,
        ]);

        $this->seed(TenantSalesDemoSeeder::class);

        $this->assertSame(10, SalesOrder::query()->where('notes', 'like', 'Demo SO #%')->count());

        $deliveredStatuses = [
            SalesOrder::STATUS_PARTIAL_DELIVERED,
            SalesOrder::STATUS_FULLY_DELIVERED,
            SalesOrder::STATUS_CLOSED,
        ];

        $deliveredOrders = SalesOrder::query()
            ->whereIn('status', $deliveredStatuses)
            ->withCount('goodsIssueNotes')
            ->get();

        $this->assertGreaterThanOrEqual(5, $deliveredOrders->count());
        $this->assertTrue(
            $deliveredOrders->every(fn (SalesOrder $so): bool => $so->goods_issue_notes_count > 0),
            'Every delivered/closed SO must have at least one GIN.',
        );
        $this->assertGreaterThan(0, GoodsIssueNote::query()->where('status', GoodsIssueNote::STATUS_CONFIRMED)->count());
        $this->assertGreaterThan(0, StockMovement::query()->where('source_type', 'gin')->count());
        $this->assertSame(2, SalesOrder::query()->where('status', SalesOrder::STATUS_DRAFT)->count());
        $this->assertSame(2, SalesOrder::query()->where('status', SalesOrder::STATUS_CONFIRMED)->count());
        $this->assertSame(1, SalesOrder::query()->where('status', SalesOrder::STATUS_CLOSED)->count());
        $this->assertSame(1, SalesOrder::query()->where('status', SalesOrder::STATUS_CANCELLED)->count());
    }

    public function test_seeder_is_idempotent_for_demo_orders(): void
    {
        Partner::factory()->count(3)->create(['customer_rank' => 1, 'credit_limit' => null]);
        Warehouse::factory()->create(['status' => 'active'])->createDefaultLocations();
        Product::factory()->count(8)->create([
            'status' => 'active',
            'category' => 'merchandise',
            'is_storable' => true,
            'price' => 15000,
        ]);

        $this->seed(TenantSalesDemoSeeder::class);
        $this->seed(TenantSalesDemoSeeder::class);

        $this->assertSame(10, SalesOrder::query()->where('notes', 'like', 'Demo SO #%')->count());
    }
}
