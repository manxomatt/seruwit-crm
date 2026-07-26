<?php

namespace Modules\Payables\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SupplierBillLine extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'supplier_bill_id',
        'description',
        'amount',
        'source_type',
        'source_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<SupplierBill, $this> */
    public function bill(): BelongsTo
    {
        return $this->belongsTo(SupplierBill::class, 'supplier_bill_id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
