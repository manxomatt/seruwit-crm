<?php

namespace Modules\Expenses\Support;

use App\Modules\Facades\Modules;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Billing\Models\TripAllowance;
use Modules\Expenses\Models\CashAdvance;
use Modules\Expenses\Models\ExpenseCategory;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\FleetCompliance\Models\VehicleComplianceRenewal;
use Modules\FleetFuel\Models\FuelLog;
use Modules\Maintenance\Models\WorkOrder;
use Modules\RentalDutyOrder\Models\RentalDutyOrder;

/**
 * Bridges operational fleet, maintenance, billing, and duty-order events into
 * the Expenses & Cash Advance sub-ledger (and onward to GL + BankBookService).
 *
 * All hooks are idempotent and guarded so operational workflows continue to
 * function even when the Expenses or Accounting module is disabled or a fiscal
 * period is locked.
 */
class OperationalExpenseBridge
{
    public function __construct(
        private readonly ExpenseService $expenses,
        private readonly CashAdvanceService $advances,
        private readonly FiscalCalendarService $calendar,
    ) {}

    /**
     * Record the tenant-borne portion of a vehicle compliance renewal
     * (STNK, KIR, Insurance) as an operational expense on COA 6140.
     *
     * - payer = 'tenant' -> 100% company expense
     * - payer = 'shared' -> 50% company expense (remaining 50% deducted in FleetSettlement)
     * - payer = 'owner'  -> 0% company expense (100% deducted in FleetSettlement)
     *
     * @param  array<string, mixed>  $options
     */
    public function syncComplianceRenewal(VehicleComplianceRenewal $renewal, array $options = []): ?ExpenseClaim
    {
        if (! $this->isReady()) {
            return null;
        }

        $totalCost = round((float) $renewal->cost, 2);
        $tenantShare = match ($renewal->payer) {
            VehicleComplianceRenewal::PAYER_TENANT => $totalCost,
            VehicleComplianceRenewal::PAYER_SHARED => round($totalCost * 0.5, 2),
            default => 0.0,
        };

        if ($tenantShare <= 0) {
            return null;
        }

        $existing = ExpenseClaim::query()
            ->where('source_type', $renewal->getMorphClass())
            ->where('source_id', $renewal->id)
            ->where('status', '!=', ExpenseClaim::STATUS_VOIDED)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            $expenseDate = $renewal->renewal_date
                ? Carbon::parse($renewal->renewal_date)->toDateString()
                : now()->toDateString();

            $this->ensureFiscalYear($expenseDate);

            $category = $this->findCategory(ExpenseCategory::CODE_VEHICLE_DOC);
            $vehiclePlate = $renewal->vehicle?->plate_number ?? "#{$renewal->vehicle_id}";
            $docLabel = $renewal->document_label;

            return $this->expenses->create([
                'expense_date' => $expenseDate,
                'type' => ExpenseClaim::TYPE_DIRECT,
                'title' => "Perpanjangan {$docLabel} ({$vehiclePlate})",
                'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
                'partner_id' => $renewal->partner_id,
                'vehicle_id' => $renewal->vehicle_id,
                'payment_method' => $options['payment_method'] ?? 'bank_transfer',
                'reference_number' => $renewal->reference_number,
                'notes' => $renewal->notes,
                'source_type' => $renewal->getMorphClass(),
                'source_id' => (int) $renewal->id,
                'post_immediately' => true,
                'lines' => [
                    [
                        'expense_category_id' => $category?->id,
                        'account_id' => $category?->account_id,
                        'vehicle_id' => $renewal->vehicle_id,
                        'description' => "Biaya {$docLabel} {$vehiclePlate}".($renewal->payer === VehicleComplianceRenewal::PAYER_SHARED ? ' (Porsi Perusahaan 50%)' : ''),
                        'amount' => $tenantShare,
                        'receipt_number' => $renewal->reference_number,
                    ],
                ],
            ], $renewal->created_by ?? Auth::id());
        } catch (\Throwable $e) {
            Log::warning('[OperationalExpenseBridge] syncComplianceRenewal skipped: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Record a direct vehicle fuel fill as an operational expense on COA 6110.
     *
     * @param  array<string, mixed>  $options
     */
    public function syncFuelLog(FuelLog $log, array $options = []): ?ExpenseClaim
    {
        if (! $this->isReady()) {
            return null;
        }

        if (($options['record_expense'] ?? true) === false) {
            return null;
        }

        $cost = round((float) $log->cost, 2);
        if ($cost <= 0) {
            return null;
        }

        $existing = ExpenseClaim::query()
            ->where('source_type', $log->getMorphClass())
            ->where('source_id', $log->id)
            ->where('status', '!=', ExpenseClaim::STATUS_VOIDED)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            $expenseDate = $log->filled_at
                ? Carbon::parse($log->filled_at)->toDateString()
                : now()->toDateString();

            $this->ensureFiscalYear($expenseDate);

            $category = $this->findCategory(ExpenseCategory::CODE_FUEL);
            $vehiclePlate = $log->vehicle?->plate_number ?? "#{$log->vehicle_id}";
            $liters = number_format((float) $log->liters, 2, '.', '');

            return $this->expenses->create([
                'expense_date' => $expenseDate,
                'type' => ExpenseClaim::TYPE_DIRECT,
                'title' => "BBM {$vehiclePlate} ({$liters} L)",
                'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
                'vehicle_id' => $log->vehicle_id,
                'driver_id' => $log->driver_id,
                'payment_method' => $options['payment_method'] ?? 'cash',
                'reference_number' => $log->receipt_number,
                'notes' => $log->notes,
                'source_type' => $log->getMorphClass(),
                'source_id' => (int) $log->id,
                'post_immediately' => true,
                'lines' => [
                    [
                        'expense_category_id' => $category?->id,
                        'account_id' => $category?->account_id,
                        'vehicle_id' => $log->vehicle_id,
                        'description' => "Pengisian BBM {$vehiclePlate} ({$liters} L)".($log->station_name ? " di {$log->station_name}" : ''),
                        'amount' => $cost,
                        'receipt_number' => $log->receipt_number,
                    ],
                ],
            ], Auth::id());
        } catch (\Throwable $e) {
            Log::warning('[OperationalExpenseBridge] syncFuelLog skipped: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Void the expense claim generated by a fuel log when the log is deleted.
     */
    public function voidFuelLog(FuelLog $log): void
    {
        if (! $this->isReady()) {
            return;
        }

        $claims = ExpenseClaim::query()
            ->where('source_type', $log->getMorphClass())
            ->where('source_id', $log->id)
            ->where('status', '!=', ExpenseClaim::STATUS_VOIDED)
            ->get();

        foreach ($claims as $claim) {
            try {
                $this->expenses->void($claim);
            } catch (\Throwable $e) {
                Log::warning('[OperationalExpenseBridge] voidFuelLog skipped: '.$e->getMessage());
            }
        }
    }

    /**
     * Record external labor / non-inventory service costs on a completed WorkOrder
     * as an operational maintenance expense on COA 6120.
     *
     * @param  array<string, mixed>  $options
     */
    public function syncWorkOrderCompleted(WorkOrder $workOrder, array $options = []): ?ExpenseClaim
    {
        if (! $this->isReady() || $workOrder->status !== WorkOrder::STATUS_COMPLETED) {
            return null;
        }

        $laborCost = round((float) ($workOrder->actual_labor_cost ?? 0), 2);
        $nonInventoryPartsCost = $workOrder->stock_deducted_at === null
            ? round((float) ($workOrder->actual_parts_cost ?? 0), 2)
            : 0.0;

        $totalServiceCost = round($laborCost + $nonInventoryPartsCost, 2);
        if ($totalServiceCost <= 0) {
            return null;
        }

        $existing = ExpenseClaim::query()
            ->where('source_type', $workOrder->getMorphClass())
            ->where('source_id', $workOrder->id)
            ->where('status', '!=', ExpenseClaim::STATUS_VOIDED)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            $expenseDate = $workOrder->completed_at
                ? Carbon::parse($workOrder->completed_at)->toDateString()
                : now()->toDateString();

            $this->ensureFiscalYear($expenseDate);

            $category = $this->findCategory(ExpenseCategory::CODE_MAINTENANCE);
            $vehiclePlate = $workOrder->vehicle?->plate_number ?? "#{$workOrder->vehicle_id}";

            return $this->expenses->create([
                'expense_date' => $expenseDate,
                'type' => ExpenseClaim::TYPE_DIRECT,
                'title' => "Servis {$workOrder->reference_number}: {$workOrder->title} ({$vehiclePlate})",
                'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
                'partner_id' => $workOrder->vendor_partner_id,
                'vehicle_id' => $workOrder->vehicle_id,
                'payment_method' => $options['payment_method'] ?? 'bank_transfer',
                'reference_number' => $workOrder->invoice_number ?? $workOrder->reference_number,
                'notes' => $workOrder->resolution_notes ?? $workOrder->notes,
                'source_type' => $workOrder->getMorphClass(),
                'source_id' => (int) $workOrder->id,
                'post_immediately' => true,
                'lines' => [
                    [
                        'expense_category_id' => $category?->id,
                        'account_id' => $category?->account_id,
                        'vehicle_id' => $workOrder->vehicle_id,
                        'description' => "Biaya jasa/servis {$workOrder->reference_number} ({$workOrder->title})",
                        'amount' => $totalServiceCost,
                        'receipt_number' => $workOrder->invoice_number ?? $workOrder->reference_number,
                    ],
                ],
            ], $workOrder->approved_by ?? $workOrder->created_by ?? Auth::id());
        } catch (\Throwable $e) {
            Log::warning('[OperationalExpenseBridge] syncWorkOrderCompleted skipped: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Reverse/void any expense claim created for a work order when it is reopened or deleted.
     */
    public function reverseWorkOrderExpense(WorkOrder $workOrder): void
    {
        if (! $this->isReady()) {
            return;
        }

        $claims = ExpenseClaim::query()
            ->where('source_type', $workOrder->getMorphClass())
            ->where('source_id', $workOrder->id)
            ->where('status', '!=', ExpenseClaim::STATUS_VOIDED)
            ->get();

        foreach ($claims as $claim) {
            try {
                $this->expenses->void($claim);
            } catch (\Throwable $e) {
                Log::warning('[OperationalExpenseBridge] reverseWorkOrderExpense skipped: '.$e->getMessage());
            }
        }
    }

    /**
     * Disburse a CashAdvance (COA 1140) when a Billing TripAllowance is issued.
     *
     * @param  array<string, mixed>  $options
     */
    public function syncTripAllowanceIssued(TripAllowance $allowance, array $options = []): ?CashAdvance
    {
        if (! $this->isReady()) {
            return null;
        }

        $amount = round((float) $allowance->advance_amount, 2);
        if ($amount <= 0) {
            return null;
        }

        $existing = CashAdvance::query()
            ->where('source_type', $allowance->getMorphClass())
            ->where('source_id', $allowance->id)
            ->where('status', '!=', CashAdvance::STATUS_VOIDED)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            $allowance->loadMissing(['trip.driver']);
            $advanceDate = $allowance->issued_at
                ? Carbon::parse($allowance->issued_at)->toDateString()
                : now()->toDateString();

            $this->ensureFiscalYear($advanceDate);

            $tripCode = $allowance->trip?->code ?? "#{$allowance->trip_id}";

            return $this->advances->create([
                'advance_date' => $advanceDate,
                'purpose' => "Uang Jalan Perjalanan {$tripCode}",
                'recipient_name' => $allowance->trip?->driver?->name,
                'driver_id' => $allowance->trip?->driver_id,
                'vehicle_id' => $allowance->trip?->vehicle_id,
                'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
                'payment_method' => $options['payment_method'] ?? 'cash',
                'amount' => $amount,
                'reference_number' => $tripCode,
                'notes' => $allowance->notes,
                'source_type' => $allowance->getMorphClass(),
                'source_id' => (int) $allowance->id,
                'disburse_immediately' => true,
            ], Auth::id());
        } catch (\Throwable $e) {
            Log::warning('[OperationalExpenseBridge] syncTripAllowanceIssued skipped: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Settle the CashAdvance when a Billing TripAllowance is settled.
     *
     * @param  array<string, mixed>  $options
     */
    public function syncTripAllowanceSettled(TripAllowance $allowance, array $options = []): ?CashAdvance
    {
        if (! $this->isReady()) {
            return null;
        }

        try {
            $allowance->loadMissing(['trip', 'expenses']);
            $settlementDate = $allowance->settled_at
                ? Carbon::parse($allowance->settled_at)->toDateString()
                : now()->toDateString();

            $this->ensureFiscalYear($settlementDate);

            $advance = CashAdvance::query()
                ->where('source_type', $allowance->getMorphClass())
                ->where('source_id', $allowance->id)
                ->where('status', '!=', CashAdvance::STATUS_VOIDED)
                ->first();

            if ($advance === null && (float) $allowance->advance_amount > 0) {
                $advance = $this->syncTripAllowanceIssued($allowance, $options);
            }

            if ($advance === null || $advance->isSettled()) {
                return $advance;
            }

            $lines = $this->mapTripAllowanceExpenseLines($allowance);

            return $this->advances->settle($advance, [
                'settlement_date' => $settlementDate,
                'payment_method' => $options['payment_method'] ?? $advance->payment_method,
                'company_bank_account_id' => $options['company_bank_account_id'] ?? $advance->company_bank_account_id,
                'notes' => $allowance->notes,
                'lines' => $lines,
            ], Auth::id());
        } catch (\Throwable $e) {
            Log::warning('[OperationalExpenseBridge] syncTripAllowanceSettled skipped: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Void the CashAdvance when an issued TripAllowance is deleted.
     */
    public function voidTripAllowance(TripAllowance $allowance): void
    {
        if (! $this->isReady()) {
            return;
        }

        $advances = CashAdvance::query()
            ->where('source_type', $allowance->getMorphClass())
            ->where('source_id', $allowance->id)
            ->where('status', '!=', CashAdvance::STATUS_VOIDED)
            ->get();

        foreach ($advances as $advance) {
            try {
                $this->advances->void($advance);
            } catch (\Throwable $e) {
                Log::warning('[OperationalExpenseBridge] voidTripAllowance skipped: '.$e->getMessage());
            }
        }
    }

    /**
     * Disburse a CashAdvance (COA 1140) when a RentalDutyOrder (SPPD) is created
     * with a positive cash_advance_amount.
     *
     * @param  array<string, mixed>  $options
     */
    public function syncDutyOrderCreated(RentalDutyOrder $dutyOrder, array $options = []): ?CashAdvance
    {
        if (! $this->isReady()) {
            return null;
        }

        $amount = round((float) $dutyOrder->cash_advance_amount, 2);
        if ($amount <= 0) {
            return null;
        }

        $existing = CashAdvance::query()
            ->where('source_type', $dutyOrder->getMorphClass())
            ->where('source_id', $dutyOrder->id)
            ->where('status', '!=', CashAdvance::STATUS_VOIDED)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            $dutyOrder->loadMissing(['driver']);
            $advanceDate = $dutyOrder->cash_advance_paid_at
                ? Carbon::parse($dutyOrder->cash_advance_paid_at)->toDateString()
                : ($dutyOrder->departure_date
                    ? Carbon::parse($dutyOrder->departure_date)->toDateString()
                    : now()->toDateString());

            $this->ensureFiscalYear($advanceDate);

            return $this->advances->create([
                'advance_date' => $advanceDate,
                'purpose' => "Uang Jalan SPPD {$dutyOrder->duty_order_number} ({$dutyOrder->origin} - {$dutyOrder->destination})",
                'recipient_name' => $dutyOrder->driver?->name,
                'driver_id' => $dutyOrder->driver_id,
                'vehicle_id' => $dutyOrder->vehicle_id,
                'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
                'payment_method' => $options['payment_method'] ?? 'cash',
                'amount' => $amount,
                'reference_number' => $dutyOrder->duty_order_number,
                'notes' => $dutyOrder->cash_advance_notes ?? $dutyOrder->notes,
                'source_type' => $dutyOrder->getMorphClass(),
                'source_id' => (int) $dutyOrder->id,
                'disburse_immediately' => true,
            ], $dutyOrder->cash_advance_paid_by ?? $dutyOrder->created_by ?? Auth::id());
        } catch (\Throwable $e) {
            Log::warning('[OperationalExpenseBridge] syncDutyOrderCreated skipped: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Settle the CashAdvance (or record direct expenses if no cash advance was given)
     * when a RentalDutyOrder (SPPD) is settled.
     *
     * @param  array<string, mixed>  $options
     */
    public function syncDutyOrderSettled(RentalDutyOrder $dutyOrder, array $options = []): CashAdvance|ExpenseClaim|null
    {
        if (! $this->isReady()) {
            return null;
        }

        try {
            $dutyOrder->loadMissing(['expenses', 'driver']);
            $settlementDate = $dutyOrder->settled_at
                ? Carbon::parse($dutyOrder->settled_at)->toDateString()
                : now()->toDateString();

            $this->ensureFiscalYear($settlementDate);

            $advance = CashAdvance::query()
                ->where('source_type', $dutyOrder->getMorphClass())
                ->where('source_id', $dutyOrder->id)
                ->where('status', '!=', CashAdvance::STATUS_VOIDED)
                ->first();

            if ($advance === null && (float) $dutyOrder->cash_advance_amount > 0) {
                $advance = $this->syncDutyOrderCreated($dutyOrder, $options);
            }

            $lines = $this->mapDutyOrderExpenseLines($dutyOrder);

            if ($advance !== null) {
                if ($advance->isSettled()) {
                    return $advance;
                }

                return $this->advances->settle($advance, [
                    'settlement_date' => $settlementDate,
                    'payment_method' => $options['payment_method'] ?? $advance->payment_method,
                    'company_bank_account_id' => $options['company_bank_account_id'] ?? $advance->company_bank_account_id,
                    'notes' => $dutyOrder->settlement_notes ?? $dutyOrder->notes,
                    'lines' => $lines,
                ], $dutyOrder->settled_by ?? Auth::id());
            }

            // No cash advance was issued, but the driver incurred reimbursable field expenses
            $nonZeroLines = array_values(array_filter($lines, fn (array $l): bool => (float) ($l['amount'] ?? 0) > 0));
            if ($nonZeroLines === []) {
                return null;
            }

            $existingClaim = ExpenseClaim::query()
                ->where('source_type', $dutyOrder->getMorphClass())
                ->where('source_id', $dutyOrder->id)
                ->where('status', '!=', ExpenseClaim::STATUS_VOIDED)
                ->first();

            if ($existingClaim !== null) {
                return $existingClaim;
            }

            return $this->expenses->create([
                'expense_date' => $settlementDate,
                'type' => ExpenseClaim::TYPE_REIMBURSEMENT,
                'title' => "Reimbursement SPPD {$dutyOrder->duty_order_number} ({$dutyOrder->origin} - {$dutyOrder->destination})",
                'company_bank_account_id' => $options['company_bank_account_id'] ?? null,
                'vehicle_id' => $dutyOrder->vehicle_id,
                'driver_id' => $dutyOrder->driver_id,
                'payment_method' => $options['payment_method'] ?? 'cash',
                'reference_number' => $dutyOrder->duty_order_number,
                'notes' => $dutyOrder->settlement_notes ?? $dutyOrder->notes,
                'source_type' => $dutyOrder->getMorphClass(),
                'source_id' => (int) $dutyOrder->id,
                'post_immediately' => true,
                'lines' => $nonZeroLines,
            ], $dutyOrder->settled_by ?? Auth::id());
        } catch (\Throwable $e) {
            Log::warning('[OperationalExpenseBridge] syncDutyOrderSettled skipped: '.$e->getMessage());

            return null;
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function mapTripAllowanceExpenseLines(TripAllowance $allowance): array
    {
        $lines = [];
        $tripCode = $allowance->trip?->code ?? "#{$allowance->trip_id}";

        foreach ($allowance->expenses as $expense) {
            $categoryCode = match ($expense->category) {
                'fuel' => ExpenseCategory::CODE_FUEL,
                'toll', 'parking' => ExpenseCategory::CODE_TOLL_PARKING,
                'meal' => ExpenseCategory::CODE_MEAL_TRAVEL,
                default => ExpenseCategory::CODE_OFFICE_OPEX,
            };

            $category = $this->findCategory($categoryCode);

            $lines[] = [
                'expense_category_id' => $category?->id,
                'account_id' => $category?->account_id,
                'vehicle_id' => $allowance->trip?->vehicle_id,
                'description' => $expense->description ?: "Biaya {$expense->category} Trip {$tripCode}",
                'amount' => round((float) $expense->amount, 2),
                'receipt_number' => $expense->receipt_reference ?? null,
            ];
        }

        if ($lines === []) {
            $fallbackCategory = $this->findCategory(ExpenseCategory::CODE_MEAL_TRAVEL);
            $lines[] = [
                'expense_category_id' => $fallbackCategory?->id,
                'account_id' => $fallbackCategory?->account_id,
                'vehicle_id' => $allowance->trip?->vehicle_id,
                'description' => "Pengembalian penuh uang jalan Trip {$tripCode}",
                'amount' => 0,
            ];
        }

        return $lines;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function mapDutyOrderExpenseLines(RentalDutyOrder $dutyOrder): array
    {
        $lines = [];

        foreach ($dutyOrder->expenses as $expense) {
            $categoryCode = match ($expense->category) {
                'fuel' => ExpenseCategory::CODE_FUEL,
                'toll', 'parking' => ExpenseCategory::CODE_TOLL_PARKING,
                'meal', 'lodging' => ExpenseCategory::CODE_MEAL_TRAVEL,
                'repair' => ExpenseCategory::CODE_MAINTENANCE,
                default => ExpenseCategory::CODE_OFFICE_OPEX,
            };

            $category = $this->findCategory($categoryCode);

            $lines[] = [
                'expense_category_id' => $category?->id,
                'account_id' => $category?->account_id,
                'vehicle_id' => $dutyOrder->vehicle_id,
                'description' => $expense->description ?: "Biaya {$expense->category} SPPD {$dutyOrder->duty_order_number}",
                'amount' => round((float) $expense->amount, 2),
                'receipt_number' => $expense->receipt_number,
            ];
        }

        if ((float) $dutyOrder->total_driver_overtime_pay > 0) {
            $category = $this->findCategory(ExpenseCategory::CODE_MEAL_TRAVEL);
            $lines[] = [
                'expense_category_id' => $category?->id,
                'account_id' => $category?->account_id,
                'vehicle_id' => $dutyOrder->vehicle_id,
                'description' => "Upah lembur supir SPPD {$dutyOrder->duty_order_number} ({$dutyOrder->overtime_hours} jam)",
                'amount' => round((float) $dutyOrder->total_driver_overtime_pay, 2),
                'receipt_number' => $dutyOrder->duty_order_number,
            ];
        }

        if ($lines === []) {
            $fallbackCategory = $this->findCategory(ExpenseCategory::CODE_MEAL_TRAVEL);
            $lines[] = [
                'expense_category_id' => $fallbackCategory?->id,
                'account_id' => $fallbackCategory?->account_id,
                'vehicle_id' => $dutyOrder->vehicle_id,
                'description' => "Pengembalian penuh uang jalan SPPD {$dutyOrder->duty_order_number}",
                'amount' => 0,
            ];
        }

        return $lines;
    }

    private function findCategory(string $code): ?ExpenseCategory
    {
        return ExpenseCategory::query()->where('code', $code)->first();
    }

    private function ensureFiscalYear(string $dateString): void
    {
        $year = (int) Carbon::parse($dateString)->format('Y');
        $this->calendar->ensureYear($year);
    }

    private function isReady(): bool
    {
        if (tenancy()->initialized && (! Modules::available('expenses') || ! Modules::available('accounting'))) {
            return false;
        }

        if (! Modules::platformEnabled('expenses') || ! Modules::platformEnabled('accounting')) {
            return false;
        }

        if (! Schema::hasTable('expense_claims') || ! Schema::hasTable('cash_advances') || ! Schema::hasTable('accounts')) {
            return false;
        }

        ExpenseSchemaInitializer::ensureReady();

        return true;
    }
}
