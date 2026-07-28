<?php

namespace Tests\Feature\Modules\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingBridge;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class AccountingAutoPostIdempotencyTest extends TestCase
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

    public function test_issuing_twice_does_not_double_post(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'status' => Invoice::STATUS_ISSUED,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);
        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Line',
            'amount' => 25000,
        ]);
        $invoice->recalculate();

        $first = AccountingBridge::invoiceIssued($invoice->fresh());
        $second = AccountingBridge::invoiceIssued($invoice->fresh());

        $this->assertNotNull($first);
        $this->assertSame($first->id, $second?->id);
        $this->assertSame(1, JournalEntry::query()
            ->where('source_id', $invoice->id)
            ->where('event', 'invoice.issued')
            ->count());
    }

    public function test_voiding_twice_does_not_double_reverse(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $invoice = Invoice::factory()->issued()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'subtotal' => 40000,
            'tax_amount' => 0,
            'total' => 40000,
        ]);

        AccountingBridge::invoiceIssued($invoice);
        $first = AccountingBridge::invoiceVoided($invoice);
        $second = AccountingBridge::invoiceVoided($invoice);

        $this->assertNotNull($first);
        $this->assertSame($first->id, $second?->id);
        $this->assertSame(1, JournalEntry::query()
            ->where('source_id', $invoice->id)
            ->where('event', 'invoice.voided')
            ->count());
    }
}
