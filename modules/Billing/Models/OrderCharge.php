<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Modules\Billing\Database\Factories\OrderChargeFactory;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
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
     * The invoice line raised for this charge, if it has been billed. Its
     * absence is what makes an order invoiceable, so this relation — not a
     * column here — is the single answer to "has this been billed yet?".
     *
     * @return MorphOne<InvoiceLine, $this>
     */
    public function invoiceLine(): MorphOne
    {
        return $this->morphOne(InvoiceLine::class, 'source');
    }

    /**
     * A charge stays overridable until its invoice leaves draft; from then on
     * the amount is part of an issued financial document.
     */
    public function isLocked(): bool
    {
        $invoice = $this->invoiceLine?->invoice;

        return $invoice !== null
            && in_array($invoice->status, [Invoice::STATUS_ISSUED, Invoice::STATUS_PAID], true);
    }
}
