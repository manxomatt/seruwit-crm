<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosPayment extends Model
{
    public const METHOD_CASH = 'cash';

    public const METHOD_QRIS = 'qris';

    public const METHOD_TRANSFER = 'transfer';

    public const METHOD_CARD = 'card';

    public const METHOD_OTHER = 'other';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'pos_sale_id',
        'method',
        'company_bank_account_id',
        'amount',
        'reference',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<PosSale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(PosSale::class, 'pos_sale_id');
    }
}
