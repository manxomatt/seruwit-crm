<?php

namespace Tests\Feature\Modules\Partners;

use Database\Seeders\TenantPartnerTypesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerType;
use Tests\TestCase;

class TenantPartnerTypesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_pack_contact_types(): void
    {
        $this->seed(TenantPartnerTypesSeeder::class);

        $this->assertSame(
            count(TenantPartnerTypesSeeder::CODES),
            PartnerType::query()->whereIn('code', TenantPartnerTypesSeeder::CODES)->count(),
        );

        $fleetOwner = PartnerType::findByCode('fleet_owner');
        $this->assertNotNull($fleetOwner);
        $this->assertTrue($fleetOwner->affects_supplier_rank);
        $this->assertSame('Pemilik Armada', $fleetOwner->localized('name', 'id'));
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantPartnerTypesSeeder::class);
        $this->seed(TenantPartnerTypesSeeder::class);

        $this->assertSame(
            count(TenantPartnerTypesSeeder::CODES),
            PartnerType::query()->whereIn('code', TenantPartnerTypesSeeder::CODES)->count(),
        );
    }

    public function test_uninstall_deactivates_types_in_use(): void
    {
        if (! Schema::hasTable('partner_partner_type')) {
            $this->markTestSkipped('partner_partner_type pivot missing.');
        }

        $this->seed(TenantPartnerTypesSeeder::class);

        $type = PartnerType::findByCode('external_driver');
        $this->assertNotNull($type);

        $partner = Partner::factory()->create();
        $partner->types()->sync([$type->id]);

        app(TenantPartnerTypesSeeder::class)->uninstall();

        $this->assertDatabaseHas('partner_types', [
            'id' => $type->id,
            'is_active' => false,
        ]);
    }
}
