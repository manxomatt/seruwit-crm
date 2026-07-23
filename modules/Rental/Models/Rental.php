<?php

namespace Modules\Rental\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Database\Factories\RentalFactory;

class Rental extends Model
{
    /** @use HasFactory<RentalFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_RETURNED = 'returned';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected static function newFactory(): Factory
    {
        return RentalFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'code',
        'vehicle_id',
        'driver_id',
        'partner_id',
        'status',
        'start_date',
        'end_date',
        'actual_return_date',
        'period_type',
        'rate_per_period',
        'km_limit_per_period',
        'excess_km_rate',
        'deposit_amount',
        'total_periods',
        'base_amount',
        'start_odometer',
        'end_odometer',
        'excess_km',
        'excess_amount',
        'deposit_returned',
        'total_amount',
        'notes',
        'cancelled_reason',
        'confirmed_by',
        'confirmed_at',
        'checked_out_at',
        'returned_at',
        'completed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'actual_return_date' => 'date',
            'rate_per_period' => 'decimal:2',
            'excess_km_rate' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'base_amount' => 'decimal:2',
            'excess_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'km_limit_per_period' => 'integer',
            'total_periods' => 'integer',
            'start_odometer' => 'integer',
            'end_odometer' => 'integer',
            'excess_km' => 'integer',
            'deposit_returned' => 'boolean',
            'confirmed_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'returned_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /** @return BelongsTo<Driver, $this> */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<User, $this> */
    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /** @return HasMany<RentalExtension, $this> */
    public function extensions(): HasMany
    {
        return $this->hasMany(RentalExtension::class)->latest();
    }

    /** @return HasMany<RentalDamage, $this> */
    public function damages(): HasMany
    {
        return $this->hasMany(RentalDamage::class)->orderBy('reported_at');
    }

    /**
     * Whether this rental is overdue — active past its scheduled end date.
     * Computed from current date; never stored as a column.
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && now()->toDateString() > $this->end_date->toDateString();
    }

    /**
     * Rentals that are blocking vehicle availability: confirmed or active.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->whereIn('status', [self::STATUS_CONFIRMED, self::STATUS_ACTIVE]);
    }

    /**
     * Whether vehicle $id has a confirmed/active rental overlapping [$start, $end],
     * optionally excluding a specific rental (for updates).
     */
    public static function hasOverlapFor(int $vehicleId, string $start, string $end, ?int $excludingId = null): bool
    {
        return static::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', [self::STATUS_CONFIRMED, self::STATUS_ACTIVE])
            ->where('start_date', '<=', $end)
            ->where('end_date', '>=', $start)
            ->when($excludingId, fn (Builder $q) => $q->where('id', '!=', $excludingId))
            ->exists();
    }

    /**
     * Reasons a vehicle cannot be rented for [$start, $end], empty when it can.
     *
     * Reads Fleet's own columns (status, STNK/KIR expiry) — downward dependency,
     * Fleet stays ignorant of Rental. Also checks for Trip conflicts when the
     * Transportation module is installed, via Modules::available() guard.
     *
     * @return list<string>
     */
    public static function vehicleAvailabilityReasons(Vehicle $vehicle, string $start, string $end, ?int $excludingId = null): array
    {
        $reasons = [];

        if ($vehicle->status !== Vehicle::STATUS_ACTIVE) {
            $reasons[] = "Vehicle {$vehicle->name} is {$vehicle->status}, not active.";
        }

        if (self::hasOverlapFor($vehicle->id, $start, $end, $excludingId)) {
            $reasons[] = "Vehicle {$vehicle->name} already has a rental in this period.";
        }

        if ($vehicle->stnk_expires_at && $vehicle->stnk_expires_at->isPast()) {
            $reasons[] = "Vehicle {$vehicle->name} has an expired STNK.";
        }

        if ($vehicle->kir_expires_at && $vehicle->kir_expires_at->isPast()) {
            $reasons[] = "Vehicle {$vehicle->name} has an expired KIR.";
        }

        return $reasons;
    }

    /**
     * Auto-increment human-readable code, e.g. RENT-000001.
     */
    public static function nextCode(): string
    {
        $lastId = (int) static::query()->orderByDesc('id')->value('id');

        return sprintf('RENT-%06d', $lastId + 1);
    }

    /**
     * Compute total periods between two dates for a given period type.
     */
    public static function computePeriods(string $start, string $end, string $periodType): int
    {
        $startDate = \Carbon\Carbon::parse($start);
        $endDate = \Carbon\Carbon::parse($end);

        return match ($periodType) {
            'daily' => (int) $startDate->diffInDays($endDate) + 1,
            'weekly' => (int) ceil(($startDate->diffInDays($endDate) + 1) / 7),
            'monthly' => (int) $startDate->diffInMonths($endDate) + 1,
            default => 1,
        };
    }
}
