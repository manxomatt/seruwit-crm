<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;

class RentalCharge extends Model
{
    public const KIND_BASE = 'base';

    public const KIND_EXTENSION = 'extension';

    public const KIND_EXCESS_KM = 'excess_km';

    public const KIND_DAMAGE = 'damage';

    public const KIND_LATE_FEE = 'late_fee';

    public const KIND_ADDON = 'addon';

    /** @var list<string> */
    protected $fillable = [
        'rental_id',
        'kind',
        'addon_code',
        'amount',
        'description',
        'rental_extension_id',
        'rental_damage_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Rental, $this> */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    /** @return BelongsTo<RentalExtension, $this> */
    public function extension(): BelongsTo
    {
        return $this->belongsTo(RentalExtension::class, 'rental_extension_id');
    }

    /** @return BelongsTo<RentalDamage, $this> */
    public function damage(): BelongsTo
    {
        return $this->belongsTo(RentalDamage::class, 'rental_damage_id');
    }

    /**
     * Whether this charge has been billed is answered by Invoicing — not a
     * column here — so a voided invoice can free the charge to be billed again.
     *
     * @return MorphOne<InvoiceLine, $this>
     */
    public function invoiceLine(): MorphOne
    {
        return $this->morphOne(InvoiceLine::class, 'source');
    }

    public function isInvoiced(): bool
    {
        $invoice = $this->invoiceLine?->invoice;

        return $invoice !== null && $invoice->status !== Invoice::STATUS_VOID;
    }
}
