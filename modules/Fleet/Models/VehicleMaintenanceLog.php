<?php

namespace Modules\Fleet\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Database\Factories\VehicleMaintenanceLogFactory;

class VehicleMaintenanceLog extends Model
{
    /** @use HasFactory<VehicleMaintenanceLogFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return VehicleMaintenanceLogFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'vehicle_id',
        'type',
        'description',
        'scheduled_date',
        'completed_date',
        'cost',
        'odometer_km',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'completed_date' => 'date',
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
}
