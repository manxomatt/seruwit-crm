<?php

namespace Tests\Feature\Modules\Invoicing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

/**
 * The invoice document on its own terms.
 *
 * Nothing here mentions a delivery order, a tariff or a trip — that is the
 * point of the split, and any such reference creeping back in means Invoicing
 * has re-acquired the logistics coupling it was pulled out of.
 */
class InvoiceTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    private function draftWithLines(float ...$amounts): Invoice
    {
        $invoice = Invoice::factory()->create();

        foreach ($amounts as $amount) {
            InvoiceLine::factory()->create(['invoice_id' => $invoice->id, 'amount' => $amount]);
        }

        $invoice->recalculate();

        return $invoice->fresh();
    }

    public function test_storing_creates_an_empty_draft_for_the_customer(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();

        $this->actingAs($user)->post(route('module.invoicing.invoices.store'), [
            'partner_id' => $partner->id,
        ])->assertRedirect();

        $invoice = Invoice::first();
        $this->assertSame('INV-000001', $invoice->code);
        $this->assertSame(Invoice::STATUS_DRAFT, $invoice->status);
        $this->assertSame($partner->id, $invoice->partner_id);
        $this->assertSame(0, $invoice->lines()->count());
    }

    public function test_lines_can_be_added_and_removed_on_a_draft_with_recalculation(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->create(['tax_enabled' => true, 'tax_rate' => 11]);

        $this->actingAs($user)->post(route('module.invoicing.invoices.lines.store', $invoice), [
            'description' => 'Jasa pengiriman',
            'amount' => 1000000,
        ])->assertSessionHas('success');

        $invoice->refresh();
        $this->assertSame('1000000.00', $invoice->subtotal);
        $this->assertSame('110000.00', $invoice->tax_amount);
        $this->assertSame('1110000.00', $invoice->total);

        $line = $invoice->lines()->first();
        $this->actingAs($user)->delete(route('module.invoicing.invoices.lines.destroy', [$invoice, $line]))
            ->assertSessionHas('success');

        $this->assertSame('0.00', $invoice->fresh()->subtotal);
    }

    public function test_lines_cannot_be_changed_once_the_invoice_leaves_draft(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->issued()->create();

        $this->actingAs($user)->post(route('module.invoicing.invoices.lines.store', $invoice), [
            'description' => 'Tambahan',
            'amount' => 50000,
        ])->assertSessionHas('error');

        $this->assertSame(0, $invoice->lines()->count());
    }

    public function test_the_ppn_toggle_recalculates_a_draft(): void
    {
        $user = $this->createAdminUser();
        $invoice = $this->draftWithLines(1000000);

        $this->actingAs($user)->patch(route('module.invoicing.invoices.update', $invoice), [
            'tax_enabled' => false,
        ]);

        $invoice->refresh();
        $this->assertSame('0.00', $invoice->tax_amount);
        $this->assertSame('1000000.00', $invoice->total);
    }

    public function test_issuing_requires_a_line_and_freezes_totals(): void
    {
        $user = $this->createAdminUser();

        $empty = Invoice::factory()->create();
        $this->actingAs($user)->post(route('module.invoicing.invoices.issue', $empty))->assertSessionHas('error');

        $invoice = $this->draftWithLines(1000000);
        $this->actingAs($user)->post(route('module.invoicing.invoices.issue', $invoice))->assertSessionHas('success');
        $totalAtIssue = $invoice->fresh()->total;

        // A later settings change must not move the issued totals.
        $this->actingAs($user)->patch(route('module.invoicing.invoices.update', $invoice), [
            'tax_enabled' => false,
        ])->assertSessionHas('error');

        $this->assertSame($totalAtIssue, $invoice->fresh()->total);
    }

    public function test_pay_marks_the_invoice_paid(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->issued()->create();

        $this->actingAs($user)->post(route('module.invoicing.invoices.pay', $invoice))->assertSessionHas('success');

        $invoice->refresh();
        $this->assertSame(Invoice::STATUS_PAID, $invoice->status);
        $this->assertNotNull($invoice->paid_at);
    }

    public function test_void_drops_the_lines_and_a_paid_invoice_cannot_be_voided(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->issued()->create();
        $line = InvoiceLine::factory()->create(['invoice_id' => $invoice->id, 'amount' => 100000]);

        $this->actingAs($user)->post(route('module.invoicing.invoices.void', $invoice))->assertSessionHas('success');

        $this->assertSame(Invoice::STATUS_VOID, $invoice->fresh()->status);
        $this->assertDatabaseMissing('invoice_lines', ['id' => $line->id]);

        $paid = Invoice::factory()->paid()->create();
        $this->actingAs($user)->post(route('module.invoicing.invoices.void', $paid))->assertSessionHas('error');
        $this->assertSame(Invoice::STATUS_PAID, $paid->fresh()->status);
    }

    public function test_only_a_draft_can_be_deleted_and_deletion_takes_its_lines(): void
    {
        $user = $this->createAdminUser();

        $issued = Invoice::factory()->issued()->create();
        $this->actingAs($user)->delete(route('module.invoicing.invoices.destroy', $issued))->assertSessionHas('error');

        $draft = Invoice::factory()->create();
        $line = InvoiceLine::factory()->create(['invoice_id' => $draft->id]);

        $this->actingAs($user)->delete(route('module.invoicing.invoices.destroy', $draft))
            ->assertRedirect(route('module.invoicing.invoices.index'));

        $this->assertDatabaseMissing('invoices', ['id' => $draft->id]);
        $this->assertDatabaseMissing('invoice_lines', ['id' => $line->id]);
    }

    public function test_the_index_summary_reports_outstanding_and_paid_this_month(): void
    {
        $user = $this->createAdminUser();
        Invoice::factory()->issued()->create(['total' => 2000000]);
        Invoice::factory()->issued()->create(['total' => 1000000]);
        Invoice::factory()->paid()->create(['total' => 500000]);
        Invoice::factory()->create();

        $response = $this->actingAs($user)->get(route('module.invoicing.invoices.index'));

        $response->assertOk();
        $summary = $response->viewData('page')['props']['summary'];
        $this->assertSame(3000000.0, $summary['outstanding']);
        $this->assertSame(500000.0, $summary['paid_this_month']);
        $this->assertSame(1, $summary['draft_count']);
    }
}
