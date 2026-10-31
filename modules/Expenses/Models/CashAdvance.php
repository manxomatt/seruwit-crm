<?php

namespace Modules\Expenses\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Driver\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;

class CashAdvance extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_DISBURSED = 'disbursed';

    public const STATUS_SETTLED = 'settled';

    public const STATUS_VOIDED = 'voided';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_DISBURSED,
        self::STATUS_SETTLED,
        self::STATUS_VOIDED,
    ];

    protected $table = 'cash_advances';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'advance_date',
        'purpose',
        'recipient_name',
        'user_id',
        'driver_id',
        'partner_id',
        'vehicle_id',
        'company_bank_account_id',
        'advance_account_id',
        'payment_method',
        'amount',
        'spent_amount',
        'returned_amount',
        'reimbursed_amount',
        'status',
        'reference_number',
        'notes',
        'source_type',
        'source_id',
        'disbursed_at',
        'disbursed_by',
        'settled_at',
        'settled_by',
        'voided_at',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'advance_date' => 'date:Y-m-d',
            'user_id' => 'integer',
            'driver_id' => 'integer',
            'partner_id' => 'integer',
            'vehicle_id' => 'integer',
            'company_bank_account_id' => 'integer',
            'advance_account_id' => 'integer',
            'amount' => 'decimal:2',
            'spent_amount' => 'decimal:2',
            'returned_amount' => 'decimal:2',
            'reimbursed_amount' => 'decimal:2',
            'source_id' => 'integer',
            'disbursed_at' => 'datetime',
            'disbursed_by' => 'integer',
            'settled_at' => 'datetime',
            'settled_by' => 'integer',
            'voided_at' => 'datetime',
            'created_by' => 'integer',
        ];
    }

    public static function nextCode(): string
    {
        $prefix = 'CA-'.now()->format('Ym');
        $latest = static::query()
            ->where('code', 'like', "{$prefix}-%")
            ->orderByDesc('id')
            ->first();

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest->code, $matches)) {
            $seq = ((int) $matches[1]) + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }

    /**
     * @return BelongsTo<CompanyBankAccount, $this>
     */
    public function companyBankAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyBankAccount::class, 'company_bank_account_id');
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function advanceAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'advance_account_id');
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<ExpenseClaim, $this>
     */
    public function expenseClaims(): HasMany
    {
        return $this->hasMany(ExpenseClaim::class, 'cash_advance_id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isDisbursed(): bool
    {
        return $this->status === self::STATUS_DISBURSED;
    }

    public function isSettled(): bool
    {
        return $this->status === self::STATUS_SETTLED;
    }

    public function isVoided(): bool
    {
        return $this->status === self::STATUS_VOIDED;
    }

    public function outstandingBalance(): float
    {
        if (! $this->isDisbursed()) {
            return 0.0;
        }

        return round(max(0, (float) $this->amount - (float) $this->spent_amount - (float) $this->returned_amount), 2);
    }

    public function getDisbursementJournalEntryIdAttribute(): ?int
    {
        $id = \Modules\Accounting\Models\JournalEntry::query()
            ->where('source_type', $this->getMorphClass())
            ->where('source_id', (int) $this->id)
            ->where('event', 'cash_advance.disbursed')
            ->value('id');

        return $id ? (int) $id : null;
    }

    public function getSettlementJournalEntryIdAttribute(): ?int
    {
        $id = \Modules\Accounting\Models\JournalEntry::query()
            ->where('source_type', $this->getMorphClass())
            ->where('source_id', (int) $this->id)
            ->whereIn('event', ['cash_advance.settled', 'expense.posted'])
            ->latest('id')
            ->value('id');

        return $id ? (int) $id : null;
    }
}
