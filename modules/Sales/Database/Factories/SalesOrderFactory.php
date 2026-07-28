<?php

namespace Modules\Sales\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Sales\Models\SalesOrder;

/**
 * @extends Factory<SalesOrder>
 */
class SalesOrderFactory extends Factory
{
    protected $model = SalesOrder::class;

    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'warehouse_id' => Warehouse::factory(),
            'created_by' => null,
            'so_number' => sprintf('SO-%s-%04d', now()->format('Y'), fake()->unique()->numberBetween(1, 9999)),
            'status' => SalesOrder::STATUS_DRAFT,
            'ordered_at' => now()->toDateString(),
            'promised_at' => null,
            'notes' => null,
            'total_amount' => 0,
            'discount_total' => 0,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(['status' => SalesOrder::STATUS_CONFIRMED]);
    }

    public function partialDelivered(): static
    {
        return $this->state(['status' => SalesOrder::STATUS_PARTIAL_DELIVERED]);
    }

    public function fullyDelivered(): static
    {
        return $this->state(['status' => SalesOrder::STATUS_FULLY_DELIVERED]);
    }

    public function closed(): static
    {
        return $this->state(['status' => SalesOrder::STATUS_CLOSED]);
    }
}
