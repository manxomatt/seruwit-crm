<?php

namespace Modules\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Database\Factories\FleetBaseFactory;
use Modules\Fleet\Support\FleetBaseKind;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Location;

class FleetBase extends Model
{
    /** @use HasFactory<FleetBaseFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'kind',
        'status',
        'address',
        'city',
        'province',
        'zip',
        'latitude',
        'longitude',
        'phone',
        'email',
        'opens_at',
        'closes_at',
        'timezone',
        'vehicle_capacity',
        'allows_overnight',
        'service_radius_km',
        'manager_id',
        'location_id',
        'warehouse_id',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kind' => FleetBaseKind::class,
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'vehicle_capacity' => 'integer',
            'allows_overnight' => 'boolean',
            'service_radius_km' => 'decimal:2',
            'manager_id' => 'integer',
            'location_id' => 'integer',
            'warehouse_id' => 'integer',
        ];
    }

    protected static function newFactory(): Factory
    {
        return FleetBaseFactory::new();
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * @return HasMany<Vehicle, $this>
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'home_base_id');
    }

    /**
     * Users assigned for scoped base access (fleet_base_head / fleet_base_manager).
     *
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_fleet_base')->withTimestamps();
    }

    /**
     * @return BelongsTo<Location, $this>|null
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @param  Builder<FleetBase>  $query
     * @return Builder<FleetBase>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * @param  Builder<FleetBase>  $query
     * @return Builder<FleetBase>
     */
    public function scopeOfKind(Builder $query, FleetBaseKind|string $kind): Builder
    {
        $value = $kind instanceof FleetBaseKind ? $kind->value : $kind;

        return $query->where('kind', $value);
    }

    public function displayAddress(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->province,
            $this->zip,
        ], fn ($part) => filled($part));

        return implode(', ', $parts) ?: $this->name;
    }

    public static function locationOptionsAvailable(): bool
    {
        return class_exists(Location::class) && Schema::hasTable('locations');
    }

    public static function warehouseOptionsAvailable(): bool
    {
        return class_exists(Warehouse::class) && Schema::hasTable('warehouses');
    }
}
