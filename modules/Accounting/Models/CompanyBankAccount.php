<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanyBankAccount extends Model
{
    public const KIND_CASH = 'cash';

    public const KIND_BANK = 'bank';

    /** @var list<string> */
    public const KINDS = [self::KIND_CASH, self::KIND_BANK];

    protected $fillable = [
        'name',
        'kind',
        'bank_name',
        'account_number',
        'account_holder',
        'account_id',
        'is_default',
        'is_active',
        'currency',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'account_id' => 'integer',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function ledgerAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function methodMaps(): HasMany
    {
        return $this->hasMany(PaymentMethodAccountMap::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(BankTransaction::class);
    }

    public function isCash(): bool
    {
        return $this->kind === self::KIND_CASH;
    }
}
