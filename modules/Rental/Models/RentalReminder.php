<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalReminder extends Model
{
    public const KIND_ENDING = 'ending';

    public const KIND_OVERDUE = 'overdue';

    /** @var list<string> */
    protected $fillable = [
        'rental_id',
        'kind',
        'days_before',
        'sent_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'days_before' => 'integer',
            'sent_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Rental, $this> */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }
}
