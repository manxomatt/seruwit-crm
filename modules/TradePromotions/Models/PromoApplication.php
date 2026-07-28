<?php

namespace Modules\TradePromotions\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Models\Product;

class PromoApplication extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'trade_promo_program_id',
        'source_type',
        'source_id',
        'product_id',
        'discount_amount',
        'meta',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount_amount' => 'decimal:2',
            'meta' => 'array',
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
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
