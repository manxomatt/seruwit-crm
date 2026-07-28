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

    public const DEPOSIT_HELD = 'held';

    public const DEPOSIT_SETTLED = 'settled';

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
        'late_fee_per_day',
        'deposit_amount',
        'total_periods',
        'base_amount',
        'start_odometer',
        'start_fuel_level',
        'checkout_checklist',
        'checkout_notes',
        'end_odometer',
        'end_fuel_level',
        'return_checklist',
        'return_notes',
        'excess_km',
        'excess_amount',
        'overdue_days',
        'late_fee_amount',
        'deposit_returned',
        'deposit_status',
        'deposit_applied_amount',
        'deposit_refunded_amount',
        'deposit_settled_at',
        'total_amount',
        'notes',
        'pickup_location',
        'return_location',
        'fuel_policy_notes',
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
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'actual_return_date' => 'date:Y-m-d',
            'rate_per_period' => 'decimal:2',
            'excess_km_rate' => 'decimal:2',
            'late_fee_per_day' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'base_amount' => 'decimal:2',
            'excess_amount' => 'decimal:2',
            'late_fee_amount' => 'decimal:2',
            'deposit_applied_amount' => 'decimal:2',
            'deposit_refunded_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'km_limit_per_period' => 'integer',
            'total_periods' => 'integer',
            'start_odometer' => 'integer',
            'end_odometer' => 'integer',
            'excess_km' => 'integer',
            'overdue_days' => 'integer',
            'deposit_returned' => 'boolean',
            'checkout_checklist' => 'array',
            'return_checklist' => 'array',
            'confirmed_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'returned_at' => 'datetime',
            'completed_at' => 'datetime',
            'deposit_settled_at' => 'datetime',
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

    /** @return HasMany<RentalCharge, $this> */
    public function charges(): HasMany
    {
        return $this->hasMany(RentalCharge::class)->orderBy('id');
    }

    public function isDepositSettled(): bool
    {
        return $this->deposit_status === self::DEPOSIT_SETTLED
            || (float) $this->deposit_amount <= 0;
    }

    /**
     * Recalculate rental total from base, excess KM, late fees, and damages.
     */
    public function recalculateTotalAmount(): void
    {
        $damagesTotal = (float) $this->damages()->sum('amount');

        $this->update([
            'total_amount' => round(
                (float) $this->base_amount
                + (float) $this->excess_amount
                + (float) $this->late_fee_amount
                + $damagesTotal,
                2
            ),
        ]);
    }

    /**
     * Effective late fee per day: explicit snapshot, else daily rate for daily rentals.
     */
    public function resolveLateFeePerDay(): float
    {
        if ($this->late_fee_per_day !== null) {
            return (float) $this->late_fee_per_day;
        }

        if ($this->period_type === 'daily') {
            return (float) $this->rate_per_period;
        }

        return 0.0;
    }

    /**
     * Days past scheduled end date (0 when returned on time or early).
     */
    public static function computeOverdueDays(string $endDate, string $actualReturnDate): int
    {
        $end = \Carbon\Carbon::parse($endDate)->startOfDay();
        $actual = \Carbon\Carbon::parse($actualReturnDate)->startOfDay();

        if ($actual->lte($end)) {
            return 0;
        }

        return (int) $end->diffInDays($actual);
    }

    /**
     * @param  array{deposit_applied_amount: float|int|string, deposit_refunded_amount: float|int|string}  $amounts
     */
    public function settleDeposit(array $amounts): void
    {
        $applied = round((float) $amounts['deposit_applied_amount'], 2);
        $refunded = round((float) $amounts['deposit_refunded_amount'], 2);

        $this->update([
            'deposit_status' => self::DEPOSIT_SETTLED,
            'deposit_applied_amount' => $applied,
            'deposit_refunded_amount' => $refunded,
            'deposit_returned' => $applied < 0.009 && abs($refunded - (float) $this->deposit_amount) < 0.009,
            'deposit_settled_at' => now(),
        ]);
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
            $reasons[] = __('rental.validation.vehicle_not_active', [
                'name' => $vehicle->name,
                'status' => $vehicle->status,
            ]);
        }

        if (self::hasOverlapFor($vehicle->id, $start, $end, $excludingId)) {
            $reasons[] = __('rental.validation.vehicle_rental_overlap', ['name' => $vehicle->name]);
        }

        if ($vehicle->stnk_expires_at && $vehicle->stnk_expires_at->isPast()) {
            $reasons[] = __('rental.validation.vehicle_stnk_expired', ['name' => $vehicle->name]);
        }

        if ($vehicle->kir_expires_at && $vehicle->kir_expires_at->isPast()) {
            $reasons[] = __('rental.validation.vehicle_kir_expired', ['name' => $vehicle->name]);
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
