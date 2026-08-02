<?php

namespace Tests\Feature\Modules\Billing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Billing\Models\TripAllowance;
use Modules\Billing\Support\BillingStatusBoard;
use Modules\Orders\Models\DeliveryOrder;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class BillingDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_billing_dashboard(): void
    {
        $this->get(route('module.billing.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_billing_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.billing.dashboard'))->assertForbidden();
    }

    public function test_billing_dashboard_shows_status_board(): void
    {
        Tariff::factory()->create(['is_active' => true]);
        Tariff::factory()->inactive()->create();

        $unpriced = DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'order_date' => now()->toDateString(),
        ]);

        $priced = DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
            'order_date' => now()->toDateString(),
        ]);
        OrderCharge::factory()->create([
            'delivery_order_id' => $priced->id,
            'amount' => 250_000,
        ]);

        DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_CONFIRMED,
        ]);

        TripAllowance::factory()->create(['advance_amount' => 100_000]);
        TripAllowance::factory()->settled()->create();

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.billing.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Billing/Dashboard/Index')
                ->where('board.charges.billable', 3)
                ->where('board.charges.unpriced', 2)
                ->where('board.charges.uninvoiced', 2)
                ->where('board.charges.uninvoiced_amount', 250000)
                ->where('board.tariffs.active', 1)
                ->where('board.tariffs.total', 2)
                ->where('board.allowances.issued', 1)
                ->where('board.allowances.outstanding_advance', 100000)
                ->where('board.allowances.settled_this_month', 1)
                ->has('board.recent')
                ->where('can.create', true)
            );

        $this->assertDatabaseMissing('order_charges', ['delivery_order_id' => $unpriced->id]);
    }

    public function test_status_board_counts_charges_created_this_month(): void
    {
        $order = DeliveryOrder::factory()->create([
            'status' => DeliveryOrder::STATUS_DELIVERED,
        ]);
        OrderCharge::factory()->create([
            'delivery_order_id' => $order->id,
            'amount' => 75_000,
            'created_at' => now(),
        ]);

        $board = app(BillingStatusBoard::class)->build();

        $this->assertSame(1, $board['charges']['this_month_count']);
        $this->assertSame(75000.0, $board['charges']['this_month_amount']);
    }

    public function test_charges_index_still_works(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.billing.charges.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Modules/Billing/Charges/Index'));
    }
}
