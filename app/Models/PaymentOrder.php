<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PaymentOrder extends Model
{
    const STATUS_PENDING = 'pending';

    const STATUS_AWAITING_CONFIRMATION = 'awaiting_confirmation';

    const STATUS_CONFIRMED = 'confirmed';

    const STATUS_REJECTED = 'rejected';

    const STATUS_EXPIRED = 'expired';

    const STATUS_CANCELLED = 'cancelled';

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    protected $fillable = [
        'tenant_id',
        'onboarding_session_id',
        'plan_id',
        'type',
        'billing_interval',
        'payment_method',
        'status',
        'amount',
        'unique_code',
        'total_amount',
        'currency',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'transfer_proof_path',
        'transfer_note',
        'confirmed_at',
        'confirmed_by',
        'subscription_id',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
        'expires_at',
        'gateway_data',
    ];

    protected $appends = [
        'proof_url',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'unique_code' => 'integer',
            'expires_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'rejected_at' => 'datetime',
            'gateway_data' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function onboardingSession(): BelongsTo
    {
        return $this->belongsTo(OnboardingSession::class, 'onboarding_session_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isAwaitingConfirmation(): bool
    {
        return $this->status === self::STATUS_AWAITING_CONFIRMATION;
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [
            self::STATUS_CONFIRMED,
            self::STATUS_EXPIRED,
            self::STATUS_CANCELLED,
        ], true);
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED;
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [
            self::STATUS_PENDING,
            self::STATUS_AWAITING_CONFIRMATION,
        ]);
    }

    public function getProofUrlAttribute(): ?string
    {
        if (! $this->transfer_proof_path) {
            return null;
        }

        return Storage::disk('payment_proofs')->url($this->transfer_proof_path);
    }

    public static function generateUniqueCode(): int
    {
        do {
            $code = random_int(100, 999);
        } while (self::where('unique_code', $code)
            ->whereIn('status', [
                self::STATUS_PENDING,
                self::STATUS_AWAITING_CONFIRMATION,
                self::STATUS_CONFIRMED,
            ])
            ->exists()
        );

        return $code;
    }
}
