<?php

namespace Modules\DriverScoring\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DriverIncentiveRule extends Model
{
    public const PERIOD_WEEKLY = 'weekly';

    public const PERIOD_MONTHLY = 'monthly';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'period',
        'min_score',
        'min_days',
        'reward_amount',
        'reward_label',
        'is_active',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'min_score' => 'integer',
            'min_days' => 'integer',
            'reward_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<DriverIncentiveAward, $this>
     */
    public function awards(): HasMany
    {
        return $this->hasMany(DriverIncentiveAward::class);
    }
}
