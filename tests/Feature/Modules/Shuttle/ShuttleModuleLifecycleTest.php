<?php

namespace Tests\Feature\Modules\Shuttle;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Shuttle\ShuttleModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class ShuttleModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_shuttle_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Shuttle Install Co', 'shuttle-install-co', 'owner@shuttle-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new ShuttleModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('shuttle_corridors'));
            $this->assertTrue(Schema::hasTable('shuttle_schedules'));
            $this->assertTrue(Schema::hasTable('shuttle_departures'));
            $this->assertTrue(Schema::hasTable('shuttle_bookings'));
            $this->assertTrue(Schema::hasTable('shuttle_passengers'));
            $this->assertTrue(Schema::hasTable('shuttle_route_stops'));
            $this->assertTrue(Schema::hasTable('shuttle_pools'));
            $this->assertTrue(Schema::hasTable('shuttle_cities'));
            $this->assertTrue(Schema::hasTable('shuttle_settings'));
            $this->assertDatabaseHas('permissions', ['module' => 'shuttle', 'action' => 'optimize']);
            $this->assertDatabaseHas('permissions', ['module' => 'shuttle', 'action' => 'dispatch']);
            $this->assertDatabaseHas('menus', ['slug' => 'shuttle']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'shuttle']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'fleet']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'invoicing']);
            $this->assertDatabaseMissing('installed_modules', ['key' => 'partners']);
            $this->assertTrue(Schema::hasTable('partners'));
        });
    }
}
