<?php

namespace Modules\Routing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\TransportationManagement\Models\Trip;

class RoutePlanRoute extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'route_plan_id',
        'sequence',
        'vehicle_id',
        'driver_id',
        'trip_id',
        'load_kg',
        'estimated_distance_km',
        'estimated_cost',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sequence' => 'integer',
            'load_kg' => 'decimal:2',
            'estimated_distance_km' => 'decimal:2',
            'estimated_cost' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<RoutePlan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(RoutePlan::class, 'route_plan_id');
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * Opaque link — Transportation owns trips; no FK so Routing uninstall stays safe.
     *
     * @return BelongsTo<Trip, $this>
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    /**
     * @return HasMany<RoutePlanStop, $this>
     */
    public function stops(): HasMany
    {
        return $this->hasMany(RoutePlanStop::class)->orderBy('sequence');
    }
}
