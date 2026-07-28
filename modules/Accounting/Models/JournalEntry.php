<?php

namespace Modules\Accounting\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JournalEntry extends Model
{
    public const TYPE_MANUAL = 'manual';

    public const TYPE_OPENING = 'opening';

    public const TYPE_CLOSING = 'closing';

    public const TYPE_REVERSAL = 'reversal';

    public const TYPE_AUTO = 'auto';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_POSTED = 'posted';

    public const STATUS_VOID = 'void';

    protected $fillable = [
        'number',
        'fiscal_period_id',
        'entry_date',
        'type',
        'status',
        'source_type',
        'source_id',
        'event',
        'memo',
        'posted_at',
        'posted_by',
        'created_by',
        'voided_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fiscal_period_id' => 'integer',
            'entry_date' => 'date',
            'posted_at' => 'datetime',
            'voided_at' => 'datetime',
            'posted_by' => 'integer',
            'created_by' => 'integer',
            'source_id' => 'integer',
        ];
    }

    public function fiscalPeriod(): BelongsTo
    {
        return $this->belongsTo(FiscalPeriod::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class)->orderBy('sort_order')->orderBy('id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function postedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPosted(): bool
    {
        return $this->status === self::STATUS_POSTED;
    }

    public function totalDebit(): float
    {
        return round((float) $this->lines->sum('debit'), 2);
    }

    public function totalCredit(): float
    {
        return round((float) $this->lines->sum('credit'), 2);
    }

    public function isBalanced(): bool
    {
        return abs($this->totalDebit() - $this->totalCredit()) < 0.005;
    }

    /**
     * Generates the next yearly journal number, e.g. JE-2026-0001.
     */
    public static function nextNumber(?string $year = null): string
    {
        $year ??= now()->format('Y');
        $prefix = "JE-{$year}-";

        $last = static::query()
            ->where('number', 'like', $prefix.'%')
            ->orderByDesc('number')
            ->value('number');

        $sequence = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches) === 1) {
            $sequence = (int) $matches[1] + 1;
        }

        return sprintf('%s%04d', $prefix, $sequence);
    }
}
