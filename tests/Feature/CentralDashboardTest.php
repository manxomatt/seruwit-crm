<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CentralDashboardTest extends TestCase
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

    public function test_admin_on_central_domain_sees_central_admin_dashboard(): void
    {
        $admin = $this->createAdminUser();
        $this->withoutExceptionHandling();
        $this->actingAs($admin)
            ->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Central/AdminDashboard')
                ->has('kpis')
                ->has('pendingPaymentOrders')
                ->has('recentTenants')
                ->has('planDistribution')
                ->has('growthMonths')
                ->has('moduleStats')
            );
    }
}
