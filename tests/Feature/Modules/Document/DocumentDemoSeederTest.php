<?php

namespace Tests\Feature\Modules\Document;

use App\Models\User;
use Database\Seeders\TenantDocumentDemoSeeder;
use Database\Seeders\TenantDriverDemoSeeder;
use Database\Seeders\TenantVehicleDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Document\Models\Document;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class DocumentDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpRoles();
        User::factory()->create();
    }

    public function test_seeds_documents_for_thirty_vehicles_and_drivers(): void
    {
        $this->seed(TenantDocumentDemoSeeder::class);

        $this->assertSame(30, Vehicle::query()->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')->count());
        $this->assertSame(30, Driver::query()->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')->count());

        $vehicle = Vehicle::query()->where('plate_number', 'BE VD 01')->firstOrFail();
        $this->assertTrue(
            Document::query()
                ->where('documentable_type', 'vehicle')
                ->where('documentable_id', $vehicle->id)
                ->exists(),
        );

        $driver = Driver::query()->where('license_number', 'SIM-DEMO-01')->firstOrFail();
        $this->assertTrue(
            Document::query()
                ->where('documentable_type', 'driver')
                ->where('documentable_id', $driver->id)
                ->exists(),
        );

        $this->assertSame(30, Document::query()->where('documentable_type', 'vehicle')->distinct('documentable_id')->count('documentable_id'));
        $this->assertSame(30, Document::query()->where('documentable_type', 'driver')->distinct('documentable_id')->count('documentable_id'));
        $this->assertGreaterThan(60, Document::query()->count());
        $this->assertTrue(app(TenantDocumentDemoSeeder::class)->isInstalled());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantDocumentDemoSeeder::class);
        $firstCount = Document::query()->count();

        $this->seed(TenantDocumentDemoSeeder::class);

        $this->assertSame($firstCount, Document::query()->count());
        $this->assertSame(30, Vehicle::query()->where('plate_number', 'like', TenantVehicleDemoSeeder::PLATE_PREFIX.' %')->count());
        $this->assertSame(30, Driver::query()->where('license_number', 'like', TenantDriverDemoSeeder::LICENSE_PREFIX.'-%')->count());
    }

    public function test_uninstall_removes_demo_documents_only(): void
    {
        $seeder = app(TenantDocumentDemoSeeder::class);
        $seeder->run();

        $this->assertTrue($seeder->isInstalled());
        $this->assertSame(30, Vehicle::query()->where('notes', 'like', '%'.TenantVehicleDemoSeeder::TAG.'%')->count());

        $seeder->uninstall();

        $this->assertFalse($seeder->isInstalled());
        $this->assertSame(0, Document::query()->where('notes', 'like', '%'.TenantDocumentDemoSeeder::TAG.'%')->count());
        $this->assertSame(30, Vehicle::query()->where('notes', 'like', '%'.TenantVehicleDemoSeeder::TAG.'%')->count());
        $this->assertSame(30, Driver::query()->where('notes', 'like', '%'.TenantDriverDemoSeeder::TAG.'%')->count());
    }
}
