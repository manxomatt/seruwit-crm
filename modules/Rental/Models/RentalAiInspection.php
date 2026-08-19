<?php

namespace Modules\Rental\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalAiInspection extends Model
{
    use HasFactory;

    public const TYPE_HANDOVER_RETURN = 'handover_return';

    public const TYPE_HANDOVER_CHECKOUT = 'handover_checkout';

    public const TYPE_LIVE_PREVIEW = 'live_preview';

    public const STATUS_CLEAN = 'clean';

    public const STATUS_MINOR_DAMAGE = 'minor_damage';

    public const STATUS_SEVERE_DAMAGE = 'severe_damage';

    /** @var list<string> */
    protected $fillable = [
        'rental_id',
        'inspection_type',
        'model_used',
        'extracted_odometer',
        'extracted_fuel_level',
        'condition_summary',
        'overall_status',
        'detected_damages',
        'raw_response',
        'created_by_user_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'extracted_odometer' => 'integer',
            'detected_damages' => 'array',
            'raw_response' => 'array',
        ];
    }

    /** @return BelongsTo<Rental, $this> */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    /** @return BelongsTo<User, $this> */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
