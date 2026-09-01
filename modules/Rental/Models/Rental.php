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

    public const STATUS_PENDING = 'pending';

    public const STATUS_PENDING_RESERVED = 'pending_reserved';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_RETURNED = 'returned';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_CANCELLED_PAID = 'cancelled_paid';

    public const STATUS_NO_SHOW = 'no_show';

    public const STATUS_NO_SHOW_PAID = 'no_show_paid';

    public const CHANNEL_STAFF = 'staff';

    public const CHANNEL_MOBILE = 'mobile';

    public const CHANNEL_WEB = 'web';

    public const DEPOSIT_HELD = 'held';

    public const DEPOSIT_SETTLED = 'settled';

    public const PROOF_PENDING = 'pending';

    public const PROOF_APPROVED = 'approved';

    public const PROOF_REJECTED = 'rejected';

    protected static function newFactory(): Factory
    {
        return RentalFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'code',
        'channel',
        'vehicle_id',
        'driver_id',
        'partner_id',
        'booker_phone',
        'public_token',
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
        'checkout_photos',
        'checkout_signature_path',
        'checkout_staff_signature_path',
        'checkout_signed_at',
        'end_odometer',
        'end_fuel_level',
        'return_checklist',
        'return_notes',
        'return_photos',
        'return_signature_path',
        'return_signed_at',
        'excess_km',
        'excess_amount',
        'overdue_days',
        'late_fee_amount',
        'deposit_returned',
        'deposit_status',
        'deposit_applied_amount',
        'deposit_refunded_amount',
        'deposit_settled_at',
        'deposit_received_at',
        'deposit_payment_method',
        'deposit_company_bank_account_id',
        'deposit_proof_path',
        'deposit_proof_uploaded_at',
        'deposit_proof_status',
        'deposit_proof_approved_by',
        'deposit_proof_approved_at',
        'deposit_proof_rejected_reason',
        'pickup_requested_at',
        'pickup_request_status',
        'pickup_customer_signature_path',
        'pickup_terms_agreed',
        'pickup_notes',
        'total_amount',
        'notes',
        'passenger_ktp_path',
        'passenger_sim_path',
        'ai_kyc_assessment',
        'pickup_location',
        'return_location',
        'pickup_location_id',
        'return_location_id',
        'pickup_fleet_base_id',
        'return_fleet_base_id',
        'one_way_fee_amount',
        'insurance_package_id',
        'fuel_policy_notes',
        'cancelled_reason',
        'cancelled_at',
        'no_show_at',
        'confirmed_by',
        'confirmed_at',
        'reserved_until',
        'checked_out_at',
        'returned_at',
        'completed_at',
        'applied_period_tier_id',
        'applied_loyalty_tier_id',
        'period_pricing_snapshot',
        'tier_discount_amount',
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
            'one_way_fee_amount' => 'decimal:2',
            'km_limit_per_period' => 'integer',
            'total_periods' => 'integer',
            'start_odometer' => 'integer',
            'end_odometer' => 'integer',
            'excess_km' => 'integer',
            'overdue_days' => 'integer',
            'deposit_returned' => 'boolean',
            'ai_kyc_assessment' => 'array',
            'checkout_checklist' => 'array',
            'return_checklist' => 'array',
            'checkout_photos' => 'array',
            'return_photos' => 'array',
            'checkout_signed_at' => 'datetime',
            'return_signed_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'reserved_until' => 'datetime',
            'cancelled_at' => 'datetime',
            'no_show_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'returned_at' => 'datetime',
            'completed_at' => 'datetime',
            'deposit_settled_at' => 'datetime',
            'deposit_received_at' => 'datetime',
            'pickup_requested_at' => 'datetime',
            'pickup_terms_agreed' => 'boolean',
            'deposit_proof_uploaded_at' => 'datetime',
            'deposit_proof_approved_at' => 'datetime',
            'deposit_proof_approved_by' => 'integer',
            'deposit_company_bank_account_id' => 'integer',
            'pickup_location_id' => 'integer',
            'return_location_id' => 'integer',
            'pickup_fleet_base_id' => 'integer',
            'return_fleet_base_id' => 'integer',
            'insurance_package_id' => 'integer',
            'applied_period_tier_id' => 'integer',
            'applied_loyalty_tier_id' => 'integer',
            'period_pricing_snapshot' => 'array',
            'tier_discount_amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /** @return BelongsTo<RentalRateTier, $this> */
    public function appliedPeriodTier(): BelongsTo
    {
        return $this->belongsTo(RentalRateTier::class, 'applied_period_tier_id');
    }

    /** @return BelongsTo<RentalRateTier, $this> */
    public function appliedLoyaltyTier(): BelongsTo
    {
        return $this->belongsTo(RentalRateTier::class, 'applied_loyalty_tier_id');
    }

    /** @return BelongsTo<\Modules\Partners\Models\Location, $this> */
    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(\Modules\Partners\Models\Location::class, 'pickup_location_id');
    }

    /** @return BelongsTo<\Modules\Partners\Models\Location, $this> */
    public function returnLocation(): BelongsTo
    {
        return $this->belongsTo(\Modules\Partners\Models\Location::class, 'return_location_id');
    }

    /** @return BelongsTo<\Modules\Fleet\Models\FleetBase, $this> */
    public function pickupFleetBase(): BelongsTo
    {
        return $this->belongsTo(\Modules\Fleet\Models\FleetBase::class, 'pickup_fleet_base_id');
    }

    /** @return BelongsTo<\Modules\Fleet\Models\FleetBase, $this> */
    public function returnFleetBase(): BelongsTo
    {
        return $this->belongsTo(\Modules\Fleet\Models\FleetBase::class, 'return_fleet_base_id');
    }

    /** @return BelongsTo<RentalInsurancePackage, $this> */
    public function insurancePackage(): BelongsTo
    {
        return $this->belongsTo(RentalInsurancePackage::class, 'insurance_package_id');
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

    /** @return BelongsTo<\Modules\Accounting\Models\CompanyBankAccount, $this> */
    public function depositCompanyBankAccount(): BelongsTo
    {
        return $this->belongsTo(\Modules\Accounting\Models\CompanyBankAccount::class, 'deposit_company_bank_account_id');
    }

    /** @return HasMany<RentalExtension, $this> */
    public function extensions(): HasMany
    {
        return $this->hasMany(RentalExtension::class)->latest();
    }

    /** @return HasMany<RentalExtensionRequest, $this> */
    public function extensionRequests(): HasMany
    {
        return $this->hasMany(RentalExtensionRequest::class)->latest();
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

    /** @return HasMany<RentalVehicleSwap, $this> */
    public function vehicleSwaps(): HasMany
    {
        return $this->hasMany(RentalVehicleSwap::class)->latest('swapped_at');
    }

    /** @return HasMany<RentalAiInspection, $this> */
    public function aiInspections(): HasMany
    {
        return $this->hasMany(RentalAiInspection::class)->latest();
    }

    /** @return \Illuminate\Database\Eloquent\Relations\HasOne<RentalAiInspection, $this> */
    public function latestAiInspection(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(RentalAiInspection::class)->latestOfMany();
    }

    public function isDepositSettled(): bool
    {
        return $this->deposit_status === self::DEPOSIT_SETTLED
            || (float) $this->deposit_amount <= 0;
    }

    /**
     * Recalculate rental total from base, excess KM, late fees, damages, and add-ons.
     */
    public function recalculateTotalAmount(): void
    {
        $damagesTotal = (float) $this->damages()->sum('amount');
        $addonsTotal = (float) $this->charges()
            ->where('kind', RentalCharge::KIND_ADDON)
            ->sum('amount');

        $this->update([
            'total_amount' => round(
                (float) $this->base_amount
                    + (float) $this->excess_amount
                    + (float) $this->late_fee_amount
                    + $damagesTotal
                    + $addonsTotal,
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

    public function isDepositReceived(): bool
    {
        return (float) $this->deposit_amount < 0.005
            || $this->deposit_received_at !== null;
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
     * Statuses that reserve / occupy the vehicle calendar.
     *
     * @return list<string>
     */
    public static function blockingStatuses(): array
    {
        return [
            self::STATUS_PENDING_RESERVED,
            self::STATUS_CONFIRMED,
            self::STATUS_ACTIVE,
        ];
    }

    /**
     * Self-serve passenger channels (Capacitor app + public web PWA).
     *
     * @return list<string>
     */
    public static function passengerChannels(): array
    {
        return [
            self::CHANNEL_MOBILE,
            self::CHANNEL_WEB,
        ];
    }

    /**
     * @return list<string>
     */
    public static function confirmableStatuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_PENDING,
            self::STATUS_PENDING_RESERVED,
        ];
    }

    /**
     * @return list<string>
     */
    public static function cancellableStatuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_PENDING,
            self::STATUS_PENDING_RESERVED,
            self::STATUS_CONFIRMED,
        ];
    }

    /**
     * @return list<string>
     */
    public static function editableStatuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_PENDING,
            self::STATUS_PENDING_RESERVED,
            self::STATUS_CONFIRMED,
        ];
    }

    /**
     * All filterable lifecycle statuses (HQ-style + internal returned).
     *
     * @return list<string>
     */
    public static function allStatuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_PENDING,
            self::STATUS_PENDING_RESERVED,
            self::STATUS_CONFIRMED,
            self::STATUS_ACTIVE,
            self::STATUS_RETURNED,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
            self::STATUS_CANCELLED_PAID,
            self::STATUS_NO_SHOW,
            self::STATUS_NO_SHOW_PAID,
        ];
    }

    /**
     * Rentals that are blocking vehicle availability.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->whereIn('status', self::blockingStatuses());
    }

    /**
     * Currently checked out (on hire).
     *
     * @param  Builder<self>  $query
     */
    public function scopeCheckedOut(Builder $query): void
    {
        $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Active past scheduled end date.
     *
     * @param  Builder<self>  $query
     */
    public function scopeOverdue(Builder $query): void
    {
        $query->where('status', self::STATUS_ACTIVE)
            ->whereDate('end_date', '<', now()->toDateString());
    }

    /**
     * Reservations with a manual transfer proof uploaded that is still awaiting
     * a staff approve/reject decision — the work behind the sidebar badge.
     *
     * @param  Builder<self>  $query
     */
    public function scopeAwaitingApproval(Builder $query): void
    {
        $query->where('deposit_proof_status', self::PROOF_PENDING);
    }

    /**
     * Active rentals ending within the next $days (inclusive of today).
     *
     * @param  Builder<self>  $query
     */
    public function scopeEndingSoon(Builder $query, int $days = 3): void
    {
        $query->where('status', self::STATUS_ACTIVE)
            ->whereDate('end_date', '>=', now()->toDateString())
            ->whereDate('end_date', '<=', now()->addDays($days)->toDateString());
    }

    /**
     * Whether vehicle $id has a blocking rental overlapping [$start, $end],
     * optionally excluding a specific rental (for updates).
     */
    public static function hasOverlapFor(int $vehicleId, string $start, string $end, ?int $excludingId = null): bool
    {
        return static::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', self::blockingStatuses())
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

        if ($vehicle->active_until && $vehicle->active_until->isPast()) {
            $reasons[] = __('rental.validation.vehicle_capacity_expired', [
                'name' => $vehicle->name,
                'date' => $vehicle->active_until->format('d/m/Y'),
            ]);
        } elseif ($vehicle->active_until && $start && \Carbon\Carbon::parse($start)->isAfter($vehicle->active_until)) {
            $reasons[] = __('rental.validation.vehicle_capacity_expired_for_booking', [
                'name' => $vehicle->name,
                'date' => $vehicle->active_until->format('d/m/Y'),
                'start' => \Carbon\Carbon::parse($start)->format('d/m/Y'),
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
