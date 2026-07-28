<?php

namespace Modules\Accounting\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BankTransaction extends Model
{
    public const TYPE_DEPOSIT = 'deposit';

    public const TYPE_WITHDRAWAL = 'withdrawal';

    public const TYPE_TRANSFER = 'transfer';

    public const TYPE_FEE = 'fee';

    /** @var list<string> */
    public const TYPES = [
        self::TYPE_DEPOSIT,
        self::TYPE_WITHDRAWAL,
        self::TYPE_TRANSFER,
        self::TYPE_FEE,
    ];

    public const DIRECTION_IN = 'in';

    public const DIRECTION_OUT = 'out';

    public const STATUS_POSTED = 'posted';

    public const STATUS_VOIDED = 'voided';

    protected $fillable = [
        'company_bank_account_id',
        'counterparty_account_id',
        'transfer_group',
        'type',
        'direction',
        'transacted_on',
        'amount',
        'reference',
        'memo',
        'source_type',
        'source_id',
        'event',
        'status',
        'is_cleared',
        'cleared_on',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'company_bank_account_id' => 'integer',
            'counterparty_account_id' => 'integer',
            'transacted_on' => 'date',
            'amount' => 'decimal:2',
            'source_id' => 'integer',
            'is_cleared' => 'boolean',
            'cleared_on' => 'date',
            'created_by' => 'integer',
        ];
    }

    public function companyBankAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyBankAccount::class, 'company_bank_account_id');
    }

    public function counterpartyAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyBankAccount::class, 'counterparty_account_id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isPosted(): bool
    {
        return $this->status === self::STATUS_POSTED;
    }

    public function isInbound(): bool
    {
        return $this->direction === self::DIRECTION_IN;
    }
}
