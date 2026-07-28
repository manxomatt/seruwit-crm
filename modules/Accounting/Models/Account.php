<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    public const TYPE_ASSET = 'asset';

    public const TYPE_LIABILITY = 'liability';

    public const TYPE_EQUITY = 'equity';

    public const TYPE_REVENUE = 'revenue';

    public const TYPE_EXPENSE = 'expense';

    public const TYPE_CONTRA_REVENUE = 'contra_revenue';

    public const NORMAL_DEBIT = 'debit';

    public const NORMAL_CREDIT = 'credit';

    /** @var list<string> */
    public const TYPES = [
        self::TYPE_ASSET,
        self::TYPE_LIABILITY,
        self::TYPE_EQUITY,
        self::TYPE_REVENUE,
        self::TYPE_EXPENSE,
        self::TYPE_CONTRA_REVENUE,
    ];

    protected $fillable = [
        'code',
        'name',
        'type',
        'parent_id',
        'is_postable',
        'is_active',
        'normal_balance',
        'currency',
        'system_role',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_postable' => 'boolean',
            'is_active' => 'boolean',
            'parent_id' => 'integer',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('code');
    }

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    public static function defaultNormalBalance(string $type): string
    {
        return match ($type) {
            self::TYPE_LIABILITY, self::TYPE_EQUITY, self::TYPE_REVENUE => self::NORMAL_CREDIT,
            default => self::NORMAL_DEBIT,
        };
    }
}
