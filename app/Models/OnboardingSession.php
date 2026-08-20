<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Self-serve workspace onboarding intent (central DB).
 *
 * @property list<string> $verticals
 */
class OnboardingSession extends Model
{
    use CentralConnection;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_AWAITING_PAYMENT = 'awaiting_payment';

    public const STATUS_PAYMENT_SUBMITTED = 'payment_submitted';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROVISIONING = 'provisioning';

    public const STATUS_READY = 'ready';

    public const STATUS_FAILED = 'failed';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'global_user_id',
        'company_name',
        'phone',
        'city',
        'subdomain',
        'verticals',
        'fleet_size',
        'rental_model',
        'plan_key',
        'status',
        'tenant_id',
        'reseller_global_id',
        'error_message',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'verticals' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<PaymentOrder, $this>
     */
    public function paymentOrders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PaymentOrder::class, 'onboarding_session_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<PaymentOrder, $this>
     */
    public function latestPaymentOrder(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(PaymentOrder::class, 'onboarding_session_id')->latestOfMany();
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [self::STATUS_READY, self::STATUS_FAILED], true);
    }

    public function isAwaitingPayment(): bool
    {
        return in_array($this->status, [self::STATUS_AWAITING_PAYMENT, self::STATUS_PAYMENT_SUBMITTED], true);
    }

    public function isInProgress(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_PROVISIONING,
            self::STATUS_AWAITING_PAYMENT,
            self::STATUS_PAYMENT_SUBMITTED,
        ], true);
    }
}
