<?php

namespace Tests\Feature\Modules\Billing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OrderCharge;
use Modules\Orders\Models\DeliveryOrder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class InvoicePdfTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_an_issued_invoice_streams_a_pdf(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->issued()->create();
        $order = DeliveryOrder::factory()->create([
            'customer_id' => $invoice->customer_id,
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);
        OrderCharge::factory()->create(['delivery_order_id' => $order->id, 'invoice_id' => $invoice->id]);

        $response = $this->actingAs($user)->get(route('module.billing.invoices.pdf', $invoice));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_a_draft_invoice_has_no_pdf(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->create();

        $this->actingAs($user)
            ->from(route('module.billing.invoices.show', $invoice))
            ->get(route('module.billing.invoices.pdf', $invoice))
            ->assertRedirect(route('module.billing.invoices.show', $invoice));
    }
}
