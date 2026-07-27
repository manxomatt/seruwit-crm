<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Models\StockLevel;
use Modules\Inventory\Models\Warehouse;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Modules\Outbound\Models\PickList;
use Modules\Outbound\Models\PickListItem;
use Modules\Product\Models\Product;

/**
 * Seeds 30 demo pick lists for the Outbound module.
 *
 *   php artisan tenants:seed --class=TenantOutboundDemoSeeder --tenants={id}
 */
class TenantOutboundDemoSeeder extends Seeder
{
    public const TAG = '[OUTBOUND-DEMO]';

    public const PICK_LIST_COUNT = 30;

    public function run(): void
    {
        if (! class_exists(PickList::class) || ! Schema::hasTable('pick_lists')) {
            $this->command?->warn('Outbound tables missing. Install the outbound module first.');

            return;
        }

        if (! class_exists(DeliveryOrder::class) || ! Schema::hasTable('delivery_orders')) {
            $this->command?->warn('Orders tables missing.');

            return;
        }

        if (! class_exists(Warehouse::class) || ! Schema::hasTable('warehouses')) {
            $this->command?->warn('Inventory tables missing.');

            return;
        }

        [$warehouse, $product, $locationId] = $this->ensureWarehouseProductAndStock();

        if ($this->demoPickListsExist()) {
            $this->command?->info('Outbound demo pick lists already present — skipping create.');
        } else {
            $this->seedPickLists($warehouse, $product, $locationId);
        }

        $count = PickList::query()->where('notes', 'like', '%'.self::TAG.'%')->count();

        $this->command?->info(sprintf('Outbound demo ready: %d pick lists.', $count));
        $this->command?->info('Open /module/outbound/pick-lists');
    }

    /**
     * @return array{0: Warehouse, 1: Product, 2: int|null}
     */
    protected function ensureWarehouseProductAndStock(): array
    {
        $warehouse = Warehouse::query()
            ->where('status', 'active')
            ->orderBy('id')
            ->first();

        if (! $warehouse) {
            $warehouse = Warehouse::factory()->create([
                'name' => 'Outbound Demo Warehouse',
                'status' => 'active',
            ]);
            $warehouse->createDefaultLocations();
        } elseif ($warehouse->locations()->count() === 0) {
            $warehouse->createDefaultLocations();
        }

        $location = $warehouse->locations()->where('code', 'STOCK')->first()
            ?? $warehouse->locations()->orderBy('id')->first();

        $product = Product::query()
            ->where('category', 'merchandise')
            ->orderBy('id')
            ->first();

        if (! $product) {
            $product = Product::factory()->create([
                'code' => 'PRD-OUT-DEMO',
                'sku' => 'PRD-OUT-DEMO',
                'name' => 'Produk Outbound Demo',
                'unit' => 'pcs',
                'category' => 'merchandise',
                'status' => 'active',
                'warehouse_id' => $warehouse->id,
                'price' => 15000,
            ]);
        }

        if ($location && class_exists(StockLevel::class) && Schema::hasTable('stock_levels')) {
            StockLevel::query()->firstOrCreate(
                [
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'location_id' => $location->id,
                    'batch_number' => 'LOT-OUT-DEMO',
                ],
                [
                    'expiry_date' => now()->addYear()->toDateString(),
                    'on_hand' => 5000,
                    'reserved' => 0,
                ],
            );
        }

        return [$warehouse, $product, $location?->id];
    }

    protected function demoPickListsExist(): bool
    {
        return PickList::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->count() >= self::PICK_LIST_COUNT;
    }

    protected function seedPickLists(Warehouse $warehouse, Product $product, ?int $locationId): void
    {
        $statuses = [
            PickList::STATUS_OPEN,
            PickList::STATUS_PICKING,
            PickList::STATUS_PICKED,
            PickList::STATUS_PACKING,
            PickList::STATUS_PACKED,
            PickList::STATUS_DISPATCHED,
            PickList::STATUS_CANCELLED,
        ];

        foreach (range(1, self::PICK_LIST_COUNT) as $i) {
            $status = $statuses[($i - 1) % count($statuses)];

            $order = DeliveryOrder::factory()->confirmed()->create([
                'code' => sprintf('DO-OUT-DEMO-%03d', $i),
                'notes' => self::TAG.' Demo delivery order.',
            ]);

            $orderItem = DeliveryOrderItem::factory()->create([
                'delivery_order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => 5 + ($i % 10),
            ]);

            $pickList = PickList::query()->create([
                'code' => sprintf('PL-DEMO-%04d', $i),
                'delivery_order_id' => $order->id,
                'warehouse_id' => $warehouse->id,
                'status' => $status,
                'generated_at' => now()->subDays($i % 20)->subHours($i % 8),
                'picked_at' => in_array($status, [PickList::STATUS_PICKED, PickList::STATUS_PACKING, PickList::STATUS_PACKED, PickList::STATUS_DISPATCHED], true)
                    ? now()->subDays(max(0, ($i % 20) - 1))
                    : null,
                'packed_at' => in_array($status, [PickList::STATUS_PACKED, PickList::STATUS_DISPATCHED], true)
                    ? now()->subDays(max(0, ($i % 20) - 2))
                    : null,
                'dispatched_at' => $status === PickList::STATUS_DISPATCHED
                    ? now()->subDays(max(0, ($i % 20) - 3))
                    : null,
                'notes' => self::TAG.' Seeded for UI pagination demo #'.$i,
            ]);

            $itemStatus = in_array($status, [PickList::STATUS_OPEN, PickList::STATUS_PICKING, PickList::STATUS_CANCELLED], true)
                ? PickListItem::STATUS_PENDING
                : PickListItem::STATUS_PICKED;

            PickListItem::query()->create([
                'pick_list_id' => $pickList->id,
                'delivery_order_item_id' => $orderItem->id,
                'product_id' => $product->id,
                'quantity_requested' => $orderItem->quantity,
                'quantity_picked' => $itemStatus === PickListItem::STATUS_PICKED ? $orderItem->quantity : 0,
                'suggested_location_id' => $locationId,
                'suggested_batch_number' => 'LOT-OUT-DEMO',
                'location_id' => $itemStatus === PickListItem::STATUS_PICKED ? $locationId : null,
                'batch_number' => $itemStatus === PickListItem::STATUS_PICKED ? 'LOT-OUT-DEMO' : null,
                'status' => $itemStatus,
                'picked_at' => $itemStatus === PickListItem::STATUS_PICKED ? now()->subDays(1) : null,
                'notes' => self::TAG.' Demo pick line.',
            ]);
        }
    }
}
