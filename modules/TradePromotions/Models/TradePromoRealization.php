<?php

namespace Modules\TradePromotions\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Partners\Models\Partner;

class TradePromoRealization extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_ACHIEVED = 'achieved';

    public const STATUS_CLOSED = 'closed';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'trade_promo_program_id',
        'partner_id',
        'realized_qty',
        'realized_value',
        'target_qty',
        'target_value',
        'achievement_percent',
        'status',
        'last_synced_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'realized_qty' => 'decimal:2',
            'realized_value' => 'decimal:2',
            'target_qty' => 'decimal:2',
            'target_value' => 'decimal:2',
            'achievement_percent' => 'decimal:2',
            'last_synced_at' => 'datetime',
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
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return HasMany<TradePromoAward, $this>
     */
    public function awards(): HasMany
    {
        return $this->hasMany(TradePromoAward::class);
    }
}
