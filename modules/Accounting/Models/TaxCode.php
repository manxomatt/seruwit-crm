<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxCode extends Model
{
    public const CATEGORY_PPN = 'ppn';

    public const CATEGORY_WHT = 'wht';

    public const CATEGORY_NONE = 'none';

    public const CALC_EXCLUSIVE = 'exclusive';

    public const CALC_INCLUSIVE = 'inclusive';

    public const CALC_NONE = 'none';

    public const DIRECTION_OUTPUT = 'output';

    public const DIRECTION_INPUT = 'input';

    public const DIRECTION_BOTH = 'both';

    public const DIRECTION_PAYABLE = 'payable';

    /** @var list<string> */
    public const CATEGORIES = [
        self::CATEGORY_PPN,
        self::CATEGORY_WHT,
        self::CATEGORY_NONE,
    ];

    /** @var list<string> */
    public const CALCULATIONS = [
        self::CALC_EXCLUSIVE,
        self::CALC_INCLUSIVE,
        self::CALC_NONE,
    ];

    /** @var list<string> */
    public const DIRECTIONS = [
        self::DIRECTION_OUTPUT,
        self::DIRECTION_INPUT,
        self::DIRECTION_BOTH,
        self::DIRECTION_PAYABLE,
    ];

    protected $fillable = [
        'code',
        'name',
        'category',
        'rate',
        'calculation',
        'direction',
        'output_account_id',
        'input_account_id',
        'wht_account_id',
        'is_default',
        'is_active',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rate' => 'decimal:4',
            'output_account_id' => 'integer',
            'input_account_id' => 'integer',
            'wht_account_id' => 'integer',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function outputAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'output_account_id');
    }

    public function inputAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'input_account_id');
    }

    public function whtAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'wht_account_id');
    }

    public function isPpn(): bool
    {
        return $this->category === self::CATEGORY_PPN;
    }

    public function isWht(): bool
    {
        return $this->category === self::CATEGORY_WHT;
    }

    public function isTaxable(): bool
    {
        return $this->category !== self::CATEGORY_NONE && (float) $this->rate > 0;
    }
}
