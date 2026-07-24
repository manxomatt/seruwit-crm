<?php

namespace Modules\TradePromotions\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Models\Product;

class TradePromoTier extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'trade_promo_program_id',
        'sort_order',
        'min_qty',
        'min_value',
        'discount_percent',
        'discount_amount',
        'free_product_id',
        'free_qty',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'min_qty' => 'decimal:2',
            'min_value' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'free_qty' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<TradePromoProgram, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(TradePromoProgram::class, 'trade_promo_program_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function freeProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'free_product_id');
    }
}
