<?php

namespace Modules\Payables\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Partners\Models\Partner;
use Modules\Purchasing\Models\GoodReceiptNote;
use Modules\Purchasing\Models\PurchaseOrder;

class SupplierBill extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_ISSUED = 'issued';

    public const STATUS_PARTIALLY_PAID = 'partially_paid';

    public const STATUS_PAID = 'paid';

    public const STATUS_VOID = 'void';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'partner_id',
        'purchase_order_id',
        'good_receipt_note_id',
        'status',
        'bill_date',
        'due_date',
        'tax_enabled',
        'tax_rate',
        'tax_code_id',
        'tax_code',
        'tax_calculation',
        'subtotal',
        'tax_amount',
        'total',
        'amount_paid',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'bill_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'tax_enabled' => 'boolean',
            'tax_rate' => 'decimal:2',
            'tax_code_id' => 'integer',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
        ];
    }

    public function balanceDue(): float
    {
        return round((float) $this->total - (float) $this->amount_paid, 2);
    }

    public function isCreditNote(): bool
    {
        return (float) $this->total < -0.009;
    }

    public static function nextCode(): string
    {
        $year = now()->format('Y');
        $prefix = "BILL-{$year}-";
        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }

    public function recalculate(): void
    {
        $lineTotal = round((float) $this->lines()->sum('amount'), 2);

        if (class_exists(\Modules\Accounting\Support\TaxComputation::class)) {
            $computed = \Modules\Accounting\Support\TaxComputation::fromLineTotal($lineTotal, [
                'enabled' => (bool) $this->tax_enabled,
                'rate' => (float) $this->tax_rate,
                'calculation' => (string) ($this->tax_calculation ?: 'exclusive'),
            ]);

            $this->update([
                'subtotal' => $computed['net'],
                'tax_amount' => $computed['tax'],
                'total' => $computed['gross'],
            ]);

            return;
        }

        $taxAmount = $this->tax_enabled
            ? round($lineTotal * ((float) $this->tax_rate) / 100, 2)
            : 0;

        $this->update([
            'subtotal' => $lineTotal,
            'tax_amount' => $taxAmount,
            'total' => round($lineTotal + $taxAmount, 2),
        ]);
    }

    public function syncPaidStatus(): void
    {
        if ($this->status === self::STATUS_VOID || $this->status === self::STATUS_DRAFT) {
            return;
        }

        $balance = $this->balanceDue();
        $paid = (float) $this->amount_paid;

        if ($paid <= 0.009) {
            $this->update(['status' => self::STATUS_ISSUED]);
        } elseif ($balance <= 0.009) {
            $this->update(['status' => self::STATUS_PAID]);
        } else {
            $this->update(['status' => self::STATUS_PARTIALLY_PAID]);
        }
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return BelongsTo<PurchaseOrder, $this> */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /** @return BelongsTo<GoodReceiptNote, $this> */
    public function goodReceiptNote(): BelongsTo
    {
        return $this->belongsTo(GoodReceiptNote::class);
    }

    /** @return HasMany<SupplierBillLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(SupplierBillLine::class)->orderBy('id');
    }
}
