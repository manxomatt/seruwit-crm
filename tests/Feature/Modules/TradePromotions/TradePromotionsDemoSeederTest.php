<?php

namespace Tests\Feature\Modules\TradePromotions;

use Database\Seeders\TenantTradePromotionsDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TradePromotions\Models\TradePromoAward;
use Modules\TradePromotions\Models\TradePromoProgram;
use Modules\TradePromotions\Models\TradePromoRealization;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TradePromotionsDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_seeds_thirty_demo_programs(): void
    {
        $this->seed(TenantTradePromotionsDemoSeeder::class);

        $this->assertSame(
            TenantTradePromotionsDemoSeeder::PROGRAM_COUNT,
            TradePromoProgram::query()->where('notes', 'like', '%'.TenantTradePromotionsDemoSeeder::TAG.'%')->count(),
        );

        $this->assertGreaterThan(0, TradePromoRealization::query()
            ->whereHas('program', fn ($q) => $q->where('notes', 'like', '%'.TenantTradePromotionsDemoSeeder::TAG.'%'))
            ->count());

        $this->assertGreaterThan(0, TradePromoAward::query()
            ->where('notes', 'like', '%'.TenantTradePromotionsDemoSeeder::TAG.'%')
            ->count());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantTradePromotionsDemoSeeder::class);
        $programCount = TradePromoProgram::query()->where('notes', 'like', '%'.TenantTradePromotionsDemoSeeder::TAG.'%')->count();
        $realizationCount = TradePromoRealization::query()
            ->whereHas('program', fn ($q) => $q->where('notes', 'like', '%'.TenantTradePromotionsDemoSeeder::TAG.'%'))
            ->count();

        $this->seed(TenantTradePromotionsDemoSeeder::class);

        $this->assertSame(
            $programCount,
            TradePromoProgram::query()->where('notes', 'like', '%'.TenantTradePromotionsDemoSeeder::TAG.'%')->count(),
        );
        $this->assertSame(
            $realizationCount,
            TradePromoRealization::query()
                ->whereHas('program', fn ($q) => $q->where('notes', 'like', '%'.TenantTradePromotionsDemoSeeder::TAG.'%'))
                ->count(),
        );
    }

    public function test_programs_index_paginates_results(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantTradePromotionsDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.promotions.programs.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/TradePromotions/Programs/Index')
                ->where('programs.per_page', 15)
                ->where('programs.total', TenantTradePromotionsDemoSeeder::PROGRAM_COUNT)
                ->where('programs.last_page', 2)
                ->has('programs.data', 15)
                ->has('programs.links'));

        $this->actingAs($user)
            ->get(route('module.promotions.programs.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('programs.data', 15));
    }

    public function test_realizations_index_paginates_results(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantTradePromotionsDemoSeeder::class);

        $total = TradePromoRealization::query()
            ->whereHas('program', fn ($q) => $q->where('notes', 'like', '%'.TenantTradePromotionsDemoSeeder::TAG.'%'))
            ->count();

        $this->assertGreaterThan(15, $total);

        $this->actingAs($user)
            ->get(route('module.promotions.realizations.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/TradePromotions/Realizations/Index')
                ->where('realizations.per_page', 15)
                ->where('realizations.total', $total)
                ->where('realizations.last_page', (int) ceil($total / 15))
                ->has('realizations.data', 15)
                ->has('realizations.links'));
    }
}
