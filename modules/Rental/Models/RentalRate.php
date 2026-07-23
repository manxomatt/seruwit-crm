<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Database\Factories\RentalRateFactory;

class RentalRate extends Model
{
    /** @use HasFactory<RentalRateFactory> */
    use HasFactory;

    public const PERIOD_DAILY = 'daily';

    public const PERIOD_WEEKLY = 'weekly';

    public const PERIOD_MONTHLY = 'monthly';

    protected static function newFactory(): Factory
    {
        return RentalRateFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'vehicle_id',
        'vehicle_type',
        'name',
        'period_type',
        'rate_per_period',
        'km_limit_per_period',
        'excess_km_rate',
        'deposit_amount',
        'is_active',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'rate_per_period' => 'decimal:2',
            'excess_km_rate' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'km_limit_per_period' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
