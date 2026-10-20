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
            20,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->where('status', Driver::STATUS_AVAILABLE)
                ->count(),
        );

        $this->assertSame(
            5,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->where('status', Driver::STATUS_ON_TRIP)
                ->count(),
        );

        $this->assertSame(
            3,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->where('status', Driver::STATUS_OFF_DUTY)
                ->count(),
        );

        $this->assertSame(
            2,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->where('status', Driver::STATUS_INACTIVE)
                ->count(),
        );

        // Rental licenses: only passenger and minibus licenses (no heavy B2)
        $this->assertSame(
            0,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->where('license_type', 'like', '%B2%')
                ->count(),
        );

        $this->assertSame(
            30,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->whereIn('license_type', ['A', 'A Umum', 'B1', 'B1 Umum'])
                ->count(),
        );

        // Login provisioned for sample drivers
        $this->assertSame(
            5,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->whereNotNull('user_id')
                ->count(),
        );

        $this->assertTrue(
            Driver::query()
                ->where('license_number', 'SIM-DEMO-01')
                ->whereNotNull('phone')
                ->whereNotNull('license_expires_at')
                ->whereNotNull('photo_url')
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

    public function test_uninstall_cleans_up_drivers_and_users(): void
    {
        $this->seed(TenantDriverDemoSeeder::class);

        $seeder = new TenantDriverDemoSeeder;
        $seeder->uninstall();

        $this->assertFalse($seeder->isInstalled());
        $this->assertSame(
            0,
            Driver::query()
                ->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')
                ->count(),
        );
    }
}
