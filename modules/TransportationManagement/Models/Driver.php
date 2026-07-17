<?php

namespace Modules\TransportationManagement\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\TransportationManagement\Database\Factories\DriverFactory;

class Driver extends Model
{
    /** @use HasFactory<DriverFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return DriverFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'license_number',
        'license_type',
        'license_expires_at',
        'phone',
        'email',
        'status',
        'photo_url',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'license_expires_at' => 'date',
        ];
    }

    /**
     * @return HasMany<Trip, $this>
     */
    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    /**
     * A driver already committed to a scheduled or in-progress trip cannot
     * take on another one until that trip finishes or is cancelled.
     */
    public function hasActiveTrip(?int $excludingTripId = null): bool
    {
        return $this->trips()
            ->whereIn('status', [Trip::STATUS_SCHEDULED, Trip::STATUS_IN_PROGRESS])
            ->when($excludingTripId, fn ($query) => $query->where('id', '!=', $excludingTripId))
            ->exists();
    }
}
