<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Invoicing\Models\Invoice;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalAccountingTest extends TestCase
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

    public function test_confirm_receives_deposit_and_posts_liability_journal(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_DRAFT,
            'deposit_amount' => 500000,
            'base_amount' => 1000000,
            'total_amount' => 1000000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental), ['payment_method' => 'cash'])
            ->assertRedirect();

        $rental->refresh();
        $this->assertNotNull($rental->deposit_received_at);
        $this->assertSame('cash', $rental->deposit_payment_method);

        $journal = JournalEntry::query()
            ->where('source_type', $rental->getMorphClass())
            ->where('source_id', $rental->id)
            ->where('event', 'rental_deposit.received')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->with('lines.account')
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue($journal->isBalanced());

        $byRole = $journal->lines->mapWithKeys(
            fn ($line) => [$line->account->system_role => ['debit' => (float) $line->debit, 'credit' => (float) $line->credit]]
        );

        $this->assertSame(500000.0, $byRole['cash']['debit'] ?? $byRole['bank']['debit'] ?? 0.0);
        $this->assertSame(500000.0, $byRole['customer_deposit']['credit']);
    }

    public function test_complete_issues_draft_invoices_to_rental_revenue(): void
    {
        $rental = Rental::factory()->returned()->create([
            'deposit_amount' => 0,
            'deposit_status' => Rental::DEPOSIT_SETTLED,
            'base_amount' => 1000000,
            'total_amount' => 1000000,
        ]);

        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_BASE,
            'amount' => 1000000,
            'description' => 'Base',
        ]);

        $invoice = Invoice::factory()->create([
            'partner_id' => $rental->partner_id,
            'status' => Invoice::STATUS_DRAFT,
            'tax_enabled' => false,
            'tax_rate' => 0,
        ]);

        \Modules\Invoicing\Models\InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Base',
            'amount' => 1000000,
            'source_type' => $charge->getMorphClass(),
            'source_id' => $charge->id,
        ]);
        $invoice->recalculate();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.complete', $rental))
            ->assertRedirect();

        $this->assertSame(Invoice::STATUS_ISSUED, $invoice->fresh()->status);

        $journal = JournalEntry::query()
            ->where('source_type', $invoice->getMorphClass())
            ->where('source_id', $invoice->id)
            ->where('event', 'invoice.issued')
            ->with('lines.account')
            ->first();

        $this->assertNotNull($journal);

        $revenue = $journal->lines->first(
            fn ($line) => $line->account->system_role === 'rental_revenue'
        );
        $this->assertNotNull($revenue);
        $this->assertSame(1000000.0, (float) $revenue->credit);
        $this->assertTrue(Account::query()->where('system_role', 'rental_revenue')->exists());
    }

    public function test_settle_deposit_applies_to_ar_and_refunds_remainder(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_RETURNED,
            'deposit_amount' => 500000,
            'deposit_status' => Rental::DEPOSIT_HELD,
            'deposit_received_at' => now()->subDay(),
            'deposit_payment_method' => 'cash',
            'deposit_applied_amount' => 0,
            'deposit_refunded_amount' => 0,
            'deposit_settled_at' => null,
            'base_amount' => 1000000,
            'total_amount' => 1000000,
            'returned_at' => now(),
        ]);

        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_BASE,
            'amount' => 1000000,
            'description' => 'Base',
        ]);

        $invoice = Invoice::factory()->create([
            'partner_id' => $rental->partner_id,
            'status' => Invoice::STATUS_DRAFT,
            'tax_enabled' => false,
            'tax_rate' => 0,
        ]);

        \Modules\Invoicing\Models\InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Base',
            'amount' => 1000000,
            'source_type' => $charge->getMorphClass(),
            'source_id' => $charge->id,
        ]);
        $invoice->recalculate();

        // Pretend deposit was already received in GL.
        \Modules\Accounting\Support\AccountingBridge::rentalDepositReceived($rental);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.deposit.settle', $rental), [
                'deposit_applied_amount' => 200000,
                'deposit_refunded_amount' => 300000,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $rental->refresh();
        $this->assertSame(Rental::DEPOSIT_SETTLED, $rental->deposit_status);
        $this->assertSame(Invoice::STATUS_PARTIALLY_PAID, $invoice->fresh()->status);
        $this->assertEquals(200000, (float) $invoice->fresh()->amount_paid);

        $applied = JournalEntry::query()
            ->where('source_id', $rental->id)
            ->where('event', 'rental_deposit.applied')
            ->with('lines.account')
            ->first();
        $this->assertNotNull($applied);

        $refunded = JournalEntry::query()
            ->where('source_id', $rental->id)
            ->where('event', 'rental_deposit.refunded')
            ->first();
        $this->assertNotNull($refunded);
    }

    public function test_cannot_settle_deposit_before_cash_received(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_RETURNED,
            'deposit_amount' => 500000,
            'deposit_status' => Rental::DEPOSIT_HELD,
            'deposit_received_at' => null,
            'returned_at' => now(),
        ]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->post(route('module.rental.deposit.settle', $rental), [
                'deposit_applied_amount' => 0,
                'deposit_refunded_amount' => 500000,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('deposit_applied_amount');
    }
}
