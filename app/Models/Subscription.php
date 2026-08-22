<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    const STATUS_ACTIVE = 'active';

    const STATUS_CANCELLED = 'cancelled';

    const STATUS_EXPIRED = 'expired';

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    protected $fillable = [
        'tenant_id',
        'plan_id',
        'subscribed_vehicles',
        'subscription_type',
        'current_vehicle_count',
        'starts_at',
        'ends_at',
        'renewal_date',
        'next_renewal_date',
        'status',
        'cancelled_at',
        'ended_at',
        'auto_renew',
        'next_billing_date',
        'renewal_notification_sent_at',
        'renewal_attempts',
        'last_renewal_attempted_at',
        'skip_next_renewal',
    ];

    protected function casts(): array
    {
        return [
            'subscribed_vehicles' => 'integer',
            'current_vehicle_count' => 'integer',
            'auto_renew' => 'boolean',
            'skip_next_renewal' => 'boolean',
            'renewal_attempts' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'ended_at' => 'datetime',
            'renewal_date' => 'date',
            'next_renewal_date' => 'datetime',
            'renewal_notification_sent_at' => 'datetime',
            'last_renewal_attempted_at' => 'datetime',
            'next_billing_date' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function renewals(): HasMany
    {
        return $this->hasMany(SubscriptionRenewal::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && ($this->ends_at === null || $this->ends_at->isFuture());
    }

    public function cancel(): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_at' => now(),
        ]);
    }
}
