<?php

namespace Modules\Accounting\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankReconciliation extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_COMPLETED = 'completed';

    /** @var list<string> */
    public const STATUSES = [self::STATUS_OPEN, self::STATUS_COMPLETED];

    protected $fillable = [
        'company_bank_account_id',
        'period_start',
        'period_end',
        'statement_date',
        'opening_balance',
        'closing_balance',
        'status',
        'csv_filename',
        'notes',
        'created_by',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'company_bank_account_id' => 'integer',
            'period_start' => 'date',
            'period_end' => 'date',
            'statement_date' => 'date',
            'opening_balance' => 'decimal:2',
            'closing_balance' => 'decimal:2',
            'created_by' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function companyBankAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyBankAccount::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(BankStatementLine::class)->orderBy('line_date')->orderBy('row_number')->orderBy('id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }
}
