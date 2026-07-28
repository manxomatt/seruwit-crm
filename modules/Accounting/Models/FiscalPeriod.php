<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FiscalPeriod extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_SOFT_CLOSE = 'soft_close';

    public const STATUS_HARD_CLOSE = 'hard_close';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_OPEN,
        self::STATUS_SOFT_CLOSE,
        self::STATUS_HARD_CLOSE,
    ];

    protected $fillable = [
        'fiscal_year_id',
        'period_index',
        'name',
        'starts_on',
        'ends_on',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fiscal_year_id' => 'integer',
            'period_index' => 'integer',
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function allowsPosting(): bool
    {
        return $this->status !== self::STATUS_HARD_CLOSE
            && ! ($this->fiscalYear?->is_closed ?? false);
    }

    public function isHardClosed(): bool
    {
        return $this->status === self::STATUS_HARD_CLOSE;
    }
}
