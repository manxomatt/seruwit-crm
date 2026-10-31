<?php

namespace Modules\Expenses\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Accounting\Models\Account;

class ExpenseCategory extends Model
{
    protected $table = 'expense_categories';

    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'account_id',
        'is_active',
        'description',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'account_id' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    /**
     * @return HasMany<ExpenseClaimLine, $this>
     */
    public function claimLines(): HasMany
    {
        return $this->hasMany(ExpenseClaimLine::class, 'expense_category_id');
    }
}
