<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Accounting\Models\TaxCode;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\TaxComputation;
use Modules\Accounting\Support\TaxRegisterService;
use Modules\Accounting\Support\WhtPayableReportService;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Models\SupplierBillLine;
use Modules\Payables\Support\BillPaymentRecorder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingComplianceMvpTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    public function test_tax_computation_exclusive_and_inclusive(): void
    {
        $exclusive = TaxComputation::fromLineTotal(100000, [
            'enabled' => true,
            'rate' => 11,
            'calculation' => TaxCode::CALC_EXCLUSIVE,
        ]);
        $this->assertEqualsWithDelta(100000.0, $exclusive['net'], 0.01);
        $this->assertEqualsWithDelta(11000.0, $exclusive['tax'], 0.01);
        $this->assertEqualsWithDelta(111000.0, $exclusive['gross'], 0.01);

        $inclusive = TaxComputation::fromLineTotal(111000, [
            'enabled' => true,
            'rate' => 11,
            'calculation' => TaxCode::CALC_INCLUSIVE,
        ]);
        $this->assertEqualsWithDelta(100000.0, $inclusive['net'], 0.01);
        $this->assertEqualsWithDelta(11000.0, $inclusive['tax'], 0.01);
        $this->assertEqualsWithDelta(111000.0, $inclusive['gross'], 0.01);
    }

    public function test_invoice_create_stamps_tax_code_and_draft_can_switch_calculation(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $ppn11 = TaxCode::query()->where('code', 'PPN11')->firstOrFail();
        $inclusive = TaxCode::query()->create([
            'code' => 'PPN11I',
            'name' => 'PPN 11% inclusive',
            'category' => TaxCode::CATEGORY_PPN,
            'rate' => 11,
            'calculation' => TaxCode::CALC_INCLUSIVE,
            'direction' => TaxCode::DIRECTION_BOTH,
            'output_account_id' => $ppn11->output_account_id,
            'input_account_id' => $ppn11->input_account_id,
            'is_default' => false,
            'is_active' => true,
        ]);

        $this->actingAs($user)->post(route('module.invoicing.invoices.store'), [
            'partner_id' => $partner->id,
            'issue_date' => now()->toDateString(),
        ])->assertRedirect();

        $invoice = Invoice::query()->latest('id')->firstOrFail();
        $this->assertSame($ppn11->id, (int) $invoice->tax_code_id);
        $this->assertSame('PPN11', $invoice->tax_code);
        $this->assertSame(TaxCode::CALC_EXCLUSIVE, $invoice->tax_calculation);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Goods',
            'amount' => 111000,
        ]);
        $invoice->recalculate();
        $invoice->refresh();
        $this->assertEqualsWithDelta(111000.0, (float) $invoice->subtotal, 0.01);
        $this->assertEqualsWithDelta(12210.0, (float) $invoice->tax_amount, 0.01);

        $this->actingAs($user)->patch(route('module.invoicing.invoices.update', $invoice), [
            'tax_code_id' => $inclusive->id,
        ])->assertRedirect();

        $invoice->refresh();
        $this->assertSame($inclusive->id, (int) $invoice->tax_code_id);
        $this->assertSame(TaxCode::CALC_INCLUSIVE, $invoice->tax_calculation);
        $this->assertEqualsWithDelta(100000.0, (float) $invoice->subtotal, 0.01);
        $this->assertEqualsWithDelta(11000.0, (float) $invoice->tax_amount, 0.01);
        $this->assertEqualsWithDelta(111000.0, (float) $invoice->total, 0.01);
    }

    public function test_tax_register_lists_issued_invoices_and_bills_and_exports_csv(): void
    {
        $user = $this->createAdminUser();
        $customer = Partner::factory()->create(['customer_rank' => 1, 'tax_id' => '01.234.567.8-901.000']);
        $supplier = Partner::factory()->create(['supplier_rank' => 1, 'tax_id' => '02.345.678.9-012.000']);
        $ppn = TaxCode::query()->where('code', 'PPN11')->firstOrFail();

        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $customer->id,
            'issue_date' => now()->toDateString(),
            'tax_enabled' => true,
            'tax_rate' => 11,
            'tax_code_id' => $ppn->id,
            'tax_code' => 'PPN11',
            'tax_calculation' => TaxCode::CALC_EXCLUSIVE,
            'subtotal' => 100000,
            'tax_amount' => 11000,
            'total' => 111000,
        ]);

        $bill = SupplierBill::query()->create([
            'code' => 'BILL-TAX-'.uniqid(),
            'partner_id' => $supplier->id,
            'status' => SupplierBill::STATUS_ISSUED,
            'bill_date' => now()->toDateString(),
            'tax_enabled' => true,
            'tax_rate' => 11,
            'tax_code_id' => $ppn->id,
            'tax_code' => 'PPN11',
            'tax_calculation' => TaxCode::CALC_EXCLUSIVE,
            'subtotal' => 50000,
            'tax_amount' => 5500,
            'total' => 55500,
            'amount_paid' => 0,
        ]);
        SupplierBillLine::query()->create([
            'supplier_bill_id' => $bill->id,
            'description' => 'Purchase',
            'amount' => 50000,
        ]);

        $from = Carbon::parse(now()->startOfMonth()->toDateString());
        $to = Carbon::parse(now()->toDateString());

        $output = app(TaxRegisterService::class)->report(TaxRegisterService::SIDE_OUTPUT, $from, $to);
        $this->assertTrue(collect($output['rows'])->contains(fn (array $row): bool => $row['document'] === $invoice->code));
        $this->assertEqualsWithDelta(11000.0, $output['totals']['tax'], 0.01);

        $input = app(TaxRegisterService::class)->report(TaxRegisterService::SIDE_INPUT, $from, $to);
        $this->assertTrue(collect($input['rows'])->contains(fn (array $row): bool => $row['document'] === $bill->code));
        $this->assertEqualsWithDelta(5500.0, $input['totals']['tax'], 0.01);

        $this->actingAs($user)
            ->get(route('module.accounting.reports.tax-register', [
                'side' => 'output',
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ]))
            ->assertOk();

        $this->actingAs($user)
            ->get(route('module.accounting.reports.tax-register.export', [
                'side' => 'output',
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ]))
            ->assertOk()
            ->assertHeader('content-disposition');
    }

    public function test_wht_payable_report_lists_withheld_payments(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['supplier_rank' => 1, 'tax_id' => '03.111.222.3-444.000']);
        $bill = SupplierBill::query()->create([
            'code' => 'BILL-WHT-RPT-'.uniqid(),
            'partner_id' => $partner->id,
            'status' => SupplierBill::STATUS_ISSUED,
            'bill_date' => now()->toDateString(),
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 100000,
            'tax_amount' => 0,
            'total' => 100000,
            'amount_paid' => 0,
        ]);
        SupplierBillLine::query()->create([
            'supplier_bill_id' => $bill->id,
            'description' => 'Services',
            'amount' => 100000,
        ]);

        $wht = TaxCode::query()->where('code', 'PPH23_2')->firstOrFail();
        $payment = BillPaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 100000,
            'method' => BillPayment::METHOD_TRANSFER,
            'wht_tax_code_id' => $wht->id,
            'wht_amount' => 2000,
            'allocations' => [
                ['supplier_bill_id' => $bill->id, 'amount' => 100000],
            ],
        ]);

        $report = app(WhtPayableReportService::class)->report(
            Carbon::parse(now()->startOfMonth()->toDateString()),
            Carbon::parse(now()->toDateString()),
        );

        $this->assertTrue(collect($report['rows'])->contains(fn (array $row): bool => $row['document'] === $payment->code));
        $this->assertEqualsWithDelta(2000.0, $report['totals']['wht'], 0.01);
        $this->assertEqualsWithDelta(98000.0, $report['totals']['paid_net'], 0.01);

        $this->actingAs($user)
            ->get(route('module.accounting.reports.wht-payable', [
                'from' => now()->startOfMonth()->toDateString(),
                'to' => now()->toDateString(),
            ]))
            ->assertOk();
    }
}
