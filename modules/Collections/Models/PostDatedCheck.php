<?php

namespace Modules\Collections\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;

class PostDatedCheck extends Model
{
    use HasFactory;

    public const STATUS_RECEIVED = 'received';

    public const STATUS_DEPOSITED = 'deposited';

    public const STATUS_CLEARED = 'cleared';

    public const STATUS_BOUNCED = 'bounced';

    public const STATUS_CANCELLED = 'cancelled';

    protected $table = 'post_dated_checks';

    protected $fillable = [
        'check_number',
        'bank_name',
        'partner_id',
        'invoice_id',
        'amount',
        'issue_date',
        'due_date',
        'status',
        'company_bank_account_id',
        'cleared_at',
        'bounced_reason',
        'notes',
        'received_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'issue_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'cleared_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * @return BelongsTo<CompanyBankAccount, $this>
     */
    public function companyBankAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyBankAccount::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function isReceived(): bool
    {
        return $this->status === self::STATUS_RECEIVED;
    }

    public function isDeposited(): bool
    {
        return $this->status === self::STATUS_DEPOSITED;
    }

    public function isCleared(): bool
    {
        return $this->status === self::STATUS_CLEARED;
    }

    public function isBounced(): bool
    {
        return $this->status === self::STATUS_BOUNCED;
    }
}
