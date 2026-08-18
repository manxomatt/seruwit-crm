<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A batch payment of approved commissions to one reseller.
 *
 * Phase 1 only creates and reads the table so the ledger can reference it; the
 * batching and approval workflow arrives with the payout phase.
 *
 * @property string $reseller_global_id
 * @property string $status
 */
class ResellerPayout extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'reseller_global_id',
        'reference',
        'period_start',
        'period_end',
        'gross_amount',
        'tax_withheld_amount',
        'net_amount',
        'currency',
        'status',
        'bank_name',
        'account_number',
        'account_name',
        'transfer_proof_path',
        'approved_by',
        'approved_at',
        'paid_by',
        'paid_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'gross_amount' => 'decimal:2',
            'tax_withheld_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<ResellerCommission, $this>
     */
    public function commissions(): HasMany
    {
        return $this->hasMany(ResellerCommission::class, 'payout_id');
    }

    public function reseller(): BelongsTo
    {
        return $this->belongsTo(CentralUser::class, 'reseller_global_id', 'global_id');
    }
}
