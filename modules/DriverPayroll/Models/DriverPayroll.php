<?php

namespace Modules\DriverPayroll\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Driver\Models\Driver;

class DriverPayroll extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    public const PAYMENT_BANK_TRANSFER = 'bank_transfer';

    public const PAYMENT_CASH = 'cash';

    protected $table = 'driver_payrolls';

    protected $fillable = [
        'code',
        'driver_id',
        'period_start',
        'period_end',
        'status',
        'base_salary',
        'daily_allowance_total',
        'overtime_pay_total',
        'trip_commission_total',
        'bonus_total',
        'deductions_total',
        'net_pay',
        'company_bank_account_id',
        'payment_method',
        'payment_reference',
        'paid_at',
        'paid_by',
        'approved_at',
        'approved_by',
        'created_by',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_start' => 'date:Y-m-d',
            'period_end' => 'date:Y-m-d',
            'paid_at' => 'datetime',
            'approved_at' => 'datetime',
            'base_salary' => 'decimal:2',
            'daily_allowance_total' => 'decimal:2',
            'overtime_pay_total' => 'decimal:2',
            'trip_commission_total' => 'decimal:2',
            'bonus_total' => 'decimal:2',
            'deductions_total' => 'decimal:2',
            'net_pay' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * @return HasMany<DriverPayrollLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(DriverPayrollLine::class, 'driver_payroll_id');
    }

    /**
     * @return BelongsTo<CompanyBankAccount, $this>
     */
    public function companyBankAccount(): BelongsTo
    {
        return $this->belongsTo(CompanyBankAccount::class);
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
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function recalculateTotals(): void
    {
        $this->loadMissing('lines');

        $dailyAllowance = (float) $this->lines->where('type', DriverPayrollLine::TYPE_DAILY_ALLOWANCE)->sum('amount');
        $overtime = (float) $this->lines->where('type', DriverPayrollLine::TYPE_OVERTIME)->sum('amount');
        $commission = (float) $this->lines->where('type', DriverPayrollLine::TYPE_TRIP_COMMISSION)->sum('amount');
        $bonus = (float) $this->lines->where('type', DriverPayrollLine::TYPE_BONUS)->sum('amount');

        $deductions = (float) $this->lines->filter(function (DriverPayrollLine $line): bool {
            return in_array($line->type, [
                DriverPayrollLine::TYPE_CASH_ADVANCE_DEDUCTION,
                DriverPayrollLine::TYPE_PENALTY,
                DriverPayrollLine::TYPE_OTHER_DEDUCTION,
            ], true);
        })->sum('amount');

        $baseSalary = (float) $this->base_salary;
        $totalGross = $baseSalary + $dailyAllowance + $overtime + $commission + $bonus;
        $netPay = max(0, $totalGross - $deductions);

        $this->update([
            'daily_allowance_total' => $dailyAllowance,
            'overtime_pay_total' => $overtime,
            'trip_commission_total' => $commission,
            'bonus_total' => $bonus,
            'deductions_total' => $deductions,
            'net_pay' => $netPay,
        ]);
    }

    public static function generateCode(): string
    {
        $prefix = 'PAY-DRV-'.now()->format('Ym');
        $latest = static::query()
            ->where('code', 'like', "{$prefix}-%")
            ->latest('id')
            ->first();

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest->code, $matches)) {
            $seq = ((int) $matches[1]) + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }
}
