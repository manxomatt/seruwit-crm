<?php

namespace Tests\Feature\Modules\Fleet;

use Database\Seeders\TenantDriverDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Driver;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DriverDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpRoles();
    }

    public function test_seeds_thirty_demo_drivers(): void
    {
        $this->seed(TenantDriverDemoSeeder::class);

        $this->assertSame(
            30,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->count(),
        );

        $this->assertSame(
            25,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->where('status', Driver::STATUS_AVAILABLE)
                ->count(),
        );

        $this->assertTrue(
            Driver::query()
                ->where('license_number', 'SIM-DEMO-01')
                ->whereNotNull('phone')
                ->whereNotNull('license_expires_at')
                ->exists(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantDriverDemoSeeder::class);
        $this->seed(TenantDriverDemoSeeder::class);

        $this->assertSame(
            30,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->count(),
        );
    }
}
