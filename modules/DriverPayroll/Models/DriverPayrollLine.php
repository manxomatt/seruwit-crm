<?php

namespace Modules\DriverPayroll\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DriverPayrollLine extends Model
{
    use HasFactory;

    public const TYPE_BASE_SALARY = 'base_salary';

    public const TYPE_DAILY_ALLOWANCE = 'daily_allowance';

    public const TYPE_OVERTIME = 'overtime';

    public const TYPE_TRIP_COMMISSION = 'trip_commission';

    public const TYPE_BONUS = 'bonus';

    public const TYPE_CASH_ADVANCE_DEDUCTION = 'cash_advance_deduction';

    public const TYPE_PENALTY = 'penalty';

    public const TYPE_OTHER_DEDUCTION = 'other_deduction';

    protected $table = 'driver_payroll_lines';

    protected $fillable = [
        'driver_payroll_id',
        'type',
        'title',
        'amount',
        'source_type',
        'source_id',
        'notes',
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
     * @return BelongsTo<DriverPayroll, $this>
     */
    public function payroll(): BelongsTo
    {
        return $this->belongsTo(DriverPayroll::class, 'driver_payroll_id');
    }

    /**
     * Polymorphic source (e.g. RentalDutyOrder, CashAdvance, Trip, etc.)
     *
     * @return MorphTo<Model, $this>
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
