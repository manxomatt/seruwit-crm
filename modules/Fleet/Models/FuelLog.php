<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\TransportationManagement\Database\Factories\FuelLogFactory;

class FuelLog extends Model
{
    /** @use HasFactory<FuelLogFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return FuelLogFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'trip_id',
        'filled_at',
        'liters',
        'cost',
        'odometer_km',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'filled_at' => 'date',
            'liters' => 'decimal:2',
            'cost' => 'decimal:2',
            'odometer_km' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<Trip, $this>
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}
