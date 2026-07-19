<?php

namespace Modules\Maintenance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Models\Vehicle;

class MaintenanceSchedule extends Model
{
    public const INTERVAL_MILEAGE = 'mileage';

    public const INTERVAL_CALENDAR = 'calendar';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'category_id',
        'name',
        'interval_type',
        'interval_value',
        'last_service_odometer',
        'last_service_date',
        'next_service_odometer',
        'next_service_date',
        'is_active',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'interval_value' => 'integer',
            'last_service_odometer' => 'integer',
            'last_service_date' => 'date',
            'next_service_odometer' => 'integer',
            'next_service_date' => 'date',
            'is_active' => 'boolean',
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
     * @return BelongsTo<MaintenanceCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MaintenanceCategory::class, 'category_id');
    }

    /**
     * Recalculate and persist both next-service fields after a service is
     * recorded. Call this whenever last_service_* changes.
     */
    public function recalculateNextService(): void
    {
        if ($this->interval_type === self::INTERVAL_MILEAGE) {
            $this->next_service_odometer = $this->last_service_odometer !== null
                ? $this->last_service_odometer + $this->interval_value
                : null;
            $this->next_service_date = null;
        } else {
            $this->next_service_date = $this->last_service_date !== null
                ? $this->last_service_date->addDays($this->interval_value)
                : null;
            $this->next_service_odometer = null;
        }

        $this->save();
    }
}
