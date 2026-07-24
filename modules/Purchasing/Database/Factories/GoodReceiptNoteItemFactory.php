<?php

namespace Modules\Purchasing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\GoodReceiptNoteItem;
use Modules\Purchasing\Models\PurchaseOrderItem;

/**
 * @extends Factory<GoodReceiptNoteItem>
 */
class GoodReceiptNoteItemFactory extends Factory
{
    protected $model = GoodReceiptNoteItem::class;

    public function definition(): array
    {
        return [
            'good_receipt_note_id' => GoodReceiptNote::factory(),
            'po_item_id' => PurchaseOrderItem::factory(),
            'location_id' => null,
            'quantity_received' => fake()->randomFloat(2, 1, 50),
            'batch_number' => null,
            'expiry_date' => null,
            'notes' => null,
        ];
    }
}
