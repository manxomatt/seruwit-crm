<?php

namespace Tests\Feature\Modules\Routing;

use App\Modules\ModuleInstaller;
use Illuminate\Support\Facades\Schema;
use Modules\Routing\RoutingModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class RoutingModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_routing_tables_are_created_on_install(): void
    {
        $tenant = $this->provisionTenant('Routing Install Co', 'routing-install-co', 'owner@routing-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new RoutingModule);

        $tenant->run(function () {
            $this->assertTrue(Schema::hasTable('route_plans'));
            $this->assertTrue(Schema::hasTable('route_plan_routes'));
            $this->assertTrue(Schema::hasTable('route_plan_stops'));
            $this->assertDatabaseHas('permissions', ['module' => 'routing', 'action' => 'optimize']);
            $this->assertDatabaseHas('permissions', ['module' => 'routing', 'action' => 'apply']);
            $this->assertDatabaseHas('menus', ['slug' => 'routing']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'transportation']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'orders']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'fleet']);
        });
    }
}
