<?php

namespace Modules\Sales\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Sales\Models\GoodsIssueNote;
use Modules\Sales\Models\GoodsIssueNoteItem;
use Modules\Sales\Models\SalesOrderItem;

/**
 * @extends Factory<GoodsIssueNoteItem>
 */
class GoodsIssueNoteItemFactory extends Factory
{
    protected $model = GoodsIssueNoteItem::class;

    public function definition(): array
    {
        return [
            'goods_issue_note_id' => GoodsIssueNote::factory(),
            'so_item_id' => SalesOrderItem::factory(),
            'location_id' => null,
            'quantity_issued' => fake()->randomFloat(2, 1, 50),
            'batch_number' => null,
            'expiry_date' => null,
            'notes' => null,
        ];
    }
}
