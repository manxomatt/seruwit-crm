<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Support\CreditLimitChecker;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CreditNoteOutstandingTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_issued_credit_note_reduces_outstanding_ar(): void
    {
        $partner = Partner::factory()->create([
            'customer_rank' => 1,
            'credit_limit' => 100_000,
        ]);

        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 100_000,
            'tax_amount' => 0,
            'total' => 100_000,
            'amount_paid' => 0,
        ]);
        InvoiceLine::factory()->create([
            'invoice_id' => $invoice->id,
            'amount' => 100_000,
        ]);

        $this->assertEquals(100_000, CreditLimitChecker::outstandingFor($partner));

        $credit = Invoice::factory()->create([
            'partner_id' => $partner->id,
            'status' => Invoice::STATUS_ISSUED,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => -40_000,
            'tax_amount' => 0,
            'total' => -40_000,
            'amount_paid' => 0,
        ]);
        InvoiceLine::factory()->create([
            'invoice_id' => $credit->id,
            'amount' => -40_000,
        ]);

        $this->assertEquals(-40_000, $credit->balanceDue());
        $this->assertEquals(60_000, CreditLimitChecker::outstandingFor($partner));
        $this->assertFalse(CreditLimitChecker::wouldExceed($partner, 30_000));
        $this->assertTrue(CreditLimitChecker::wouldExceed($partner, 50_000));
    }
}
