<?php

namespace Modules\Expenses\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Driver\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;

class ExpenseClaim extends Model
{
    public const TYPE_DIRECT = 'direct_expense';

    public const TYPE_PETTY_CASH = 'petty_cash';

    public const TYPE_REIMBURSEMENT = 'reimbursement';

    public const TYPE_ADVANCE_SETTLEMENT = 'advance_settlement';

    /** @var list<string> */
    public const TYPES = [
        self::TYPE_DIRECT,
        self::TYPE_PETTY_CASH,
        self::TYPE_REIMBURSEMENT,
        self::TYPE_ADVANCE_SETTLEMENT,
    ];

    public const STATUS_DRAFT = 'draft';

    public const STATUS_POSTED = 'posted';

    public const STATUS_VOIDED = 'voided';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_POSTED,
        self::STATUS_VOIDED,
    ];

    protected $table = 'expense_claims';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'expense_date',
        'type',
        'title',
        'cash_advance_id',
        'company_bank_account_id',
        'partner_id',
        'vehicle_id',
        'driver_id',
        'payment_method',
        'total_amount',
        'status',
        'reference_number',
        'notes',
        'source_type',
        'source_id',
        'posted_at',
        'posted_by',
        'voided_at',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expense_date' => 'date:Y-m-d',
            'cash_advance_id' => 'integer',
            'company_bank_account_id' => 'integer',
            'partner_id' => 'integer',
            'vehicle_id' => 'integer',
            'driver_id' => 'integer',
            'total_amount' => 'decimal:2',
            'source_id' => 'integer',
            'posted_at' => 'datetime',
            'posted_by' => 'integer',
            'voided_at' => 'datetime',
            'created_by' => 'integer',
        ];
    }

    public static function nextCode(): string
    {
        $prefix = 'EXP-'.now()->format('Ym');
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
     * @return HasMany<ExpenseClaimLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(ExpenseClaimLine::class, 'expense_claim_id')->orderBy('sort_order')->orderBy('id');
    }

    /**
     * @return BelongsTo<CashAdvance, $this>
     */
    public function cashAdvance(): BelongsTo
    {
        return $this->belongsTo(CashAdvance::class, 'cash_advance_id');
    }

    /**
     * @return BelongsTo<CompanyBankAccount, $this>
     */
    public function companyBankAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyBankAccount::class, 'company_bank_account_id');
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
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPosted(): bool
    {
        return $this->status === self::STATUS_POSTED;
    }

    public function isVoided(): bool
    {
        return $this->status === self::STATUS_VOIDED;
    }

    public function getJournalEntryIdAttribute(): ?int
    {
        $id = \Modules\Accounting\Models\JournalEntry::query()
            ->where('source_type', $this->getMorphClass())
            ->where('source_id', (int) $this->id)
            ->where('event', 'expense.posted')
            ->value('id');

        return $id ? (int) $id : null;
    }
}
