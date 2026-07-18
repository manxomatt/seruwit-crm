<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Billing\Database\Factories\OrderChargeFactory;
use Modules\Orders\Models\DeliveryOrder;

class OrderCharge extends Model
{
    /** @use HasFactory<OrderChargeFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return OrderChargeFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'delivery_order_id',
        'tariff_id',
        'amount',
        'invoice_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<DeliveryOrder, $this>
     */
    public function deliveryOrder(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class);
    }

    /**
     * @return BelongsTo<Tariff, $this>
     */
    public function tariff(): BelongsTo
    {
        return $this->belongsTo(Tariff::class);
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * A charge stays overridable until its invoice leaves draft; from then on
     * the amount is part of an issued financial document.
     */
    public function isLocked(): bool
    {
        return $this->invoice !== null
            && in_array($this->invoice->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PAID], true);
    }
}
