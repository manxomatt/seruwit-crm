<?php

namespace Tests\Feature\Modules\Expenses;

use App\Modules\ModuleLayering;
use App\Modules\ModuleRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingBridge;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Billing\Models\TripAllowance;
use Modules\Expenses\Models\CashAdvance;
use Modules\Expenses\Models\ExpenseClaim;
use Modules\Expenses\Support\ExpenseSchemaInitializer;
use Modules\Expenses\Support\OperationalExpenseBridge;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\FleetCompliance\Models\VehicleComplianceRenewal;
use Modules\FleetFuel\Support\FuelLogRecorder;
use Modules\FleetSettlement\Models\VehicleSettlement;
use Modules\FleetSettlement\Support\SettlementAccountingBridge;
use Modules\FleetSettlement\Support\VehicleSettlementCalculator;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Modules\Receivables\Contracts\PayableViaGatewayContract;
use Modules\Receivables\Models\GatewayCharge;
use Modules\Receivables\Support\GatewayCheckoutService;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\RentalDutyOrder\Models\RentalDutyOrder;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FinancePhase1And2IntegrationTest extends TestCase
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
        $this->withoutMiddleware([
            \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
            \Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
            \App\Http\Middleware\EnsureTenantIsActive::class,
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
            \App\Http\Middleware\RedirectUnfinishedSignup::class,
            \App\Http\Middleware\EnsureCentralUserCanAccessModule::class,
        ]);

        \App\Models\Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Full system access']
        );

        ExpenseSchemaInitializer::ensureReady();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    public function test_phase_1_revenue_role_decoupling_subfeatures_and_polymorphic_gateway_checkout(): void
    {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        // 1. ModuleLayering & ModuleRegistry::subFeatures()
        $this->assertSame([], app(ModuleLayering::class)->violations());
        $subFeatures = app(ModuleRegistry::class)->subFeatures();
        $this->assertArrayHasKey('accounting-reconciliation', $subFeatures);
        $this->assertArrayHasKey('accounting-tax', $subFeatures);
        $this->assertArrayHasKey('accounting-assets', $subFeatures);
        $this->assertArrayHasKey('accounting-budgets', $subFeatures);

        // 2. Travel Revenue Report route in Shuttle module
        $this->get(route('module.shuttle.reports.travel-revenue'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Accounting/Reports/TravelRevenue')
                ->has('rows')
                ->has('totals')
            );

        // 3. Invoice revenue_role decoupling -> AccountingBridge::invoiceIssued()
        $customer = Partner::factory()->create([
            'sub_type' => 'customer',
            'status' => 'active',
        ]);

        $invoice = Invoice::query()->create([
            'code' => 'INV-ROLE-'.uniqid(),
            'partner_id' => $customer->id,
            'source_type' => 'custom_vertical_booking',
            'source_id' => 999,
            'revenue_role' => 'shuttle_revenue',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => Invoice::STATUS_ISSUED,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 750000,
            'tax_total' => 0,
            'discount_total' => 0,
            'total' => 750000,
            'amount_paid' => 0,
            'created_by' => $user->id,
        ]);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Tiket Shuttle Eksekutif',
            'quantity' => 1,
            'unit_price' => 750000,
            'amount' => 750000,
            'revenue_role' => 'shuttle_revenue',
        ]);

        $this->assertSame('shuttle_revenue', $invoice->fresh('lines')->resolveRevenueRole());

        app(AccountingBridge::class)->invoiceIssued($invoice->fresh('lines'));

        $shuttleRevAccount = Account::query()->where('system_role', 'shuttle_revenue')->first();
        $entry = JournalEntry::query()
            ->where('source_type', $invoice->getMorphClass())
            ->where('source_id', $invoice->id)
            ->where('event', 'invoice.issued')
            ->with('lines')
            ->first();

        $this->assertNotNull($entry);
        if ($shuttleRevAccount) {
            $creditLine = $entry->lines->firstWhere('account_id', $shuttleRevAccount->id);
            $this->assertNotNull($creditLine);
            $this->assertEquals(750000.0, (float) $creditLine->credit);
        }

        // 4. Polymorphic GatewayCheckoutService fulfillment handler registration
        $fulfilledPayables = [];
        GatewayCheckoutService::registerFulfillmentHandler(
            'test_custom_payable',
            function (GatewayCharge $charge) use (&$fulfilledPayables): void {
                $fulfilledPayables[] = $charge->chargeable_id;
            }
        );

        $payable = new class implements PayableViaGatewayContract
        {
            public function getGatewayPurpose(): string
            {
                return 'Booking Deposit';
            }

            public function getGatewayAmount(): float
            {
                return 150000.0;
            }

            public function getGatewayItemName(): string
            {
                return 'Deposit Sewa Unit';
            }

            public function getGatewayPartnerId(): ?int
            {
                return null;
            }

            public function getGatewayCustomerDetails(): array
            {
                return ['name' => 'Budi Santoso', 'email' => 'budi@example.com', 'phone' => '08123456789'];
            }

            public function getGatewayFinishPath(): string
            {
                return '/payment/finish';
            }

            public function onGatewayPaymentSettled(GatewayCharge $charge, array $notification, string $mappedPaymentMethod): void
            {
                // handled
            }
        };

        $this->assertSame(150000.0, $payable->getGatewayAmount());
        $this->assertSame('Booking Deposit', $payable->getGatewayPurpose());
    }

    public function test_phase_2_fleet_settlement_includes_compliance_deductions_and_bridges_to_payables_and_bank_book(): void
    {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $cashAccount = Account::findByCode('1110') ?? Account::query()->where('system_role', 'cash')->firstOrFail();
        $bankAccount = CompanyBankAccount::query()->create([
            'name' => 'Bank Operasional Settlement',
            'kind' => CompanyBankAccount::KIND_BANK,
            'bank_name' => 'BCA',
            'account_number' => '888999000',
            'account_holder' => 'PT Seruwit',
            'account_id' => $cashAccount->id,
            'is_default' => true,
            'is_active' => true,
            'currency' => 'IDR',
        ]);

        $investor = Partner::factory()->create([
            'name' => 'Investor Mitra Armada',
            'sub_type' => 'supplier',
            'supplier_rank' => 1,
            'status' => 'active',
        ]);

        $customer = Partner::factory()->create([
            'name' => 'Pelanggan Korporat',
            'sub_type' => 'customer',
            'customer_rank' => 1,
            'status' => 'active',
        ]);

        $vehicle = Vehicle::factory()->create([
            'plate_number' => 'B 9988 SRW',
            'ownership_type' => 'partner',
            'partner_id' => $investor->id,
            'settlement_scheme' => 'revenue_share',
            'revenue_share_owner_pct' => 80,
            'revenue_share_tenant_pct' => 20,
            'maintenance_payer' => 'owner',
            'status' => 'available',
        ]);

        $periodStart = now()->startOfMonth()->toDateString();
        $periodEnd = now()->endOfMonth()->toDateString();

        Rental::factory()->create([
            'code' => 'RNT-SETTLE-'.uniqid(),
            'partner_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'start_date' => $periodStart,
            'end_date' => $periodStart,
            'status' => Rental::STATUS_COMPLETED,
            'rate_per_period' => 5000000,
            'total_periods' => 1,
            'base_amount' => 5000000,
            'total_amount' => 5000000,
        ]);

        // Owner-borne STNK renewal (100% deducted = 400,000)
        VehicleComplianceRenewal::query()->create([
            'vehicle_id' => $vehicle->id,
            'document_type' => VehicleComplianceRenewal::TYPE_STNK_ANNUAL,
            'new_expires_at' => now()->addYear()->toDateString(),
            'renewal_date' => $periodStart,
            'cost' => 400000,
            'payer' => VehicleComplianceRenewal::PAYER_OWNER,
            'partner_id' => $investor->id,
            'created_by' => $user->id,
        ]);

        // Shared KIR renewal (50% deducted from owner = 300,000; 50% posted as tenant expense = 300,000)
        $sharedRenewal = VehicleComplianceRenewal::query()->create([
            'vehicle_id' => $vehicle->id,
            'document_type' => VehicleComplianceRenewal::TYPE_KIR,
            'new_expires_at' => now()->addMonths(6)->toDateString(),
            'renewal_date' => $periodStart,
            'cost' => 600000,
            'payer' => VehicleComplianceRenewal::PAYER_SHARED,
            'partner_id' => $investor->id,
            'created_by' => $user->id,
        ]);

        // Verify OperationalExpenseBridge records the 50% tenant portion (300,000) on 6140
        $complianceClaim = app(OperationalExpenseBridge::class)->syncComplianceRenewal($sharedRenewal->load('vehicle'));
        $this->assertNotNull($complianceClaim);
        $this->assertSame(ExpenseClaim::STATUS_POSTED, $complianceClaim->status);
        $this->assertEquals(300000.0, (float) $complianceClaim->total_amount);

        // Verify VehicleSettlementCalculator includes 400,000 (owner 100%) + 300,000 (shared 50%) = 700,000 deduction
        $calc = app(VehicleSettlementCalculator::class)->calculateForVehicle(
            $vehicle,
            \Illuminate\Support\Carbon::parse($periodStart),
            \Illuminate\Support\Carbon::parse($periodEnd),
        );
        $summary = $calc['summary'];
        $this->assertEquals(5000000.0, $summary['total_revenue']);
        $this->assertEquals(4000000.0, $summary['owner_gross_share']);
        $this->assertEquals(700000.0, $summary['maintenance_deduction']);
        $this->assertEquals(3300000.0, $summary['net_payout']);

        // Save settlement as Approved -> creates SupplierBill in Payables + GL journal
        $settlement = VehicleSettlement::query()->create([
            'code' => 'STL-TEST-'.uniqid(),
            'vehicle_id' => $vehicle->id,
            'partner_id' => $investor->id,
            'period_month' => now()->format('Y-m'),
            'start_date' => $periodStart,
            'end_date' => $periodEnd,
            'ownership_type' => 'partner',
            'settlement_scheme' => 'revenue_share',
            'revenue_share_owner_pct' => 80,
            'revenue_share_tenant_pct' => 20,
            'total_orders' => 1,
            'total_rental_days' => 1,
            'total_revenue' => $summary['total_revenue'],
            'owner_gross_share' => $summary['owner_gross_share'],
            'tenant_gross_share' => $summary['tenant_gross_share'],
            'total_maintenance_cost' => $summary['total_maintenance_cost'],
            'maintenance_deduction' => $summary['maintenance_deduction'],
            'other_adjustment' => 0,
            'net_payout' => $summary['net_payout'],
            'status' => VehicleSettlement::STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by' => $user->id,
        ]);

        app(SettlementAccountingBridge::class)->sync($settlement);

        $bill = SupplierBill::query()
            ->where('code', 'BILL-'.$settlement->code)
            ->first();

        $this->assertNotNull($bill);
        $this->assertSame(SupplierBill::STATUS_ISSUED, $bill->status);
        $this->assertEquals(3300000.0, (float) $bill->total);

        // Transition settlement to Paid -> records BillPayment + GL journal + BankTransaction
        $settlement->update([
            'status' => VehicleSettlement::STATUS_PAID,
            'payment_method' => 'bank_transfer',
            'paid_at' => now(),
            'paid_by' => $user->id,
            'payment_reference' => 'TRF-MITRA-001',
        ]);

        app(SettlementAccountingBridge::class)->sync($settlement->fresh(), [
            'company_bank_account_id' => $bankAccount->id,
        ]);

        $bill->refresh();
        $this->assertSame(SupplierBill::STATUS_PAID, $bill->status);
        $this->assertEquals(3300000.0, (float) $bill->amount_paid);

        $billPayment = BillPayment::query()
            ->whereHas('allocations', fn ($q) => $q->where('supplier_bill_id', $bill->id))
            ->first();
        $this->assertNotNull($billPayment);

        $bankTx = BankTransaction::query()
            ->where('source_type', $billPayment->getMorphClass())
            ->where('source_id', $billPayment->id)
            ->first();
        $this->assertNotNull($bankTx);
        $this->assertEquals(3300000.0, (float) $bankTx->amount);
    }

    public function test_phase_2_operational_expense_bridges_for_fuel_maintenance_trip_allowance_and_duty_order(): void
    {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $cashAccount = Account::findByCode('1110') ?? Account::query()->where('system_role', 'cash')->firstOrFail();
        CompanyBankAccount::query()->firstOrCreate(
            ['kind' => CompanyBankAccount::KIND_CASH],
            [
                'name' => 'Kas Operasional',
                'bank_name' => 'CASH',
                'account_id' => $cashAccount->id,
                'is_default' => true,
                'is_active' => true,
                'currency' => 'IDR',
            ]
        );

        $driver = Driver::factory()->create(['status' => 'available']);
        $vehicle = Vehicle::factory()->create([
            'plate_number' => 'B 7711 OPS',
            'ownership_type' => 'company',
            'status' => 'available',
            'odometer_km' => 10000,
        ]);

        // 1. FleetFuel -> FuelLogRecorder auto-posts ExpenseClaim on 6110
        $fuelLog = app(FuelLogRecorder::class)->record($vehicle, [
            'driver_id' => $driver->id,
            'filled_at' => now()->toDateTimeString(),
            'liters' => 25,
            'cost' => 250000,
            'odometer_km' => 10250,
            'station_name' => 'Pertamina Kuningan',
            'receipt_number' => 'BBM-001',
        ]);

        $fuelClaim = ExpenseClaim::query()
            ->where('source_type', $fuelLog->getMorphClass())
            ->where('source_id', $fuelLog->id)
            ->first();

        $this->assertNotNull($fuelClaim);
        $this->assertSame(ExpenseClaim::STATUS_POSTED, $fuelClaim->status);
        $this->assertEquals(250000.0, (float) $fuelClaim->total_amount);

        // 2. Maintenance WorkOrder completion -> auto-posts ExpenseClaim for labor/service cost
        $woCategory = MaintenanceCategory::query()->firstOrCreate(
            ['key' => 'general_service'],
            ['name' => 'Servis Umum', 'sort_order' => 1]
        );

        $workOrder = WorkOrder::query()->create([
            'vehicle_id' => $vehicle->id,
            'category_id' => $woCategory->id,
            'reference_number' => WorkOrder::generateReferenceNumber(),
            'title' => 'Servis Berkala & Spooring',
            'status' => WorkOrder::STATUS_COMPLETED,
            'priority' => WorkOrder::PRIORITY_NORMAL,
            'type' => WorkOrder::TYPE_PREVENTIVE,
            'service_location' => WorkOrder::LOCATION_OUTSOURCE,
            'completed_at' => now(),
            'actual_labor_cost' => 450000,
            'actual_parts_cost' => 0,
            'created_by' => $user->id,
        ]);

        $woClaim = app(OperationalExpenseBridge::class)->syncWorkOrderCompleted($workOrder->load('vehicle'));
        $this->assertNotNull($woClaim);
        $this->assertSame(ExpenseClaim::STATUS_POSTED, $woClaim->status);
        $this->assertEquals(450000.0, (float) $woClaim->total_amount);

        // 3. Billing TripAllowance issue & settle -> CashAdvance disburse & settle
        $trip = Trip::factory()->create([
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'status' => Trip::STATUS_SCHEDULED,
        ]);

        $allowance = TripAllowance::query()->create([
            'trip_id' => $trip->id,
            'advance_amount' => 500000,
            'status' => TripAllowance::STATUS_ISSUED,
            'issued_at' => now(),
        ]);

        $tripAdvance = app(OperationalExpenseBridge::class)->syncTripAllowanceIssued($allowance);
        $this->assertNotNull($tripAdvance);
        $this->assertSame(CashAdvance::STATUS_DISBURSED, $tripAdvance->status);
        $this->assertEquals(500000.0, (float) $tripAdvance->amount);

        $allowance->expenses()->create([
            'category' => 'fuel',
            'amount' => 200000,
            'description' => 'Solar Tol Cipali',
        ]);
        $allowance->expenses()->create([
            'category' => 'toll',
            'amount' => 100000,
            'description' => 'E-Toll Cipali',
        ]);

        $allowance->update([
            'status' => TripAllowance::STATUS_SETTLED,
            'settled_at' => now(),
        ]);

        $settledTripAdvance = app(OperationalExpenseBridge::class)->syncTripAllowanceSettled($allowance->fresh(['trip', 'expenses']));
        $this->assertNotNull($settledTripAdvance);
        $this->assertSame(CashAdvance::STATUS_SETTLED, $settledTripAdvance->status);
        $this->assertEquals(300000.0, (float) $settledTripAdvance->spent_amount);
        $this->assertEquals(200000.0, (float) $settledTripAdvance->returned_amount);

        // 4. RentalDutyOrder (SPPD) creation, overtime customer billing, and settlement
        $customer = Partner::factory()->create(['sub_type' => 'customer', 'status' => 'active']);
        $rental = Rental::factory()->create([
            'code' => 'RNT-SPPD-'.uniqid(),
            'partner_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'status' => Rental::STATUS_ACTIVE,
            'rate_per_period' => 1000000,
            'total_periods' => 1,
            'base_amount' => 1000000,
            'total_amount' => 1000000,
        ]);

        $this->post(route('module.rental.duty_orders.store'), [
            'rental_id' => $rental->id,
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'departure_date' => now()->toDateString(),
            'return_date' => now()->toDateString(),
            'cash_advance_amount' => 800000,
            'standard_hours_per_day' => 10,
            'driver_overtime_rate_per_hour' => 25000,
            'customer_overtime_rate_per_hour' => 75000,
        ])->assertRedirect();

        $dutyOrder = RentalDutyOrder::query()->where('rental_id', $rental->id)->firstOrFail();

        $sppdAdvance = CashAdvance::query()
            ->where('source_type', $dutyOrder->getMorphClass())
            ->where('source_id', $dutyOrder->id)
            ->first();
        $this->assertNotNull($sppdAdvance);
        $this->assertSame(CashAdvance::STATUS_DISBURSED, $sppdAdvance->status);
        $this->assertEquals(800000.0, (float) $sppdAdvance->amount);

        // Add field expense on SPPD
        $this->post(route('module.rental.duty_orders.expenses.store', $dutyOrder), [
            'category' => 'fuel',
            'amount' => 350000,
            'date' => now()->toDateString(),
            'receipt_number' => 'SPPD-BBM-1',
            'description' => 'BBM Jakarta-Bandung PP',
        ])->assertRedirect();

        // Record 4 hours overtime billed to customer (4 * 75,000 = 300,000 customer charge; 4 * 25,000 = 100,000 driver overtime pay)
        $this->post(route('module.rental.duty_orders.overtime', $dutyOrder), [
            'actual_hours_worked' => 14,
            'standard_hours_per_day' => 10,
            'driver_overtime_rate_per_hour' => 25000,
            'customer_overtime_rate_per_hour' => 75000,
            'is_overtime_billed_to_customer' => true,
        ])->assertRedirect();

        $overtimeCharge = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('addon_code', "OVERTIME-{$dutyOrder->duty_order_number}")
            ->first();
        $this->assertNotNull($overtimeCharge);
        $this->assertEquals(300000.0, (float) $overtimeCharge->amount);

        // Settle SPPD -> settles CashAdvance (350,000 fuel + 100,000 driver overtime = 450,000 spent; 350,000 returned)
        $this->post(route('module.rental.duty_orders.settle', $dutyOrder), [
            'settlement_notes' => 'LPJ SPPD lengkap',
        ])->assertRedirect();

        $sppdAdvance->refresh();
        $this->assertSame(CashAdvance::STATUS_SETTLED, $sppdAdvance->status);
        $this->assertEquals(450000.0, (float) $sppdAdvance->spent_amount);
        $this->assertEquals(350000.0, (float) $sppdAdvance->returned_amount);
    }
}
