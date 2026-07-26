<?php

namespace Modules\Payables\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillPaymentAllocation extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'bill_payment_id',
        'supplier_bill_id',
        'amount',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<BillPayment, $this> */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(BillPayment::class, 'bill_payment_id');
    }

    /** @return BelongsTo<SupplierBill, $this> */
    public function bill(): BelongsTo
    {
        return $this->belongsTo(SupplierBill::class, 'supplier_bill_id');
    }
}
