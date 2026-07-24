<?php

namespace Modules\DriverScoring\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Models\Driver;

class DriverIncentiveAward extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PAID = 'paid';

    public const STATUS_REJECTED = 'rejected';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'driver_incentive_rule_id',
        'driver_id',
        'period_start',
        'period_end',
        'average_score',
        'scored_days',
        'reward_amount',
        'status',
        'awarded_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'average_score' => 'decimal:2',
            'scored_days' => 'integer',
            'reward_amount' => 'decimal:2',
            'awarded_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<DriverIncentiveRule, $this>
     */
    public function rule(): BelongsTo
    {
        return $this->belongsTo(DriverIncentiveRule::class, 'driver_incentive_rule_id');
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
