<?php

namespace Modules\Sales\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\Warehouse;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\SalesOrder;

/**
 * @extends Factory<GoodsIssueNote>
 */
class GoodsIssueNoteFactory extends Factory
{
    protected $model = GoodsIssueNote::class;

    public function definition(): array
    {
        return [
            'sales_order_id' => SalesOrder::factory()->confirmed(),
            'warehouse_id' => Warehouse::factory(),
            'issued_by' => null,
            'gin_number' => sprintf('GIN-%s-%04d', now()->format('Y'), fake()->unique()->numberBetween(1, 9999)),
            'status' => GoodsIssueNote::STATUS_DRAFT,
            'issued_at' => now()->toDateString(),
            'delivery_note_number' => null,
            'notes' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(['status' => GoodsIssueNote::STATUS_CONFIRMED]);
    }
}
