<?php

namespace Tests\Feature\Modules;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FinanceNavUxTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_finance_module_index_pages_render_for_admin(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.accounting.dashboard'))->assertOk();
        $this->actingAs($user)->get(route('module.invoicing.invoices.index'))->assertOk();
        $this->actingAs($user)->get(route('module.receivables.payments.index'))->assertOk();
        $this->actingAs($user)->get(route('module.payables.bills.index'))->assertOk();
        $this->actingAs($user)->get(route('module.payables.payments.index'))->assertOk();
        $this->actingAs($user)->get(route('module.billing.charges.index'))->assertOk();
    }
}
