<?php

namespace Modules\Purchasing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Purchasing\Models\PurchaseOrder;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    protected $model = PurchaseOrder::class;

    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory()->supplier(),
            'warehouse_id' => Warehouse::factory(),
            'created_by' => null,
            'po_number' => sprintf('PO-%s-%04d', now()->format('Y'), fake()->unique()->numberBetween(1, 9999)),
            'status' => PurchaseOrder::STATUS_DRAFT,
            'ordered_at' => now()->toDateString(),
            'expected_at' => null,
            'notes' => null,
            'total_amount' => 0,
        ];
    }

    public function submitted(): static
    {
        return $this->state(['status' => PurchaseOrder::STATUS_SUBMITTED]);
    }

    public function approved(): static
    {
        return $this->state(['status' => PurchaseOrder::STATUS_APPROVED]);
    }
}
