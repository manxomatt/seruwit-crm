<?php

namespace Modules\Canvassing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Models\Product;

class CanvassingVisitOrderItem extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'canvassing_visit_id',
        'product_id',
        'quantity',
        'unit_price',
        'unit',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<CanvassingVisit, $this> */
    public function visit(): BelongsTo
    {
        return $this->belongsTo(CanvassingVisit::class, 'canvassing_visit_id');
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
