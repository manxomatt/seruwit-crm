<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethodAccountMap extends Model
{
    /** @var list<string> */
    public const METHODS = ['cash', 'transfer', 'giro', 'card', 'qris', 'other'];

    protected $fillable = [
        'payment_method',
        'company_bank_account_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'company_bank_account_id' => 'integer',
        ];
    }

    public function companyBankAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyBankAccount::class);
    }
}
