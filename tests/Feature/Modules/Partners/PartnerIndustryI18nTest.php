<?php

namespace Tests\Feature\Modules\Partners;

use Database\Seeders\TenantPartnerIndustriesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerIndustry;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class PartnerIndustryI18nTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_localized_label_follows_app_locale(): void
    {
        $industry = PartnerIndustry::factory()->create([
            'name' => ['id' => 'Logistik', 'en' => 'Logistics'],
        ]);

        app()->setLocale('id');
        $this->assertSame('Logistik', $industry->label);

        app()->setLocale('en');
        $this->assertSame('Logistics', $industry->fresh()->label);
    }

    public function test_partner_industries_pack_seeder_is_idempotent_and_uninstallable(): void
    {
        $this->seed(TenantPartnerIndustriesSeeder::class);

        $this->assertSame(
            count(TenantPartnerIndustriesSeeder::CODES),
            PartnerIndustry::query()->whereIn('code', TenantPartnerIndustriesSeeder::CODES)->count(),
        );

        $this->seed(TenantPartnerIndustriesSeeder::class);

        $this->assertSame(
            count(TenantPartnerIndustriesSeeder::CODES),
            PartnerIndustry::query()->whereIn('code', TenantPartnerIndustriesSeeder::CODES)->count(),
        );

        $used = PartnerIndustry::query()->where('code', 'logistics_transport')->first();
        $this->assertNotNull($used);
        Partner::factory()->create(['industry_id' => $used->id]);

        app(TenantPartnerIndustriesSeeder::class)->uninstall();

        $this->assertDatabaseHas('partner_industries', [
            'code' => 'logistics_transport',
            'is_active' => false,
        ]);
        $this->assertSame(
            1,
            PartnerIndustry::query()->whereIn('code', TenantPartnerIndustriesSeeder::CODES)->count(),
        );
    }

    public function test_find_by_localized_name_matches_either_locale(): void
    {
        PartnerIndustry::factory()->create([
            'name' => ['id' => 'Otomotif', 'en' => 'Automotive'],
        ]);

        $this->assertNotNull(PartnerIndustry::findByLocalizedName('Otomotif'));
        $this->assertNotNull(PartnerIndustry::findByLocalizedName('Automotive'));
    }
}
