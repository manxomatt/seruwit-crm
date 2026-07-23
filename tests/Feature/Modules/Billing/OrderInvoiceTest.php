<?php

namespace Tests\Feature\Modules\Billing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

/**
 * The logistics half of billing: turning delivered orders into invoice lines.
 *
 * The invoice's own behaviour is covered by the Invoicing module's tests; what
 * matters here is that the right orders may be billed, that they are priced
 * from the tariff, and that "already invoiced" is answered by the presence of
 * an invoice line rather than a column this module keeps for itself.
 */
class OrderInvoiceTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    private function deliveredOrder(Partner $partner, float $amount): DeliveryOrder
    {
        $order = DeliveryOrder::factory()->create([
            'partner_id' => $partner->id,
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);

        OrderCharge::factory()->create(['delivery_order_id' => $order->id, 'amount' => $amount]);

        return $order;
    }

    public function test_a_draft_invoice_bundles_the_selected_orders_with_correct_totals(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $orderA = $this->deliveredOrder($partner, 1000000);
        $orderB = $this->deliveredOrder($partner, 500000);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'partner_id' => $partner->id,
            'order_ids' => [$orderA->id, $orderB->id],
        ])->assertRedirect();

        $invoice = Invoice::first();
        $this->assertSame('INV-000001', $invoice->code);
        $this->assertSame(Invoice::STATUS_DRAFT, $invoice->status);
        $this->assertSame(2, $invoice->lines()->count());
        $this->assertSame('1500000.00', $invoice->subtotal);
        // Default settings: PPN enabled at 11%.
        $this->assertTrue($invoice->tax_enabled);
        $this->assertSame('165000.00', $invoice->tax_amount);
        $this->assertSame('1665000.00', $invoice->total);
    }

    public function test_each_line_points_back_at_the_charge_it_was_raised_for(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $order = $this->deliveredOrder($partner, 750000);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'partner_id' => $partner->id,
            'order_ids' => [$order->id],
        ]);

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $line = InvoiceLine::first();

        $this->assertSame($charge->getMorphClass(), $line->source_type);
        $this->assertSame($charge->id, $line->source_id);
        $this->assertSame('750000.00', $line->amount);
        // The description is a snapshot, so the invoice still reads correctly
        // even once the order behind it changes.
        $this->assertStringContainsString($order->code, $line->description);
    }

    public function test_storing_creates_missing_charges_from_the_matching_tariff(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        Tariff::factory()->create(['origin' => 'Gudang A', 'destination' => 'Toko B', 'price' => 350000]);
        $order = DeliveryOrder::factory()->create([
            'partner_id' => $partner->id,
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'pickup_address' => 'Gudang A',
            'delivery_address' => 'Toko B',
        ]);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'partner_id' => $partner->id,
            'order_ids' => [$order->id],
        ]);

        $this->assertSame('350000.00', Invoice::first()->subtotal);
    }

    public function test_orders_of_another_customer_or_undelivered_or_invoiced_are_rejected(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();

        $foreign = $this->deliveredOrder(Partner::factory()->create(), 100);
        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'partner_id' => $partner->id,
            'order_ids' => [$foreign->id],
        ])->assertSessionHas('error');

        $undelivered = DeliveryOrder::factory()->confirmed()->create(['partner_id' => $partner->id]);
        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'partner_id' => $partner->id,
            'order_ids' => [$undelivered->id],
        ])->assertSessionHas('error');

        $invoiced = $this->deliveredOrder($partner, 100);
        $existing = Invoice::factory()->create(['partner_id' => $partner->id]);
        $charge = OrderCharge::firstWhere('delivery_order_id', $invoiced->id);
        InvoiceLine::factory()->sourcedFrom($charge)->create(['invoice_id' => $existing->id]);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'partner_id' => $partner->id,
            'order_ids' => [$invoiced->id],
        ])->assertSessionHas('error');

        $this->assertSame(1, Invoice::count());
    }

    public function test_more_orders_can_be_attached_to_a_draft_with_recalculation(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $orderA = $this->deliveredOrder($partner, 1000000);
        $orderB = $this->deliveredOrder($partner, 500000);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'partner_id' => $partner->id,
            'order_ids' => [$orderA->id],
        ]);
        $invoice = Invoice::first();

        $this->actingAs($user)->post(route('module.billing.invoices.orders.store', $invoice), [
            'order_ids' => [$orderB->id],
        ])->assertSessionHas('success');

        $this->assertSame('1500000.00', $invoice->fresh()->subtotal);
    }

    public function test_orders_cannot_be_attached_to_an_issued_invoice(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $order = $this->deliveredOrder($partner, 100000);
        $invoice = Invoice::factory()->issued()->create(['partner_id' => $partner->id]);

        $this->actingAs($user)->post(route('module.billing.invoices.orders.store', $invoice), [
            'order_ids' => [$order->id],
        ])->assertSessionHas('error');

        $this->assertSame(0, $invoice->lines()->count());
    }

    /**
     * Removing the line is how the work goes back on the market — there is no
     * separate "release" step, because there is no second record to release.
     */
    public function test_removing_the_line_makes_the_order_invoiceable_again(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        $order = $this->deliveredOrder($partner, 400000);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'partner_id' => $partner->id,
            'order_ids' => [$order->id],
        ]);

        $invoice = Invoice::first();
        $line = $invoice->lines()->first();

        $this->actingAs($user)->delete(route('module.invoicing.invoices.lines.destroy', [$invoice, $line]));

        $response = $this->actingAs($user)->get(route('module.billing.invoices.create', ['partner_id' => $partner->id]));
        $invoiceable = $response->viewData('page')['props']['invoiceableOrders'];

        $this->assertCount(1, $invoiceable);
        $this->assertSame($order->id, $invoiceable[0]['id']);
    }
}
