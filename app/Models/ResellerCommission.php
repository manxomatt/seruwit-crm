<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single earned commission, snapshotted at the moment a payment order was
 * confirmed.
 *
 * Every money-bearing attribute here is a copy, not a lookup: the rate, the
 * base, the plan and the reseller are all frozen. Changing a rule or moving a
 * tenant to another reseller therefore only affects future accruals.
 *
 * @property string $reseller_global_id
 * @property string $tenant_id
 * @property int $payment_order_id
 * @property string $status
 */
class ResellerCommission extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PAID = 'paid';

    public const STATUS_VOID = 'void';

    public const EVENT_FIRST = 'first';

    public const EVENT_RENEWAL = 'renewal';

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'reseller_global_id',
        'tenant_id',
        'payment_order_id',
        'subscription_id',
        'plan_id',
        'event',
        'base_amount',
        'rule_id',
        'rate_type',
        'rate_value',
        'commission_amount',
        'tax_withheld_amount',
        'net_amount',
        'currency',
        'occurrence',
        'status',
        'hold_until',
        'approved_at',
        'payout_id',
        'paid_at',
        'voided_at',
        'void_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_amount' => 'decimal:2',
            'rate_value' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'tax_withheld_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'occurrence' => 'integer',
            'hold_until' => 'datetime',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
            'voided_at' => 'datetime',
        ];
    }

    public function reseller(): BelongsTo
    {
        return $this->belongsTo(CentralUser::class, 'reseller_global_id', 'global_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function paymentOrder(): BelongsTo
    {
        return $this->belongsTo(PaymentOrder::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(ResellerCommissionRule::class, 'rule_id');
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(ResellerPayout::class, 'payout_id');
    }

    /**
     * Statuses that represent a live claim on money — used both for occurrence
     * counting and for the reseller's outstanding balance.
     *
     * @return list<string>
     */
    public static function liveStatuses(): array
    {
        return [self::STATUS_PENDING, self::STATUS_APPROVED, self::STATUS_PAID];
    }

    /**
     * Voiding is only safe while the money has not left the building. Once a
     * commission is paid, the correction has to be a new negative row so the
     * ledger stays append-only.
     */
    public function canBeVoided(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_APPROVED], true);
    }

    public function isHeld(): bool
    {
        return $this->hold_until !== null && $this->hold_until->isFuture();
    }

    /**
     * @param  Builder<$this>  $query
     */
    public function scopeLive(Builder $query): void
    {
        $query->whereIn('status', self::liveStatuses());
    }

    /**
     * @param  Builder<$this>  $query
     */
    public function scopeForReseller(Builder $query, string $resellerGlobalId): void
    {
        $query->where('reseller_global_id', $resellerGlobalId);
    }
}
