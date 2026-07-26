<?php

namespace Tests\Feature\Modules\Document;

use App\Models\User;
use Database\Seeders\TenantFleetDocumentDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentType;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class FleetDocumentDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpRoles();
        User::factory()->create();
    }

    public function test_seeds_five_vehicles_five_drivers_with_documents(): void
    {
        $this->seed(TenantFleetDocumentDemoSeeder::class);

        $this->assertSame(5, Vehicle::query()->where('plate_number', 'like', 'BE 100% MM')->count());
        $this->assertSame(5, Driver::query()->where('license_number', 'like', 'SIM-%-DEMO-%')->count());
        $this->assertGreaterThanOrEqual(5, DocumentType::query()->count());
        $this->assertGreaterThan(10, Document::query()->count());

        $vehicle = Vehicle::query()->where('plate_number', 'BE 1001 MM')->firstOrFail();
        $this->assertTrue(
            Document::query()
                ->where('documentable_type', 'vehicle')
                ->where('documentable_id', $vehicle->id)
                ->exists(),
        );

        $driver = Driver::query()->where('license_number', 'SIM-B2-DEMO-001')->firstOrFail();
        $this->assertTrue(
            Document::query()
                ->where('documentable_type', 'driver')
                ->where('documentable_id', $driver->id)
                ->exists(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantFleetDocumentDemoSeeder::class);
        $this->seed(TenantFleetDocumentDemoSeeder::class);

        $this->assertSame(5, Vehicle::query()->where('plate_number', 'like', 'BE 100% MM')->count());
        $this->assertSame(5, Driver::query()->where('license_number', 'like', 'SIM-%-DEMO-%')->count());
    }
}
