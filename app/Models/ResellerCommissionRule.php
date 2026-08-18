<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One commission rate rule. See App\Services\ResellerCommissionResolver for the
 * precedence order these are matched in.
 *
 * @property string|null $reseller_global_id
 * @property int|null $plan_id
 * @property string $applies_to
 * @property string $type
 */
class ResellerCommissionRule extends Model
{
    public const TYPE_PERCENT = 'percent';

    public const TYPE_FLAT = 'flat';

    public const APPLIES_FIRST = 'first';

    public const APPLIES_RENEWAL = 'renewal';

    public const APPLIES_ALL = 'all';

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'reseller_global_id',
        'plan_id',
        'applies_to',
        'billing_interval',
        'type',
        'value',
        'max_occurrences',
        'starts_at',
        'ends_at',
        'priority',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'max_occurrences' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'priority' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function reseller(): BelongsTo
    {
        return $this->belongsTo(CentralUser::class, 'reseller_global_id', 'global_id');
    }

    /**
     * Rules whose validity window covers the given moment.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeEffectiveAt(Builder $query, \DateTimeInterface $moment): void
    {
        $query->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $moment))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $moment));
    }
}
