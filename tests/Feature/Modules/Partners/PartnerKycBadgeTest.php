<?php

namespace Tests\Feature\Modules\Partners;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerKycBadgeTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_pending_partner_kyc_review_count_is_shared_with_staff(): void
    {
        Partner::factory()->create([
            'name' => 'Pending Partner 1',
            'kyc_status' => Partner::KYC_STATUS_PENDING,
        ]);
        Partner::factory()->create([
            'name' => 'Pending Partner 2',
            'kyc_status' => Partner::KYC_STATUS_PENDING,
        ]);
        Partner::factory()->create([
            'name' => 'Verified Partner',
            'kyc_status' => Partner::KYC_STATUS_VERIFIED,
        ]);
        Partner::factory()->create([
            'name' => 'Unverified Partner',
            'kyc_status' => Partner::KYC_STATUS_UNVERIFIED,
        ]);

        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->get(route('module.partners.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('pendingPartnerKycReviewCount', 2));
    }

    public function test_staff_can_filter_partners_by_kyc_status(): void
    {
        Partner::factory()->create([
            'name' => 'Pending Partner',
            'kyc_status' => Partner::KYC_STATUS_PENDING,
        ]);
        Partner::factory()->create([
            'name' => 'Verified Partner',
            'kyc_status' => Partner::KYC_STATUS_VERIFIED,
        ]);

        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->get(route('module.partners.index', ['kyc_status' => Partner::KYC_STATUS_PENDING]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('partners.data', 1)
                ->where('partners.data.0.name', 'Pending Partner')
            );
    }

    public function test_staff_can_update_partner_kyc_status(): void
    {
        $partner = Partner::factory()->create([
            'name' => 'Review Partner',
            'kyc_status' => Partner::KYC_STATUS_PENDING,
        ]);

        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)
            ->post(route('module.partners.kyc-status', $partner), [
                'status' => Partner::KYC_STATUS_VERIFIED,
            ]);

        $response->assertRedirect();

        $partner->refresh();
        $this->assertSame(Partner::KYC_STATUS_VERIFIED, $partner->kyc_status);
        $this->assertNotNull($partner->kyc_verified_at);
        $this->assertSame($admin->id, $partner->kyc_verified_by);

        // Test rejecting
        $rejectResponse = $this->actingAs($admin)
            ->post(route('module.partners.kyc-status', $partner), [
                'status' => Partner::KYC_STATUS_REJECTED,
                'reason' => 'Foto KTP buram',
            ]);

        $rejectResponse->assertRedirect();

        $partner->refresh();
        $this->assertSame(Partner::KYC_STATUS_REJECTED, $partner->kyc_status);
        $this->assertSame('Foto KTP buram', $partner->kyc_rejected_reason);
        $this->assertNull($partner->kyc_verified_at);
    }
}
