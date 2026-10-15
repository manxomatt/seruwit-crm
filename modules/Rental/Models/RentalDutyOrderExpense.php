<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalDutyOrderExpense extends Model
{
    use HasFactory;

    public const CATEGORY_FUEL = 'fuel';

    public const CATEGORY_TOLL = 'toll';

    public const CATEGORY_PARKING = 'parking';

    public const CATEGORY_MEAL = 'meal';

    public const CATEGORY_LODGING = 'lodging';

    public const CATEGORY_REPAIR = 'repair';

    public const CATEGORY_OTHER = 'other';

    protected $fillable = [
        'duty_order_id',
        'category',
        'amount',
        'date',
        'receipt_number',
        'receipt_url',
        'description',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<RentalDutyOrder, $this>
     */
    public function dutyOrder(): BelongsTo
    {
        return $this->belongsTo(RentalDutyOrder::class, 'duty_order_id');
    }

    /**
     * Category display label.
     */
    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            self::CATEGORY_FUEL => 'BBM / Bensin',
            self::CATEGORY_TOLL => 'E-Toll / Tol',
            self::CATEGORY_PARKING => 'Parkir & Retribusi',
            self::CATEGORY_MEAL => 'Uang Makan Supir',
            self::CATEGORY_LODGING => 'Penginapan Supir',
            self::CATEGORY_REPAIR => 'Perbaikan Darurat Lapangan',
            default => 'Lain-lain',
        };
    }
}
