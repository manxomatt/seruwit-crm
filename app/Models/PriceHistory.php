<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceHistory extends Model
{
    protected $fillable = [
        'subscription_tier_id',
        'old_price_per_vehicle',
        'new_price_per_vehicle',
        'change_reason',
        'effective_date',
    ];

    protected $casts = [
        'old_price_per_vehicle' => 'integer',
        'new_price_per_vehicle' => 'integer',
        'effective_date' => 'datetime',
    ];

    public function subscriptionTier(): BelongsTo
    {
        return $this->belongsTo(SubscriptionTier::class);
    }

    public function getPriceIncreaseAttribute(): int
    {
        if (! $this->old_price_per_vehicle) {
            return 0;
        }

        return $this->new_price_per_vehicle - $this->old_price_per_vehicle;
    }

    public function getPercentageChangeAttribute(): float
    {
        if (! $this->old_price_per_vehicle) {
            return 0;
        }

        return (($this->new_price_per_vehicle - $this->old_price_per_vehicle) / $this->old_price_per_vehicle) * 100;
    }

    public function isIncrease(): bool
    {
        return $this->getPriceIncreaseAttribute() > 0;
    }

    public function isDecrease(): bool
    {
        return $this->getPriceIncreaseAttribute() < 0;
    }
}
