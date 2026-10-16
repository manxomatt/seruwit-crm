<?php

namespace Modules\Rental\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;

class RentalDutyOrder extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_DISPATCHED = 'dispatched';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_SETTLED = 'settled';

    public const STATUS_CANCELLED = 'cancelled';

    public const SETTLEMENT_PENDING = 'pending';

    public const SETTLEMENT_SUBMITTED = 'submitted';

    public const SETTLEMENT_SETTLED = 'settled';

    protected $fillable = [
        'duty_order_number',
        'rental_id',
        'driver_id',
        'vehicle_id',
        'origin',
        'destination',
        'departure_date',
        'return_date',
        'departure_time',
        'return_time',
        'actual_departure_at',
        'actual_return_at',
        'passenger_name',
        'passenger_phone',
        'status',
        'notes',
        'cash_advance_amount',
        'cash_advance_notes',
        'cash_advance_paid_at',
        'cash_advance_paid_by',
        'actual_expense_total',
        'net_balance',
        'settlement_status',
        'settled_at',
        'settled_by',
        'settlement_notes',
        'standard_hours_per_day',
        'actual_hours_worked',
        'overtime_hours',
        'driver_overtime_rate_per_hour',
        'total_driver_overtime_pay',
        'customer_overtime_rate_per_hour',
        'total_customer_overtime_charge',
        'is_overtime_billed_to_customer',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'departure_date' => 'date:Y-m-d',
            'return_date' => 'date:Y-m-d',
            'actual_departure_at' => 'datetime',
            'actual_return_at' => 'datetime',
            'cash_advance_paid_at' => 'datetime',
            'settled_at' => 'datetime',
            'cash_advance_amount' => 'decimal:2',
            'actual_expense_total' => 'decimal:2',
            'net_balance' => 'decimal:2',
            'driver_overtime_rate_per_hour' => 'decimal:2',
            'total_driver_overtime_pay' => 'decimal:2',
            'customer_overtime_rate_per_hour' => 'decimal:2',
            'total_customer_overtime_charge' => 'decimal:2',
            'is_overtime_billed_to_customer' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Rental, $this>
     */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function cashAdvancePayer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cash_advance_paid_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function settler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'settled_by');
    }

    /**
     * @return HasMany<RentalDutyOrderExpense, $this>
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(RentalDutyOrderExpense::class, 'duty_order_id');
    }

    /**
     * Scope active / on duty orders.
     *
     * @param  Builder<static>  $query
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_DRAFT, self::STATUS_DISPATCHED]);
    }

    /**
     * Recalculate expense total and net cash balance.
     */
    public function recalculateExpenses(): void
    {
        $totalExpenses = (float) $this->expenses()->sum('amount');
        $advance = (float) $this->cash_advance_amount;
        $net = $advance - $totalExpenses;

        $this->update([
            'actual_expense_total' => $totalExpenses,
            'net_balance' => $net,
        ]);
    }

    /**
     * Auto-generate a unique duty order number (Surat Jalan Operasional - SJO).
     */
    public static function generateNumber(): string
    {
        $prefix = 'SJO-'.now()->format('Ym');
        $latest = static::query()
            ->where('duty_order_number', 'like', "{$prefix}-%")
            ->latest('id')
            ->first();

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest->duty_order_number, $matches)) {
            $seq = ((int) $matches[1]) + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }
}
