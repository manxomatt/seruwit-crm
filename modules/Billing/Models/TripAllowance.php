<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Billing\Database\Factories\TripAllowanceFactory;
use Modules\TransportationManagement\Models\Trip;

class TripAllowance extends Model
{
    /** @use HasFactory<TripAllowanceFactory> */
    use HasFactory;

    public const STATUS_ISSUED = 'issued';

    public const STATUS_SETTLED = 'settled';

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return TripAllowanceFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'trip_id',
        'advance_amount',
        'status',
        'issued_at',
        'settled_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'advance_amount' => 'decimal:2',
            'issued_at' => 'datetime',
            'settled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Trip, $this>
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    /**
     * @return HasMany<TripAllowanceExpense, $this>
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(TripAllowanceExpense::class)->orderBy('id');
    }

    public function totalExpenses(): float
    {
        return (float) $this->expenses()->sum('amount');
    }

    /**
     * The settlement balance: advance minus recorded expenses. Positive means
     * the driver returns money to the company; negative means the company
     * reimburses the driver. Never stored — expense lines are immutable after
     * settlement, so this is always reproducible.
     */
    public function balance(): float
    {
        return (float) $this->advance_amount - $this->totalExpenses();
    }
}
