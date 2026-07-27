<?php

namespace Tests\Feature\Modules\Payables;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PayablesPaymentCreateTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_payment_create_page_renders_with_suppliers(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create(['name' => 'PT Combo Supplier']);

        $this->actingAs($user)
            ->get(route('module.payables.payments.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Payables/Payments/Create')
                ->has('partners', 1)
                ->where('partners.0.id', $supplier->id)
                ->where('partners.0.name', 'PT Combo Supplier')
                ->has('methods')
                ->where('selectedPartnerId', null)
                ->has('openBills', 0));
    }

    public function test_payment_create_loads_open_bills_for_selected_supplier(): void
    {
        $user = $this->createAdminUser();
        $supplier = Partner::factory()->supplier()->create();

        $bill = SupplierBill::query()->create([
            'partner_id' => $supplier->id,
            'code' => 'BILL-TEST-001',
            'status' => SupplierBill::STATUS_ISSUED,
            'bill_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'subtotal' => 100000,
            'tax_amount' => 0,
            'total' => 100000,
            'amount_paid' => 0,
        ]);

        $this->actingAs($user)
            ->get(route('module.payables.payments.create', ['partner_id' => $supplier->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Payables/Payments/Create')
                ->where('selectedPartnerId', $supplier->id)
                ->has('openBills', 1)
                ->where('openBills.0.id', $bill->id)
                ->where('openBills.0.code', 'BILL-TEST-001'));
    }

    public function test_payment_methods_are_available_on_create(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.payables.payments.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('methods', BillPayment::methods()));
    }
}
