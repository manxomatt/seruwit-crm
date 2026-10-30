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
use Modules\Maintenance\Support\WorkOrderShopHold;
use Modules\Partners\Models\Partner;
use Modules\Rental\Database\Factories\RentalFactory;
use Modules\Rental\Support\RentalStatusHint;
use Modules\RentalCorporate\Models\RentalCorporateContract;
use Modules\RentalDispatch\Models\RentalDispatch;
use Modules\RentalDutyOrder\Models\RentalDutyOrder;

class Rental extends Model
{
    /** @use HasFactory<RentalFactory> */
    use HasFactory;

    public const PERIOD_DAILY = 'daily';

    public const PERIOD_WEEKLY = 'weekly';

    public const PERIOD_MONTHLY = 'monthly';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PENDING_RESERVED = 'pending_reserved';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_RESERVED = 'confirmed';

    public const STATUS_OVERDUE = 'overdue';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_RETURNED = 'returned';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_CANCELLED_PAID = 'cancelled_paid';

    public const STATUS_NO_SHOW = 'no_show';

    public const STATUS_NO_SHOW_PAID = 'no_show_paid';

    public const STATUS_ABANDONED = 'abandoned';

    public const CHANNEL_STAFF = 'staff';

    public const CHANNEL_MOBILE = 'mobile';

    public const CHANNEL_WEB = 'web';

    public const DEPOSIT_HELD = 'held';

    public const DEPOSIT_SETTLED = 'settled';

    public const REFUND_STATUS_PENDING_BANK = 'pending_bank_info';

    public const REFUND_STATUS_BANK_SUBMITTED = 'bank_submitted';

    public const REFUND_STATUS_IN_REVIEW = 'in_review';

    public const REFUND_STATUS_APPROVED = 'approved';

    public const REFUND_STATUS_REFUNDED = 'refunded';

    public const REFUND_STATUS_FORFEITED = 'forfeited';

    public const PROOF_PENDING = 'pending';

    public const PROOF_APPROVED = 'approved';

    public const PROOF_REJECTED = 'rejected';

    public const SERVICE_SELF_DRIVE = 'self_drive';

    public const SERVICE_WITH_DRIVER = 'with_driver';

    public const SERVICE_LEPAS_KUNCI = self::SERVICE_SELF_DRIVE;

    public const SERVICE_DENGAN_SOPIR = self::SERVICE_WITH_DRIVER;

    public const DELIVERY_DEPOT = 'depot';

    public const DELIVERY_AIRPORT = 'airport';

    public const DELIVERY_HOTEL = 'hotel';

    public const DELIVERY_CUSTOM = 'custom_address';

    public const DELIVERY_HOTEL_CUSTOM = 'hotel_custom';

