<?php

namespace Modules\TradePromotions\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradePromoRebateRule extends Model
{
    public const BASIS_QTY = 'qty';

    public const BASIS_NET_VALUE = 'net_value';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'trade_promo_program_id',
        'rebate_percent',
        'rebate_per_unit',
        'calc_basis',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rebate_percent' => 'decimal:2',
            'rebate_per_unit' => 'decimal:4',
        ];
    }

    /**
     * @return BelongsTo<TradePromoProgram, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(TradePromoProgram::class, 'trade_promo_program_id');
    }
}
