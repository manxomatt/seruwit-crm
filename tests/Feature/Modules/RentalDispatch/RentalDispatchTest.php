<?php

namespace Tests\Feature\Modules\RentalDispatch;

use App\Modules\Facades\Modules;
use App\Support\SystemRolePermissions;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Modules\Fleet\Models\Driver;
use Modules\Fleet\Models\Vehicle;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\RentalDispatch\Models\RentalDispatch;
use Modules\RentalDispatch\RentalDispatchModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalDispatchTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        SystemRolePermissions::seedRolesForModule('rental-dispatch');
        SystemRolePermissions::syncAllSystemRoles();

        $this->ensureTablesExist();
    }

    protected function ensureTablesExist(): void
    {
        if (! Schema::hasTable('rental_dispatches')) {
            $migration = require base_path('modules/RentalDispatch/Database/Migrations/2026_10_15_120000_create_rental_dispatches_table.php');
            $migration->up();
        }
    }

    public function test_module_is_registered_with_correct_properties(): void
    {
        $module = Modules::find('rental-dispatch');

        $this->assertNotNull($module);
        $this->assertInstanceOf(RentalDispatchModule::class, $module);
        $this->assertSame('rental-dispatch', $module->key());
        $this->assertSame('Antar-Jemput (Runner Dispatch)', $module->label());
        $this->assertEquals(['rental'], $module->requires());
        $this->assertContains('view', $module->permissions());
        $this->assertContains('dispatch', $module->permissions());
    }

    public function test_guests_cannot_access_dispatch_board(): void
    {
        $this->get(route('module.rental.dispatch.index'))->assertRedirect(route('login'));
        $this->get(route('module.rental-dispatches.index'))->assertRedirect(route('login'));
    }

    public function test_admin_can_view_dispatch_index_page_with_metrics(): void
    {
        $user = $this->createAdminUser();

        $vehicle = Vehicle::factory()->create(['status' => Vehicle::STATUS_ACTIVE]);
        $customer = Partner::create([
            'code' => 'PTN-DISP-01',
            'name' => 'Budi Santoso',
            'phone' => '08123456789',
            'account_type' => 'individual',
            'status' => 'active',
        ]);

        $rental = Rental::factory()->create([
            'vehicle_id' => $vehicle->id,
            'partner_id' => $customer->id,
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(3)->toDateString(),
        ]);

        $driver = Driver::factory()->create(['name' => 'Pak Joko Runner']);

        // 1. Scheduled today
        RentalDispatch::create([
            'rental_id' => $rental->id,
            'type' => RentalDispatch::TYPE_DELIVERY,
            'status' => RentalDispatch::STATUS_SCHEDULED,
            'scheduled_at' => Carbon::today()->setHour(9)->setMinute(0),
            'location_name' => 'Bandara Juanda T1',
            'contact_name' => $customer->name,
            'contact_phone' => $customer->phone,
        ]);

        // 2. En route today
        RentalDispatch::create([
            'rental_id' => $rental->id,
            'type' => RentalDispatch::TYPE_PICKUP,
            'driver_id' => $driver->id,
            'status' => RentalDispatch::STATUS_EN_ROUTE,
            'scheduled_at' => Carbon::today()->setHour(14)->setMinute(0),
            'location_name' => 'Hotel Tentrem',
            'contact_name' => $customer->name,
            'contact_phone' => $customer->phone,
        ]);

        $response = $this->actingAs($user)->get(route('module.rental.dispatch.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Modules/RentalDispatch/Index')
            ->has('dispatches', 2)
            ->has('metrics')
            ->where('metrics.today_total', 2)
            ->where('metrics.unassigned_count', 1)
            ->where('metrics.en_route_count', 1)
            ->where('metrics.completed_today', 0)
        );

        $responseAlias = $this->actingAs($user)->get(route('module.rental-dispatches.index'));
        $responseAlias->assertOk();
        $responseAlias->assertInertia(fn ($page) => $page
            ->component('Modules/RentalDispatch/Index')
        );
    }

    public function test_backward_compatible_model_alias_works(): void
    {
        $dispatch = new \Modules\Rental\Models\RentalDispatch;
        $this->assertInstanceOf(RentalDispatch::class, $dispatch);
    }
}
