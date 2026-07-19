<?php

namespace Tests\Feature\Modules\Invoicing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
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
        InvoiceLine::factory()->create(['invoice_id' => $invoice->id]);

        $response = $this->actingAs($user)->get(route('module.invoicing.invoices.pdf', $invoice));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_a_draft_invoice_has_no_pdf(): void
    {
        $user = $this->createAdminUser();
        $invoice = Invoice::factory()->create();

        $this->actingAs($user)
            ->from(route('module.invoicing.invoices.show', $invoice))
            ->get(route('module.invoicing.invoices.pdf', $invoice))
            ->assertRedirect(route('module.invoicing.invoices.show', $invoice));
    }
}
