<?php

namespace Tests\Feature\Modules\Canvassing;

use Database\Seeders\TenantCanvassingDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Canvassing\Models\CanvassingPlan;
use Modules\Canvassing\Models\CanvassingVisit;
use Modules\Canvassing\Models\Salesperson;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CanvassingDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_seeds_thirty_demo_salespeople(): void
    {
        $this->seed(TenantCanvassingDemoSeeder::class);

        $this->assertSame(
            TenantCanvassingDemoSeeder::SALESPERSON_COUNT,
            Salesperson::query()->where('notes', 'like', '%'.TenantCanvassingDemoSeeder::TAG.'%')->count(),
        );

        $this->assertGreaterThan(15, CanvassingVisit::query()
            ->whereHas('salesperson', fn ($q) => $q->where('notes', 'like', '%'.TenantCanvassingDemoSeeder::TAG.'%'))
            ->count());

        $this->assertSame(
            TenantCanvassingDemoSeeder::SALESPERSON_COUNT,
            CanvassingPlan::query()
                ->whereHas('salesperson', fn ($q) => $q->where('notes', 'like', '%'.TenantCanvassingDemoSeeder::TAG.'%'))
                ->count(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantCanvassingDemoSeeder::class);
        $salespersonCount = Salesperson::query()->where('notes', 'like', '%'.TenantCanvassingDemoSeeder::TAG.'%')->count();
        $visitCount = CanvassingVisit::query()
            ->whereHas('salesperson', fn ($q) => $q->where('notes', 'like', '%'.TenantCanvassingDemoSeeder::TAG.'%'))
            ->count();

        $this->seed(TenantCanvassingDemoSeeder::class);

        $this->assertSame(
            $salespersonCount,
            Salesperson::query()->where('notes', 'like', '%'.TenantCanvassingDemoSeeder::TAG.'%')->count(),
        );
        $this->assertSame(
            $visitCount,
            CanvassingVisit::query()
                ->whereHas('salesperson', fn ($q) => $q->where('notes', 'like', '%'.TenantCanvassingDemoSeeder::TAG.'%'))
                ->count(),
        );
    }

    public function test_salespeople_index_paginates_demo_results(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantCanvassingDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.canvassing.salespeople.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Canvassing/Salespeople/Index')
                ->where('salespeople.per_page', 15)
                ->where('salespeople.total', TenantCanvassingDemoSeeder::SALESPERSON_COUNT)
                ->where('salespeople.last_page', 2)
                ->has('salespeople.data', 15)
                ->has('salespeople.links'));

        $this->actingAs($user)
            ->get(route('module.canvassing.salespeople.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('salespeople.data', 15));
    }

    public function test_visits_and_plans_indexes_paginate(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantCanvassingDemoSeeder::class);

        $visitTotal = CanvassingVisit::query()
            ->whereHas('salesperson', fn ($q) => $q->where('notes', 'like', '%'.TenantCanvassingDemoSeeder::TAG.'%'))
            ->count();

        $this->actingAs($user)
            ->get(route('module.canvassing.visits.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Canvassing/Visits/Index')
                ->where('visits.per_page', 15)
                ->where('visits.total', $visitTotal)
                ->has('visits.data', 15)
                ->has('salespeople')
                ->has('visits.links'));

        $this->actingAs($user)
            ->get(route('module.canvassing.plans.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Canvassing/Plans/Index')
                ->where('plans.per_page', 15)
                ->where('plans.total', TenantCanvassingDemoSeeder::SALESPERSON_COUNT)
                ->where('plans.last_page', 2)
                ->has('plans.data', 15)
                ->has('plans.links'));
    }
}
