<?php

namespace Tests\Feature\Modules\Outbound;

use Database\Seeders\TenantOutboundDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Outbound\Models\PickList;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class OutboundDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_seeds_thirty_demo_pick_lists(): void
    {
        $this->seed(TenantOutboundDemoSeeder::class);

        $this->assertSame(
            TenantOutboundDemoSeeder::PICK_LIST_COUNT,
            PickList::query()->where('notes', 'like', '%'.TenantOutboundDemoSeeder::TAG.'%')->count(),
        );

        $this->assertGreaterThan(0, PickList::query()->where('status', PickList::STATUS_OPEN)->count());
        $this->assertGreaterThan(0, PickList::query()->where('status', PickList::STATUS_DISPATCHED)->count());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantOutboundDemoSeeder::class);
        $count = PickList::query()->where('notes', 'like', '%'.TenantOutboundDemoSeeder::TAG.'%')->count();

        $this->seed(TenantOutboundDemoSeeder::class);

        $this->assertSame(
            $count,
            PickList::query()->where('notes', 'like', '%'.TenantOutboundDemoSeeder::TAG.'%')->count(),
        );
    }

    public function test_pick_lists_index_paginates_demo_results(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantOutboundDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.outbound.pick-lists.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Outbound/PickLists/Index')
                ->where('pickLists.per_page', 15)
                ->where('pickLists.total', TenantOutboundDemoSeeder::PICK_LIST_COUNT)
                ->where('pickLists.last_page', 2)
                ->has('pickLists.data', 15)
                ->has('pickLists.links')
                ->has('filters')
                ->has('can.create'));

        $this->actingAs($user)
            ->get(route('module.outbound.pick-lists.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('pickLists.data', 15));
    }
}
