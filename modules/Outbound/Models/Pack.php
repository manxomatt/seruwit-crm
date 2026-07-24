<?php

namespace Modules\Outbound\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Pack extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_SEALED = 'sealed';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'label_code',
        'pick_list_id',
        'status',
        'packed_by',
        'packed_at',
        'sealed_at',
        'weight_kg',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weight_kg' => 'decimal:2',
            'packed_at' => 'datetime',
            'sealed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<PickList, $this>
     */
    public function pickList(): BelongsTo
    {
        return $this->belongsTo(PickList::class);
    }

    /**
     * @return HasMany<PackItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PackItem::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function packer(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'packed_by');
    }

    public static function nextCode(): string
    {
        $year = now()->format('Y');
        $prefix = "PKG-{$year}-";

        $last = static::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $seq = $last ? ((int) substr((string) $last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    public static function nextLabelCode(): string
    {
        return 'LBL-'.strtoupper(Str::random(10));
    }
}
