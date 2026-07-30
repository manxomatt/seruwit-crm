<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerPortalTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_unlinked_user_cannot_open_partner_portal(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('module.portal.rentals.index'))
            ->assertForbidden();
    }

    public function test_linked_partner_sees_own_rentals_only(): void
    {
        $user = User::factory()->create();
        $partner = Partner::factory()->create([
            'status' => 'active',
            'portal_user_id' => $user->id,
        ]);
        $other = Partner::factory()->create(['status' => 'active']);

        $mine = Rental::factory()->create(['partner_id' => $partner->id, 'code' => 'RENT-MINE-1']);
        Rental::factory()->create(['partner_id' => $other->id, 'code' => 'RENT-OTHER-1']);

        $this->actingAs($user)
            ->get(route('module.portal.rentals.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Portal/Index')
                ->where('partner.id', $partner->id)
                ->has('rentals.data', 1)
                ->where('rentals.data.0.id', $mine->id));
    }

    public function test_linked_partner_cannot_view_another_partners_rental(): void
    {
        $user = User::factory()->create();
        Partner::factory()->create([
            'status' => 'active',
            'portal_user_id' => $user->id,
        ]);
        $foreign = Rental::factory()->create();

        $this->actingAs($user)
            ->get(route('module.portal.rentals.show', $foreign))
            ->assertForbidden();
    }
}
