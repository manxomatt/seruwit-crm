<?php

namespace Tests\Feature\Modules\Sales;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Sales\Models\SalesOrder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class SalesOrderPaginationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_sales_orders_index_paginates_results(): void
    {
        $user = $this->createAdminUser();

        SalesOrder::factory()->count(15)->create();

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Sales/SalesOrders/Index')
                ->has('orders.data', 10)
                ->where('orders.total', 15)
                ->where('orders.per_page', 10)
                ->where('orders.current_page', 1)
                ->where('orders.last_page', 2)
            );

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('orders.data', 5)
                ->where('orders.current_page', 2)
            );
    }

    public function test_sales_orders_pagination_preserves_filters(): void
    {
        $user = $this->createAdminUser();

        SalesOrder::factory()->count(12)->create(['status' => SalesOrder::STATUS_DRAFT]);
        SalesOrder::factory()->count(3)->create(['status' => SalesOrder::STATUS_CONFIRMED]);

        $this->actingAs($user)
            ->get(route('module.sales.sales-orders.index', [
                'status' => SalesOrder::STATUS_DRAFT,
                'page' => 2,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('orders.data', 2)
                ->where('orders.total', 12)
                ->where('orders.current_page', 2)
                ->where('filters.status', SalesOrder::STATUS_DRAFT)
            );
    }
}
