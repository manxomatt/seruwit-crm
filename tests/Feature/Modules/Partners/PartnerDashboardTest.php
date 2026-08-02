<?php

namespace Tests\Feature\Modules\Partners;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerIndustry;
use Modules\Partners\Support\PartnerStatusBoard;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerDashboardTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_partners_dashboard(): void
    {
        $this->get(route('module.partners.dashboard'))->assertRedirect(route('login'));
    }

    public function test_user_without_permission_cannot_view_partners_dashboard(): void
    {
        $user = $this->createUserWithoutRole();

        $this->actingAs($user)->get(route('module.partners.dashboard'))->assertForbidden();
    }

    public function test_partners_dashboard_shows_status_board(): void
    {
        $industry = PartnerIndustry::factory()->create([
            'name' => ['id' => 'Logistik', 'en' => 'Logistics'],
        ]);

        Partner::factory()->create([
            'status' => 'active',
            'customer_rank' => 1,
            'supplier_rank' => 0,
            'industry_id' => $industry->id,
        ]);
        Partner::factory()->supplier()->create(['status' => 'active']);
        Partner::factory()->inactive()->create();
        Partner::factory()->create([
            'status' => 'active',
            'is_blacklisted' => true,
            'email' => null,
            'phone' => null,
            'mobile' => null,
        ]);

        Location::factory()->create(['is_active' => true]);
        Location::factory()->create(['is_active' => false]);

        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.partners.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Partners/Dashboard/Index')
                ->where('board.counts.total', 4)
                ->where('board.counts.active', 3)
                ->where('board.counts.inactive', 1)
                ->where('board.counts.customers', 3)
                ->where('board.counts.suppliers', 1)
                ->where('board.counts.blacklisted', 1)
                ->where('board.locations.total', 2)
                ->where('board.locations.active', 1)
                ->has('board.recent', 4)
                ->has('board.by_industry', 1)
                ->where('can.create', true)
            );
    }

    public function test_status_board_counts_roles_and_missing_contact(): void
    {
        Partner::factory()->create([
            'customer_rank' => 1,
            'supplier_rank' => 1,
            'email' => 'a@example.com',
            'phone' => '081111',
        ]);
        Partner::factory()->create([
            'customer_rank' => 1,
            'supplier_rank' => 0,
            'email' => null,
            'phone' => null,
            'mobile' => null,
        ]);

        $board = app(PartnerStatusBoard::class)->build();

        $this->assertSame(2, $board['counts']['total']);
        $this->assertSame(2, $board['counts']['customers']);
        $this->assertSame(1, $board['counts']['suppliers']);
        $this->assertSame(1, $board['counts']['both']);
        $this->assertSame(1, $board['counts']['missing_contact']);
    }
}