    protected static function newFactory(): Factory
    {
        return RentalFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'code',
        'channel',
        'service_type',
        'vehicle_id',
        'driver_id',
        'partner_id',
        'corporate_contract_id',
        'client_po_number',
        'booker_phone',
        'public_token',
        'status',
        'start_date',
        'pickup_time',
        'end_date',
        'return_time',
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
        'deposit_refund_status',
        'deposit_refund_bank_name',
        'deposit_refund_account_number',
        'deposit_refund_account_name',
        'deposit_refund_bank_submitted_at',
        'deposit_refund_proof_path',
        'deposit_refund_notes',
        'deposit_refunded_at',
        'pickup_requested_at',
        'pickup_request_status',
        'pickup_customer_signature_path',
        'pickup_terms_agreed',
        'pickup_notes',
        'total_amount',
        'notes',
        'passenger_ktp_path',
        'passenger_sim_path',
        'passenger_guarantor_doc_type',
        'passenger_guarantor_doc_path',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'social_media_account',
        'ai_kyc_assessment',
        'pickup_location',
        'return_location',
        'pickup_location_id',
        'return_location_id',
        'delivery_type',
        'delivery_address',
        'delivery_landmark',
        'delivery_fee',
        'return_delivery_type',
        'return_delivery_address',
        'return_delivery_fee',
        'pickup_fleet_base_id',
        'return_fleet_base_id',
        'one_way_fee_amount',
        'driver_fee_amount',
        'insurance_package_id',
        'fuel_policy_notes',
        'contract_signed_at',
        'contract_signature_path',
        'contract_signed_ip',
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
            'corporate_contract_id' => 'integer',
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
            'deposit_refund_bank_submitted_at' => 'datetime',
            'deposit_refunded_at' => 'datetime',
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
            'driver_fee_amount' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'return_delivery_fee' => 'decimal:2',
            'contract_signed_at' => 'datetime',
        ];
    }

    public function isWithDriver(): bool
    {
        return in_array($this->service_type, [self::SERVICE_WITH_DRIVER, 'dengan_sopir'], true);
    }

    public function isSelfDrive(): bool
    {
        return in_array($this->service_type, [self::SERVICE_SELF_DRIVE, 'lepas_kunci'], true);
    }

    public function getDeliveryAddressOrLandmarkAttribute(): ?string
    {
        return $this->delivery_address ?: $this->delivery_landmark;
    }

    public function getReturnAddressOrLandmarkAttribute(): ?string
    {
        return $this->return_delivery_address;
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

    /** @return HasMany<RentalDutyOrder, $this> */
    public function dutyOrders(): HasMany
    {
        return $this->hasMany(RentalDutyOrder::class);
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<RentalCorporateContract, $this> */
    public function corporateContract(): BelongsTo
    {
        return $this->belongsTo(RentalCorporateContract::class, 'corporate_contract_id');
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

    /** @return HasMany<RentalDispatch, $this> */
    public function dispatches(): HasMany
    {
        return $this->hasMany(RentalDispatch::class)->orderBy('scheduled_at');
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

    public function isExpired(): bool
    {
        if (in_array($this->status, [self::STATUS_PENDING, self::STATUS_ABANDONED], true)) {
            return true;
        }

        if ($this->status === self::STATUS_PENDING_RESERVED
            && $this->reserved_until !== null
            && $this->reserved_until->isPast()) {
            return true;
        }

        return false;
    }

    public function isCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_CANCELLED, self::STATUS_CANCELLED_PAID], true);
    }

    /**
     * @param  array{deposit_applied_amount: float|int|string, deposit_refunded_amount: float|int|string, deposit_refund_proof_path?: string|null, deposit_refund_notes?: string|null}  $amounts
     */
    public function settleDeposit(array $amounts): void
    {
        $applied = round((float) $amounts['deposit_applied_amount'], 2);
        $refunded = round((float) $amounts['deposit_refunded_amount'], 2);

        $updates = [
            'deposit_status' => self::DEPOSIT_SETTLED,
            'deposit_applied_amount' => $applied,
            'deposit_refunded_amount' => $refunded,
            'deposit_returned' => $applied < 0.009 && abs($refunded - (float) $this->deposit_amount) < 0.009,
            'deposit_settled_at' => now(),
        ];

        if (! empty($amounts['deposit_refund_proof_path'])) {
            $updates['deposit_refund_proof_path'] = $amounts['deposit_refund_proof_path'];
            $updates['deposit_refund_status'] = self::REFUND_STATUS_REFUNDED;
            $updates['deposit_refunded_at'] = now();
        } elseif ($refunded <= 0) {
            $updates['deposit_refund_status'] = self::REFUND_STATUS_FORFEITED;
        } else {
            $updates['deposit_refund_status'] = filled($this->deposit_refund_bank_name)
                ? self::REFUND_STATUS_APPROVED
                : self::REFUND_STATUS_PENDING_BANK;
        }

        if (array_key_exists('deposit_refund_notes', $amounts)) {
            $updates['deposit_refund_notes'] = $amounts['deposit_refund_notes'];
        }

        $this->update($updates);
    }

    public function resolveDepositRefundStatus(): string
    {
        if ((float) $this->deposit_amount <= 0) {
            return 'not_applicable';
        }

        if (! $this->isDepositReceived()) {
            return 'pending_deposit';
        }

        if ($this->deposit_refunded_at !== null || $this->deposit_refund_status === self::REFUND_STATUS_REFUNDED || filled($this->deposit_refund_proof_path)) {
            return self::REFUND_STATUS_REFUNDED;
        }

        if ($this->deposit_status === self::DEPOSIT_SETTLED) {
            if ((float) $this->deposit_refunded_amount <= 0) {
                return self::REFUND_STATUS_FORFEITED;
            }

            if (filled($this->deposit_refund_bank_name)) {
                return self::REFUND_STATUS_APPROVED;
            }

            return self::REFUND_STATUS_PENDING_BANK;
        }

        if (! in_array($this->status, [self::STATUS_RETURNED, self::STATUS_COMPLETED], true)) {
            return filled($this->deposit_refund_bank_name)
                ? self::REFUND_STATUS_BANK_SUBMITTED
                : 'pending_return';
        }

        if (filled($this->deposit_refund_bank_name)) {
            return self::REFUND_STATUS_IN_REVIEW;
        }

        return self::REFUND_STATUS_PENDING_BANK;
    }

    public function canSubmitRefundAccount(): bool
    {
        if ((float) $this->deposit_amount <= 0) {
            return false;
        }

        if ($this->deposit_refunded_at !== null || $this->deposit_refund_status === self::REFUND_STATUS_REFUNDED || filled($this->deposit_refund_proof_path)) {
            return false;
        }

        return in_array($this->status, [
            self::STATUS_CONFIRMED,
            self::STATUS_ACTIVE,
            self::STATUS_RETURNED,
            self::STATUS_COMPLETED,
        ], true);
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
     * Staff-facing one-liner next to the status badge.
     */
    public function getStatusHintAttribute(): ?string
    {
        return app(RentalStatusHint::class)->for($this);
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
     * Conflicting rentals for a vehicle within [$start, $end].
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, self>
     */
    public static function findConflictingRentals(int $vehicleId, string $start, string $end, ?int $excludingId = null)
    {
        return static::query()
            ->with(['partner:id,name,phone,mobile', 'vehicle:id,name,plate_number,type,rental_class'])
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', self::blockingStatuses())
            ->where('start_date', '<=', $end)
            ->where('end_date', '>=', $start)
            ->when($excludingId, fn (Builder $q) => $q->where('id', '!=', $excludingId))
            ->orderBy('start_date')
            ->get();
    }

    /**
     * Find available alternative vehicles for [$start, $end], prioritized by same rental class.
     *
     * @return \Illuminate\Support\Collection<int, Vehicle>
     */
    public static function findAlternativeVehicles(Vehicle $vehicle, string $start, string $end, ?int $excludingRentalId = null): \Illuminate\Support\Collection
    {
        $candidates = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->where('id', '!=', $vehicle->id)
            ->orderBy('name')
            ->get();

        return $candidates->filter(function (Vehicle $candidate) use ($start, $end, $excludingRentalId): bool {
            return self::vehicleAvailabilityReasons($candidate, $start, $end, $excludingRentalId) === [];
        })->sortByDesc(function (Vehicle $candidate) use ($vehicle): int {
            if ($vehicle->rental_class && $candidate->rental_class === $vehicle->rental_class) {
                return 2;
            }

            return 1;
        })->values();
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

        if (WorkOrderShopHold::isHeld((int) $vehicle->id)) {
            $reasons[] = __('rental.validation.vehicle_queued_for_workshop', [
                'name' => $vehicle->name,
            ]);
        }

        if ($blackout = RentalMaintenanceBlackout::findOverlappingBlackout((int) $vehicle->id, $start, $end)) {
            $reasons[] = __('rental.validation.vehicle_maintenance_blackout', [
                'name' => $vehicle->name,
                'reason' => $blackout->reason,
                'start' => $blackout->start_date?->format('d/m/Y') ?? $start,
                'end' => $blackout->end_date?->format('d/m/Y') ?? $end,
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
