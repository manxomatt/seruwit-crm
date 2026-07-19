<?php

namespace Modules\Invoicing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Modules\Invoicing\Database\Factories\InvoiceLineFactory;

/**
 * One billable item on an invoice: a description and an amount, plus an
 * optional `source` pointing back at whatever the selling module raised it for.
 *
 * The description is a snapshot, deliberately duplicated rather than read
 * through the source at render time — an issued invoice must keep saying what
 * it said when it was issued, even if the order behind it is later edited or
 * the module that raised it is uninstalled.
 */
class InvoiceLine extends Model
{
    /** @use HasFactory<InvoiceLineFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return InvoiceLineFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'invoice_id',
        'description',
        'amount',
        'source_type',
        'source_id',
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
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Whatever this line was raised for. Resolves to null for a free-form line,
     * and to a missing model once the module that owned the source is
     * uninstalled — callers must treat it as optional in both cases.
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
