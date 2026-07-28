<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalDashboardExportTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_export_requires_valid_type(): void
    {
        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.dashboard.export', ['type' => 'nope']))
            ->assertSessionHasErrors('type');
    }

    public function test_export_overdue_csv(): void
    {
        Rental::factory()->active()->create([
            'start_date' => now()->subDays(10)->toDateString(),
            'end_date' => now()->subDays(2)->toDateString(),
            'total_amount' => 500000,
        ]);

        $response = $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.dashboard.export', ['type' => 'overdue']));

        $response->assertOk();
        $response->assertHeader('content-disposition');
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));

        $csv = $response->streamedContent();
        $this->assertStringContainsString('code,vehicle,plate,partner,start_date,end_date,status,total_amount', $csv);
        $this->assertStringContainsString('500000', $csv);
    }

    public function test_export_revenue_and_idle_csv(): void
    {
        Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE, 'name' => 'Idle Van']);
        Rental::factory()->create([
            'status' => Rental::STATUS_COMPLETED,
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->toDateString(),
            'total_amount' => 750000,
            'completed_at' => now(),
        ]);

        $revenue = $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.dashboard.export', ['type' => 'revenue_mtd']));

        $revenue->assertOk();
        $this->assertStringContainsString('vehicle,plate,bookings,total_amount', $revenue->streamedContent());

        $idle = $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.dashboard.export', ['type' => 'idle']));

        $idle->assertOk();
        $this->assertStringContainsString('Idle Van', $idle->streamedContent());
    }
}
