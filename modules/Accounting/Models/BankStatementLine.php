<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankStatementLine extends Model
{
    public const MATCH_UNMATCHED = 'unmatched';

    public const MATCH_MATCHED = 'matched';

    public const MATCH_IGNORED = 'ignored';

    public const MATCH_ADJUSTED = 'adjusted';

    /** @var list<string> */
    public const MATCH_STATUSES = [
        self::MATCH_UNMATCHED,
        self::MATCH_MATCHED,
        self::MATCH_IGNORED,
        self::MATCH_ADJUSTED,
    ];

    protected $fillable = [
        'bank_reconciliation_id',
        'row_number',
        'line_date',
        'description',
        'reference',
        'direction',
        'amount',
        'match_status',
        'bank_transaction_id',
        'journal_entry_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'bank_reconciliation_id' => 'integer',
            'row_number' => 'integer',
            'line_date' => 'date',
            'amount' => 'decimal:2',
            'bank_transaction_id' => 'integer',
            'journal_entry_id' => 'integer',
        ];
    }

    public function reconciliation(): BelongsTo
    {
        return $this->belongsTo(BankReconciliation::class, 'bank_reconciliation_id');
    }

    public function bankTransaction(): BelongsTo
    {
        return $this->belongsTo(BankTransaction::class);
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function isUnmatched(): bool
    {
        return $this->match_status === self::MATCH_UNMATCHED;
    }

    public function isInbound(): bool
    {
        return $this->direction === BankTransaction::DIRECTION_IN;
    }
}
