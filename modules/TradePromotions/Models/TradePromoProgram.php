<?php

namespace Modules\TradePromotions\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Principal;
use Modules\Product\Models\Product;

class TradePromoProgram extends Model
{
    public const TYPE_VOLUME_DISCOUNT = 'volume_discount';

    public const TYPE_FREE_GOODS = 'free_goods';

    public const TYPE_REBATE = 'rebate';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_PAUSED = 'paused';

    public const STATUS_CLOSED = 'closed';

    public const METRIC_VOLUME = 'volume';

    public const METRIC_VALUE = 'value';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'status',
        'starts_at',
        'ends_at',
        'principal_id',
        'target_metric',
        'target_amount',
        'notes',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'target_amount' => 'decimal:2',
        ];
    }

    public static function nextCode(): string
    {
        $last = (int) static::query()->orderByDesc('id')->value('id');

        return sprintf('TP-%06d', $last + 1);
    }

    public function isActiveNow(): bool
    {
        if ($this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        $now = now();

        return $this->starts_at <= $now && $this->ends_at >= $now;
    }

    /**
     * @return HasMany<TradePromoTier, $this>
     */
    public function tiers(): HasMany
    {
        return $this->hasMany(TradePromoTier::class)->orderBy('sort_order');
    }

    /**
     * @return HasOne<TradePromoRebateRule, $this>
     */
    public function rebateRule(): HasOne
    {
        return $this->hasOne(TradePromoRebateRule::class);
    }

    /**
     * @return BelongsToMany<Partner, $this>
     */
    public function partners(): BelongsToMany
    {
        return $this->belongsToMany(Partner::class, 'trade_promo_program_partners')
            ->withTimestamps();
    }

    /**
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'trade_promo_program_products')
            ->withTimestamps();
    }

    /**
     * @return HasMany<TradePromoRealization, $this>
     */
    public function realizations(): HasMany
    {
        return $this->hasMany(TradePromoRealization::class);
    }

    /**
     * @return HasMany<TradePromoAward, $this>
     */
    public function awards(): HasMany
    {
        return $this->hasMany(TradePromoAward::class);
    }

    /**
     * @return BelongsTo<Principal, $this>
     */
    public function principal(): BelongsTo
    {
        return $this->belongsTo(Principal::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
