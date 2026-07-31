<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Models\RentalDamage;
use Tests\Support\WithRentalHandoverEvidence;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalInvoiceTest extends TestCase
{
    use RefreshDatabase;
    use WithRentalHandoverEvidence;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_confirm_creates_issued_base_invoice_with_due_date(): void
    {
        $partner = \Modules\Partners\Models\Partner::factory()->create([
            'payment_term_days' => 7,
        ]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_DRAFT,
            'base_amount' => 1500000,
            'total_amount' => 1500000,
            'deposit_amount' => 500000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])
            ->assertRedirect();

        $charge = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('kind', RentalCharge::KIND_BASE)
            ->first();

        $this->assertNotNull($charge);
        $this->assertEquals(1500000, (float) $charge->amount);

        $line = InvoiceLine::query()
            ->where('source_type', $charge->getMorphClass())
            ->where('source_id', $charge->id)
            ->first();

        $this->assertNotNull($line);
        $invoice = $line->invoice;
        $this->assertSame(Invoice::STATUS_ISSUED, $invoice->status);
        $this->assertSame($rental->partner_id, $invoice->partner_id);
        $this->assertEquals(1500000, (float) $invoice->subtotal);
        $this->assertNotNull($invoice->due_date);
        $this->assertSame(
            $invoice->issue_date->copy()->addDays(7)->toDateString(),
            $invoice->due_date->toDateString(),
        );
    }

    public function test_confirm_is_idempotent_for_invoicing(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_DRAFT,
            'base_amount' => 1000000,
            'total_amount' => 1000000,
        ]);

        $user = $this->createAdminUser();
        $this->actingAs($user)->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])->assertRedirect();

        $this->assertSame(1, Invoice::query()->count());
        $this->assertSame(1, RentalCharge::query()->where('rental_id', $rental->id)->count());
    }

    public function test_extend_creates_extension_invoice(): void
    {
        $rental = Rental::factory()->active()->create([
            'end_date' => '2027-01-20',
            'period_type' => 'daily',
            'rate_per_period' => 400000,
            'total_periods' => 5,
            'base_amount' => 2000000,
            'total_amount' => 2000000,
            'deposit_amount' => 0,
        ]);

        RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_BASE,
            'amount' => 2000000,
            'description' => 'Base',
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.extend', $rental), ['new_end_date' => '2027-01-23'])
            ->assertRedirect();

        $extCharge = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('kind', RentalCharge::KIND_EXTENSION)
            ->first();

        $this->assertNotNull($extCharge);
        $this->assertEquals(1200000, (float) $extCharge->amount);
        $this->assertTrue(
            InvoiceLine::query()
                ->where('source_type', $extCharge->getMorphClass())
                ->where('source_id', $extCharge->id)
                ->exists()
        );
    }

    public function test_return_with_excess_km_creates_excess_invoice(): void
    {
        $rental = Rental::factory()->active()->create([
            'start_odometer' => 50000,
            'km_limit_per_period' => 100,
            'total_periods' => 3,
            'excess_km_rate' => 5000,
            'base_amount' => 1000000,
            'total_amount' => 1000000,
            'deposit_amount' => 0,
            'end_date' => '2027-01-15',
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.return', $rental), $this->rentalReturnPayload([
                'actual_return_date' => '2027-01-15',
                'end_odometer' => 50400,
            ]))
            ->assertRedirect();

        $excess = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('kind', RentalCharge::KIND_EXCESS_KM)
            ->first();

        $this->assertNotNull($excess);
        $this->assertEquals(500000, (float) $excess->amount);
    }

    public function test_late_return_creates_late_fee_invoice(): void
    {
        $rental = Rental::factory()->active()->create([
            'period_type' => 'daily',
            'rate_per_period' => 400000,
            'late_fee_per_day' => 500000,
            'end_date' => '2027-01-10',
            'base_amount' => 2000000,
            'total_amount' => 2000000,
            'deposit_amount' => 0,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.return', $rental), $this->rentalReturnPayload([
                'actual_return_date' => '2027-01-13',
            ]))
            ->assertRedirect();

        $rental->refresh();
        $this->assertEquals(3, $rental->overdue_days);
        $this->assertEquals(1500000, (float) $rental->late_fee_amount);
        $this->assertEquals(3500000, (float) $rental->total_amount);

        $lateFee = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('kind', RentalCharge::KIND_LATE_FEE)
            ->first();

        $this->assertNotNull($lateFee);
        $this->assertEquals(1500000, (float) $lateFee->amount);
    }

    public function test_damage_creates_invoice_and_updates_total(): void
    {
        $rental = Rental::factory()->returned()->create([
            'base_amount' => 1000000,
            'excess_amount' => 0,
            'total_amount' => 1000000,
            'deposit_amount' => 0,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.damages.store', $rental), [
                'description' => 'Cracked bumper',
                'amount' => 250000,
            ])
            ->assertRedirect();

        $rental->refresh();
        $this->assertEquals(1250000, (float) $rental->total_amount);

        $damageCharge = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('kind', RentalCharge::KIND_DAMAGE)
            ->first();

        $this->assertNotNull($damageCharge);
        $this->assertEquals(250000, (float) $damageCharge->amount);
    }

    public function test_cannot_delete_invoiced_damage(): void
    {
        $rental = Rental::factory()->returned()->create(['deposit_amount' => 0]);
        $damage = RentalDamage::factory()->create([
            'rental_id' => $rental->id,
            'amount' => 100000,
        ]);

        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_DAMAGE,
            'amount' => 100000,
            'description' => 'Damage',
            'rental_damage_id' => $damage->id,
        ]);

        $invoice = Invoice::factory()->create([
            'partner_id' => $rental->partner_id,
            'status' => Invoice::STATUS_ISSUED,
        ]);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Damage',
            'amount' => 100000,
            'source_type' => $charge->getMorphClass(),
            'source_id' => $charge->id,
        ]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->delete(route('module.rental.damages.destroy', [$rental, $damage]))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('rental_damages', ['id' => $damage->id]);
    }

    public function test_can_delete_damage_while_invoice_still_draft(): void
    {
        $rental = Rental::factory()->returned()->create([
            'base_amount' => 1000000,
            'excess_amount' => 0,
            'total_amount' => 1150000,
            'deposit_amount' => 0,
        ]);

        $damage = RentalDamage::factory()->create([
            'rental_id' => $rental->id,
            'amount' => 150000,
            'description' => 'Scratch',
        ]);

        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_DAMAGE,
            'amount' => 150000,
            'description' => 'Scratch',
            'rental_damage_id' => $damage->id,
        ]);

        $invoice = Invoice::factory()->create([
            'partner_id' => $rental->partner_id,
            'status' => Invoice::STATUS_DRAFT,
        ]);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Scratch',
            'amount' => 150000,
            'source_type' => $charge->getMorphClass(),
            'source_id' => $charge->id,
        ]);

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.rental.damages.destroy', [$rental, $damage]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('rental_damages', ['id' => $damage->id]);
        $rental->refresh();
        $this->assertEquals(1000000, (float) $rental->total_amount);
    }

    public function test_deposit_settlement_requires_sum_equal_deposit(): void
    {
        $rental = Rental::factory()->returned()->create([
            'deposit_amount' => 1000000,
            'deposit_status' => Rental::DEPOSIT_HELD,
            'deposit_returned' => false,
            'deposit_applied_amount' => 0,
            'deposit_refunded_amount' => 0,
            'deposit_settled_at' => null,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.deposit.settle', $rental), [
                'deposit_applied_amount' => 200000,
                'deposit_refunded_amount' => 100000,
            ])
            ->assertSessionHasErrors('deposit_applied_amount');
    }

    public function test_can_settle_deposit_with_partial_application(): void
    {
        $rental = Rental::factory()->returned()->create([
            'deposit_amount' => 1000000,
            'deposit_status' => Rental::DEPOSIT_HELD,
            'deposit_returned' => false,
            'deposit_applied_amount' => 0,
            'deposit_refunded_amount' => 0,
            'deposit_settled_at' => null,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.deposit.settle', $rental), [
                'deposit_applied_amount' => 300000,
                'deposit_refunded_amount' => 700000,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $rental->refresh();
        $this->assertSame(Rental::DEPOSIT_SETTLED, $rental->deposit_status);
        $this->assertEquals(300000, (float) $rental->deposit_applied_amount);
        $this->assertEquals(700000, (float) $rental->deposit_refunded_amount);
        $this->assertFalse($rental->deposit_returned);
        $this->assertNotNull($rental->deposit_settled_at);
    }

    public function test_cannot_complete_when_deposit_unsettled(): void
    {
        $rental = Rental::factory()->returned()->create([
            'deposit_amount' => 500000,
            'deposit_status' => Rental::DEPOSIT_HELD,
            'deposit_returned' => false,
            'deposit_applied_amount' => 0,
            'deposit_refunded_amount' => 0,
            'deposit_settled_at' => null,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.complete', $rental))
            ->assertStatus(422);
    }

    public function test_show_includes_payment_summary(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])
            ->assertRedirect();

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.show', $rental))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Show')
                ->where('invoicingEnabled', true)
                ->where('payment.status', 'unpaid')
                ->has('payment.invoices', 1)
                ->where('payment.invoices.0.due_date', fn ($v) => is_string($v) && $v !== '')
                ->where('payment.total_invoiced', fn ($v) => (float) $v > 0));
    }
}
