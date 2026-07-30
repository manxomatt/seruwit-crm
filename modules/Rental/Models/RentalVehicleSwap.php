<?php

namespace Modules\Rental\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Fleet\Models\Vehicle;

class RentalVehicleSwap extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'rental_id',
        'from_vehicle_id',
        'to_vehicle_id',
        'odometer_km',
        'notes',
        'swapped_by',
        'swapped_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'odometer_km' => 'integer',
            'swapped_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Rental, $this> */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function fromVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'from_vehicle_id');
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function toVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'to_vehicle_id');
    }

    /** @return BelongsTo<User, $this> */
    public function swappedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'swapped_by');
    }
}
