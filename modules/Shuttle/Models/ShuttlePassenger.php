<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShuttlePassenger extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'booking_id',
        'name',
        'phone',
        'id_number',
        'seat_label',
    ];

    /**
     * @return BelongsTo<ShuttleBooking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(ShuttleBooking::class, 'booking_id');
    }
}
