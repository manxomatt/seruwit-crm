<?php

namespace Tests\Feature\Modules\Billing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Customer\Models\Customer;
use Modules\Orders\Models\DeliveryOrder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

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

    private function deliveredOrder(Customer $customer, float $amount): DeliveryOrder
    {
        $order = DeliveryOrder::factory()->create([
            'customer_id' => $customer->id,
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);

        OrderCharge::factory()->create(['delivery_order_id' => $order->id, 'amount' => $amount]);

        return $order;
    }

    public function test_a_draft_invoice_bundles_the_selected_orders_with_correct_totals(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create();
        $orderA = $this->deliveredOrder($customer, 1000000);
        $orderB = $this->deliveredOrder($customer, 500000);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'customer_id' => $customer->id,
            'order_ids' => [$orderA->id, $orderB->id],
        ])->assertRedirect();

        $invoice = Invoice::first();
        $this->assertSame('INV-000001', $invoice->code);
        $this->assertSame(Invoice::STATUS_DRAFT, $invoice->status);
        $this->assertSame(2, $invoice->charges()->count());
        $this->assertSame('1500000.00', $invoice->subtotal);
        // Default settings: PPN enabled at 11%.
        $this->assertTrue($invoice->tax_enabled);
        $this->assertSame('165000.00', $invoice->tax_amount);
        $this->assertSame('1665000.00', $invoice->total);
    }

    public function test_storing_creates_missing_charges_from_the_matching_tariff(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create();
        Tariff::factory()->create(['origin' => 'Gudang A', 'destination' => 'Toko B', 'price' => 350000]);
        $order = DeliveryOrder::factory()->create([
            'customer_id' => $customer->id,
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'pickup_address' => 'Gudang A',
            'delivery_address' => 'Toko B',
        ]);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'customer_id' => $customer->id,
            'order_ids' => [$order->id],
        ]);

        $this->assertSame('350000.00', Invoice::first()->subtotal);
    }

    public function test_orders_of_another_customer_or_undelivered_or_invoiced_are_rejected(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create();

        $foreign = $this->deliveredOrder(Customer::factory()->create(), 100);
        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'customer_id' => $customer->id,
            'order_ids' => [$foreign->id],
        ])->assertSessionHas('error');

        $undelivered = DeliveryOrder::factory()->confirmed()->create(['customer_id' => $customer->id]);
        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'customer_id' => $customer->id,
            'order_ids' => [$undelivered->id],
        ])->assertSessionHas('error');

        $invoiced = $this->deliveredOrder($customer, 100);
        $existing = Invoice::factory()->create(['customer_id' => $customer->id]);
        $invoiced->refresh();
        OrderCharge::query()->where('delivery_order_id', $invoiced->id)->update(['invoice_id' => $existing->id]);
        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'customer_id' => $customer->id,
            'order_ids' => [$invoiced->id],
        ])->assertSessionHas('error');

        $this->assertSame(1, Invoice::count());
    }

    public function test_the_ppn_toggle_recalculates_a_draft(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create();
        $order = $this->deliveredOrder($customer, 1000000);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'customer_id' => $customer->id,
            'order_ids' => [$order->id],
        ]);

        $invoice = Invoice::first();

        $this->actingAs($user)->patch(route('module.billing.invoices.update', $invoice), [
            'tax_enabled' => false,
        ]);

        $invoice->refresh();
        $this->assertSame('0.00', $invoice->tax_amount);
        $this->assertSame('1000000.00', $invoice->total);
    }

    public function test_charges_can_be_attached_and_detached_on_a_draft_with_recalculation(): void
    {
        $user = $this->createAdminUser();
        $customer = Customer::factory()->create();
        $orderA = $this->deliveredOrder($customer, 1000000);
        $orderB = $this->deliveredOrder($customer, 500000);

        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'customer_id' => $customer->id,
            'order_ids' => [$orderA->id],
        ]);
        $invoice = Invoice::first();

        $this->actingAs($user)->post(route('module.billing.invoices.charges.store', $invoice), [
            'order_id' => $orderB->id,
        ])->assertSessionHas('success');

        $this->assertSame('1500000.00', $invoice->fresh()->subtotal);

        $chargeB = OrderCharge::firstWhere('delivery_order_id', $orderB->id);
        $this->actingAs($user)->delete(route('module.billing.invoices.charges.destroy', [$invoice, $chargeB]))
            ->assertSessionHas('success');

        $this->assertSame('1000000.00', $invoice->fresh()->subtotal);
        $this->assertNull($chargeB->fresh()->invoice_id);
    }

    public function test_issuing_requires_a_charge_and_freezes_totals(): void
    {
        $user = $this->createAdminUser();
        $empty = Invoice::factory()->create();

        $this->actingAs($user)->post(route('module.billing.invoices.issue', $empty))->assertSessionHas('error');

        $customer = Customer::factory()->create();
        $order = $this->deliveredOrder($customer, 1000000);
        $this->actingAs($user)->post(route('module.billing.invoices.store'), [
            'customer_id' => $customer->id,
            'order_ids' => [$order->id],
        ]);
        $invoice = Invoice::query()->latest('id')->first();

        $this->actingAs($user)->post(route('module.billing.invoices.issue', $invoice))->assertSessionHas('success');
        $totalAtIssue = $invoice->fresh()->total;

        // A later tariff/settings change must not move the issued totals.
        $this->actingAs($user)->patch(route('module.billing.invoices.update', $invoice), [
            'tax_enabled' => false,
        ])->assertSessionHas('error');

        $this->assertSame($totalAtIssue, $invoice->fresh()->total);
    }

    public function test_pay_marks_the_invoice_paid(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->issued()->create();

        $this->actingAs($user)->post(route('module.billing.invoices.pay', $invoice))->assertSessionHas('success');

        $invoice->refresh();
        $this->assertSame(Invoice::STATUS_PAID, $invoice->status);
        $this->assertNotNull($invoice->paid_at);
    }

    public function test_void_releases_charges_and_a_paid_invoice_cannot_be_voided(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->issued()->create();
        $charge = OrderCharge::factory()->create(['invoice_id' => $invoice->id, 'amount' => 100000]);

        $this->actingAs($user)->post(route('module.billing.invoices.void', $invoice))->assertSessionHas('success');

        $this->assertSame(Invoice::STATUS_VOID, $invoice->fresh()->status);
        $this->assertNull($charge->fresh()->invoice_id);

        $paid = Invoice::factory()->paid()->create();
        $this->actingAs($user)->post(route('module.billing.invoices.void', $paid))->assertSessionHas('error');
        $this->assertSame(Invoice::STATUS_PAID, $paid->fresh()->status);
    }

    public function test_only_a_draft_can_be_deleted_and_deletion_releases_charges(): void
    {
        $user = $this->createAdminUser();
        $issued = Invoice::factory()->issued()->create();
        $this->actingAs($user)->delete(route('module.billing.invoices.destroy', $issued))->assertSessionHas('error');

        $draft = Invoice::factory()->create();
        $charge = OrderCharge::factory()->create(['invoice_id' => $draft->id]);

        $this->actingAs($user)->delete(route('module.billing.invoices.destroy', $draft))
            ->assertRedirect(route('module.billing.invoices.index'));

        $this->assertDatabaseMissing('invoices', ['id' => $draft->id]);
        $this->assertNull($charge->fresh()->invoice_id);
    }

    public function test_the_index_summary_reports_outstanding_and_paid_this_month(): void
    {
        $user = $this->createAdminUser();
        Invoice::factory()->issued()->create(['total' => 2000000]);
        Invoice::factory()->issued()->create(['total' => 1000000]);
        Invoice::factory()->paid()->create(['total' => 500000]);
        Invoice::factory()->create();

        $response = $this->actingAs($user)->get(route('module.billing.invoices.index'));

        $response->assertOk();
        $summary = $response->viewData('page')['props']['summary'];
        $this->assertSame(3000000.0, $summary['outstanding']);
        $this->assertSame(500000.0, $summary['paid_this_month']);
        $this->assertSame(1, $summary['draft_count']);
    }
}
