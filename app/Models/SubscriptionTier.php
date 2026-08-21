<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionTier extends Model
{
    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    protected $fillable = [
        'name',
        'min_vehicles',
        'max_vehicles',
        'price_per_vehicle',
    ];

    protected function casts(): array
    {
        return [
            'min_vehicles' => 'integer',
            'max_vehicles' => 'integer',
            'price_per_vehicle' => 'decimal:2',
        ];
    }

    /**
     * Find the tier that applies to a given vehicle count.
     */
    public static function tierFor(int $vehicleCount): ?self
    {
        return self::query()
            ->where('min_vehicles', '<=', $vehicleCount)
            ->where('max_vehicles', '>=', $vehicleCount)
            ->first();
    }

    /**
     * Calculate subscription price based on vehicle count.
     */
    public static function calculatePrice(int $vehicles, string $interval = 'month'): float
    {
        $tier = self::tierFor($vehicles);

        // Fallback price if tier not found (should not happen with proper seeding)
        $pricePerUnit = $tier ? (float) $tier->price_per_vehicle : 20000.00;
        $total = $vehicles * $pricePerUnit;

        // Apply discount for annual interval (e.g. pay 10 months instead of 12)
        if ($interval === 'annual' || $interval === 'year') {
            return $total * 10;
        }

        return $total;
    }

    /**
     * Get full pricing breakdown for a given vehicle count.
     */
    public static function priceBreakdown(int $vehicleCount, string $interval = 'month'): array
    {
        $tier = self::tierFor($vehicleCount);

        return [
            'vehicle_count' => $vehicleCount,
            'tier_id' => $tier?->id,
            'tier_name' => $tier?->name,
            'price_per_vehicle' => $tier?->price_per_vehicle,
            'total_price' => self::calculatePrice($vehicleCount, $interval),
            'discount_percent' => $tier ? self::getDiscountPercent((float) $tier->price_per_vehicle) : 0,
        ];
    }

    /**
     * Calculate discount percentage relative to Tier 1 price (20000).
     */
    private static function getDiscountPercent(float $price): float
    {
        $basePrice = 20000.00;
        if ($price >= $basePrice) {
            return 0;
        }

        return round((1 - ($price / $basePrice)) * 100, 2);
    }
}
