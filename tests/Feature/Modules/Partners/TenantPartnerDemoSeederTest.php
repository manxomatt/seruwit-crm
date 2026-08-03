<?php

namespace Tests\Feature\Modules\Partners;

use Database\Seeders\TenantPartnerDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Partners\Models\Partner;
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
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantPartnerDemoSeeder::class);
        $this->seed(TenantPartnerDemoSeeder::class);

        $this->assertSame(20, Partner::query()->count());
    }

    public function test_uninstall_removes_tagged_partners_only(): void
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
        $this->assertTrue(Partner::query()->where('code', 'PART-REAL-001')->exists());
        $this->assertFalse(app(TenantPartnerDemoSeeder::class)->isInstalled());
    }
}
