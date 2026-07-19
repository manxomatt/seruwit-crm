<?php

namespace Tests\Feature\Modules\Billing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Customer\Models\Customer;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Orders\Models\DeliveryOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class OrderChargeTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    /**
     * Confirms the order through the real endpoint so the observer fires.
     */
    private function confirmOrder(DeliveryOrder $order): void
    {
        DeliveryOrderItem::factory()->create(['delivery_order_id' => $order->id]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.orders.confirm', $order));
    }

    public function test_confirming_an_order_creates_a_charge_from_the_matching_general_tariff(): void
    {
        $tariff = Tariff::factory()->create(['origin' => 'Gudang A', 'destination' => 'Toko B', 'price' => 500000]);
        $order = DeliveryOrder::factory()->create(['pickup_address' => 'Gudang A', 'delivery_address' => 'Toko B']);

        $this->confirmOrder($order);

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $this->assertNotNull($charge);
        $this->assertSame($tariff->id, $charge->tariff_id);
        $this->assertSame('500000.00', $charge->amount);
    }

    public function test_a_customer_specific_tariff_wins_over_the_general_one(): void
    {
        $customer = Customer::factory()->create();
        Tariff::factory()->create(['origin' => 'Gudang A', 'destination' => 'Toko B', 'price' => 500000]);
        $specific = Tariff::factory()->forCustomer($customer)->create(['origin' => 'Gudang A', 'destination' => 'Toko B', 'price' => 400000]);
        $order = DeliveryOrder::factory()->create([
            'customer_id' => $customer->id,
            'pickup_address' => 'Gudang A',
            'delivery_address' => 'Toko B',
        ]);

        $this->confirmOrder($order);

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $this->assertSame($specific->id, $charge->tariff_id);
        $this->assertSame('400000.00', $charge->amount);
    }

    public function test_matching_is_case_insensitive_and_ignores_inactive_tariffs(): void
    {
        Tariff::factory()->inactive()->create(['origin' => 'Gudang A', 'destination' => 'Toko B', 'price' => 999999]);
        $active = Tariff::factory()->create(['origin' => 'GUDANG A', 'destination' => 'toko b', 'price' => 300000]);
        $order = DeliveryOrder::factory()->create(['pickup_address' => 'gudang a', 'delivery_address' => 'TOKO B']);

        $this->confirmOrder($order);

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $this->assertSame($active->id, $charge->tariff_id);
    }

    public function test_an_order_without_a_matching_tariff_gets_a_zero_charge(): void
    {
        $order = DeliveryOrder::factory()->create();

        $this->confirmOrder($order);

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $this->assertNotNull($charge);
        $this->assertNull($charge->tariff_id);
        $this->assertSame('0.00', $charge->amount);
    }

    public function test_cancelling_a_confirmed_order_deletes_its_uninvoiced_charge(): void
    {
        $user = $this->createAdminUser();
        $order = DeliveryOrder::factory()->create();
        $this->confirmOrder($order);

        $this->actingAs($user)->post(route('module.orders.cancel', $order), [
            'cancelled_reason' => 'Customer withdrew',
        ]);

        $this->assertDatabaseMissing('order_charges', ['delivery_order_id' => $order->id]);
    }

    public function test_the_charges_index_renders(): void
    {
        $user = $this->createAdminUser();
        DeliveryOrder::factory()->confirmed()->create();

        $this->actingAs($user)->get(route('module.billing.charges.index'))->assertOk();
    }

    public function test_a_charge_can_be_priced_manually_including_lazily_for_a_pre_billing_order(): void
    {
        $user = $this->createAdminUser();
        // Confirmed state set directly (factory), so the observer never ran —
        // mimics an order that predates the Billing install.
        $order = DeliveryOrder::factory()->confirmed()->create();
        $this->assertDatabaseMissing('order_charges', ['delivery_order_id' => $order->id]);

        $this->actingAs($user)->patch(route('module.billing.charges.update', $order), [
            'amount' => 750000,
        ])->assertSessionHas('success');

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $this->assertSame('750000.00', $charge->amount);
    }

    public function test_a_manually_picked_tariff_overrides_the_amount(): void
    {
        $user = $this->createAdminUser();
        $tariff = Tariff::factory()->create(['price' => 888000]);
        $order = DeliveryOrder::factory()->confirmed()->create();

        $this->actingAs($user)->patch(route('module.billing.charges.update', $order), [
            'tariff_id' => $tariff->id,
        ]);

        $charge = OrderCharge::firstWhere('delivery_order_id', $order->id);
        $this->assertSame($tariff->id, $charge->tariff_id);
        $this->assertSame('888000.00', $charge->amount);
    }

    /**
     * Bill $amount of work on $invoice, the way OrderInvoiceController does.
     */
    private function billed(DeliveryOrder $order, Invoice $invoice, float $amount): OrderCharge
    {
        $charge = OrderCharge::factory()->create([
            'delivery_order_id' => $order->id,
            'amount' => $amount,
        ]);

        InvoiceLine::factory()->sourcedFrom($charge)->create([
            'invoice_id' => $invoice->id,
            'amount' => $amount,
        ]);

        return $charge;
    }

    public function test_a_charge_on_an_issued_invoice_cannot_be_changed(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->issued()->create();
        $order = DeliveryOrder::factory()->create(['status' => DeliveryOrder::STATUS_DELIVERED]);
        $this->billed($order, $invoice, 100000);

        $this->actingAs($user)->patch(route('module.billing.charges.update', $order), [
            'amount' => 999999,
        ])->assertSessionHas('error');

        $this->assertSame('100000.00', OrderCharge::firstWhere('delivery_order_id', $order->id)->amount);
    }

    /**
     * The line carries its own amount snapshot, so repricing has to move both
     * it and the invoice totals — otherwise the invoice would keep quoting the
     * old price.
     */
    public function test_updating_a_charge_on_a_draft_invoice_recalculates_its_totals(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->create(['tax_enabled' => false]);
        $order = DeliveryOrder::factory()->create(['status' => DeliveryOrder::STATUS_DELIVERED]);
        $this->billed($order, $invoice, 100000);

        $this->actingAs($user)->patch(route('module.billing.charges.update', $order), [
            'amount' => 250000,
        ]);

        $this->assertSame('250000.00', $invoice->fresh()->total);
        $this->assertSame('250000.00', $invoice->lines()->first()->amount);
    }
}
