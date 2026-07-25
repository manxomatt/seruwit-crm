<?php

namespace Tests\Feature\Modules\Purchasing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Purchasing\Models\PurchaseOrder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PurchaseOrderPaginationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_purchase_orders_index_paginates_results(): void
    {
        $user = $this->createAdminUser();

        PurchaseOrder::factory()->count(20)->create();

        $this->actingAs($user)
            ->get(route('module.purchasing.purchase-orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Purchasing/PurchaseOrders/Index')
                ->has('orders.data', 15)
                ->where('orders.total', 20)
                ->where('orders.per_page', 15)
                ->where('orders.current_page', 1)
            );

        $this->actingAs($user)
            ->get(route('module.purchasing.purchase-orders.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('orders.data', 5)
                ->where('orders.current_page', 2)
            );
    }
}
