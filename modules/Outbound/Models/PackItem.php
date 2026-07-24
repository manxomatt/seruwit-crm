<?php

namespace Modules\Outbound\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'pack_id',
        'pick_list_item_id',
        'quantity',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Pack, $this>
     */
    public function pack(): BelongsTo
    {
        return $this->belongsTo(Pack::class);
    }

    /**
     * @return BelongsTo<PickListItem, $this>
     */
    public function pickListItem(): BelongsTo
    {
        return $this->belongsTo(PickListItem::class);
    }
}
