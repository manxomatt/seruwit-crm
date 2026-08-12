<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Rental\Database\Factories\RentalRateTierFactory;

class RentalRateTier extends Model
{
    /** @use HasFactory<RentalRateTierFactory> */
    use HasFactory;

    public const TIER_PERIOD_VOLUME = 'period_volume';

    public const TIER_LOYALTY_COUNT = 'loyalty_count';

    protected static function newFactory(): Factory
    {
        return RentalRateTierFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'rental_rate_id',
        'tier_type',
        'min_threshold',
        'max_threshold',
        'rate_per_period',
        'discount_percent',
        'discount_flat',
        'priority',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'min_threshold' => 'integer',
            'max_threshold' => 'integer',
            'rate_per_period' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'discount_flat' => 'decimal:2',
            'priority' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<RentalRate, $this> */
    public function rentalRate(): BelongsTo
    {
        return $this->belongsTo(RentalRate::class);
    }

    public function matches(int $value): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($value < $this->min_threshold) {
            return false;
        }

        if ($this->max_threshold !== null && $value > $this->max_threshold) {
            return false;
        }

        return true;
    }

    /**
     * Apply this tier to a current rate, or return current if no modifier set.
     */
    public function apply(float $currentRate): float
    {
        if ($this->rate_per_period !== null) {
            return (float) $this->rate_per_period;
        }

        if ($this->discount_percent !== null) {
            return round($currentRate * (1 - ((float) $this->discount_percent / 100)), 2);
        }

        if ($this->discount_flat !== null) {
            return round(max(0.0, $currentRate - (float) $this->discount_flat), 2);
        }

        return $currentRate;
    }

    /**
     * Summary label for UI / breakdown snapshots.
     */
    public function summaryLabel(): string
    {
        if ($this->rate_per_period !== null) {
            $prefix = $this->tier_type === self::TIER_PERIOD_VOLUME ? 'Period ' : 'Loyalty ';
            $range = $this->max_threshold
                ? "{$this->min_threshold}-{$this->max_threshold}"
                : "{$this->min_threshold}+";

            return "{$prefix}{$range} Fixed";
        }

        if ($this->discount_percent !== null) {
            $prefix = $this->tier_type === self::TIER_PERIOD_VOLUME ? 'Period ' : 'Loyalty ';
            $range = $this->max_threshold
                ? "{$this->min_threshold}-{$this->max_threshold}"
                : "{$this->min_threshold}+";

            return "{$prefix}{$range} -{$this->discount_percent}%";
        }

        if ($this->discount_flat !== null) {
            $prefix = $this->tier_type === self::TIER_PERIOD_VOLUME ? 'Period ' : 'Loyalty ';
            $range = $this->max_threshold
                ? "{$this->min_threshold}-{$this->max_threshold}"
                : "{$this->min_threshold}+";

            return "{$prefix}{$range} -Rp".number_format((float) $this->discount_flat, 0, ',', '.');
        }

        return $this->tier_type === self::TIER_PERIOD_VOLUME ? 'Period Tier' : 'Loyalty Tier';
    }
}
