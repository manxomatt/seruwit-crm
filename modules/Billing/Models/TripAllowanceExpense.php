<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Billing\Database\Factories\TripAllowanceExpenseFactory;

class TripAllowanceExpense extends Model
{
    /** @use HasFactory<TripAllowanceExpenseFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    public const CATEGORIES = ['bbm', 'tol', 'parkir', 'makan', 'kuli', 'lainnya'];

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return TripAllowanceExpenseFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'trip_allowance_id',
        'category',
        'amount',
        'note',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<TripAllowance, $this>
     */
    public function tripAllowance(): BelongsTo
    {
        return $this->belongsTo(TripAllowance::class);
    }
}
