<?php

namespace Tests\Feature\Modules\Payables;

use Database\Seeders\TenantPayablesDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Payables\Models\BillPayment;
use Modules\Payables\Models\SupplierBill;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PayablesDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_seeds_twenty_demo_bills(): void
    {
        $this->seed(TenantPayablesDemoSeeder::class);

        $this->assertSame(
            TenantPayablesDemoSeeder::BILL_COUNT,
            SupplierBill::query()->where('notes', 'like', '%'.TenantPayablesDemoSeeder::TAG.'%')->count(),
        );

        $this->assertGreaterThan(0, BillPayment::query()->where('notes', 'like', '%'.TenantPayablesDemoSeeder::TAG.'%')->count());
        $this->assertGreaterThan(0, SupplierBill::query()->where('status', SupplierBill::STATUS_ISSUED)->count());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantPayablesDemoSeeder::class);
        $billCount = SupplierBill::query()->where('notes', 'like', '%'.TenantPayablesDemoSeeder::TAG.'%')->count();
        $paymentCount = BillPayment::query()->where('notes', 'like', '%'.TenantPayablesDemoSeeder::TAG.'%')->count();

        $this->seed(TenantPayablesDemoSeeder::class);

        $this->assertSame(
            $billCount,
            SupplierBill::query()->where('notes', 'like', '%'.TenantPayablesDemoSeeder::TAG.'%')->count(),
        );
        $this->assertSame(
            $paymentCount,
            BillPayment::query()->where('notes', 'like', '%'.TenantPayablesDemoSeeder::TAG.'%')->count(),
        );
    }

    public function test_bills_index_paginates_results(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantPayablesDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.payables.bills.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Payables/Bills/Index')
                ->where('bills.per_page', 15)
                ->where('bills.total', TenantPayablesDemoSeeder::BILL_COUNT)
                ->where('bills.last_page', 2)
                ->has('bills.data', 15)
                ->has('bills.links'));

        $this->actingAs($user)
            ->get(route('module.payables.bills.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('bills.data', 5));
    }

    public function test_payments_index_exposes_pagination_meta(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantPayablesDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.payables.payments.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Payables/Payments/Index')
                ->has('payments.data')
                ->has('payments.current_page')
                ->has('payments.last_page')
                ->has('payments.per_page')
                ->has('payments.total')
                ->has('payments.links'));
    }
}
