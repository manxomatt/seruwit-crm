<?php

namespace Tests\Feature\Modules\Partners;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerBlacklist;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerBlacklistTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_admin_can_view_blacklist_index_with_metrics(): void
    {
        $user = $this->createAdminUser();

        PartnerBlacklist::create([
            'name' => 'Sindikat Pencuri',
            'id_number' => '3578010000000001',
            'phone' => '081299990001',
            'category' => PartnerBlacklist::CATEGORY_CAR_THEFT,
            'severity' => PartnerBlacklist::SEVERITY_CRITICAL,
            'incident_details' => 'Mencoba membawa kabur Avanza ke luar pulau.',
            'is_active' => true,
        ]);

        PartnerBlacklist::create([
            'name' => 'Penunggak Sewa',
            'id_number' => '3578010000000002',
            'phone' => '081299990002',
            'category' => PartnerBlacklist::CATEGORY_BAD_DEBT,
            'severity' => PartnerBlacklist::SEVERITY_WARNING,
            'incident_details' => 'Kabur saat ditagih perpanjangan 3 hari.',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->get(route('module.partners.blacklist.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Partners/Blacklist/Index')
            ->has('blacklists', 2)
            ->has('metrics')
            ->where('metrics.total_cases', 2)
            ->where('metrics.theft_cases', 1)
            ->where('metrics.bad_debt_cases', 1)
            ->where('metrics.active_cases', 2)
        );
    }

    public function test_admin_can_view_blacklist_create_page(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->get(route('module.partners.blacklist.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/Partners/Blacklist/Create')
            ->has('partner')
        );
    }

    public function test_admin_can_store_blacklist_record_and_sync_partner(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::create([
            'code' => 'PTN-SUSP-01',
            'name' => 'Agus Buronan',
            'phone' => '085566778899',
            'id_number' => '3271010000000009',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $payload = [
            'name' => 'Agus Buronan',
            'id_number' => '3271010000000009',
            'phone' => '085566778899',
            'license_number' => 'SIM-998877',
            'category' => 'pawn_attempt',
            'severity' => 'critical',
            'incident_date' => Carbon::now()->subDays(3)->toDateString(),
            'incident_details' => 'Tertangkap basah menggadaikan unit rental tanpa izin.',
            'police_report_number' => 'LP/123/2026/POLRES',
            'partner_id' => $partner->id,
        ];

        $response = $this->actingAs($user)->post(
            route('module.partners.blacklist.store'),
            $payload
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('partner_blacklists', [
            'name' => 'Agus Buronan',
            'id_number' => '3271010000000009',
            'category' => 'pawn_attempt',
            'is_active' => true,
        ]);

        // Verify partner status was synced to blacklisted
        $partner->refresh();
        $this->assertTrue($partner->is_blacklisted);
        $this->assertStringContainsString('menggadaikan', (string) $partner->blacklist_reason);
        $this->assertNotNull($partner->blacklisted_at);
    }

    public function test_admin_can_update_and_whitelist_blacklist_record(): void
    {
        $user = $this->createAdminUser();

        $partner = Partner::create([
            'code' => 'PTN-SUSP-02',
            'name' => 'Bambang Whitelist',
            'phone' => '081122334455',
            'id_number' => '3171010000000008',
            'account_type' => 'individual',
            'is_blacklisted' => true,
            'blacklist_reason' => 'Salah paham data.',
        ]);

        $blacklist = PartnerBlacklist::create([
            'partner_id' => $partner->id,
            'name' => 'Bambang Whitelist',
            'id_number' => '3171010000000008',
            'phone' => '081122334455',
            'category' => 'bad_debt',
            'severity' => 'warning',
            'incident_details' => 'Salah paham pembayaran, sudah diselesaikan.',
            'is_active' => true,
        ]);

        // Deactivate (whitelist)
        $response = $this->actingAs($user)->patch(
            route('module.partners.blacklist.update', $blacklist->id),
            ['is_active' => false]
        );

        $response->assertRedirect();

        $blacklist->refresh();
        $this->assertFalse($blacklist->is_active);

        // Partner blacklist flag should be automatically cleared
        $partner->refresh();
        $this->assertFalse($partner->is_blacklisted);
        $this->assertNull($partner->blacklist_reason);
    }

    public function test_check_risk_api_identifies_clean_and_blocked_identities(): void
    {
        $user = $this->createAdminUser();

        PartnerBlacklist::create([
            'name' => 'DPO Gadai',
            'id_number' => '5171010000000007',
            'phone' => '087788990011',
            'category' => 'car_theft',
            'severity' => 'critical',
            'incident_details' => 'Gadai unit sewa.',
            'is_active' => true,
        ]);

        // 1. Check clean customer
        $cleanResponse = $this->actingAs($user)->getJson(route('module.partners.risk_check', [
            'id_number' => '3578999999999999',
            'phone' => '081233334444',
        ]));

        $cleanResponse->assertOk();
        $cleanResponse->assertJson([
            'risk_level' => 'clean',
            'is_blacklisted' => false,
        ]);

        // 2. Check blocked customer by NIK
        $blockedResponse = $this->actingAs($user)->getJson(route('module.partners.risk_check', [
            'id_number' => '5171010000000007',
            'phone' => '089900001111',
        ]));

        $blockedResponse->assertOk();
        $blockedResponse->assertJson([
            'risk_level' => 'blocked',
            'is_blacklisted' => true,
        ]);
        $this->assertNotEmpty($blockedResponse->json('records'));
    }
}
