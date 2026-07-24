<?php

namespace Tests\Feature\Modules\ExecutiveDashboard;

use App\Modules\ModuleInstaller;
use Modules\ExecutiveDashboard\ExecutiveDashboardModule;
use Tests\TestCase;
use Tests\Traits\WithRoles;
use Tests\Traits\WithTenant;

class ExecutiveDashboardModuleLifecycleTest extends TestCase
{
    use WithRoles, WithTenant;

    public function test_bi_module_seeds_permissions_and_menu_on_install(): void
    {
        $tenant = $this->provisionTenant('BI Install Co', 'bi-install-co', 'owner@bi-install.test');
        $tenant->plan = 'pro';
        $tenant->save();

        app(ModuleInstaller::class)->install($tenant, new ExecutiveDashboardModule);

        $tenant->run(function () {
            $this->assertDatabaseHas('permissions', ['module' => 'bi', 'action' => 'view']);
            $this->assertDatabaseHas('menus', ['slug' => 'bi', 'route_name' => 'bi.dashboard']);
            $this->assertDatabaseHas('installed_modules', ['key' => 'bi']);
        });
    }
}
