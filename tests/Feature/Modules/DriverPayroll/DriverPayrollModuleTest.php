<?php

namespace Tests\Feature\Modules\DriverPayroll;

use App\Models\User;
use App\Modules\Facades\Modules;
use App\Modules\ModuleTier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Driver\Models\Driver;
use Modules\DriverPayroll\Models\DriverPayroll;
use Modules\DriverPayroll\Models\DriverPayrollLine;
use Modules\DriverPayroll\Support\DriverPayrollCalculator;
use Modules\DriverPayroll\Support\DriverPayrollDisbursementService;
use Modules\Expenses\Models\CashAdvance;
use Modules\Expenses\Support\ExpenseSchemaInitializer;
use Modules\RentalDutyOrder\Models\RentalDutyOrder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DriverPayrollModuleTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function beforeRefreshingDatabase(): void
    {
        if (Schema::hasTable('accounts') && Schema::hasTable('bank_transactions')) {
            ExpenseSchemaInitializer::ensureReady();
            RefreshDatabaseState::$migrated = true;
        }
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        ExpenseSchemaInitializer::ensureReady();

        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    public function test_driver_payroll_module_is_registered_with_correct_metadata(): void
    {
        $module = Modules::find('driver-payroll');

        $this->assertNotNull($module);
        $this->assertSame(ModuleTier::Vertical, $module->tier());
        $this->assertSame(['driver'], $module->requires());
        $this->assertContains('view', $module->permissions());
        $this->assertContains('disburse', $module->permissions());
    }

    public function test_driver_payroll_calculator_aggregates_overtime_and_cash_advance_deductions(): void
    {
        $admin = $this->createAdminUser();
        $driver = Driver::query()->create([
            'name' => 'Bambang Pamungkas',
            'license_number' => 'SIM-B1-8899',
            'phone' => '081299887766',
            'status' => 'available',
        ]);

        if (Schema::hasTable('rental_duty_orders')) {
            $vehicle = \Modules\Fleet\Models\Vehicle::query()->create([
                'name' => 'Toyota HiAce Premio',
                'plate_number' => 'B 9988 XYZ',
                'type' => 'minibus',
                'fuel_type' => 'diesel',
                'status' => 'available',
            ]);

            RentalDutyOrder::query()->create([
                'duty_order_number' => 'SJO-202610-0099',
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
                'origin' => 'Bandung',
                'destination' => 'Jakarta',
                'departure_date' => '2026-10-15',
                'return_date' => '2026-10-16',
                'status' => 'settled',
                'overtime_hours' => 5,
                'driver_overtime_rate_per_hour' => 50000,
                'total_driver_overtime_pay' => 250000,
                'cash_advance_amount' => 0,
                'actual_expense_total' => 0,
                'net_balance' => 0,
            ]);
        }

        $cashAdvance = CashAdvance::query()->create([
            'code' => 'CA-202610-0088',
            'advance_date' => '2026-10-10',
            'purpose' => 'Kasbon Darurat Ban Kempes',
            'driver_id' => $driver->id,
            'amount' => 100000,
            'spent_amount' => 0,
            'returned_amount' => 0,
            'status' => CashAdvance::STATUS_DISBURSED,
        ]);

        $calculator = app(DriverPayrollCalculator::class);
        $payroll = $calculator->generate([
            'driver_id' => $driver->id,
            'period_start' => '2026-10-01',
            'period_end' => '2026-10-31',
            'base_salary' => 2000000,
            'bonus' => 500000,
            'deduct_cash_advances' => true,
        ], $admin);

        $this->assertInstanceOf(DriverPayroll::class, $payroll);
        $this->assertSame(DriverPayroll::STATUS_DRAFT, $payroll->status);
        $this->assertEquals(2000000, (float) $payroll->base_salary);
        $this->assertEquals(500000, (float) $payroll->bonus_total);
        $this->assertEquals(250000, (float) $payroll->overtime_pay_total);
        $this->assertEquals(100000, (float) $payroll->deductions_total);

        // Net pay = (2000000 + 500000 + 250000) - 100000 = 2650000
        $this->assertEquals(2650000, (float) $payroll->net_pay);
        $this->assertCount(4, $payroll->lines);

        $deductionLine = $payroll->lines->firstWhere('type', DriverPayrollLine::TYPE_CASH_ADVANCE_DEDUCTION);
        $this->assertNotNull($deductionLine);
        $this->assertSame(CashAdvance::class, $deductionLine->source_type);
        $this->assertSame($cashAdvance->id, $deductionLine->source_id);
    }

    public function test_driver_payroll_approval_and_disbursement_creates_gl_journal_and_bank_book_entry(): void
    {
        $admin = $this->createAdminUser();
        $driver = Driver::query()->create([
            'name' => 'Agus Priyono',
            'license_number' => 'SIM-B2-1122',
            'phone' => '081234567890',
            'status' => 'available',
        ]);

        $cashAdvance = CashAdvance::query()->create([
            'code' => 'CA-202610-0099',
            'advance_date' => '2026-10-12',
            'purpose' => 'Uang Saku Jalan Tol',
            'driver_id' => $driver->id,
            'amount' => 150000,
            'spent_amount' => 0,
            'returned_amount' => 0,
            'status' => CashAdvance::STATUS_DISBURSED,
        ]);

        $bankLedger = Account::query()->firstOrCreate(
            ['code' => '1120'],
            [
                'name' => 'Bank Mandiri Utama',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'bank_primary',
                'is_postable' => true,
                'is_active' => true,
            ]
        );

        $bankAccount = CompanyBankAccount::query()->create([
            'name' => 'Rekening Operasional Payroll',
            'bank_name' => 'Bank Mandiri',
            'account_number' => '142-00-998877-6',
            'account_holder' => 'PT Seruwit Transport',
            'account_id' => $bankLedger->id,
            'is_active' => true,
        ]);

        $calculator = app(DriverPayrollCalculator::class);
        $payroll = $calculator->generate([
            'driver_id' => $driver->id,
            'period_start' => '2026-10-01',
            'period_end' => '2026-10-31',
            'base_salary' => 3000000,
            'bonus' => 200000,
            'deduct_cash_advances' => true,
        ], $admin);

        $disbursementService = app(DriverPayrollDisbursementService::class);

        // 1. Approve
        $approved = $disbursementService->approve($payroll, $admin);
        $this->assertSame(DriverPayroll::STATUS_APPROVED, $approved->status);
        $this->assertNotNull($approved->approved_at);

        // 2. Disburse
        $paid = $disbursementService->disburse(
            payroll: $approved,
            companyBankAccountId: $bankAccount->id,
            paymentMethod: 'bank_transfer',
            paymentReference: 'TRF-PAY-0099',
            actor: $admin,
        );

        $this->assertSame(DriverPayroll::STATUS_PAID, $paid->status);
        $this->assertNotNull($paid->paid_at);

        // Net pay = (3000000 + 200000) - 150000 = 3050000
        $this->assertEquals(3050000, (float) $paid->net_pay);

        // Verify CashAdvance marked as settled
        $this->assertSame(CashAdvance::STATUS_SETTLED, $cashAdvance->fresh()->status);

        // Verify GL Journal
        $journal = JournalEntry::query()
            ->where('source_type', $paid->getMorphClass())
            ->where('source_id', $paid->id)
            ->first();

        $this->assertNotNull($journal);
        $this->assertSame(JournalEntry::STATUS_POSTED, $journal->status);

        // Verify BankTransaction
        $bankTx = BankTransaction::query()
            ->where('source_type', $paid->getMorphClass())
            ->where('source_id', $paid->id)
            ->first();

        $this->assertNotNull($bankTx);
        $this->assertEquals(3050000, (float) $bankTx->amount);
    }

    public function test_driver_payroll_http_routes(): void
    {
        $admin = $this->createAdminUser();
        $this->actingAs($admin);

        $driver = Driver::query()->create([
            'name' => 'Wahyudi',
            'license_number' => 'SIM-B1-7788',
            'phone' => '081234567888',
            'status' => 'available',
        ]);

        $payroll = DriverPayroll::query()->create([
            'code' => 'PAY-DRV-202610-9999',
            'driver_id' => $driver->id,
            'period_start' => '2026-10-01',
            'period_end' => '2026-10-31',
            'status' => DriverPayroll::STATUS_DRAFT,
            'base_salary' => 2500000,
            'net_pay' => 2500000,
            'created_by' => $admin->id,
        ]);

        // Index
        $response = $this->get(route('module.driver-payroll.index'));
        $response->assertOk();

        // Show
        $response = $this->get(route('module.driver-payroll.show', $payroll->id));
        $response->assertOk();

        // Print
        $response = $this->get(route('module.driver-payroll.print', $payroll->id));
        $response->assertOk();
    }
}
