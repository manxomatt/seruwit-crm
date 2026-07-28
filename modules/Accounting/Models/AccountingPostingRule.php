<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingPostingRule extends Model
{
    protected $fillable = [
        'event_key',
        'side',
        'system_role',
        'amount_key',
        'sort_order',
        'skip_if_zero',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'skip_if_zero' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, self>
     */
    public static function forEvent(string $eventKey)
    {
        return static::query()
            ->where('event_key', $eventKey)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }
}
