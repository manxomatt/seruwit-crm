<?php

namespace Modules\DriverPayroll\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Driver\Models\Driver;
use Modules\DriverPayroll\Models\DriverPayroll;
use Modules\DriverPayroll\Models\DriverPayrollLine;
use Modules\Expenses\Models\CashAdvance;
use Modules\RentalDutyOrder\Models\RentalDutyOrder;

class DriverPayrollCalculator
{
    /**
     * Generate a new DriverPayroll draft for a driver within a period.
     *
     * @param  array{
     *     driver_id: int,
     *     period_start: string,
     *     period_end: string,
     *     base_salary?: float|int,
     *     bonus?: float|int,
     *     deduct_cash_advances?: bool,
     *     notes?: string|null,
     * }  $data
     */
    public function generate(array $data, ?User $actor = null): DriverPayroll
    {
        return DB::transaction(function () use ($data, $actor): DriverPayroll {
            $driverId = (int) $data['driver_id'];
            $periodStart = $data['period_start'];
            $periodEnd = $data['period_end'];
            $baseSalary = isset($data['base_salary']) ? round((float) $data['base_salary'], 2) : 0.0;
            $bonus = isset($data['bonus']) ? round((float) $data['bonus'], 2) : 0.0;
            $deductCashAdvances = $data['deduct_cash_advances'] ?? true;
            $notes = $data['notes'] ?? null;

            $driver = Driver::query()->findOrFail($driverId);

            $payroll = DriverPayroll::query()->create([
                'code' => DriverPayroll::generateCode(),
                'driver_id' => $driver->id,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'status' => DriverPayroll::STATUS_DRAFT,
                'base_salary' => $baseSalary,
                'bonus_total' => $bonus,
                'created_by' => $actor?->id,
                'notes' => $notes,
            ]);

            // 1. Base Salary Line (if > 0)
            if ($baseSalary > 0) {
                DriverPayrollLine::query()->create([
                    'driver_payroll_id' => $payroll->id,
                    'type' => DriverPayrollLine::TYPE_BASE_SALARY,
                    'title' => "Gaji Pokok ({$periodStart} s/d {$periodEnd})",
                    'amount' => $baseSalary,
                ]);
            }

            // 2. Bonus Line (if > 0)
            if ($bonus > 0) {
                DriverPayrollLine::query()->create([
                    'driver_payroll_id' => $payroll->id,
                    'type' => DriverPayrollLine::TYPE_BONUS,
                    'title' => 'Bonus / Insentif Performa',
                    'amount' => $bonus,
                ]);
            }

            // 3. Overtime from RentalDutyOrder
            if (Schema::hasTable('rental_duty_orders')) {
                $dutyOrders = RentalDutyOrder::query()
                    ->where('driver_id', $driver->id)
                    ->whereBetween('departure_date', [$periodStart, $periodEnd])
                    ->where('total_driver_overtime_pay', '>', 0)
                    ->get();

                foreach ($dutyOrders as $dutyOrder) {
                    $hours = (float) $dutyOrder->overtime_hours;
                    $pay = (float) $dutyOrder->total_driver_overtime_pay;

                    DriverPayrollLine::query()->create([
                        'driver_payroll_id' => $payroll->id,
                        'type' => DriverPayrollLine::TYPE_OVERTIME,
                        'title' => "Lembur SJO {$dutyOrder->duty_order_number} ({$hours} jam)",
                        'amount' => $pay,
                        'source_type' => RentalDutyOrder::class,
                        'source_id' => $dutyOrder->id,
                        'notes' => "Rute: {$dutyOrder->origin} - {$dutyOrder->destination}",
                    ]);
                }
            }

            // 4. Open Cash Advance Deductions (potongan kasbon)
            if ($deductCashAdvances && Schema::hasTable('cash_advances')) {
                $openAdvances = CashAdvance::query()
                    ->where('driver_id', $driver->id)
                    ->where('status', CashAdvance::STATUS_DISBURSED)
                    ->get();

                foreach ($openAdvances as $advance) {
                    $unsettled = (float) $advance->amount - ((float) $advance->spent_amount + (float) $advance->returned_amount);
                    if ($unsettled > 0) {
                        DriverPayrollLine::query()->create([
                            'driver_payroll_id' => $payroll->id,
                            'type' => DriverPayrollLine::TYPE_CASH_ADVANCE_DEDUCTION,
                            'title' => "Potongan Kasbon {$advance->code} ({$advance->purpose})",
                            'amount' => $unsettled,
                            'source_type' => CashAdvance::class,
                            'source_id' => $advance->id,
                        ]);
                    }
                }
            }

            $payroll->recalculateTotals();

            return $payroll->fresh(['lines', 'driver']);
        });
    }
}
