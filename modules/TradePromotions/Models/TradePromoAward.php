<?php

namespace Modules\TradePromotions\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;

class TradePromoAward extends Model
{
    public const TYPE_DISCOUNT = 'discount';

    public const TYPE_FREE_GOODS = 'free_goods';

    public const TYPE_REBATE = 'rebate';

    public const STATUS_ACCRUED = 'accrued';

    public const STATUS_CLAIMED = 'claimed';

    public const STATUS_SETTLED = 'settled';

    public const STATUS_VOID = 'void';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'trade_promo_program_id',
        'trade_promo_realization_id',
        'partner_id',
        'award_type',
        'amount',
        'free_product_id',
        'free_qty',
        'status',
        'settled_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'free_qty' => 'decimal:2',
            'settled_at' => 'datetime',
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
     * @return BelongsTo<TradePromoRealization, $this>
     */
    public function realization(): BelongsTo
    {
        return $this->belongsTo(TradePromoRealization::class, 'trade_promo_realization_id');
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function freeProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'free_product_id');
    }
}
