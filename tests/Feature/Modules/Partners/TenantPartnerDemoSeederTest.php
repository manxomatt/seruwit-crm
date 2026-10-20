<?php

namespace Tests\Feature\Modules\Partners;

use Database\Seeders\TenantPartnerDemoSeeder;
use Database\Seeders\TenantPartnerIndustriesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerBankAccount;
use Modules\Partners\Models\PartnerBlacklist;
use Modules\Partners\Models\PartnerIndustry;
use Tests\TestCase;

class TenantPartnerDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_twenty_partners_with_customer_supplier_and_both_roles(): void
    {
        $this->seed(TenantPartnerDemoSeeder::class);

        $this->assertSame(20, Partner::query()->count());
        $this->assertSame(8, Partner::query()->where('customer_rank', '>', 0)->where('supplier_rank', 0)->count());
        $this->assertSame(7, Partner::query()->where('supplier_rank', '>', 0)->where('customer_rank', 0)->count());
        $this->assertSame(5, Partner::query()->where('customer_rank', '>', 0)->where('supplier_rank', '>', 0)->count());
        $this->assertTrue(Partner::query()->where('code', 'PART-C-000001')->exists());
        $this->assertTrue(Partner::query()->where('code', 'PART-S-000001')->exists());
        $this->assertTrue(Partner::query()->where('code', 'PART-B-000001')->exists());
        $this->assertTrue(Partner::query()->whereNotNull('industry_id')->exists());
    }

    public function test_seeds_partner_bank_accounts_locations_kyc_and_blacklists(): void
    {
        $this->seed(TenantPartnerDemoSeeder::class);

        // Master Locations (5 seeded)
        $this->assertSame(
            5,
            Location::query()->whereIn('code', TenantPartnerDemoSeeder::DEMO_LOCATION_CODES)->count(),
        );

        // Bank Accounts seeded
        $this->assertGreaterThan(10, PartnerBankAccount::query()->count());

        // KYC Statuses: pending, verified, rejected, unverified
        $this->assertSame(2, Partner::query()->where('kyc_status', Partner::KYC_STATUS_PENDING)->count());
        $this->assertGreaterThan(5, Partner::query()->where('kyc_status', Partner::KYC_STATUS_VERIFIED)->count());
        $this->assertSame(1, Partner::query()->where('kyc_status', Partner::KYC_STATUS_REJECTED)->count());

        // Blacklist and Anti-Fraud
        $this->assertSame(1, Partner::query()->where('is_blacklisted', true)->count());
        $this->assertSame(2, PartnerBlacklist::query()->count());
        $this->assertTrue(
            PartnerBlacklist::query()->where('category', PartnerBlacklist::CATEGORY_CAR_THEFT)->exists()
        );
        $this->assertTrue(
            PartnerBlacklist::query()->where('category', PartnerBlacklist::CATEGORY_BAD_DEBT)->exists()
        );

        // Contact Types linked
        $this->assertTrue(
            Partner::query()->whereHas('types', fn ($q) => $q->where('code', 'travel_agent'))->exists()
        );
        $this->assertTrue(
            Partner::query()->whereHas('types', fn ($q) => $q->where('code', 'shipper'))->exists()
        );

        // Missing Contact partner demonstration
        $this->assertTrue(
            Partner::query()
                ->where('code', 'PART-B-000005')
                ->whereNull('email')
                ->whereNull('phone')
                ->whereNull('mobile')
                ->exists()
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantPartnerDemoSeeder::class);
        $this->seed(TenantPartnerDemoSeeder::class);

        $this->assertSame(20, Partner::query()->count());
        $this->assertSame(5, Location::query()->whereIn('code', TenantPartnerDemoSeeder::DEMO_LOCATION_CODES)->count());
        $this->assertSame(2, PartnerBlacklist::query()->count());
    }

    public function test_reuses_pack_industries_when_code_column_exists(): void
    {
        if (! Schema::hasColumn('partner_industries', 'code')) {
            $this->markTestSkipped('partner_industries.code requires the tenant i18n migration.');
        }

        $this->seed(TenantPartnerIndustriesSeeder::class);
        $this->seed(TenantPartnerDemoSeeder::class);

        $this->assertSame(20, Partner::query()->count());
        $this->assertTrue(
            Partner::query()
                ->where('code', 'PART-C-000001')
                ->whereHas('industry', fn ($q) => $q->where('code', 'retail'))
                ->exists()
        );
        $this->assertSame(
            count(TenantPartnerIndustriesSeeder::CODES),
            PartnerIndustry::query()->whereIn('code', TenantPartnerIndustriesSeeder::CODES)->count(),
        );
    }

    public function test_reinstall_restores_soft_deleted_demo_codes(): void
    {
        $this->seed(TenantPartnerDemoSeeder::class);

        Partner::query()
            ->where('notes', 'like', '%'.TenantPartnerDemoSeeder::TAG.'%')
            ->get()
            ->each->delete();

        $this->assertSame(0, Partner::query()->count());
        $this->assertGreaterThan(0, Partner::withTrashed()->count());

        $this->seed(TenantPartnerDemoSeeder::class);

        $this->assertSame(20, Partner::query()->count());
        $this->assertTrue(Partner::query()->where('code', 'PART-C-000001')->exists());
    }

    public function test_uninstall_force_deletes_tagged_partners(): void
    {
        $this->seed(TenantPartnerDemoSeeder::class);

        Partner::factory()->create([
            'code' => 'PART-REAL-001',
            'name' => 'Real Partner',
            'notes' => 'Not demo',
        ]);

        $this->assertSame(21, Partner::query()->count());

        app(TenantPartnerDemoSeeder::class)->uninstall();

        $this->assertSame(1, Partner::query()->count());
        $this->assertSame(1, Partner::withTrashed()->count());
        $this->assertTrue(Partner::query()->where('code', 'PART-REAL-001')->exists());
        $this->assertFalse(app(TenantPartnerDemoSeeder::class)->isInstalled());
        $this->assertSame(0, Location::query()->whereIn('code', TenantPartnerDemoSeeder::DEMO_LOCATION_CODES)->count());
        $this->assertSame(0, PartnerBlacklist::query()->count());
    }
}
