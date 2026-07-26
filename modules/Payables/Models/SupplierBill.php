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
            'bill_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
        ];
    }

    public function balanceDue(): float
    {
        return max(0, round((float) $this->total - (float) $this->amount_paid, 2));
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
        $subtotal = round((float) $this->lines()->sum('amount'), 2);
        $this->update([
            'subtotal' => $subtotal,
            'tax_amount' => 0,
            'total' => $subtotal,
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
