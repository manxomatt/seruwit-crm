<?php

namespace Modules\Purchasing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\Warehouse;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;

/**
 * @extends Factory<GoodReceiptNote>
 */
class GoodReceiptNoteFactory extends Factory
{
    protected $model = GoodReceiptNote::class;

    public function definition(): array
    {
        return [
            'purchase_order_id' => PurchaseOrder::factory()->approved(),
            'warehouse_id' => Warehouse::factory(),
            'received_by' => null,
            'grn_number' => sprintf('GRN-%s-%04d', now()->format('Y'), fake()->unique()->numberBetween(1, 9999)),
            'status' => GoodReceiptNote::STATUS_DRAFT,
            'received_at' => now()->toDateString(),
            'supplier_do_number' => null,
            'notes' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(['status' => GoodReceiptNote::STATUS_CONFIRMED]);
    }
}
