<?php

namespace Tests\Feature\Modules\Receivables;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Models\PaymentAllocation;
use Modules\Receivables\Support\AgingReport;
use Modules\Receivables\Support\CreditLimitChecker;
use Modules\Receivables\Support\PaymentRecorder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PaymentRecordingTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    private function issuedInvoice(Partner $partner, float $total, ?string $dueDate = null): Invoice
    {
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => $total,
            'tax_amount' => 0,
            'total' => $total,
            'amount_paid' => 0,
            'due_date' => $dueDate,
        ]);

        InvoiceLine::factory()->create([
            'invoice_id' => $invoice->id,
            'amount' => $total,
            'description' => 'Test line',
        ]);

        return $invoice->fresh();
    }

    public function test_installment_payment_marks_invoice_partially_paid(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = $this->issuedInvoice($partner, 1_000_000);

        $this->actingAs($this->createAdminUser())->post(route('module.receivables.payments.store', [], false), [
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 400_000,
            'type' => Payment::TYPE_INSTALLMENT,
            'method' => Payment::METHOD_TRANSFER,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 400_000],
            ],
        ])->assertRedirect();

        $invoice->refresh();
        $this->assertSame(Invoice::STATUS_PARTIALLY_PAID, $invoice->status);
        $this->assertEquals(400_000, (float) $invoice->amount_paid);
        $this->assertEquals(600_000, $invoice->balanceDue());
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('payment_allocations', 1);
    }

    public function test_settlement_marks_invoice_paid(): void
    {
        $partner = Partner::factory()->create();
        $invoice = $this->issuedInvoice($partner, 500_000);

        PaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 200_000,
            'type' => Payment::TYPE_DOWN_PAYMENT,
            'method' => Payment::METHOD_CASH,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 200_000],
            ],
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.invoicing.invoices.pay', $invoice))
            ->assertSessionHas('success');

        $invoice->refresh();
        $this->assertSame(Invoice::STATUS_PAID, $invoice->status);
        $this->assertEquals(500_000, (float) $invoice->amount_paid);
        $this->assertNotNull($invoice->paid_at);
        $this->assertEquals(2, Payment::query()->count());
    }

    public function test_voiding_payment_reopens_invoice_balance(): void
    {
        $partner = Partner::factory()->create();
        $invoice = $this->issuedInvoice($partner, 300_000);

        $payment = PaymentRecorder::record([
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 300_000,
            'type' => Payment::TYPE_SETTLEMENT,
            'method' => Payment::METHOD_TRANSFER,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 300_000],
            ],
        ]);

        $this->assertSame(Invoice::STATUS_PAID, $invoice->fresh()->status);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.receivables.payments.void', $payment))
            ->assertSessionHas('success');

        $invoice->refresh();
        $this->assertSame(Invoice::STATUS_ISSUED, $invoice->status);
        $this->assertEquals(0, (float) $invoice->amount_paid);
        $this->assertSame(Payment::STATUS_VOIDED, $payment->fresh()->status);
    }

    public function test_allocation_cannot_exceed_invoice_balance(): void
    {
        $partner = Partner::factory()->create();
        $invoice = $this->issuedInvoice($partner, 100_000);

        $this->actingAs($this->createAdminUser())->post(route('module.receivables.payments.store', [], false), [
            'partner_id' => $partner->id,
            'payment_date' => now()->toDateString(),
            'amount' => 150_000,
            'type' => Payment::TYPE_INSTALLMENT,
            'method' => Payment::METHOD_TRANSFER,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 150_000],
            ],
        ])->assertSessionHasErrors();

        $this->assertSame(0, PaymentAllocation::query()->count());
    }

    public function test_credit_limit_blocks_issuing_when_exceeded(): void
    {
        $partner = Partner::factory()->create([
            'credit_limit' => 100_000,
            'customer_rank' => 1,
        ]);

        $open = $this->issuedInvoice($partner, 80_000);
        $this->assertTrue(CreditLimitChecker::wouldExceed($partner, 30_000));
        $this->assertFalse(CreditLimitChecker::wouldExceed($partner, 10_000));

        $draft = Invoice::factory()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 50_000,
            'tax_amount' => 0,
            'total' => 50_000,
        ]);
        InvoiceLine::factory()->create(['invoice_id' => $draft->id, 'amount' => 50_000]);
        $draft->recalculate();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.invoicing.invoices.issue', $draft))
            ->assertSessionHas('error');

        $this->assertSame(Invoice::STATUS_DRAFT, $draft->fresh()->status);
        $this->assertSame(Invoice::STATUS_ISSUED, $open->fresh()->status);
    }

    public function test_aging_report_buckets_overdue_invoices(): void
    {
        $partner = Partner::factory()->create();
        $this->issuedInvoice($partner, 100_000, now()->subDays(45)->toDateString());
        $this->issuedInvoice($partner, 50_000, now()->addDays(5)->toDateString());

        $report = AgingReport::build();

        $this->assertEquals(50_000.0, $report['buckets']['current']);
        $this->assertEquals(100_000.0, $report['buckets']['31_60']);
        $this->assertSame(1, $report['overdue_count']);
        $this->assertEquals(100_000.0, $report['overdue_amount']);
    }

    public function test_payments_index_shows_overdue_alert(): void
    {
        $partner = Partner::factory()->create();
        $this->issuedInvoice($partner, 75_000, now()->subDays(10)->toDateString());

        $response = $this->actingAs($this->createAdminUser())
            ->get(route('module.receivables.payments.index'));

        $response->assertOk();
        $alerts = $response->viewData('page')['props']['alerts'];
        $this->assertSame(1, $alerts['overdue_count']);
        $this->assertEquals(75_000.0, $alerts['overdue_amount']);
    }
}
