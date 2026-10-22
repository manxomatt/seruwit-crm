<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Fleet\Models\Vehicle;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalMaintenanceBlackout;
use Modules\Rental\Support\RentalAvailabilityBoard;
use Modules\Rental\Support\RentalUsageCalendar;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalMaintenanceBlackoutTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_cannot_access_maintenance(): void
    {
        $this->get(route('module.rental.maintenance.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_view_maintenance_index_with_kpis(): void
    {
        $vehicle = Vehicle::factory()->create(['name' => 'Armada 1', 'status' => Vehicle::STATUS_ACTIVE]);

        RentalMaintenanceBlackout::create([
            'code' => 'MNT-202610-0001',
            'vehicle_id' => $vehicle->id,
            'reason' => 'Servis Rutin 10.000 KM',
            'start_date' => '2026-10-16',
            'end_date' => '2026-10-18',
            'status' => RentalMaintenanceBlackout::STATUS_IN_PROGRESS,
            'estimated_cost' => 500000,
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.maintenance.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Maintenance/Index')
                ->has('blackouts', 1)
                ->where('kpis.in_workshop_count', 1)
                ->has('compliance_alerts')
                ->has('vehicles')
            );
    }

    public function test_admin_can_store_maintenance_blackout_and_it_blocks_booking(): void
    {
        $vehicle = Vehicle::factory()->create(['name' => 'Avanza B 1234 CD', 'status' => Vehicle::STATUS_ACTIVE]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.maintenance.store'), [
                'vehicle_id' => $vehicle->id,
                'reason' => 'Ganti Kanvas Rem & Oli',
                'start_date' => '2026-10-20',
                'end_date' => '2026-10-22',
                'status' => 'in_progress',
                'estimated_cost' => 750000,
                'set_vehicle_maintenance_status' => true,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertDatabaseHas('rental_maintenance_blackouts', [
            'vehicle_id' => $vehicle->id,
            'reason' => 'Ganti Kanvas Rem & Oli',
            'status' => 'in_progress',
        ]);

        // Vehicle availability reasons must now block overlapping booking
        $reasons = Rental::vehicleAvailabilityReasons($vehicle, '2026-10-21', '2026-10-23');
        $this->assertNotEmpty($reasons);
        $this->assertTrue(collect($reasons)->contains(fn ($r) => str_contains($r, 'Ganti Kanvas Rem & Oli')));
    }

    public function test_calendar_and_availability_board_reflect_maintenance(): void
    {
        Carbon::setTestNow('2026-10-16');

        $vehicle = Vehicle::factory()->create(['name' => 'Innova Zenix', 'status' => Vehicle::STATUS_ACTIVE]);

        RentalMaintenanceBlackout::create([
            'code' => 'MNT-202610-0002',
            'vehicle_id' => $vehicle->id,
            'reason' => 'Uji KIR & Tune Up',
            'start_date' => '2026-10-16',
            'end_date' => '2026-10-18',
            'status' => RentalMaintenanceBlackout::STATUS_IN_PROGRESS,
        ]);

        // 1. Availability board check
        /** @var RentalAvailabilityBoard $board */
        $board = app(RentalAvailabilityBoard::class);
        $avail = $board->build('2026-10-16', '2026-10-18');

        $this->assertEquals(1, $avail['counts']['maintenance']);
        $this->assertEquals('maintenance', $avail['vehicles'][0]['availability']);
        $this->assertNotNull($avail['vehicles'][0]['blackout']);
        $this->assertEquals('Uji KIR & Tune Up', $avail['vehicles'][0]['blackout']['reason']);

        // 2. Calendar check
        /** @var RentalUsageCalendar $calendar */
        $calendar = app(RentalUsageCalendar::class);
        $cal = $calendar->build('week', '2026-10-16');

        $this->assertEquals(1, $cal['counts']['maintenance']);
        $this->assertEquals('maintenance', $cal['vehicles'][0]['cells']['2026-10-16']['status']);
    }

    public function test_can_complete_maintenance_blackout_and_restore_vehicle(): void
    {
        $vehicle = Vehicle::factory()->create(['name' => 'Calya B 9999 XX', 'status' => Vehicle::STATUS_MAINTENANCE]);

        $blackout = RentalMaintenanceBlackout::create([
            'code' => 'MNT-202610-0003',
            'vehicle_id' => $vehicle->id,
            'reason' => 'Perbaikan AC',
            'start_date' => '2026-10-10',
            'end_date' => '2026-10-12',
            'status' => RentalMaintenanceBlackout::STATUS_IN_PROGRESS,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.maintenance.complete', $blackout->id), [
                'actual_cost' => 1200000,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $blackout->refresh();
        $this->assertEquals(RentalMaintenanceBlackout::STATUS_COMPLETED, $blackout->status);
        $this->assertEquals(1200000, $blackout->actual_cost);

        $vehicle->refresh();
        $this->assertEquals(Vehicle::STATUS_ACTIVE, $vehicle->status);
    }

    public function test_blackout_queries_do_not_crash_if_prevent_rentals_column_is_missing(): void
    {
        // Simulate legacy or partial table where prevent_rentals column was not created
        if (\Illuminate\Support\Facades\Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals')) {
            \Illuminate\Support\Facades\Schema::table('rental_maintenance_blackouts', function ($table) {
                $table->dropColumn('prevent_rentals');
            });
        }

        $vehicle = Vehicle::factory()->create(['name' => 'Avanza Test', 'status' => Vehicle::STATUS_ACTIVE]);

        // Calling queries should not throw undefined column SQL exception
        $blackout = RentalMaintenanceBlackout::findOverlappingBlackout($vehicle->id, '2026-10-19', '2026-10-25');
        $this->assertNull($blackout);

        $active = RentalMaintenanceBlackout::activeBlackoutsBetween('2026-10-19', '2026-10-25');
        $this->assertEmpty($active);

        // After self-healing, prevent_rentals must be restored
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasColumn('rental_maintenance_blackouts', 'prevent_rentals'));
    }
}
