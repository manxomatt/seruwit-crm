<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionBillingReport extends Model
{
    protected $fillable = [
        'subscription_id',
        'payment_order_id',
        'year',
        'month',
        'total_amount',
        'vehicle_cost',
        'vehicle_count',
        'billing_interval',
        'status',
        'billed_at',
        'paid_at',
    ];

    protected $casts = [
        'total_amount' => 'integer',
        'vehicle_cost' => 'integer',
        'vehicle_count' => 'integer',
        'billed_at' => 'datetime',
        'paid_at' => 'datetime',
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

    public function isBilled(): bool
    {
        return $this->status === 'billed';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function markAsBilled(): void
    {
        $this->update(['status' => 'billed', 'billed_at' => now()]);
    }

    public function markAsPaid(): void
    {
        $this->update(['status' => 'paid', 'paid_at' => now()]);
    }

    public function getMonthYearAttribute(): string
    {
        return sprintf('%d-%02d', $this->year, $this->month);
    }
}
