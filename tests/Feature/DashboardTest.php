<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Invoicing\Models\Invoice;
use Modules\Orders\Models\DeliveryOrder;
use Modules\Partners\Models\Partner;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_dashboard(): void
    {
        $this->get(route('module.dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_dashboard(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Module/Dashboard')
                ->has('user')
                ->has('stats')
                ->has('logistics')
                ->has('alerts')
                ->has('recentActivity')
                ->has('period')
            );
    }

    public function test_dashboard_returns_trip_stats_when_transportation_available(): void
    {
        $user = $this->createAdminUser();
        Trip::factory()->create(['status' => Trip::STATUS_SCHEDULED]);
        Trip::factory()->create(['status' => Trip::STATUS_IN_PROGRESS]);
        Trip::factory()->create(['status' => Trip::STATUS_COMPLETED]);

        $this->actingAs($user)->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('logistics.trips')
                ->where('logistics.trips.active', 2)
            );
    }

    public function test_dashboard_returns_order_stats_when_orders_available(): void
    {
        $user = $this->createAdminUser();
        DeliveryOrder::factory()->create(['status' => DeliveryOrder::STATUS_DRAFT]);
        DeliveryOrder::factory()->create(['status' => DeliveryOrder::STATUS_DELIVERED]);
        DeliveryOrder::factory()->create(['status' => DeliveryOrder::STATUS_DELIVERED]);

        $this->actingAs($user)->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('logistics.orders')
                ->where('logistics.orders.total', 3)
                ->where('logistics.orders.by_status.delivered', 2)
                ->where('logistics.orders.by_status.draft', 1)
            );
    }

    public function test_dashboard_returns_fleet_stats_when_fleet_available(): void
    {
        $user = $this->createAdminUser();
        Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        Vehicle::factory()->create(['status' => Vehicle::STATUS_MAINTENANCE]);

        $this->actingAs($user)->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('logistics.fleet')
                ->where('logistics.fleet.vehicles_total', 3)
                ->where('logistics.fleet.vehicles.active', 2)
                ->where('logistics.fleet.vehicles.maintenance', 1)
            );
    }

    public function test_dashboard_returns_partner_stats(): void
    {
        $user = $this->createAdminUser();
        Partner::factory()->count(3)->create(['customer_rank' => 1, 'supplier_rank' => 0]);
        Partner::factory()->create(['customer_rank' => 0, 'supplier_rank' => 1]);

        $this->actingAs($user)->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('logistics.partners')
                ->where('logistics.partners.total', 4)
                ->where('logistics.partners.customers', 3)
                ->where('logistics.partners.suppliers', 1)
            );
    }

    public function test_dashboard_returns_invoice_stats(): void
    {
        $user = $this->createAdminUser();
        Invoice::factory()->create(['status' => Invoice::STATUS_DRAFT]);
        Invoice::factory()->create(['status' => Invoice::STATUS_ISSUED, 'total' => 1000000, 'due_date' => now()->addDays(7)]);
        Invoice::factory()->create(['status' => Invoice::STATUS_PAID, 'total' => 2000000, 'paid_at' => now()]);

        $this->actingAs($user)->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('logistics.invoices')
                ->has('logistics.invoices.by_status')
                ->has('logistics.invoices.overdue')
            );
    }

    public function test_dashboard_supports_period_parameter(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.dashboard', ['period' => 'today']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('period', 'today'));

        $this->actingAs($user)->get(route('module.dashboard', ['period' => 'month']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('period', 'month'));

        $this->actingAs($user)->get(route('module.dashboard', ['period' => 'week']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('period', 'week'));
    }

    public function test_dashboard_includes_alerts_for_overdue_invoices(): void
    {
        $user = $this->createAdminUser();
        Invoice::factory()->create([
            'status' => Invoice::STATUS_ISSUED,
            'total' => 500000,
            'due_date' => now()->subDays(5),
        ]);

        $response = $this->actingAs($user)->get(route('module.dashboard'));
        $response->assertOk();

        $alerts = $response->original->getData()['page']['props']['alerts'];
        $overdueAlert = collect($alerts)->firstWhere('type', 'invoice_overdue');

        $this->assertNotNull($overdueAlert);
        $this->assertEquals('danger', $overdueAlert['severity']);
        $this->assertEquals(1, $overdueAlert['count']);
    }

    public function test_dashboard_includes_recent_activity(): void
    {
        $user = $this->createAdminUser();
        DeliveryOrder::factory()->create(['status' => DeliveryOrder::STATUS_DELIVERED]);
        Trip::factory()->create(['status' => Trip::STATUS_IN_PROGRESS]);

        $response = $this->actingAs($user)->get(route('module.dashboard'));
        $response->assertOk();

        $activity = $response->original->getData()['page']['props']['recentActivity'];
        $this->assertNotEmpty($activity);
        $this->assertGreaterThanOrEqual(2, count($activity));
    }

    public function test_dashboard_includes_cms_stats(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('stats.media')
            );
    }
}
