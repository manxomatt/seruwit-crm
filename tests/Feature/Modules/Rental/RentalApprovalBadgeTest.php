<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalApprovalBadgeTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_awaiting_approval_scope_counts_only_pending_proofs(): void
    {
        $this->makeRental('RENT-BADGE-001', Rental::PROOF_PENDING);
        $this->makeRental('RENT-BADGE-002', Rental::PROOF_PENDING);
        $this->makeRental('RENT-BADGE-003', Rental::PROOF_APPROVED);
        $this->makeRental('RENT-BADGE-004', null);

        $this->assertSame(2, Rental::query()->awaitingApproval()->count());
    }

    public function test_pending_rental_approvals_count_is_shared_with_approver(): void
    {
        $this->makeRental('RENT-BADGE-001', Rental::PROOF_PENDING);
        $this->makeRental('RENT-BADGE-002', Rental::PROOF_PENDING);
        $this->makeRental('RENT-BADGE-003', Rental::PROOF_APPROVED);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('pendingRentalApprovalsCount', 2));
    }

    public function test_pending_rental_approvals_count_hidden_from_users_without_approve_permission(): void
    {
        $this->makeRental('RENT-BADGE-001', Rental::PROOF_PENDING);
        $this->makeRental('RENT-BADGE-002', Rental::PROOF_PENDING);

        // The read-only "user" role can view rentals but cannot approve them, so
        // the badge count must stay hidden (zero) even while proofs are pending.
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('pendingRentalApprovalsCount', 0));
    }

    private function makeRental(string $code, ?string $proofStatus): Rental
    {
        return Rental::factory()->create([
            'code' => $code,
            'deposit_proof_status' => $proofStatus,
        ]);
    }
}
