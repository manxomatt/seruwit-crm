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
     * Calculate subscription price based on vehicle count.
     */
    public static function calculatePrice(int $vehicles, string $interval = 'month'): float
    {
        $tier = self::query()
            ->where('min_vehicles', '<=', $vehicles)
            ->where('max_vehicles', '>=', $vehicles)
            ->first();

        // Fallback price if tier not found (should not happen with proper seeding)
        $pricePerUnit = $tier ? (float) $tier->price_per_vehicle : 20000.00;
        $total = $vehicles * $pricePerUnit;

        // Apply discount for annual interval (e.g. pay 10 months instead of 12)
        if ($interval === 'annual' || $interval === 'year') {
            return $total * 10;
        }

        return $total;
    }
}
