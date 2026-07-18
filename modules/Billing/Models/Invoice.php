<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Billing\Database\Factories\InvoiceFactory;
use Modules\Customer\Models\Customer;

class Invoice extends Model
{
    /** @use HasFactory<InvoiceFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ISSUED = 'issued';

    public const STATUS_PAID = 'paid';

    public const STATUS_VOID = 'void';

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return InvoiceFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'customer_id',
        'status',
        'issue_date',
        'due_date',
        'tax_enabled',
        'tax_rate',
        'subtotal',
        'tax_amount',
        'total',
        'paid_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'tax_enabled' => 'boolean',
            'tax_rate' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return HasMany<OrderCharge, $this>
     */
    public function charges(): HasMany
    {
        return $this->hasMany(OrderCharge::class)->orderBy('id');
    }

    /**
     * Recomputes and stores the totals from the attached charges. Called on
     * every draft mutation, so issuing is a pure status flip — nothing
     * recomputes after issue, which is the snapshot guarantee.
     */
    public function recalculate(): void
    {
        $subtotal = (float) $this->charges()->sum('amount');
        $taxAmount = $this->tax_enabled ? round($subtotal * ((float) $this->tax_rate) / 100, 2) : 0;

        $this->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $subtotal + $taxAmount,
        ]);
    }

    /**
     * Generates the next sequential human-readable invoice code, e.g.
     * INV-000001. Not safe against a race between two simultaneous store
     * requests, but invoice creation is a low-frequency, single-operator
     * action here — same trade-off as DeliveryOrder::nextCode().
     */
    public static function nextCode(): string
    {
        $lastNumber = (int) static::query()
            ->orderByDesc('id')
            ->value('id');

        return sprintf('INV-%06d', $lastNumber + 1);
    }
}
