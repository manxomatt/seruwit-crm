<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FiscalYear extends Model
{
    protected $fillable = [
        'year',
        'starts_on',
        'ends_on',
        'is_closed',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'starts_on' => 'date',
            'ends_on' => 'date',
            'is_closed' => 'boolean',
        ];
    }

    public function periods(): HasMany
    {
        return $this->hasMany(FiscalPeriod::class)->orderBy('period_index');
    }
}
