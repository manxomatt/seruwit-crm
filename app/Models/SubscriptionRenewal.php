<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionRenewal extends Model
{
    protected $fillable = [
        'subscription_id',
        'payment_order_id',
        'status',
        'renewal_date',
        'processed_at',
        'failure_reason',
        'attempt_count',
        'last_attempt_at',
    ];

    protected $casts = [
        'renewal_date' => 'datetime',
        'processed_at' => 'datetime',
        'last_attempt_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function paymentOrder(): BelongsTo
    {
        return $this->belongsTo(PaymentOrder::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function markAsProcessing(): void
    {
        $this->update(['status' => 'processing', 'last_attempt_at' => now()]);
    }

    public function markAsCompleted(): void
    {
        $this->update(['status' => 'completed', 'processed_at' => now()]);
    }

    public function markAsFailed(?string $reason = null): void
    {
        $this->update([
            'status' => 'failed',
            'failure_reason' => $reason,
            'attempt_count' => $this->attempt_count + 1,
        ]);
    }
}
